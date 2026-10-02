import nodemailer from 'nodemailer';
import { logger } from './logger.js';
import { IEmailOptions, IEmailResult } from './utils.interface.js';

export const emailUtils = {
  /**
   * Send an email via SMTP or fallback to logging in development
   */
  async sendEmail(options: IEmailOptions): Promise<IEmailResult> {
    try {
      const smtpHost = process.env.EMAIL_SENDER_SMTP_HOST || process.env.SMTP_HOST;
      const smtpUser = process.env.EMAIL_SENDER_SMTP_USER || process.env.SMTP_USER;
      const smtpPass = process.env.EMAIL_SENDER_SMTP_PASS || process.env.SMTP_PASS;
      const smtpPort = Number(process.env.EMAIL_SENDER_SMTP_PORT || process.env.SMTP_PORT || '587');
      const smtpFrom =
        process.env.EMAIL_SENDER_SMTP_FROM ||
        process.env.SMTP_FROM ||
        'Dhaka Tesla Pool <no-reply@dhakateslapool.com>';

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

        const info = await transporter.sendMail({
          from: smtpFrom,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });

        logger.info(`Email sent successfully to ${options.to}`);
        return {
          success: true,
          messageId: info.messageId,
        };
      }

      // Safe logging fallback when SMTP credentials are not yet configured in local dev
      logger.info(
        { to: options.to, subject: options.subject },
        'Email dispatch simulated (SMTP credentials not configured)'
      );
      return {
        success: true,
      };
    } catch (error: any) {
      logger.error({ error, to: options.to }, 'Failed to send email');
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  },
};

export const { sendEmail } = emailUtils;
export default emailUtils;
