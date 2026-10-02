import { IWelcomeEmailData } from './templates.interface.js';

export const getWelcomeEmailTemplate = (data: IWelcomeEmailData): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Dhaka Tesla Pool</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: #0f172a; color: #ffffff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; letter-spacing: -0.5px; }
    .header p { margin: 5px 0 0; color: #94a3b8; font-size: 14px; }
    .content { padding: 30px; }
    .content p { line-height: 1.6; font-size: 15px; }
    .tagline-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0; }
    .footer { background: #f8fafc; text-align: center; padding: 20px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Dhaka Tesla Pool</h1>
      <p>Share a seat. Split the fare. Survive Dhaka traffic.</p>
    </div>
    <div class="content">
      <h2>Welcome aboard, ${data.name}!</h2>
      <p>Thank you for joining Dhaka Tesla Pool as a <strong>${data.role}</strong>.</p>
      <div class="tagline-box">
        <strong>Our Mission:</strong> Beat Dhaka's notorious traffic congestion in luxury, eco-friendly Tesla pools while saving money through automated seat-sharing.
      </div>
      <p>${
        data.role === 'DRIVER'
          ? 'Go online in your driver portal to start receiving passenger ride pools for your assigned Tesla.'
          : 'Choose your pickup and destination zones anytime to get instant fare estimates and pool rides across Dhaka.'
      }</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Dhaka Tesla Pool. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};
