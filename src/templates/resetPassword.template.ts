import { IPasswordResetEmailData } from './templates.interface.js';

export const getResetPasswordTemplate = (data: IPasswordResetEmailData): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: #0f172a; color: #ffffff; padding: 30px; text-align: center; }
    .content { padding: 30px; text-align: center; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 25px 0; }
    .footer { background: #f8fafc; text-align: center; padding: 20px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello ${data.name},</p>
      <p>We received a request to reset your password for your Dhaka Tesla Pool account.</p>
      <a href="${data.resetLink}" class="btn">Reset Password</a>
      <p style="font-size: 13px; color: #64748b;">This link will expire in ${data.expiresInMinutes || 15} minutes. If you did not request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Dhaka Tesla Pool Security</p>
    </div>
  </div>
</body>
</html>`;
};
