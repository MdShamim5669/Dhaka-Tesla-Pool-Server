import { IRideCancelledEmailData } from './templates.interface.js';

export const getRideCancelledTemplate = (data: IRideCancelledEmailData): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ride Request Update</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: #b91c1c; color: #ffffff; padding: 25px; text-align: center; }
    .content { padding: 30px; }
    .reason-box { background: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px; padding: 15px; margin: 20px 0; color: #991b1b; }
    .footer { background: #f8fafc; text-align: center; padding: 20px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Ride Request Cancelled</h2>
    </div>
    <div class="content">
      <p>Hello ${data.name},</p>
      <p>Your ride request (<strong>${data.pickupZone} &rarr; ${data.destZone}</strong>) has been cancelled.</p>
      <div class="reason-box">
        <strong>Reason:</strong> ${data.reason}
      </div>
      <p>You can create a new ride request anytime through the Dhaka Tesla Pool app.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Dhaka Tesla Pool</p>
    </div>
  </div>
</body>
</html>`;
};
