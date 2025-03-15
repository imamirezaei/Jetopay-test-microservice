import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from '../entities/bank-account.entity';
import { AccountBalance } from '../entities/account-balance.entity';
import { AccountStatus } from '../enums/account-status.enum';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(AccountBalance)
    private accountBalanceRepository: Repository<AccountBalance>,
  ) {}

  async getAccountsByUserId(userId: string): Promise<BankAccount[]> {
    return this.bankAccountRepository.find({
      where: { userId, status: AccountStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  async getAccountById(id: string): Promise<BankAccount> {
    const account = await this.bankAccountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async verifyAccountOwnership(userId: string, accountId: string): Promise<boolean> {
    const account = await this.bankAccountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      return false;
    }

    return account.userId === userId;
  }

  async linkAccount(
    userId: string,
    accountNumber: string,
    bankCode: string,
    cardNumber?: string,
  ): Promise<BankAccount> {
    this.logger.log(`Linking account ${accountNumber} for user ${userId}`);

    // Check if account is already linked
    const existingAccount = await this.bankAccountRepository.findOne({
      where: { accountNumber, bankCode },
    });

    if (existingAccount) {
      if (existingAccount.userId === userId) {
        throw new BadRequestException('Account is already linked to your profile');
      } else {
        throw new BadRequestException('Account is already linked to another user');
      }
    }

    // In a real implementation, we would verify account ownership with the bank
    // For demo purposes, we'll just create the account
    
    // Create new account entry
    const newAccount = this.bankAccountRepository.create({
      userId,
      accountNumber,
      bankCode,
      cardNumber,
      name: `Account ${accountNumber.substr(-4)}`,
      status: AccountStatus.ACTIVE,
    });

    const savedAccount = await this.bankAccountRepository.save(newAccount);

    // Initialize account balance
    await this.accountBalanceRepository.save({
      accountId: savedAccount.id,
      availableBalance: 0,
      currentBalance: 0,
      reservedBalance: 0,
    });

    return savedAccount;
  }

  async getAccountDetails(accountId: string): Promise<any> {
    const account = await this.bankAccountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    const balance = await this.accountBalanceRepository.findOne({
      where: { accountId },
    });

    // Combine account details with balance information
    return {
      ...account,
      balance: balance ? {
        availableBalance: balance.availableBalance,
        currentBalance: balance.currentBalance,
        reservedBalance: balance.reservedBalance,
      } : null,
    };
  }

  async updateAccountStatus(accountId: string, status: AccountStatus): Promise<BankAccount> {
    const account = await this.getAccountById(accountId);
    
    account.status = status;
    
    return this.bankAccountRepository.save(account);
  }
  
  async searchAccounts(
    bankCode: string,
    accountNumber: string,
  ): Promise<BankAccount | null> {
    // This method would typically interact with the bank's API
    // For demo purposes, we'll just search our local database
    
    return this.bankAccountRepository.findOne({
      where: { bankCode, accountNumber },
    });
  }
}