import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantInfo } from '../entities/merchant-info.entity';

@Injectable()
export class MerchantService {
  private readonly logger = new Logger(MerchantService.name);

  constructor(
    @InjectRepository(MerchantInfo)
    private merchantRepository: Repository<MerchantInfo>,
  ) {}

  async getMerchantInfo(merchantId: string): Promise<MerchantInfo> {
    const merchant = await this.merchantRepository.findOne({
      where: { merchantId },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant with ID ${merchantId} not found`);
    }

    return merchant;
  }

  async verifyMerchant(
    merchantId: string,
    terminalId?: string,
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const merchant = await this.getMerchantInfo(merchantId);

      // Check if merchant is active
      if (!merchant.active) {
        return {
          valid: false,
          message: 'Merchant is not active',
        };
      }

      // Check terminal ID if provided
      if (terminalId && merchant.terminalId !== terminalId) {
        return {
          valid: false,
          message: 'Terminal ID does not match merchant',
        };
      }

      // In a real implementation, additional checks would be performed with Shaparak
      // For demo, we'll just validate based on local data

      return {
        valid: true,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          valid: false,
          message: error.message,
        };
      }

      this.logger.error(`Failed to verify merchant: ${error.message}`, error.stack);
      return {
        valid: false,
        message: 'Error verifying merchant',
      };
    }
  }

  async createOrUpdateMerchant(merchantData: Partial<MerchantInfo>): Promise<MerchantInfo> {
    let merchant: MerchantInfo;

    if (merchantData.merchantId) {
      // Check if merchant already exists
      merchant = await this.merchantRepository.findOne({
        where: { merchantId: merchantData.merchantId },
      });
    }

    if (merchant) {
      // Update existing merchant
      this.merchantRepository.merge(merchant, merchantData);
    } else {
      // Create new merchant
      merchant = this.merchantRepository.create(merchantData);
    }

    return this.merchantRepository.save(merchant);
  }

  async getAllMerchants(
    active?: boolean,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ merchants: MerchantInfo[]; total: number }> {
    const whereClause: any = {};
    
    if (active !== undefined) {
      whereClause.active = active;
    }
    
    const [merchants, total] = await this.merchantRepository.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { merchants, total };
  }

  async deactivateMerchant(merchantId: string): Promise<MerchantInfo> {
    const merchant = await this.getMerchantInfo(merchantId);
    
    merchant.active = false;
    merchant.deactivatedAt = new Date();
    
    return this.merchantRepository.save(merchant);
  }

  async activateMerchant(merchantId: string): Promise<MerchantInfo> {
    const merchant = await this.getMerchantInfo(merchantId);
    
    merchant.active = true;
    merchant.deactivatedAt = null;
    
    return this.merchantRepository.save(merchant);
  }

  async updateMerchantCredentials(
    merchantId: string,
    username: string,
    password: string,
    apiKey: string,
  ): Promise<MerchantInfo> {
    const merchant = await this.getMerchantInfo(merchantId);
    
    merchant.username = username;
    merchant.password = password;
    merchant.apiKey = apiKey;
    
    return this.merchantRepository.save(merchant);
  }

  async validateMerchantApiKey(
    merchantId: string,
    apiKey: string,
  ): Promise<boolean> {
    const merchant = await this.merchantRepository.findOne({
      where: { merchantId, apiKey },
    });

    return !!merchant && merchant.active;
  }
}