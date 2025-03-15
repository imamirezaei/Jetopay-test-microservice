import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AccountBalance } from '../entities/account-balance.entity';
import { FrozenFunds } from '../entities/frozen-funds.entity';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(
    @InjectRepository(AccountBalance)
    private accountBalanceRepository: Repository<AccountBalance>,
    @InjectRepository(FrozenFunds)
    private frozenFundsRepository: Repository<FrozenFunds>,
    private dataSource: DataSource,
  ) {}

  async getAccountBalance(accountId: string): Promise<AccountBalance> {
    const balance = await this.accountBalanceRepository.findOne({
      where: { accountId },
    });

    if (!balance) {
      throw new NotFoundException(`Balance not found for account ${accountId}`);
    }

    return balance;
  }

  async checkFundsAvailability(accountId: string, amount: number): Promise<boolean> {
    const balance = await this.getAccountBalance(accountId);
    
    return balance.availableBalance >= amount;
  }

  async freezeFunds(
    accountId: string,
    amount: number,
    transactionId: string,
    expiration?: Date,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Get current balance
      const balance = await queryRunner.manager.findOne(AccountBalance, {
        where: { accountId },
        lock: { mode: 'pessimistic_write' },
      });
      
      if (!balance) {
        throw new NotFoundException(`Balance not found for account ${accountId}`);
      }
      
      // Check if sufficient funds are available
      if (balance.availableBalance < amount) {
        throw new BadRequestException('Insufficient funds');
      }
      
      // Update balances
      balance.availableBalance -= amount;
      balance.reservedBalance += amount;
      
      await queryRunner.manager.save(balance);
      
      // Record frozen funds
      const frozenFunds = queryRunner.manager.create(FrozenFunds, {
        accountId,
        amount,
        transactionId,
        expiration: expiration || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      });
      
      await queryRunner.manager.save(frozenFunds);
      
      // Commit transaction
      await queryRunner.commitTransaction();
      
      return true;
    } catch (error) {
      // Rollback transaction in case of error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to freeze funds: ${error.message}`, error.stack);
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async unfreezeFunds(accountId: string, transactionId: string): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Find frozen funds record
      const frozenFunds = await queryRunner.manager.findOne(FrozenFunds, {
        where: { accountId, transactionId, released: false },
      });
      
      if (!frozenFunds) {
        throw new NotFoundException(`No frozen funds found for transaction ${transactionId}`);
      }
      
      // Get current balance
      const balance = await queryRunner.manager.findOne(AccountBalance, {
        where: { accountId },
        lock: { mode: 'pessimistic_write' },
      });
      
      if (!balance) {
        throw new NotFoundException(`Balance not found for account ${accountId}`);
      }
      
      // Update balances
      balance.availableBalance += frozenFunds.amount;
      balance.reservedBalance -= frozenFunds.amount;
      
      await queryRunner.manager.save(balance);
      
      // Mark frozen funds as released
      frozenFunds.released = true;
      frozenFunds.releasedAt = new Date();
      
      await queryRunner.manager.save(frozenFunds);
      
      // Commit transaction
      await queryRunner.commitTransaction();
      
      return true;
    } catch (error) {
      // Rollback transaction in case of error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to unfreeze funds: ${error.message}`, error.stack);
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async debitAccount(
    accountId: string,
    amount: number,
    transactionId: string,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Check for frozen funds first
      const frozenFunds = await queryRunner.manager.findOne(FrozenFunds, {
        where: { accountId, transactionId, released: false },
      });
      
      // Get current balance
      const balance = await queryRunner.manager.findOne(AccountBalance, {
        where: { accountId },
        lock: { mode: 'pessimistic_write' },
      });
      
      if (!balance) {
        throw new NotFoundException(`Balance not found for account ${accountId}`);
      }
      
      if (frozenFunds) {
        // Use frozen funds
        balance.reservedBalance -= frozenFunds.amount;
        balance.currentBalance -= frozenFunds.amount;
        
        await queryRunner.manager.save(balance);
        
        // Mark frozen funds as used
        frozenFunds.released = true;
        frozenFunds.releasedAt = new Date();
        frozenFunds.used = true;
        
        await queryRunner.manager.save(frozenFunds);
      } else {
        // Check if sufficient funds are available
        if (balance.availableBalance < amount) {
          throw new BadRequestException('Insufficient funds');
        }
        
        // Update balances directly
        balance.availableBalance -= amount;
        balance.currentBalance -= amount;
        
        await queryRunner.manager.save(balance);
      }
      
      // Commit transaction
      await queryRunner.commitTransaction();
      
      return true;
    } catch (error) {
      // Rollback transaction in case of error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to debit account: ${error.message}`, error.stack);
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async creditAccount(
    accountId: string,
    amount: number,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Get current balance
      const balance = await queryRunner.manager.findOne(AccountBalance, {
        where: { accountId },
        lock: { mode: 'pessimistic_write' },
      });
      
      if (!balance) {
        throw new NotFoundException(`Balance not found for account ${accountId}`);
      }
      
      // Update balances
      balance.availableBalance += amount;
      balance.currentBalance += amount;
      
      await queryRunner.manager.save(balance);
      
      // Commit transaction
      await queryRunner.commitTransaction();
      
      return true;
    } catch (error) {
      // Rollback transaction in case of error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to credit account: ${error.message}`, error.stack);
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }
}