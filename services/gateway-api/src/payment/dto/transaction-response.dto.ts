// payment/dto/transaction-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionType } from '../enums/transaction-type.enum';

class PaymentMethodDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ required: false })
  maskedCardNumber?: string;

  @ApiProperty({ required: false })
  cardHolderName?: string;

  @ApiProperty({ required: false })
  expirationDate?: string;

  @ApiProperty()
  isDefault: boolean;
}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  merchantId?: string;

  @ApiProperty({ required: false })
  referenceId?: string;

  @ApiProperty({ required: false })
  gatewayUrl?: string;

  @ApiProperty({ type: PaymentMethodDto, nullable: true })
  paymentMethod?: PaymentMethodDto;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty({ required: false })
  statusDetail?: string;

  @ApiProperty({ type: 'object', required: false })
  metadata?: any;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
