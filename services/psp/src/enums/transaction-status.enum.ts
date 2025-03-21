// enums/transaction-status.enum.ts
export enum TransactionStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    PENDING_AUTHORIZATION = 'PENDING_AUTHORIZATION',
    AUTHORIZED = 'AUTHORIZED',
    SUCCESSFUL = 'SUCCESSFUL',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
    PARTIAL_REFUNDED = 'PARTIAL_REFUNDED',
  }