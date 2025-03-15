// payment/services/payment-method.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from '../entities/payment-method.entity';
import { AddPaymentMethodDto } from '../dto/add-payment-method.dto';
import { PaymentMethodResponseDto } from '../dto/payment-method-response.dto';
import { PaymentMethodType } from '../enums/payment-method-type.enum';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async getUserPaymentMethods(userId: string): Promise<PaymentMethodResponseDto[]> {
    const paymentMethods = await this.paymentMethodRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return paymentMethods.map(this.mapToResponseDto);
  }

  async findById(id: string): Promise<PaymentMethod> {
    return this.paymentMethodRepository.findOne({
      where: { id },
    });
  }

  async getPaymentMethodById(id: string): Promise<PaymentMethodResponseDto> {
    const paymentMethod = await this.findById(id);
    
    if (!paymentMethod) {
      return null;
    }
    
    return this.mapToResponseDto(paymentMethod);
  }

  async getDefaultPaymentMethod(userId: string): Promise<PaymentMethod> {
    return this.paymentMethodRepository.findOne({
      where: { userId, isDefault: true },
    });
  }

  async addPaymentMethod(
    userId: string,
    addPaymentMethodDto: AddPaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    // Check if this is the first payment method (will be set as default)
    const existingMethods = await this.paymentMethodRepository.count({
      where: { userId },
    });
    
    const isDefault = existingMethods === 0;

    // For card type, mask the card number
    let maskedCardNumber = null;
    if (addPaymentMethodDto.type === PaymentMethodType.CARD) {
      if (!addPaymentMethodDto.cardNumber) {
        throw new BadRequestException('Card number is required for card payment method');
      }
      
      // Mask the card number (keep only first 6 and last 4 digits)
      maskedCardNumber = addPaymentMethodDto.cardNumber.replace(
        /^(\d{6})\d+(\d{4})$/,
        '$1******$2',
      );
    }

    // Create payment method record
    const paymentMethod = this.paymentMethodRepository.create({
      userId,
      type: addPaymentMethodDto.type,
      cardHolderName: addPaymentMethodDto.cardHolderName,
      maskedCardNumber,
      expirationDate: addPaymentMethodDto.expirationDate,
      isDefault,
      token: addPaymentMethodDto.token || this.generateToken(),
      nickname: addPaymentMethodDto.nickname,
    });

    const savedMethod = await this.paymentMethodRepository.save(paymentMethod);
    return this.mapToResponseDto(savedMethod);
  }

  async setDefaultPaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<PaymentMethodResponseDto> {
    // Clear previous default payment method
    await this.paymentMethodRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
    
    // Set new default payment method
    const updateResult = await this.paymentMethodRepository.update(
      { id: paymentMethodId, userId },
      { isDefault: true },
    );
    
    if (updateResult.affected === 0) {
      throw new NotFoundException('Payment method not found');
    }
    
    return this.getPaymentMethodById(paymentMethodId);
  }

  async removePaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<boolean> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, userId },
    });
    
    if (!paymentMethod) {
      return false;
    }
    
    // Check if this is the default payment method
    if (paymentMethod.isDefault) {
      // Find another payment method to set as default
      const anotherMethod = await this.paymentMethodRepository.findOne({
        where: { userId, id: paymentMethodId },
      });
      
      if (anotherMethod) {
        await this.paymentMethodRepository.update(
          { id: anotherMethod.id },
          { isDefault: true },
        );
      }
    }
    
    await this.paymentMethodRepository.remove(paymentMethod);
    return true;
  }

  private mapToResponseDto(paymentMethod: PaymentMethod): PaymentMethodResponseDto {
    return {
      id: paymentMethod.id,
      type: paymentMethod.type,
      maskedCardNumber: paymentMethod.maskedCardNumber,
      cardHolderName: paymentMethod.cardHolderName,
      expirationDate: paymentMethod.expirationDate,
      isDefault: paymentMethod.isDefault,
      nickname: paymentMethod.nickname,
      createdAt: paymentMethod.createdAt,
    };
  }

  private generateToken(): string {
    // Generate a random token for the payment method
    return Math.random().toString(36).substr(2, 9) +
      Math.random().toString(36).substr(2, 9);
  }
}
