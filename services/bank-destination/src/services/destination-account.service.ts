import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DestinationAccount } from '../entities/destination-account.entity';
import { AccountStatus } from '../enums/account-status.enum';

@Injectable()
export class DestinationAccountService {
  private readonly logger = new Logger(DestinationAccountService.name);

  constructor(
    @InjectRepository(DestinationAccount)
    private destinationAccountRepository: Repository<DestinationAccount>,
  ) {}

  async getAccountsByUserId(userId: string): Promise<DestinationAccount[]> {
    return this.destinationAccountRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAccountById(id: string): Promise<DestinationAccount> {
    const account = await this.destinationAccountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async findAccount(
    accountNumber: string,
    bankCode: string,
  ): Promise<DestinationAccount | null> {
    return this.destinationAccountRepository.findOne({
      where: { accountNumber, bankCode },
    });
  }

  async validateAccount(
    accountNumber: string,
    bankCode: string,
  ): Promise<{ valid: boolean; message?: string; accountName?: string }> {
    this.logger.log(`Validating account ${accountNumber} with bank ${bankCode}`);

    // In a real implementation, this would call an external bank API to validate the account
    // For demo purposes, we'll simulate the validation
    
    if (!accountNumber || accountNumber.length < 8) {
      return { valid: false, message: 'Invalid account number format' };
    }

    if (!bankCode || !this.isValidBankCode(bankCode)) {
      return { valid: false, message: 'Invalid bank code' };
    }

    // Simulate a successful validation
    return {
      valid: true,
      accountName: this.generateRandomAccountHolderName(),
    };
  }

  async addDestinationAccount(
    userId: string,
    accountNumber: string,
    bankCode: string,
    accountName: string,
    description?: string,
  ): Promise<DestinationAccount> {
    this.logger.log(`Adding destination account ${accountNumber} for user ${userId}`);

    // Check if this account already exists for the user
    const existingAccount = await this.destinationAccountRepository.findOne({
      where: { userId, accountNumber, bankCode },
    });

    if (existingAccount) {
      // Account already exists, return it
      return existingAccount;
    }

    // Create new destination account
    const account = this.destinationAccountRepository.create({
      userId,
      accountNumber,
      bankCode,
      accountName,
      description,
      status: AccountStatus.PENDING_VERIFICATION,
    });

    return this.destinationAccountRepository.save(account);
  }

  async verifyAccount(id: string): Promise<DestinationAccount> {
    const account = await this.getAccountById(id);
    
    // In a real implementation, this would trigger a small test transfer to verify the account
    // For demo purposes, we'll just mark it as verified
    
    account.status = AccountStatus.VERIFIED;
    account.verifiedAt = new Date();
    
    return this.destinationAccountRepository.save(account);
  }

  async getAccountInfo(id: string): Promise<DestinationAccount> {
    return this.getAccountById(id);
  }

  private isValidBankCode(bankCode: string): boolean {
    // List of valid Iranian bank codes
    const validBankCodes = [
      'BMJI', // Bank Melli Iran
      'SEPBIR', // Bank Sepah
      'TEJIR', // Tejarat Bank
      'MELIIR', // Bank Mellat
      'SADIR', // Bank Saderat Iran
      'KESIR', // Bank Keshavarzi
      'PARSIR', // Parsian Bank
      'SAMAIR', // Saman Bank
      'EGTIR', // Eghtesad Novin Bank
      'PSBCIR', // Pasargad Bank
    ];
    
    return validBankCodes.includes(bankCode);
  }

  private generateRandomAccountHolderName(): string {
    // List of sample Iranian names for demo purposes
    const firstNames = [
      'Ali', 'Mohammad', 'Reza', 'Hassan', 'Hossein', 
      'Mehdi', 'Saeed', 'Ahmad', 'Javad', 'Amir',
      'Maryam', 'Fatima', 'Zahra', 'Sara', 'Leila',
      'Nazanin', 'Shirin', 'Azadeh', 'Parisa', 'Niloufar'
    ];
    
    const lastNames = [
      'Mohammadi', 'Hosseini', 'Ahmadi', 'Rezaei', 'Karimi',
      'Moradi', 'Jafari', 'Najafi', 'Bagheri', 'Hashemi',
      'Rahimi', 'Ghasemi', 'Kazemi', 'Mousavi', 'Akbari'
    ];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }
}