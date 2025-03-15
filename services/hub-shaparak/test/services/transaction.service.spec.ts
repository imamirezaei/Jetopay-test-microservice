// test/services/transaction.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { of } from 'rxjs';
import { TransactionService } from '../../src/services/transaction.service';
import { LedgerService } from '../../src/services/ledger.service';
import { Transaction } from '../../src/entities/transaction.entity';
import { Ledger } from '../../src/entities/ledger.entity';
import { RecordTransactionDto } from '../../src/dto/request/record-transaction.dto';
import { VerifyTransactionDto } from '../../src/dto/request/verify-transaction.dto';
import { TransactionStatus } from '../../src/enums/transaction-status.enum';
import { BankCode } from '../../src/enums/bank-code.enum';

describe('TransactionService', () => {
  let service: TransactionService;
  let transactionRepository: Repository<Transaction>;
  let ledgerRepository: Repository<Ledger>;
  let ledgerService: LedgerService;
  let eventEmitter: EventEmitter2;
  let configService: ConfigService;
  let bankSourceClient: any;
  let bankDestinationClient: any;
  let shaparakClient: any;

  const mockTransactionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockLedgerRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockLedgerService = {
    createLedgerEntries: jest.fn(),
    updateLedgerEntriesForSettlement: jest.fn(),
    getLedgerEntriesByBank: jest.fn(),
    getLedgerEntriesByAccount: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: any) => defaultValue),
  };

  const mockBankSourceClient = {
    send: jest.fn(),
  };

  const mockBankDestinationClient = {
    send: jest.fn(),
  };

  const mockShaparakClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(Ledger),
          useValue: mockLedgerRepository,
        },
        {
          provide: LedgerService,
          useValue: mockLedgerService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'BANK_SOURCE_SERVICE',
          useValue: mockBankSourceClient,
        },
        {
          provide: 'BANK_DESTINATION_SERVICE',
          useValue: mockBankDestinationClient,
        },
        {
          provide: 'SHAPARAK_SERVICE',
          useValue: mockShaparakClient,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    transactionRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    ledgerRepository = module.get<Repository<Ledger>>(getRepositoryToken(Ledger));
    ledgerService = module.get<LedgerService>(LedgerService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    configService = module.get<ConfigService>(ConfigService);
    bankSourceClient = module.get('BANK_SOURCE_SERVICE');
    bankDestinationClient = module.get('BANK_DESTINATION_SERVICE');
    shaparakClient = module.get('SHAPARAK_SERVICE');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordTransaction', () => {
    it('should record a transaction successfully', async () => {
      // Arrange
      const recordTransactionDto: RecordTransactionDto = {
        referenceId: 'REF-123456789',
        transactionDate: '2023-07-15T10:30:00Z',
        originatorBankCode: BankCode.MELLAT,
        destinationBankCode: BankCode.SAMAN,
        originatorAccount: '1234567890123456',
        destinationAccount: '6543210987654321',
        amount: 1000000,
        currency: 'IRR',
        description: 'Test transaction',
        merchantId: '123456',
        terminalId: 'T12345',
        metadata: { orderId: '12345' },
      };

      const mockTransaction = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        ...recordTransactionDto,
        status: TransactionStatus.PENDING,
        statusDetail: 'Transaction recorded, awaiting processing',
        feeAmount: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock repository responses
      mockTransactionRepository.findOne.mockResolvedValue(null); // No existing transaction
      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);

      // Act
      const result = await service.recordTransaction(recordTransactionDto);

      // Assert
      expect(result).toEqual(expect.objectContaining({
        id: mockTransaction.id,
        referenceId: recordTransactionDto.referenceId,
        status: TransactionStatus.PENDING,
      }));
      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { referenceId: recordTransactionDto.referenceId },
      });
      expect(mockTransactionRepository.create).toHaveBeenCalled();
      expect(mockTransactionRepository.save).toHaveBeenCalled();
      expect(mockLedgerService.createLedgerEntries).toHaveBeenCalledWith(mockTransaction);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'transaction.recorded',
        expect.objectContaining({
          type: 'transaction.recorded',
          transactionId: mockTransaction.id,
          referenceId: mockTransaction.referenceId,
        }),
      );
    });

    it('should throw BadRequestException if transaction already exists', async () => {
      // Arrange
      const recordTransactionDto: RecordTransactionDto = {
        referenceId: 'REF-123456789',
        transactionDate: '2023-07-15T10:30:00Z',
        originatorBankCode: BankCode.MELLAT,
        destinationBankCode: BankCode.SAMAN,
        originatorAccount: '1234567890123456',
        destinationAccount: '6543210987654321',
        amount: 1000000,
        currency: 'IRR',
      };

      const existingTransaction = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        referenceId: recordTransactionDto.referenceId,
        status: TransactionStatus.PENDING,
      };

      // Mock repository response
      mockTransactionRepository.findOne.mockResolvedValue(existingTransaction);

      // Act & Assert
      await expect(service.recordTransaction(recordTransactionDto)).rejects.toThrow(
        `Transaction with reference ID ${recordTransactionDto.referenceId} already exists`,
      );
      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { referenceId: recordTransactionDto.referenceId },
      });
      expect(mockTransactionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyTransaction', () => {
    it('should verify a transaction successfully', async () => {
      // Arrange
      const verifyTransactionDto: VerifyTransactionDto = {
        referenceId: 'REF-123456789',
        verificationCode: 'VERF-123456',
        additionalData: { confirmationId: '123456' },
      };

      const mockTransaction = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        referenceId: verifyTransactionDto.referenceId,
        status: TransactionStatus.PROCESSING,
        originatorBankCode: BankCode.MELLAT,
        destinationBankCode: BankCode.SAMAN,
        amount: 1000000,
        currency: 'IRR',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.SETTLED,
        statusDetail: 'Transaction verified and settled successfully',
        verificationCode: verifyTransactionDto.verificationCode,
        trackingCode: 'TRK-78901234',
      };

      // Mock repository responses
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(updatedTransaction);

      // Mock microservice client responses
      mockBankSourceClient.send.mockReturnValue(of({ verified: true }));
      mockBankDestinationClient.send.mockReturnValue(of({ verified: true }));
      mockShaparakClient.send.mockReturnValue(of({
        verified: true,
        trackingCode: 'TRK-78901234',
      }));

      // Act
      const result = await service.verifyTransaction(verifyTransactionDto);

      // Assert
      expect(result).toEqual(expect.objectContaining({
        id: mockTransaction.id,
        referenceId: verifyTransactionDto.referenceId,
        status: TransactionStatus.SETTLED,
        trackingCode: 'TRK-78901234',
      }));
      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { referenceId: verifyTransactionDto.referenceId },
      });
      expect(mockBankSourceClient.send).toHaveBeenCalled();
      expect(mockBankDestinationClient.send).toHaveBeenCalled();
      expect(mockShaparakClient.send).toHaveBeenCalled();
      expect(mockTransactionRepository.save).toHaveBeenCalled();
      expect(mockLedgerService.updateLedgerEntriesForSettlement).toHaveBeenCalledWith(
        mockTransaction.id,
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'transaction.verified',
        expect.objectContaining({
          type: 'transaction.verified',
          transactionId: mockTransaction.id,
          referenceId: mockTransaction.referenceId,
          status: TransactionStatus.SETTLED,
        }),
      );
    });

    it('should handle verification failure', async () => {
      // Arrange
      const verifyTransactionDto: VerifyTransactionDto = {
        referenceId: 'REF-123456789',
      };

      const mockTransaction = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        referenceId: verifyTransactionDto.referenceId,
        status: TransactionStatus.PROCESSING,
        originatorBankCode: BankCode.MELLAT,
        destinationBankCode: BankCode.SAMAN,
        amount: 1000000,
        currency: 'IRR',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.FAILED,
        statusDetail: 'Transaction verification failed',
      };

      // Mock repository responses
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(updatedTransaction);

      // Mock microservice client responses
      mockBankSourceClient.send.mockReturnValue(of({ verified: true }));
      mockBankDestinationClient.send.mockReturnValue(of({ verified: false, message: 'Insufficient funds' }));
      mockShaparakClient.send.mockReturnValue(of({
        verified: false,
        message: 'Transaction verification failed',
      }));

      // Act
      const result = await service.verifyTransaction(verifyTransactionDto);

      // Assert
      expect(result).toEqual(expect.objectContaining({
        id: mockTransaction.id,
        referenceId: verifyTransactionDto.referenceId,
        status: TransactionStatus.FAILED,
        statusDetail: 'Transaction verification failed',
      }));
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'transaction.verified',
        expect.objectContaining({
          type: 'transaction.verified',
          transactionId: mockTransaction.id,
          referenceId: mockTransaction.referenceId,
          status: TransactionStatus.FAILED,
        }),
      );
    });

    it('should throw NotFoundException if transaction not found', async () => {
      // Arrange
      const verifyTransactionDto: VerifyTransactionDto = {
        referenceId: 'NON-EXISTENT-REF',
      };

      // Mock repository response
      mockTransactionRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyTransaction(verifyTransactionDto)).rejects.toThrow(
        `Transaction with reference ID ${verifyTransactionDto.referenceId} not found`,
      );
    });
  });

  describe('getTransactions', () => {
    it('should return transactions with pagination', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          referenceId: 'REF-123456789',
          status: TransactionStatus.SETTLED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          referenceId: 'REF-987654321',
          status: TransactionStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const filters = {
        status: TransactionStatus.SETTLED,
        page: 1,
        limit: 10,
      };

      // Mock repository response
      mockTransactionRepository.findAndCount.mockResolvedValue([mockTransactions, 2]);

      // Act
      const result = await service.getTransactions(filters);

      // Assert
      expect(result).toEqual({
        transactions: expect.arrayContaining([
          expect.objectContaining({
            id: mockTransactions[0].id,
            referenceId: mockTransactions[0].referenceId,
            status: mockTransactions[0].status,
          }),
          expect.objectContaining({
            id: mockTransactions[1].id,
            referenceId: mockTransactions[1].referenceId,
            status: mockTransactions[1].status,
          }),
        ]),
        total: 2,
        page: 1,
        limit: 10,
      });
      expect(mockTransactionRepository.findAndCount).toHaveBeenCalled();
    });
  });
});