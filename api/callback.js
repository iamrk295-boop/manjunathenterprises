/**
 * Vercel Serverless Function — Lead Callback & Contact Handler
 * Validates lead submissions, filters spam bots via honeypot, and returns JSON.
 */

module.exports = async function handler(req, res) {
  // Set CORS and security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    let body = req.body;

    // Handle string body if not parsed automatically
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        const params = new URLSearchParams(body);
        body = Object.fromEntries(params.entries());
      }
    }

    body = body || {};

    const name = (body.name || '').trim().substring(0, 100);
    const phone = (body.phone || '').trim().replace(/[\s\-\(\)\+]/g, '');
    const carModel = (body.car_model || body.message || '').trim().substring(0, 150);
    const service = (body.service || 'Emergency Assistance').trim().substring(0, 80);
    const botField = body['bot-field'] || body.botField || '';

    // 1. Honeypot check: If bot-field is filled, silently discard
    if (botField) {
      console.warn('[SPAM DETECTED] Honeypot triggered.');
      return res.status(200).json({ success: true, message: 'Received' });
    }

    // 2. Validate essential contact field: Phone number
    // Must be valid 10-digit Indian phone number (or 12-digit with country code 91)
    const phoneRegex = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return res.status(400).json({
        error: 'Invalid phone number. Please enter a valid 10-digit mobile number.'
      });
    }

    // 3. Log lead securely (timestamped, masked for logging)
    const maskedPhone = phone.slice(0, 3) + '****' + phone.slice(-3);
    console.log(`[LEAD RECEIVED] ${new Date().toISOString()} | Service: ${service} | Phone: ${maskedPhone} | Model: ${carModel}`);

    // If an external webhook (e.g. Telegram / WhatsApp / CRM) is configured via env variable:
    if (process.env.LEAD_WEBHOOK_URL) {
      try {
        await fetch(process.env.LEAD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            name: name || 'Not provided',
            phone: phone,
            carModel: carModel || 'Not provided',
            service: service
          })
        });
      } catch (webhookErr) {
        console.error('Webhook notification failed:', webhookErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Callback request received. A technician will call you shortly.'
    });

  } catch (err) {
    console.error('Callback handler error:', err);
    return res.status(500).json({ error: 'Internal server error processing request.' });
  }
};
