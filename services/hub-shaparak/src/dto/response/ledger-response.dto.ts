import { ApiProperty } from '@nestjs/swagger';
import { BankCode } from '../../enums/bank-code.enum';

/**
 * DTO for ledger entry responses
 * This class defines the structure of data returned when retrieving ledger entries
 */
export class LedgerResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique ID of the ledger entry',
  })
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the associated transaction',
  })
  transactionId: string;

  @ApiProperty({
    example: BankCode.MELLAT,
    description: 'Bank code for this ledger entry',
    enum: BankCode,
  })
  bankCode: BankCode;

  @ApiProperty({
    example: '1234567890123456',
    description: 'Account number for this ledger entry',
  })
  accountNumber: string;

  @ApiProperty({
    example: 'DEBIT',
    description: 'Type of ledger entry (DEBIT or CREDIT)',
    enum: ['DEBIT', 'CREDIT'],
  })
  entryType: string;

  @ApiProperty({
    example: 1000000,
    description: 'Amount of the ledger entry',
  })
  amount: number;

  @ApiProperty({
    example: 'IRR',
    description: 'Currency code',
  })
  currency: string;

  @ApiProperty({
    example: '2023-07-15T10:30:00Z',
    description: 'Date and time of the ledger entry',
    format: 'date-time',
  })
  entryDate: Date;

  @ApiProperty({
    example: 'Debit entry for payment #12345',
    description: 'Description of the ledger entry',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 'REF-123456789',
    description: 'Reference ID for the ledger entry',
    required: false,
  })
  referenceId?: string;

  @ApiProperty({
    example: { 
      sourceSystem: 'PSP', 
      batchId: '98765',
      settlementStatus: 'completed',
      settlementDate: '2023-07-15T12:45:30Z'
    },
    description: 'Additional metadata for the ledger entry',
    required: false,
    type: 'object',
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    example: '2023-07-15T10:31:22Z',
    description: 'Date and time when the ledger entry was created',
    format: 'date-time',
  })
  createdAt: Date;
  
  @ApiProperty({
    example: 'bank-ledger-id-12345',
    description: 'ID assigned by the bank to this ledger entry',
    required: false,
  })
  bankLedgerId?: string;
  
  @ApiProperty({
    example: '9876543210',
    description: 'Tracking number for this ledger entry',
    required: false,
  })
  trackingNumber?: string;
  
  @ApiProperty({
    example: true,
    description: 'Whether this ledger entry has been reconciled',
    required: false,
  })
  reconciled?: boolean;
  
  @ApiProperty({
    example: '2023-07-15T15:30:00Z',
    description: 'Date and time when this ledger entry was reconciled',
    required: false,
    format: 'date-time',
  })
  reconciledAt?: Date;
  
  @ApiProperty({
    example: 'PROCESSED',
    description: 'Processing status of the ledger entry',
    required: false,
    enum: ['PENDING', 'PROCESSED', 'SETTLED', 'FAILED', 'REVERSED']
  })
  processingStatus?: string;
  
  @ApiProperty({
    example: '78901234',
    description: 'Batch number for bulk processing',
    required: false,
  })
  batchNumber?: string;
  
  @ApiProperty({
    example: '12345',
    description: 'Sequence number within a batch',
    required: false,
  })
  sequenceNumber?: string;
}