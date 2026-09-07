/**
 * PyroGuard AI — Twilio SMS Provider
 * Implements the SMSProvider interface using the official Twilio Node.js SDK.
 * Handles message dispatch, error handling, and timeout management.
 */

import Twilio from 'twilio';
import { SMSProvider, SMSResult } from './smsProvider.js';
import { ENV } from '../../config/env.js';

export class TwilioProvider implements SMSProvider {
  private client: Twilio.Twilio | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /** Lazily initializes the Twilio client. Logs a warning if credentials are missing. */
  private initialize(): void {
    if (!ENV.TWILIO_ACCOUNT_SID || !ENV.TWILIO_AUTH_TOKEN || !ENV.TWILIO_PHONE_NUMBER) {
      console.warn(
        '[SMS] Twilio credentials not configured. SMS alerts will be logged but not delivered. ' +
        'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your .env file.'
      );
      return;
    }

    try {
      this.client = Twilio(ENV.TWILIO_ACCOUNT_SID, ENV.TWILIO_AUTH_TOKEN);
      this.initialized = true;
      console.log('[SMS] Twilio provider initialized successfully.');
    } catch (err: any) {
      console.error(`[SMS] Failed to initialize Twilio client: ${err.message}`);
    }
  }

  async sendSMS(phone: string, message: string): Promise<SMSResult> {
    if (!this.client || !this.initialized) {
      console.warn(`[SMS] Twilio not initialized. Would have sent SMS to ${phone}:`);
      console.warn(`[SMS] Message preview: ${message.substring(0, 80)}...`);
      return {
        success: false,
        error: 'Twilio client not initialized. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.',
      };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: ENV.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      console.log(`[SMS] Twilio message sent successfully. SID: ${result.sid}, To: ${phone}`);
      return {
        success: true,
        messageId: result.sid,
      };
    } catch (err: any) {
      const errorCode = err.code || 'UNKNOWN';
      const errorMsg = err.message || 'Unknown Twilio error';
      console.error(`[SMS] Twilio send failed (code: ${errorCode}): ${errorMsg}`);
      return {
        success: false,
        error: `Twilio error ${errorCode}: ${errorMsg}`,
      };
    }
  }

  getName(): string {
    return 'TWILIO';
  }
}
