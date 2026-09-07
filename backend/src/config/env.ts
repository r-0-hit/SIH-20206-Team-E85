import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback to local .env

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'pyroguard-super-secret-key-for-jwt-tokens-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
  DATABASE_PATH: process.env.DATABASE_PATH || path.resolve(process.cwd(), '../database/pyroguard.sqlite'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 mins
  RATE_LIMIT_MAX: 500, // requests per window

  // SMS Alert Configuration
  SMS_ALERT_ENABLED: process.env.SMS_ALERT_ENABLED === 'true',
  SMS_RISK_THRESHOLD: parseInt(process.env.SMS_RISK_THRESHOLD || '75', 10),
  SMS_ALERT_RECIPIENTS: process.env.SMS_ALERT_RECIPIENTS || '',
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'TWILIO',

  // Twilio Credentials
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886',

  // Telegram Alert Credentials
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
};

