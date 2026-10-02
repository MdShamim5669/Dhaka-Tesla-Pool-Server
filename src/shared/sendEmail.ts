import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface ISendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: ISendEmailOptions): Promise<boolean> => {
  try {
    const smtpHost = process.env.EMAIL_SENDER_SMTP_HOST || process.env.SMTP_HOST;
    const smtpUser = process.env.EMAIL_SENDER_SMTP_USER || process.env.SMTP_USER;
    const smtpPass = process.env.EMAIL_SENDER_SMTP_PASS || process.env.SMTP_PASS;
    const smtpPort = Number(process.env.EMAIL_SENDER_SMTP_PORT || process.env.SMTP_PORT || '587');
    const smtpFrom = process.env.EMAIL_SENDER_SMTP_FROM || process.env.SMTP_FROM || 'Dhaka Tesla Pool <no-reply@dhakateslapool.com>';

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      logger.info(`Email sent successfully to ${options.to}`);
      return true;
    }

    // In development or when SMTP is not configured, log the email
    logger.info({ to: options.to, subject: options.subject }, 'Email dispatch simulated (SMTP not configured)');
    return true;
  } catch (error) {
    logger.error({ error, to: options.to }, 'Failed to send email');
    return false;
  }
};

export default sendEmail;
