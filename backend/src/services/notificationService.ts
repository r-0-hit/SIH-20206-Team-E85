/**
 * PyroGuard AI — Notification Service
 * Core orchestrator for SMS alert dispatch on high-risk thermal events.
 *
 * Responsibilities:
 *   - Evaluate whether a detection qualifies for SMS alert (risk threshold)
 *   - Prevent duplicate SMS for the same analysis
 *   - Resolve human-readable address via geocoding
 *   - Format the SMS message
 *   - Dispatch via the configured SMS provider (Twilio)
 *   - Log all attempts to the sms_alerts table
 *
 * Design principles:
 *   - Fire-and-forget: never blocks the detection pipeline
 *   - Fail-safe: SMS failure never affects detection/analysis storage
 *   - Provider-agnostic: swap Twilio for MSG91 by changing SMS_PROVIDER env
 */

import { ENV } from '../config/env.js';
import { getOne, run } from '../config/database.js';
import { resolveAddress } from './geocodingService.js';
import { SMSProvider, SMSResult } from './smsProviders/smsProvider.js';
import { TwilioProvider } from './smsProviders/twilioProvider.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface NotificationPayload {
  analysisId: string;
  lat: number;
  lon: number;
  classification: string;
  riskScore: number;
  nearestFacilityName: string;
  facilityType: string;
}

// ── Classification display names ─────────────────────────────────────────────

const CLASSIFICATION_LABELS: Record<string, string> = {
  INDUSTRIAL_ACCIDENTAL_FIRE: 'Industrial Accidental Fire',
  INDUSTRIAL_PERSISTENT: 'Industrial Persistent Flaring',
  WILDFIRE: 'Wildfire',
  AGRICULTURAL_BURNING: 'Agricultural Burning',
  MINING_EXTRACTION: 'Mining Extraction Fire',
  OTHER_OR_FALSE_ALARM: 'Other / False Alarm',
};

const FACILITY_TYPE_LABELS: Record<string, string> = {
  petroleum_refinery: 'Petroleum Refinery',
  chemical_complex: 'Chemical Complex',
  thermal_power_plant: 'Thermal Power Plant',
  steel_mill: 'Steel Mill',
  coal_mine: 'Coal Mine',
  offshore_flaring_platform: 'Offshore Flaring Platform',
  industrial: 'Industrial Area',
  factory: 'Factory',
  refinery: 'Refinery',
  power: 'Power Plant',
};

// ── Notification Service Class ───────────────────────────────────────────────

class NotificationService {
  private provider: SMSProvider;
  private enabled: boolean;
  private riskThreshold: number;
  private recipients: string[];

  constructor() {
    this.enabled = ENV.SMS_ALERT_ENABLED;
    this.riskThreshold = ENV.SMS_RISK_THRESHOLD;

    // Parse comma-separated recipient phone numbers
    this.recipients = ENV.SMS_ALERT_RECIPIENTS
      ? ENV.SMS_ALERT_RECIPIENTS.split(',').map((r) => r.trim()).filter(Boolean)
      : [];

    // Initialize SMS provider based on config
    this.provider = this.createProvider();

    if (this.enabled) {
      if (this.recipients.length === 0) {
        console.warn('[Notification] SMS_ALERT_ENABLED is true but SMS_ALERT_RECIPIENTS is empty. No SMS will be sent.');
      } else {
        console.log(
          `[Notification] SMS alerts enabled. Provider: ${this.provider.getName()}, ` +
          `Threshold: risk >= ${this.riskThreshold}, Recipients: ${this.recipients.length}`
        );
      }
    } else {
      console.log('[Notification] SMS alerts are disabled (SMS_ALERT_ENABLED=false).');
    }
  }

  /** Creates the appropriate SMS provider based on the SMS_PROVIDER env variable. */
  private createProvider(): SMSProvider {
    const providerName = ENV.SMS_PROVIDER.toUpperCase();

    switch (providerName) {
      case 'TWILIO':
        return new TwilioProvider();
      // Future providers can be added here:
      // case 'MSG91':
      //   return new MSG91Provider();
      // case 'GUPSHUP':
      //   return new GupshupProvider();
      default:
        console.warn(`[Notification] Unknown SMS_PROVIDER "${providerName}". Defaulting to Twilio.`);
        return new TwilioProvider();
    }
  }

  /**
   * Determines whether a detection qualifies for an SMS alert.
   * Only high-risk, non-routine events trigger SMS.
   */
  shouldTriggerAlert(riskScore: number, classification: string): boolean {
    // Never alert for false alarms or routine persistent flaring
    if (classification === 'OTHER_OR_FALSE_ALARM') return false;
    if (classification === 'INDUSTRIAL_PERSISTENT') return false;

    return riskScore >= this.riskThreshold;
  }

  /**
   * Fire-and-forget entry point. Called from detectionController after ML analysis.
   * Evaluates the event, resolves address, formats SMS, and dispatches.
   * All errors are caught internally — this method NEVER throws.
   */
  evaluateAndNotify(payload: NotificationPayload): void {
    // Intentionally NOT awaited — fire-and-forget
    this._processNotification(payload).catch((err) => {
      console.error(`[Notification] Unexpected error in notification pipeline: ${err.message}`);
    });
  }

  /** Internal async notification pipeline. */
  private async _processNotification(payload: NotificationPayload): Promise<void> {
    // 1. Check if SMS alerts are enabled
    if (!this.enabled) return;

    // 2. Check if recipients are configured
    if (this.recipients.length === 0) return;

    // 3. Check risk threshold
    if (!this.shouldTriggerAlert(payload.riskScore, payload.classification)) {
      return;
    }

    // 4. Check for duplicate (has this analysis already been alerted?)
    const isDuplicate = await this.checkDuplicate(payload.analysisId);
    if (isDuplicate) {
      console.log(`[Notification] Skipping duplicate SMS for analysis ${payload.analysisId}`);
      return;
    }

    // 5. Resolve human-readable address (never raw coordinates)
    let address: string;
    try {
      address = await resolveAddress(
        payload.lat,
        payload.lon,
        payload.nearestFacilityName
      );
    } catch (err: any) {
      console.warn(`[Notification] Address resolution failed: ${err.message}. Using facility name fallback.`);
      address = payload.nearestFacilityName || 'Unknown Location';
    }

    // 6. Format SMS message
    const message = this.formatSMSMessage({
      address,
      classification: payload.classification,
      riskScore: payload.riskScore,
      facilityType: payload.facilityType,
      analysisId: payload.analysisId,
    });

    // 7. Send to all recipients
    for (const phone of this.recipients) {
      await this.sendAndLog(phone, message, payload.analysisId);
    }
  }

  /** Checks if an SMS alert has already been sent for the given analysis ID. */
  private async checkDuplicate(analysisId: string): Promise<boolean> {
    try {
      const existing = await getOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM sms_alerts WHERE analysis_id = ? AND status IN ('SENT', 'PENDING')`,
        [analysisId]
      );
      return (existing?.count || 0) > 0;
    } catch (err: any) {
      // If the table doesn't exist yet or query fails, allow the SMS (fail-open for alerting)
      console.warn(`[Notification] Duplicate check failed: ${err.message}. Proceeding with SMS.`);
      return false;
    }
  }

  /** Sends SMS via the provider and logs the result to the sms_alerts table. */
  private async sendAndLog(phone: string, message: string, analysisId: string): Promise<void> {
    const alertId = `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Insert PENDING record first
    try {
      await run(
        `INSERT INTO sms_alerts (id, analysis_id, recipient_phone, message_content, provider, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
        [alertId, analysisId, phone, message, this.provider.getName(), new Date().toISOString()]
      );
    } catch (err: any) {
      console.warn(`[Notification] Failed to log pending SMS alert: ${err.message}`);
      // Continue to send even if logging fails
    }

    // Send via provider
    let result: SMSResult;
    try {
      result = await this.provider.sendSMS(phone, message);
    } catch (err: any) {
      result = { success: false, error: err.message };
    }

    // Update status
    try {
      if (result.success) {
        await run(
          `UPDATE sms_alerts SET status = 'SENT', provider_message_id = ? WHERE id = ?`,
          [result.messageId || '', alertId]
        );
        console.log(`[Notification] ✅ SMS alert sent for ${analysisId} to ${phone} (ID: ${result.messageId})`);
      } else {
        await run(
          `UPDATE sms_alerts SET status = 'FAILED', error_message = ? WHERE id = ?`,
          [result.error || 'Unknown error', alertId]
        );
        console.error(`[Notification] ❌ SMS alert failed for ${analysisId} to ${phone}: ${result.error}`);
      }
    } catch (err: any) {
      console.warn(`[Notification] Failed to update SMS alert status: ${err.message}`);
    }
  }

  /** Formats the SMS message body — concise, actionable, human-readable. */
  private formatSMSMessage(data: {
    address: string;
    classification: string;
    riskScore: number;
    facilityType: string;
    analysisId: string;
  }): string {
    const classLabel = CLASSIFICATION_LABELS[data.classification] || data.classification.replace(/_/g, ' ');
    const contextLabel = FACILITY_TYPE_LABELS[data.facilityType] || data.facilityType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    return [
      `🚨 PYROGUARD ALERT`,
      ``,
      `High-risk thermal event detected.`,
      ``,
      `Location: ${data.address}`,
      `Classification: ${classLabel}`,
      `Risk Score: ${data.riskScore}/100`,
      `Context: ${contextLabel}`,
      ``,
      `Immediate assessment recommended.`,
      ``,
      `Ref: ${data.analysisId}`,
    ].join('\n');
  }
}

// ── Singleton Export ──────────────────────────────────────────────────────────

export const notificationService = new NotificationService();
