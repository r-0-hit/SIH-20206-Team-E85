/**
 * PyroGuard AI — Twilio WhatsApp Provider
 * Implements the SMSProvider interface using Twilio's WhatsApp Sandbox API.
 * Enables zero-cost, instant emergency alert dispatch with rich formatting.
 */

import Twilio from 'twilio';
import { SMSProvider, SMSResult } from './smsProvider.js';
import { ENV } from '../../config/env.js';

export class TwilioWhatsAppProvider implements SMSProvider {
  private client: Twilio.Twilio | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /** Lazily initializes the Twilio client for WhatsApp Sandbox. */
  private initialize(): void {
    if (!ENV.TWILIO_ACCOUNT_SID || !ENV.TWILIO_AUTH_TOKEN) {
      console.warn(
        '[WhatsApp] Twilio credentials not configured. WhatsApp alerts will not be delivered. ' +
        'Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.'
      );
      return;
    }

    try {
      this.client = Twilio(ENV.TWILIO_ACCOUNT_SID, ENV.TWILIO_AUTH_TOKEN);
      this.initialized = true;
      console.log('[WhatsApp] Twilio WhatsApp provider initialized successfully.');
    } catch (err: any) {
      console.error(`[WhatsApp] Failed to initialize Twilio client: ${err.message}`);
    }
  }

  async sendSMS(phone: string, message: string): Promise<SMSResult> {
    if (!this.client || !this.initialized) {
      console.warn(`[WhatsApp] Twilio not initialized. Would have sent WhatsApp alert to ${phone}`);
      return {
        success: false,
        error: 'Twilio client not initialized. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.',
      };
    }

    // Ensure WhatsApp prefix for sender and recipient
    const senderNumber = ENV.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
      ? ENV.TWILIO_WHATSAPP_NUMBER
      : `whatsapp:${ENV.TWILIO_WHATSAPP_NUMBER}`;

    const formattedRecipient = phone.startsWith('whatsapp:')
      ? phone
      : `whatsapp:${phone.startsWith('+') ? phone : `+${phone}`}`;

    try {
      const result = await this.client.messages.create({
        body: message,
        from: senderNumber,
        to: formattedRecipient,
      });

      console.log(`[WhatsApp] Alert sent successfully! SID: ${result.sid}, To: ${formattedRecipient}`);
      return {
        success: true,
        messageId: result.sid,
      };
    } catch (err: any) {
      const errorCode = err.code || 'UNKNOWN';
      const errorMsg = err.message || 'Unknown Twilio error';
      console.error(`[WhatsApp] Twilio send failed (code: ${errorCode}): ${errorMsg}`);
      return {
        success: false,
        error: `Twilio WhatsApp error ${errorCode}: ${errorMsg}`,
      };
    }
  }

  getName(): string {
    return 'TWILIO_WHATSAPP';
  }
}
