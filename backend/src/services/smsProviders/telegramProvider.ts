/**
 * PyroGuard AI — Telegram Alert Provider
 * Implements the SMSProvider interface using Telegram's official HTTPS Bot API.
 * 100% free, zero carrier limits, instant sub-second delivery with rich Markdown formatting.
 */

import { SMSProvider, SMSResult } from './smsProvider.js';
import { ENV } from '../../config/env.js';

export class TelegramProvider implements SMSProvider {
  private botToken: string;
  private defaultChatId: string;

  constructor() {
    this.botToken = ENV.TELEGRAM_BOT_TOKEN || '';
    this.defaultChatId = ENV.TELEGRAM_CHAT_ID || '';
    if (this.botToken) {
      console.log('[Telegram] Telegram Alert Provider initialized successfully.');
    } else {
      console.warn('[Telegram] TELEGRAM_BOT_TOKEN not configured in environment.');
    }
  }

  async sendSMS(recipientOrChatId: string, message: string): Promise<SMSResult> {
    const chatId = recipientOrChatId || this.defaultChatId;

    if (!this.botToken || !chatId) {
      console.warn(`[Telegram] Cannot send alert: missing botToken or chatId. (chatId=${chatId})`);
      return {
        success: false,
        error: 'Telegram bot token or chat ID is missing in configuration.',
      };
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: false,
        }),
      });

      const data = await response.json() as any;

      if (data.ok) {
        console.log(`[Telegram] Alert dispatched successfully! Message ID: ${data.result.message_id}, Chat: ${chatId}`);
        return {
          success: true,
          messageId: String(data.result.message_id),
        };
      } else {
        console.error(`[Telegram] API error: ${data.description} (code: ${data.error_code})`);
        return {
          success: false,
          error: `Telegram error ${data.error_code}: ${data.description}`,
        };
      }
    } catch (err: any) {
      console.error(`[Telegram] Network dispatch error: ${err.message}`);
      return {
        success: false,
        error: `Telegram network error: ${err.message}`,
      };
    }
  }

  getName(): string {
    return 'TELEGRAM';
  }
}
