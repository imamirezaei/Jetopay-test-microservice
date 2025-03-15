import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly iv: Buffer;

  constructor(private configService: ConfigService) {
    // In a production environment, the encryption key and IV should be stored securely
    // and not hard-coded or derived from predictable values
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'your-secure-encryption-key-min-32-chars';
    
    // Generate a 32-byte key from the encryption key using SHA-256
    this.key = crypto.createHash('sha256').update(encryptionKey).digest();
    
    // Generate a 16-byte IV from the encryption key using MD5
    this.iv = crypto.createHash('md5').update(encryptionKey).digest();
  }

  encrypt(text: string): string {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  generateHmac(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  verifyHmac(data: string, secret: string, hmac: string): boolean {
    const calculatedHmac = this.generateHmac(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHmac, 'hex'),
      Buffer.from(hmac, 'hex'),
    );
  }

  generateRandomString(length: number = 32): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  generateApiKey(): string {
    return `SPK-${this.generateRandomString(40)}`;
  }

  maskCardNumber(cardNumber: string): string {
    // Keep only the first 6 and last 4 digits
    if (cardNumber && cardNumber.length >= 10) {
      const firstSix = cardNumber.substring(0, 6);
      const lastFour = cardNumber.substring(cardNumber.length - 4);
      const maskedLength = cardNumber.length - 10;
      const mask = '*'.repeat(maskedLength);
      return `${firstSix}${mask}${lastFour}`;
    }
    // If the card number is too short, just return it
    return cardNumber;
  }

  encryptCardData(cardData: {
    cardNumber: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv?: string;
  }): string {
    // Create a copy of the data to avoid modifying the original
    const cardDataCopy = { ...cardData };
    
    // Mask the CVV completely if present
    if (cardDataCopy.cvv) {
      cardDataCopy.cvv = '***';
    }
    
    // Encrypt the JSON string of the card data
    return this.encrypt(JSON.stringify(cardDataCopy));
  }

  validateSignature(
    data: string,
    signature: string,
    publicKey: string,
  ): boolean {
    try {
      const verify = crypto.createVerify('sha256');
      verify.update(data);
      return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
      return false;
    }
  }

  signData(data: string, privateKey: string): string {
    try {
      const sign = crypto.createSign('sha256');
      sign.update(data);
      return sign.sign(privateKey, 'hex');
    } catch (error) {
      throw new Error(`Failed to sign data: ${error.message}`);
    }
  }
}