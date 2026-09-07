/**
 * PyroGuard AI — SMS Provider Interface
 * Abstraction layer allowing seamless provider swaps (Twilio, MSG91, Gupshup).
 * The rest of the application interacts only with this interface.
 */

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSProvider {
  /**
   * Sends an SMS message to the specified phone number.
   * @param phone - Recipient phone number in E.164 format (e.g., +919876543210)
   * @param message - SMS body text
   * @returns Promise resolving to the delivery result
   */
  sendSMS(phone: string, message: string): Promise<SMSResult>;

  /** Returns the provider name for logging and audit purposes. */
  getName(): string;
}
