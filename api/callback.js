/**
 * Vercel Serverless Function — Lead Callback & Contact Handler
 * Validates lead submissions, filters spam bots via honeypot, and returns JSON.
 * Compatible with raw Node.js HTTP and Vercel Serverless runtimes.
 */

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.end(JSON.stringify(data));
}

module.exports = async function handler(req, res) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
  }

  try {
    let body = req.body;

    // In raw Node.js HTTP, collect buffer if req.body is undefined
    if (!body) {
      body = await new Promise((resolve) => {
        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            try {
              const params = new URLSearchParams(raw);
              resolve(Object.fromEntries(params.entries()));
            } catch (err2) {
              resolve({});
            }
          }
        });
      });
    } else if (typeof body === 'string') {
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
      return sendJson(res, 200, { success: true, message: 'Received' });
    }

    // 2. Validate essential contact field: Phone number
    const phoneRegex = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return sendJson(res, 400, {
        error: 'Invalid phone number. Please enter a valid 10-digit mobile number.'
      });
    }

    // 3. Log lead securely (timestamped, masked for logging)
    const maskedPhone = phone.slice(0, 3) + '****' + phone.slice(-3);
    console.log(`[LEAD RECEIVED] ${new Date().toISOString()} | Service: ${service} | Phone: ${maskedPhone} | Model: ${carModel}`);

    // If an external webhook is configured:
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

    return sendJson(res, 200, {
      success: true,
      message: 'Callback request received. A technician will call you shortly.'
    });

  } catch (err) {
    console.error('Callback handler error:', err);
    return sendJson(res, 500, { error: 'Internal server error processing request.' });
  }
};
