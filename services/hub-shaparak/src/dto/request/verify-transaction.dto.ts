 // dto/response/transaction-response.dto.ts
  import { ApiProperty } from '@nestjs/swagger';
  import { TransactionStatus } from '../../enums/transaction-status.enum';
  import { BankCode } from '../../enums/bank-code.enum';
  
  export class TransactionResponseDto {
    @ApiProperty({
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Unique ID of the transaction',
    })
    id: string;
  
    @ApiProperty({
      example: 'REF-123456789',
      description: 'Reference ID of the transaction',
    })
    referenceId: string;
  
    @ApiProperty({
      example: '2023-07-15T10:30:00Z',
      description: 'Date and time of the transaction',
    })
    transactionDate: Date;
  
    @ApiProperty({
      example: BankCode.MELLAT,
      description: 'Bank code of the originator bank',
      enum: BankCode,
    })
    originatorBankCode: BankCode;
  
    @ApiProperty({
      example: BankCode.SAMAN,
      description: 'Bank code of the destination bank',
      enum: BankCode,
    })
    destinationBankCode: BankCode;
  
    @ApiProperty({
      example: '1234567890123456',
      description: 'Account number of the originator',
    })
    originatorAccount: string;
  
    @ApiProperty({
      example: '6543210987654321',
      description: 'Account number of the destination',
    })
    destinationAccount: string;
  
    @ApiProperty({
      example: 1000000,
      description: 'Transaction amount',
    })
    amount: number;
  
    @ApiProperty({
      example: 'IRR',
      description: 'Currency code',
    })
    currency: string;
  
    @ApiProperty({
      example: TransactionStatus.SETTLED,
      description: 'Current status of the transaction',
      enum: TransactionStatus,
    })
    status: TransactionStatus;
  
    @ApiProperty({
      example: 'Transaction settled successfully',
      description: 'Detailed status information',
      required: false,
    })
    statusDetail?: string;
  
    @ApiProperty({
      example: 'VERF-123456',
      description: 'Verification code from the bank',
      required: false,
    })
    verificationCode?: string;
  
    @ApiProperty({
      example: 'TRK-78901234',
      description: 'Tracking code for the transaction',
      required: false,
    })
    trackingCode?: string;
  
    @ApiProperty({
      example: '123456',
      description: 'Merchant ID for the transaction',
      required: false,
    })
    merchantId?: string;
  
    @ApiProperty({
      example: 'T12345',
      description: 'Terminal ID for the transaction',
      required: false,
    })
    terminalId?: string;
  
    @ApiProperty({
      example: 'Payment for Order #12345',
      description: 'Description of the transaction',
      required: false,
    })
    description?: string;
  
    @ApiProperty({
      example: { orderId: '12345', customerId: '67890' },
      description: 'Additional metadata for the transaction',
      required: false,
    })
    metadata?: Record<string, any>;
  
    @ApiProperty({
      example: 5000,
      description: 'Fee amount for the transaction',
    })
    feeAmount: number;
  
    @ApiProperty({
      example: '2023-07-15T10:31:22Z',
      description: 'Date and time when the transaction was created',
    })
    createdAt: Date;
  
    @ApiProperty({
      example: '2023-07-15T10:35:18Z',
      description: 'Date and time when the transaction was last updated',
    })
    updatedAt: Date;
  }