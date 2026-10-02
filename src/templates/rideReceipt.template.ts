import { IRideReceiptEmailData } from './templates.interface.js';

export const getRideReceiptTemplate = (data: IRideReceiptEmailData): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Dhaka Tesla Pool Ride Receipt</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: #0f172a; color: #ffffff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .route-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0; }
    .route-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
    .fare-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .fare-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .fare-table tr.total td { font-weight: bold; font-size: 18px; border-bottom: none; color: #0f172a; padding-top: 15px; }
    .badge-pooled { background: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 4px; display: inline-block; }
    .badge-solo { background: #e0f2fe; color: #0369a1; font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 4px; display: inline-block; }
    .footer { background: #f8fafc; text-align: center; padding: 20px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ride Completed</h1>
      <p style="margin: 5px 0 0; color: #94a3b8;">Receipt for Ride #${data.rideId.slice(0, 8)}</p>
    </div>
    <div class="content">
      <p>Hello ${data.passengerName}, thank you for riding with Dhaka Tesla Pool!</p>
      
      <div class="route-card">
        <div style="font-weight: 600; margin-bottom: 10px;">Trip Summary &bull; ${data.date}</div>
        <div class="route-row">
          <span>Pickup Zone:</span>
          <strong>${data.pickupZone}</strong>
        </div>
        <div class="route-row">
          <span>Destination Zone:</span>
          <strong>${data.destZone}</strong>
        </div>
        <div class="route-row">
          <span>Seats Reserved:</span>
          <strong>${data.seats} seat(s)</strong>
        </div>
        <div class="route-row">
          <span>Pooling Status:</span>
          <span>${data.isPooled ? '<span class="badge-pooled">Pooled &bull; 20% Discount</span>' : '<span class="badge-solo">Solo Trip</span>'}</span>
        </div>
        <div class="route-row">
          <span>Distance:</span>
          <strong>${data.distanceKm.toFixed(1)} km</strong>
        </div>
      </div>

      <table class="fare-table">
        <tr>
          <td>Base Fare & Distance Charge</td>
          <td align="right">৳${data.baseFare.toFixed(2)}</td>
        </tr>
        ${data.discountAmount ? `
        <tr>
          <td style="color: #16a34a;">Pool Discount Applied</td>
          <td align="right" style="color: #16a34a;">-৳${data.discountAmount.toFixed(2)}</td>
        </tr>` : ''}
        <tr>
          <td>Payment Method</td>
          <td align="right">${data.paymentMethod}</td>
        </tr>
        <tr class="total">
          <td>Total Paid</td>
          <td align="right">৳${data.finalFare.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    <div class="footer">
      <p>Questions about your fare? Contact support@dhakateslapool.com</p>
    </div>
  </div>
</body>
</html>`;
};
