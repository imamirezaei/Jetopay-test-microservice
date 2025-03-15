// guards/merchant.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { MerchantService } from '../services/merchant.service';

@Injectable()
export class MerchantGuard implements CanActivate {
  constructor(private merchantService: MerchantService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const merchantId = request.user?.merchantId;
    const apiKey = request.headers['x-api-key'];

    if (!merchantId && !apiKey) {
      throw new UnauthorizedException('Merchant identification required');
    }

    if (apiKey) {
      // If API key is provided, verify it
      const isValid = await this.merchantService.validateMerchantApiKey(
        merchantId,
        apiKey,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid API key');
      }
    } else {
      // If no API key, verify merchant ID from JWT
      const merchant = await this.merchantService.getMerchantInfo(merchantId);
      
      if (!merchant.active) {
        throw new UnauthorizedException('Merchant account is not active');
      }
    }

    return true;
  }
}