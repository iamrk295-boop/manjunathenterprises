/**
 * Vercel Serverless Function — Lead Callback & Contact Handler
 * Features:
 * - Fail-closed lead delivery (requires LEAD_WEBHOOK_URL)
 * - 5-second AbortSignal webhook timeout
 * - Masked phone privacy logging
 * - In-memory rate limiting (5 req / 10 min per IP)
 * - 10KB maximum request payload limit
 * - Strict 10-digit Indian mobile number validation
 * - Anti-spam honeypot detection
 * - Strict same-origin / allowed domain CORS validation
 */

// In-memory rate limiter store: Map<ip, Array<timestamp>>
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;

// Periodically prune stale IP records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const active = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (active.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, active);
    }
  }
}, 5 * 60 * 1000).unref();

function checkRateLimit(ip) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

// Allowed origins list
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/(www\.)?manjunathabatteries\.in$/,
  /^https:\/\/manjunathenterprises\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0.0\.1(:\d+)?$/
];

function isOriginAllowed(origin) {
  if (!origin) return true; // Same-origin requests (no Origin header in some browsers)
  if (process.env.ALLOWED_ORIGIN && origin === process.env.ALLOWED_ORIGIN) return true;
  return ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
}

function sendResponse(res, statusCode, data, origin) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  return res.end(JSON.stringify(data));
}

function sanitizeText(str, maxLength) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Strip HTML tags
    .trim()
    .substring(0, maxLength);
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || '';

  // 1. CORS Preflight & Origin Check
  if (req.headers.origin && !isOriginAllowed(req.headers.origin)) {
    return sendResponse(res, 403, {
      success: false,
      error: 'Forbidden: Request origin is not permitted.'
    }, null);
  }

  if (req.method === 'OPTIONS') {
    return sendResponse(res, 200, { success: true }, origin);
  }

  if (req.method !== 'POST') {
    return sendResponse(res, 405, {
      success: false,
      error: 'Method not allowed. Only POST is accepted.'
    }, origin);
  }

  // 2. Request Payload Size Guard (10KB max)
  const MAX_PAYLOAD_BYTES = 10 * 1024; // 10KB
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return sendResponse(res, 413, {
      success: false,
      error: 'Payload too large. Maximum allowed size is 10KB.'
    }, origin);
  }

  // 3. Client IP Extraction & Rate Limiting
  const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const clientIp = (typeof rawIp === 'string' ? rawIp.split(',')[0] : '127.0.0.1').trim();

  try {
    // 4. Parse Request Body with Size Limit
    let body = req.body;

    if (!body) {
      body = await new Promise((resolve, reject) => {
        let raw = '';
        let bytesCount = 0;

        req.on('data', chunk => {
          bytesCount += chunk.length;
          if (bytesCount > MAX_PAYLOAD_BYTES) {
            reject(new Error('PAYLOAD_TOO_LARGE'));
            req.destroy();
            return;
          }
          raw += chunk;
        });

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

        req.on('error', err => reject(err));
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

    // 5. Anti-Spam Honeypot Verification
    const botField = body['bot-field'] || body.botField || '';
    if (botField) {
      console.warn('[SPAM_BLOCKED] Honeypot field was filled by automated bot.');
      // Silently return 200 to confuse bots without exhausting webhook quota
      return sendResponse(res, 200, {
        success: true,
        message: 'Request received.'
      }, origin);
    }

    // 6. Apply In-Memory Rate Limiting for real user requests
    if (!checkRateLimit(clientIp)) {
      console.warn(`[RATE_LIMITED] IP: ${clientIp} exceeded request threshold.`);
      return sendResponse(res, 429, {
        success: false,
        error: 'Too many requests. Please wait a few minutes or call +91 80740 15911 directly.'
      }, origin);
    }

    // 7. Input Validation & Sanitization
    const name = sanitizeText(body.name, 80);
    const rawPhone = (body.phone || '').trim().replace(/[\s\-\(\)\+]/g, '');
    const carModel = sanitizeText(body.car_model || body.message, 100);
    const service = sanitizeText(body.service, 60) || 'Emergency Battery Assistance';

    // Normalize phone number (strip leading 0 or 91 country prefix if present)
    let cleanPhone = rawPhone;
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      cleanPhone = cleanPhone.substring(2);
    } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
      cleanPhone = cleanPhone.substring(1);
    }

    // Strictly validate 10-digit Indian mobile number (must start with 6, 7, 8, or 9)
    const indianMobileRegex = /^[6-9]\d{9}$/;
    if (!cleanPhone || !indianMobileRegex.test(cleanPhone)) {
      return sendResponse(res, 400, {
        success: false,
        error: 'Invalid phone number. Please enter a valid 10-digit mobile number.'
      }, origin);
    }

    // Mask phone number for logging (never log full numbers to server logs)
    const maskedPhone = cleanPhone.slice(0, 3) + '****' + cleanPhone.slice(-3);
    console.log(`[LEAD_PROCESSED] Time: ${new Date().toISOString()} | Service: ${service} | Phone: ${maskedPhone} | Vehicle: ${carModel || 'N/A'}`);

    // 8. Fail-Closed Webhook Delivery Requirement (Priority 2)
    const webhookUrl = process.env.LEAD_WEBHOOK_URL;
    if (!webhookUrl || typeof webhookUrl !== 'string' || webhookUrl.trim() === '') {
      console.error('[DISPATCH_ERROR] LEAD_WEBHOOK_URL is not configured in environment variables.');
      return sendResponse(res, 503, {
        success: false,
        error: 'Online dispatch is currently unavailable. Please call +91 80740 15911 directly for immediate assistance.'
      }, origin);
    }

    // Validate webhook URL format
    let validWebhookUrl;
    try {
      validWebhookUrl = new URL(webhookUrl);
      if (!['http:', 'https:'].includes(validWebhookUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (urlErr) {
      console.error('[CONFIG_ERROR] LEAD_WEBHOOK_URL format is invalid.');
      return sendResponse(res, 500, {
        success: false,
        error: 'Lead dispatch configuration error. Please call +91 80740 15911 directly.'
      }, origin);
    }

    // Forward lead payload to configured webhook with 5-second AbortSignal timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const notificationSummary = `🚨 NEW BATTERY LEAD: ${service}\n📞 Phone: ${cleanPhone}\n👤 Name: ${name || 'Not provided'}\n🚗 Vehicle: ${carModel || 'Not provided'}\n🌐 Source: manjunathabatteries.in`;

    const leadPayload = {
      // Standard Generic & CRM Payload fields
      timestamp: new Date().toISOString(),
      source: 'manjunathabatteries.in',
      name: name || 'Not provided',
      phone: cleanPhone,
      carModel: carModel || 'Not provided',
      service: service,

      // Discord Webhook compatibility
      content: notificationSummary,

      // Slack Incoming Webhook compatibility
      text: notificationSummary
    };

    let webhookResponse;
    try {
      webhookResponse = await fetch(validWebhookUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ManjunathBatteries-LeadDispatcher/1.0'
        },
        body: JSON.stringify(leadPayload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        console.error('[DISPATCH_TIMEOUT] Lead webhook timed out after 5000ms.');
        return sendResponse(res, 504, {
          success: false,
          error: 'Lead dispatch service timed out. Please call +91 80740 15911 directly for immediate assistance.'
        }, origin);
      }
      console.error('[DISPATCH_NET_ERROR] Webhook network failure:', fetchErr.message);
      return sendResponse(res, 502, {
        success: false,
        error: 'Lead dispatch service could not be reached. Please call +91 80740 15911 directly.'
      }, origin);
    }

    // Check webhook response status
    if (!webhookResponse.ok) {
      console.error(`[DISPATCH_HTTP_ERROR] Lead webhook returned non-2xx status: ${webhookResponse.status}`);
      return sendResponse(res, 502, {
        success: false,
        error: 'Lead dispatch system rejected the enquiry. Please call +91 80740 15911 directly.'
      }, origin);
    }

    // Delivery confirmed by lead handling system
    return sendResponse(res, 200, {
      success: true,
      message: 'Callback request received. A technician will call you shortly.'
    }, origin);

  } catch (err) {
    if (err.message === 'PAYLOAD_TOO_LARGE') {
      return sendResponse(res, 413, {
        success: false,
        error: 'Payload too large. Maximum allowed size is 10KB.'
      }, origin);
    }
    console.error('[SERVER_ERROR] Unexpected failure:', err);
    return sendResponse(res, 500, {
      success: false,
      error: 'An unexpected error occurred while processing your request. Please call +91 80740 15911 directly.'
    }, origin);
  }
};
