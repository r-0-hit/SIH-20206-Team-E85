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
import { TwilioWhatsAppProvider } from './smsProviders/twilioWhatsAppProvider.js';
import { TelegramProvider } from './smsProviders/telegramProvider.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface NotificationPayload {
  analysisId: string;
  lat: number;
  lon: number;
  classification: string;
  riskScore: number;
  nearestFacilityName: string;
  facilityType: string;
  frp?: number;
  distanceKm?: number;
  isIndustrial?: boolean;
  anomalyRatio?: number;
  zScore?: number;
  expectedFrp?: number;
  isAnomalousSurge?: boolean;
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

    // Parse comma-separated recipient phone numbers or Telegram Chat IDs
    this.recipients = ENV.SMS_ALERT_RECIPIENTS
      ? ENV.SMS_ALERT_RECIPIENTS.split(',').map((r) => r.trim()).filter(Boolean)
      : [];

    if (ENV.SMS_PROVIDER.toUpperCase() === 'TELEGRAM' && ENV.TELEGRAM_CHAT_ID) {
      if (!this.recipients.includes(ENV.TELEGRAM_CHAT_ID)) {
        this.recipients.push(ENV.TELEGRAM_CHAT_ID);
      }
    }

    // Initialize SMS/Alert provider based on config
    this.provider = this.createProvider();

    if (this.enabled) {
      if (this.recipients.length === 0) {
        console.warn('[Notification] Alerts enabled but no recipients configured.');
      } else {
        console.log(
          `[Notification] Alerts enabled. Provider: ${this.provider.getName()}, ` +
          `Threshold: risk >= ${this.riskThreshold}, Recipients: ${this.recipients.length}`
        );
      }
    } else {
      console.log('[Notification] Alerts are disabled.');
    }
  }

  /** Creates the appropriate alert provider based on the SMS_PROVIDER env variable. */
  private createProvider(): SMSProvider {
    const providerName = ENV.SMS_PROVIDER.toUpperCase();

    switch (providerName) {
      case 'TELEGRAM':
        return new TelegramProvider();
      case 'TWILIO_WHATSAPP':
      case 'WHATSAPP':
        return new TwilioWhatsAppProvider();
      case 'TWILIO':
      case 'TWILIO_SMS':
        return new TwilioProvider();
      default:
        console.warn(`[Notification] Unknown SMS_PROVIDER "${providerName}". Defaulting to Telegram.`);
        return new TelegramProvider();
    }
  }

  /**
   * Determines whether a detection qualifies for an emergency alert.
   * STRICT CRITERIA:
   * 1. Never alert on false alarms or benign low-risk events (risk < threshold).
   * 2. Never alert on routine operational flaring (INDUSTRIAL_PERSISTENT).
   * 3. For industrial facilities (Jamnagar, Panipat, refineries, chemical plants):
   *    High temperature is ROUTINE for them (they flare gas 24/7).
   *    We ONLY alert if there is an unequivocal SUDDEN TEMPERATURE / FRP SPIKE:
   *    - anomaly_ratio >= 2.0 (FRP is >= 2x above learned operational baseline)
   *    - OR z_score >= 2.5 (anomalous surge)
   *    - OR is_anomalous_surge is explicitly true
   *    Routine baseline heat is strictly suppressed to eliminate false alarms.
   */
  shouldTriggerAlert(payload: NotificationPayload): boolean {
    // 1. Never alert for false alarms or low-risk events
    if (payload.classification === 'OTHER_OR_FALSE_ALARM') return false;
    if (payload.classification === 'INDUSTRIAL_PERSISTENT') return false;
    if (payload.riskScore < this.riskThreshold) return false;

    // 2. High-baseline industrial facilities (refineries like Jamnagar, Panipat, chemical plants, steel mills, power plants):
    // These facilities operate continuously at high temperatures (naturally in the red zone) and flare gas 24/7.
    // Continuous baseline heat must NEVER trigger alerts.
    // Alert ONLY if there is an unequivocal SUDDEN SPIKE in temperature/FRP relative to the learned baseline.
    const isBaselineFacility = Boolean(
      payload.isIndustrial ||
      payload.facilityType === 'petroleum_refinery' ||
      payload.facilityType === 'chemical_complex' ||
      payload.facilityType === 'refinery' ||
      payload.facilityType === 'steel_mill' ||
      payload.facilityType === 'thermal_power_plant' ||
      payload.facilityType === 'offshore_flaring_platform' ||
      payload.facilityType === 'factory' ||
      payload.facilityType === 'industrial' ||
      (payload.nearestFacilityName && /jamnagar|panipat|refinery|petrochemical|smelter|flaring|steel|power/i.test(payload.nearestFacilityName)) ||
      (payload.distanceKm !== undefined && payload.distanceKm <= 5.0 && payload.expectedFrp && payload.expectedFrp > 0)
    );

    if (isBaselineFacility) {
      const ratio = payload.anomalyRatio || (payload.frp && payload.expectedFrp && payload.expectedFrp > 0 ? payload.frp / payload.expectedFrp : 1.0);
      const z = payload.zScore || 0.0;
      const hasSpike = Boolean(
        payload.isAnomalousSurge ||
        ratio >= 2.0 ||
        z >= 2.5
      );

      if (!hasSpike) {
        console.log(
          `[Notification] ⏭️ Suppressing alert for ${payload.nearestFacilityName || 'Facility'}: ` +
          `Facility operates in continuous high-temperature red zone. Current FRP (${payload.frp !== undefined ? payload.frp + ' MW' : 'baseline'}) is normal (ratio: ${ratio.toFixed(2)}x, z-score: ${z.toFixed(2)}). Alerts trigger ONLY on sudden thermal spikes.`
        );
        return false;
      }

      console.log(
        `[Notification] 🚨 SUDDEN THERMAL SPIKE CONFIRMED at ${payload.nearestFacilityName || 'Facility'}: ` +
        `Current FRP (${payload.frp !== undefined ? payload.frp + ' MW' : 'N/A'}) is ${ratio.toFixed(2)}x above learned baseline (z-score: ${z.toFixed(2)}). Dispatching emergency Telegram alert!`
      );
    }

    return true;
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

    // 3. Check sudden spike and risk threshold
    if (!this.shouldTriggerAlert(payload)) {
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

    // 6. Format alert message (rich WhatsApp markdown or concise SMS)
    const message = this.formatSMSMessage({
      address,
      classification: payload.classification,
      riskScore: payload.riskScore,
      facilityType: payload.facilityType,
      nearestFacilityName: payload.nearestFacilityName,
      analysisId: payload.analysisId,
      lat: payload.lat,
      lon: payload.lon,
      frp: payload.frp,
      distanceKm: payload.distanceKm,
      anomalyRatio: payload.anomalyRatio,
      expectedFrp: payload.expectedFrp,
      isRich: this.provider.getName() === 'TELEGRAM' || this.provider.getName() === 'TWILIO_WHATSAPP',
    });

    // 7. Send to all recipients
    for (const phone of this.recipients) {
      await this.sendAndLog(phone, message, payload.analysisId);
    }
  }

  /** Returns current alert subsystem status. */
  public getStatus() {
    return {
      enabled: this.enabled,
      provider: this.provider.getName(),
      riskThreshold: this.riskThreshold,
      recipientsCount: this.recipients.length,
      recipients: this.recipients,
      botName: '@pyroguard_alerts_soham_bot',
      botUrl: 'https://t.me/pyroguard_alerts_soham_bot',
      spikeRule: 'FRP >= 2.0x baseline or z-score >= 2.5',
    };
  }

  /**
   * Manually dispatches an alert for an incident on operator command.
   * Bypasses routine suppression and deduplication.
   */
  public async dispatchManualAlert(payload: NotificationPayload): Promise<SMSResult> {
    let address: string;
    try {
      address = await resolveAddress(
        payload.lat,
        payload.lon,
        payload.nearestFacilityName
      );
    } catch {
      address = payload.nearestFacilityName || 'Unknown Location';
    }

    const message = this.formatSMSMessage({
      address,
      classification: payload.classification,
      riskScore: payload.riskScore,
      facilityType: payload.facilityType,
      nearestFacilityName: payload.nearestFacilityName,
      analysisId: payload.analysisId,
      lat: payload.lat,
      lon: payload.lon,
      frp: payload.frp,
      distanceKm: payload.distanceKm,
      anomalyRatio: payload.anomalyRatio,
      expectedFrp: payload.expectedFrp,
      isRich: this.provider.getName() === 'TELEGRAM' || this.provider.getName() === 'TWILIO_WHATSAPP',
    });

    let lastResult: SMSResult = { success: false, error: 'No recipients configured' };
    for (const recipient of this.recipients) {
      lastResult = await this.provider.sendSMS(recipient, message);
    }
    return lastResult;
  }

  /**
   * Dispatches a quick live diagnostic ping to Telegram to verify bot connectivity.
   */
  public async sendTestPing(): Promise<SMSResult> {
    const timestamp = new Date().toISOString();
    const message = [
      `🤖 *PYROGUARD AI — TELEGRAM ALERT CHANNEL VERIFIED* 🟢`,
      ``,
      `✅ *Status:* Online & Listening`,
      `⚡ *Active Channel:* Telegram Bot (\`@pyroguard_alerts_soham_bot\`)`,
      `🛡️ *Spike Defense:* Industrial baseline flaring suppressed`,
      `🚨 *Trigger Rule:* Sudden thermal surge (≥2.0× baseline) OR Wildfire (Risk ≥ 75)`,
      `⏱️ *Ping Timestamp:* \`${timestamp}\``,
      ``,
      `Ready to dispatch immediate alerts for verified emergencies.`
    ].join('\n');

    let lastResult: SMSResult = { success: false, error: 'No recipients configured' };
    for (const recipient of this.recipients) {
      lastResult = await this.provider.sendSMS(recipient, message);
    }
    return lastResult;
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

  /** Formats the alert message body — rich WhatsApp markdown or concise SMS. */
  private formatSMSMessage(data: {
    address: string;
    classification: string;
    riskScore: number;
    facilityType: string;
    nearestFacilityName?: string;
    analysisId: string;
    lat: number;
    lon: number;
    frp?: number;
    distanceKm?: number;
    anomalyRatio?: number;
    expectedFrp?: number;
    isRich?: boolean;
  }): string {
    const classLabel = CLASSIFICATION_LABELS[data.classification] || data.classification.replace(/_/g, ' ');
    const contextLabel = FACILITY_TYPE_LABELS[data.facilityType] || data.facilityType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const mapsUrl = `https://maps.google.com/?q=${data.lat},${data.lon}`;

    if (data.isRich) {
      const facilityDesc = data.nearestFacilityName
        ? `🏭 *Nearest Facility:* ${data.nearestFacilityName}${data.distanceKm !== undefined ? ` (${data.distanceKm} km away)` : ''}`
        : `🏭 *Context:* ${contextLabel}`;
      const frpDesc = data.frp ? `⚡ *Fire Radiative Power (FRP):* ${data.frp} MW\n` : '';
      const spikeDesc = data.anomalyRatio && data.anomalyRatio >= 1.5
        ? `📈 *Thermal Spike Detected:* ${data.anomalyRatio.toFixed(1)}× above learned operational baseline${data.expectedFrp ? ` (Normal: ~${data.expectedFrp} MW)` : ''}\n`
        : '';

      return [
        `🚨 *PYROGUARD AI — CRITICAL THERMAL SPIKE ALERT* 🚨`,
        ``,
        `🔥 *Classification:* ${classLabel}`,
        `⚡ *Risk Score:* ${data.riskScore}/100 [CRITICAL HAZARD]`,
        `${frpDesc}${spikeDesc}${facilityDesc}`,
        `📍 *Location / Address:* ${data.address}`,
        `🌐 *Exact Coordinates:* ${data.lat.toFixed(4)}° N, ${data.lon.toFixed(4)}° E`,
        ``,
        `⚠️ *EMERGENCY RESPONSE PROTOCOL:*`,
        `• Immediate dispatch of on-site fire suppression units`,
        `• Isolate hydrocarbon feeds & volatile storage zones`,
        `• Alert district disaster management authorities`,
        ``,
        `🗺️ *Open Coordinates in Google Maps:*`,
        `${mapsUrl}`,
        ``,
        `🆔 *Incident Ref:* \`${data.analysisId}\``,
      ].join('\n');
    }

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
