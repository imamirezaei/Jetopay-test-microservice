import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transfer } from '../entities/transfer.entity';
import { DestinationAccount } from '../entities/destination-account.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Transfer)
    private transferRepository: Repository<Transfer>,
    @InjectRepository(DestinationAccount)
    private destinationAccountRepository: Repository<DestinationAccount>,
  ) {}

  async sendTransferNotification(
    transferId: string,
    message: string,
  ): Promise<void> {
    try {
      // Get the transfer details
      const transfer = await this.transferRepository.findOne({
        where: { id: transferId },
        relations: ['destinationAccount'],
      });

      if (!transfer || !transfer.destinationAccount) {
        this.logger.warn(`Cannot send notification: Transfer ${transferId} or destination account not found`);
        return;
      }

      // Get the user ID from the destination account
      const userId = transfer.destinationAccount.userId;

      if (!userId) {
        this.logger.warn(`Cannot send notification: User ID not found for transfer ${transferId}`);
        return;
      }

      // In a real implementation, this would send a notification to the user
      // through a notification service, SMS gateway, or push notification
      this.logger.log(`[NOTIFICATION SIMULATION] Sending notification to user ${userId}: ${message}`);
      
      // For demonstration purposes, we'll just log the notification
      this.logger.log({
        type: 'TRANSFER_NOTIFICATION',
        userId,
        transferId,
        destinationAccountId: transfer.destinationAccountId,
        amount: transfer.amount,
        timestamp: new Date().toISOString(),
        message,
      });
      
      // In production, you would implement a real notification service, for example:
      // 
      // await this.pushNotificationService.sendPushNotification({
      //   userId,
      //   title: 'Transfer Notification',
      //   body: message,
      //   data: {
      //     transferId,
      //     amount: transfer.amount,
      //     type: 'TRANSFER',
      //   },
      // });
      // 
      // Or send an SMS:
      // 
      // const user = await this.userService.findById(userId);
      // if (user.phoneNumber) {
      //   await this.smsService.sendSms({
      //     to: user.phoneNumber,
      //     message,
      //   });
      // }
    } catch (error) {
      this.logger.error(`Failed to send notification for transfer ${transferId}: ${error.message}`, error.stack);
      // We don't want to throw an error here, as notification failures shouldn't
      // interrupt the main business flow
    }
  }

  async sendAccountVerificationNotification(
    accountId: string,
    status: 'success' | 'failure',
    message?: string,
  ): Promise<void> {
    try {
      // Get the account details
      const account = await this.destinationAccountRepository.findOne({
        where: { id: accountId },
      });

      if (!account) {
        this.logger.warn(`Cannot send notification: Account ${accountId} not found`);
        return;
      }

      const userId = account.userId;

      // Compose the notification message
      const notificationMessage = status === 'success'
        ? `Your account ${account.accountNumber} has been successfully verified.`
        : `Account verification failed for ${account.accountNumber}: ${message}`;

      // In a real implementation, this would send a notification to the user
      this.logger.log(`[NOTIFICATION SIMULATION] Sending notification to user ${userId}: ${notificationMessage}`);
      
      // For demonstration purposes, we'll just log the notification
      this.logger.log({
        type: 'ACCOUNT_VERIFICATION_NOTIFICATION',
        userId,
        accountId,
        status,
        message: notificationMessage,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to send account verification notification for account ${accountId}: ${error.message}`, error.stack);
    }
  }

  async sendBulkNotification(
    userIds: string[],
    message: string,
    data?: any,
  ): Promise<void> {
    try {
      this.logger.log(`[NOTIFICATION SIMULATION] Sending bulk notification to ${userIds.length} users: ${message}`);
      
      // For demonstration purposes, we'll just log the notification
      this.logger.log({
        type: 'BULK_NOTIFICATION',
        userIds,
        message,
        data,
        timestamp: new Date().toISOString(),
      });
      
      // In a real implementation, you would use a notification service that supports bulk messaging
    } catch (error) {
      this.logger.error(`Failed to send bulk notification: ${error.message}`, error.stack);
    }
  }
}