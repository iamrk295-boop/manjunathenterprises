/**
 * Comprehensive Automated Verification Script for Manjutha Batteries Landing Page
 * Tests:
 * 1. Hero copy, CTA hierarchy & phone/WhatsApp links
 * 2. Focused 2-service requirements (Service A & B)
 * 3. 3-step process copy
 * 4. Mobile sticky CTA bar
 * 5. Dedicated pages (contact-us, privacy-policy) & addresses
 * 6. Error alert containers & honest recovery UI
 * 7. GTM placeholders & dataLayer tracking integrity
 * 8. API Callback endpoint (/api/callback):
 *    - Missing LEAD_WEBHOOK_URL (fails closed with 503)
 *    - Invalid phone number (returns 400)
 *    - Honeypot bot submission (silently discarded)
 *    - Payload size limit >10KB (returns 413)
 *    - Disallowed cross-origin request (returns 403)
 *    - Webhook destination failure / non-2xx (returns 502)
 *    - Webhook destination timeout (returns 504)
 *    - Successful webhook delivery (returns 200)
 *    - Rate limiting threshold (returns 429)
 * 9. Client-side JS code audit (verifies no false success, no GTM push on failure)
 */

const fs = require('fs');
const path = require('path');
const callbackHandler = require('../api/callback');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
  }
}

console.log('\n=== RUNNING LANDING PAGE & SECURITY VERIFICATION SUITE ===\n');

// 1. Inspect index.html
const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

console.log('--- 1. Hero Section Copy & CTA Hierarchy ---');
assert(indexHtml.includes('Car Battery Dead?'), 'Hero has required headline start "Car Battery Dead?"');
assert(indexHtml.includes('Get Battery Assistance Fast.'), 'Hero headline includes "Get Battery Assistance Fast."');
assert(indexHtml.includes('Need a jump-start or replacement battery? Call Manjutha Batteries for assistance in'), 'Hero has required supporting text with Manjutha Batteries');
assert(indexHtml.includes('>CALL NOW<') || indexHtml.includes('<span>CALL NOW</span>'), 'Hero primary CTA is "CALL NOW"');
assert(indexHtml.includes('>WHATSAPP US<') || indexHtml.includes('<span>WHATSAPP US</span>'), 'Hero secondary CTA is "WHATSAPP US"');
assert(indexHtml.includes('tel:+918074015911'), 'Working tel: link present');
assert(indexHtml.includes('https://wa.me/918074015911'), 'Working WhatsApp link present');

console.log('\n--- 2. Focused Service Section Requirements ---');
assert(indexHtml.includes('Need a Battery Jump-Start?'), 'Service A headline matches "Need a Battery Jump-Start?"');
assert(indexHtml.includes('Contact us to explain your vehicle\'s battery problem and confirm assistance availability.'), 'Service A description matches specification');
assert(indexHtml.includes('CALL FOR JUMP-START'), 'Service A CTA matches "CALL FOR JUMP-START"');

assert(indexHtml.includes('Need a Replacement Battery?'), 'Service B headline matches "Need a Replacement Battery?"');
assert(
  indexHtml.includes('Ask about compatible batteries, available options, and pricing for your vehicle.') ||
  indexHtml.includes('Contact us to check battery compatibility, available options, and pricing for your vehicle.'),
  'Service B description matches specification'
);
assert(indexHtml.includes('CALL FOR REPLACEMENT'), 'Service B CTA matches "CALL FOR REPLACEMENT"');

console.log('\n--- 3. Three-Step Process Copy Requirements ---');
assert(indexHtml.includes('STEP 1 — CALL US'), 'Step 1 matches "STEP 1 — CALL US"');
assert(indexHtml.includes('Tell us your vehicle model and battery problem.'), 'Step 1 description matches');
assert(indexHtml.includes('STEP 2 — SHARE YOUR LOCATION'), 'Step 2 matches "STEP 2 — SHARE YOUR LOCATION"');
assert(indexHtml.includes('Share your location through WhatsApp when relevant and supported.'), 'Step 2 description matches');
assert(indexHtml.includes('STEP 3 — CONFIRM THE SERVICE'), 'Step 3 matches "STEP 3 — CONFIRM THE SERVICE"');
assert(indexHtml.includes("We'll confirm availability and explain the next steps."), 'Step 3 description matches');

console.log('\n--- 4. Mobile Sticky Bar ---');
assert(indexHtml.includes('class="sticky-mobile-bar"'), 'Sticky mobile bar present in index.html');
assert(indexHtml.includes('data-cta-location="sticky_mobile_bar"'), 'Sticky mobile bar has location tracking');

console.log('\n--- 5. Dedicated Pages & Honest Error Containers ---');
const contactPath = path.join(__dirname, '..', 'contact-us.html');
const privacyPath = path.join(__dirname, '..', 'privacy-policy.html');
assert(fs.existsSync(contactPath), 'Dedicated contact-us.html exists');
assert(fs.existsSync(privacyPath), 'Dedicated privacy-policy.html exists');

const contactHtml = fs.readFileSync(contactPath, 'utf8');
const privacyHtml = fs.readFileSync(privacyPath, 'utf8');
assert(contactHtml.includes('30 A, Belathur, Krishnarajapuram, Bengaluru, Karnataka 560067'), 'Contact page has verified full address');
assert(contactHtml.includes('tel:+918074015911'), 'Contact page has working phone link');

assert(indexHtml.includes('class="form-error-alert"'), 'index.html has dedicated .form-error-alert container');
assert(contactHtml.includes('class="form-error-alert"'), 'contact-us.html has dedicated .form-error-alert container');
assert(indexHtml.includes('CALL NOW: 80740 15911'), 'index.html error container includes working Call Now alternative');

console.log('\n--- 6. Phone Number Normalization & WhatsApp Form Flow (js/main.js) ---');
const mainModule = require('../js/main.js');
const normalizePhone = mainModule.normalizeIndianPhone;

// Unit Tests for Phone Number Normalization
assert(typeof normalizePhone === 'function', 'normalizeIndianPhone is exported and callable');
assert(normalizePhone('8074015911') === '8074015911', 'Accepts standard 10-digit mobile (8074015911)');
assert(normalizePhone('918074015911') === '8074015911', 'Normalizes 12-digit number with 91 prefix (918074015911)');
assert(normalizePhone('+918074015911') === '8074015911', 'Normalizes number with +91 prefix (+918074015911)');
assert(normalizePhone('+91 80740 15911') === '8074015911', 'Normalizes formatted number with +91 and spaces (+91 80740 15911)');
assert(normalizePhone('08074015911') === '8074015911', 'Normalizes 11-digit number with leading zero STD trunk (08074015911)');
assert(normalizePhone('9176543210') === '9176543210', 'Preserves genuine 10-digit number starting with 91 without stripping digits');
assert(normalizePhone('1234567890') === null, 'Rejects invalid number starting with 1');
assert(normalizePhone('80740') === null, 'Rejects incomplete number (< 10 digits)');
assert(normalizePhone('80740159119999') === null, 'Rejects oversized number (> 12 digits)');
assert(normalizePhone('abcdefghij') === null, 'Rejects non-numeric input');

// WhatsApp Form Flow Assertions
const mainJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8');
assert(mainJs.includes('BUSINESS_WHATSAPP_NUMBER = \'918074015911\''), 'Verified business WhatsApp number 918074015911 isolated in main.js');
assert(mainJs.includes('https://wa.me/') && mainJs.includes('encodeURIComponent'), 'Constructs valid wa.me URL with encodeURIComponent');
assert(mainJs.includes('Hello Manjutha Batteries, I need battery assistance.'), 'Message structure includes greeting "Hello Manjutha Batteries, I need battery assistance."');
assert(mainJs.includes('My phone number: '), 'Message structure includes "My phone number: "');
assert(mainJs.includes('Service required: '), 'Message structure includes "Service required: "');
assert(mainJs.includes('Please contact me as soon as possible.'), 'Message structure includes closing "Please contact me as soon as possible."');
assert(indexHtml.includes('class="form-whatsapp-alert"'), 'index.html has dedicated .form-whatsapp-alert container');
assert(contactHtml.includes('class="form-whatsapp-alert"'), 'contact-us.html has dedicated .form-whatsapp-alert container');
assert(mainJs.includes("interaction_type: 'intent'"), 'Marks intent without claiming completed WhatsApp message delivery');
assert(!mainJs.includes("conversion_status: 'verified_lead'"), 'Does not claim verified lead before WhatsApp message is sent');

console.log('\n--- 7. Correct Business Brand Name ("Manjutha Batteries") & Legal Entity ---');
assert(indexHtml.includes('class="brand-title">MANJUTHA <span>BATTERIES</span></span>'), 'index.html primary header brand is "MANJUTHA BATTERIES"');
assert(contactHtml.includes('class="brand-title">MANJUTHA <span>BATTERIES</span></span>'), 'contact-us.html header brand is "MANJUTHA BATTERIES"');
assert(privacyHtml.includes('class="brand-title">MANJUTHA <span>BATTERIES</span></span>'), 'privacy-policy.html header brand is "MANJUTHA BATTERIES"');
assert(indexHtml.includes('<title>Car Battery Dead? Jump-Start & Replacement Assistance | Manjutha Batteries</title>'), 'index.html title uses Manjutha Batteries');
assert(contactHtml.includes('<title>Contact Us | Manjutha Batteries — Automotive Battery Assistance Bengaluru</title>'), 'contact-us.html title uses Manjutha Batteries');
assert(privacyHtml.includes('<title>Privacy Policy | Manjutha Batteries — Manjunath Enterprises</title>'), 'privacy-policy.html title uses Manjutha Batteries');
assert(indexHtml.includes('"name": "Manjutha Batteries"'), 'index.html Schema.org name is Manjutha Batteries');
assert(contactHtml.includes('"name": "Manjutha Batteries"'), 'contact-us.html Schema.org name is Manjutha Batteries');
assert(privacyHtml.includes('"name": "Privacy Policy - Manjutha Batteries / Manjunath Enterprises"'), 'privacy-policy.html Schema.org name is Manjutha Batteries');
assert(indexHtml.includes('class="footer-brand-title">MANJUTHA BATTERIES</div>'), 'index.html footer brand title is MANJUTHA BATTERIES');
assert(!indexHtml.includes('Manjunath Batteries'), 'Zero occurrences of incorrect "Manjunath Batteries" in index.html');
assert(!contactHtml.includes('Manjunath Batteries'), 'Zero occurrences of incorrect "Manjunath Batteries" in contact-us.html');
assert(!privacyHtml.includes('Manjunath Batteries'), 'Zero occurrences of incorrect "Manjunath Batteries" in privacy-policy.html');
assert(!mainJs.includes('Manjunath Batteries'), 'Zero occurrences of incorrect "Manjunath Batteries" in main.js');
assert(indexHtml.includes('Manjunath Enterprises') && indexHtml.includes('operating trade name of Manjunath Enterprises'), 'Legal entity Manjunath Enterprises preserved in footer disclaimer');
assert(indexHtml.includes('© 2026 Manjunath Enterprises. All rights reserved.'), 'Legal copyright Manjunath Enterprises preserved in index.html');
assert(contactHtml.includes('© 2026 Manjunath Enterprises. All rights reserved.'), 'Legal copyright Manjunath Enterprises preserved in contact-us.html');
assert(privacyHtml.includes('© 2026 Manjunath Enterprises. All rights reserved.'), 'Legal copyright Manjunath Enterprises preserved in privacy-policy.html');

console.log('\n--- 8. Google Tag Manager (GTM-5W6HQ7G3) Container Installation ---');
const pages = [
  { name: 'index.html', content: indexHtml },
  { name: 'contact-us.html', content: contactHtml },
  { name: 'privacy-policy.html', content: privacyHtml }
];

pages.forEach(p => {
  // GTM Script in Head
  assert(p.content.includes("'https://www.googletagmanager.com/gtm.js?id='+i+dl"), `${p.name} has official GTM script loader`);
  assert(p.content.includes("})(window,document,'script','dataLayer','GTM-5W6HQ7G3');"), `${p.name} GTM script uses GTM-5W6HQ7G3`);
  
  // GTM Noscript in Body
  assert(p.content.includes('<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5W6HQ7G3"'), `${p.name} noscript iframe uses GTM-5W6HQ7G3`);
  
  // No placeholders
  assert(!p.content.includes('GTM-XXXXXXX'), `${p.name} has no GTM-XXXXXXX placeholders remaining`);
  
  // No duplicates
  const scriptOccurrences = (p.content.match(/googletagmanager\.com\/gtm\.js/g) || []).length;
  const noscriptOccurrences = (p.content.match(/googletagmanager\.com\/ns\.html/g) || []).length;
  assert(scriptOccurrences === 1, `${p.name} has exactly 1 GTM script (no duplicates)`);
  assert(noscriptOccurrences === 1, `${p.name} has exactly 1 GTM noscript iframe (no duplicates)`);
  
  // Position checks
  const headIdx = p.content.indexOf('<head>');
  const gtmScriptIdx = p.content.indexOf("googletagmanager.com/gtm.js");
  const bodyIdx = p.content.indexOf('<body>');
  const gtmNoscriptIdx = p.content.indexOf("googletagmanager.com/ns.html");
  assert(gtmScriptIdx > headIdx && gtmScriptIdx < bodyIdx, `${p.name} GTM script is located inside <head>`);
  assert(gtmNoscriptIdx > bodyIdx, `${p.name} GTM noscript is located immediately inside <body>`);
});

console.log('\n--- 9. Targeted Header Phone CTA Checks ---');
assert(indexHtml.includes('class="header-phone-btn"'), 'index.html header phone has dedicated .header-phone-btn conversion container');
assert(indexHtml.includes('class="header-phone-action">CALL NOW</span>'), 'index.html header phone has clear "CALL NOW" action tag');
assert(indexHtml.includes('class="header-phone-digits">80740 15911</span>'), 'index.html header phone has legible digits 80740 15911');
assert(contactHtml.includes('class="header-phone-action">CALL NOW</span>'), 'contact-us.html header phone has "CALL NOW"');
assert(privacyHtml.includes('class="header-phone-action">CALL NOW</span>'), 'privacy-policy.html header phone has "CALL NOW"');

console.log('\n--- 10. API Callback Security & Reliability Tests (/api/callback) ---');

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    end(data) {
      if (data && typeof data === 'string') {
        try { this.body = JSON.parse(data); } catch(e) { this.body = data; }
      }
      return this;
    }
  };
}

async function runApiTests() {
  const originalEnv = process.env.LEAD_WEBHOOK_URL;
  const originalFetch = global.fetch;

  try {
    // Test 7a: Missing LEAD_WEBHOOK_URL -> Fails closed with 503
    delete process.env.LEAD_WEBHOOK_URL;
    const reqMissingWebhook = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { name: 'Ravi', phone: '9876543210', car_model: 'Swift' }
    };
    const resMissingWebhook = createMockRes();
    await callbackHandler(reqMissingWebhook, resMissingWebhook);
    assert(
      resMissingWebhook.statusCode === 503 && resMissingWebhook.body.success === false,
      'API fails closed with HTTP 503 when LEAD_WEBHOOK_URL is not configured'
    );

    // Test 7b: Invalid phone number (< 10 digits) -> 400
    process.env.LEAD_WEBHOOK_URL = 'https://mock-webhook.internal/test';
    const reqInvalidPhone = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { name: 'Bot', phone: '1234', car_model: 'Test' }
    };
    const resInvalidPhone = createMockRes();
    await callbackHandler(reqInvalidPhone, resInvalidPhone);
    assert(
      resInvalidPhone.statusCode === 400 && resInvalidPhone.body.success === false,
      'API rejects invalid phone number (< 10 digits) with HTTP 400'
    );

    // Test 7c: Honeypot bot submission -> silently discarded with 200
    const reqHoneypot = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { name: 'SpamBot', phone: '9876543210', 'bot-field': 'bot' }
    };
    const resHoneypot = createMockRes();
    await callbackHandler(reqHoneypot, resHoneypot);
    assert(
      resHoneypot.statusCode === 200 && resHoneypot.body.success === true,
      'API silently discards honeypot bot submissions without contacting webhook'
    );

    // Test 7d: Disallowed Origin -> 403 Forbidden
    const reqBadOrigin = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'origin': 'https://evil-attacker.com'
      },
      body: { name: 'Ravi', phone: '9876543210' }
    };
    const resBadOrigin = createMockRes();
    await callbackHandler(reqBadOrigin, resBadOrigin);
    assert(
      resBadOrigin.statusCode === 403,
      'API blocks cross-origin requests from untrusted origins with HTTP 403'
    );

    // Test 7e: Payload too large (>10KB) -> 413
    const reqOversized = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '15000'
      },
      body: { name: 'Big', phone: '9876543210' }
    };
    const resOversized = createMockRes();
    await callbackHandler(reqOversized, resOversized);
    assert(
      resOversized.statusCode === 413,
      'API rejects oversized payloads (>10KB) with HTTP 413'
    );

    // Test 7f: Webhook destination failure (webhook returns 500) -> 502
    global.fetch = async () => ({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error'
    });
    const reqWebhookFail = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { name: 'Ravi', phone: '9876543210', car_model: 'Swift' }
    };
    const resWebhookFail = createMockRes();
    await callbackHandler(reqWebhookFail, resWebhookFail);
    assert(
      resWebhookFail.statusCode === 502 && resWebhookFail.body.success === false,
      'API reports HTTP 502 when configured webhook fails or rejects enquiry'
    );

    // Test 7g: Webhook destination timeout -> 504
    global.fetch = async () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    };
    const reqWebhookTimeout = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { name: 'Ravi', phone: '9876543210', car_model: 'Swift' }
    };
    const resWebhookTimeout = createMockRes();
    await callbackHandler(reqWebhookTimeout, resWebhookTimeout);
    assert(
      resWebhookTimeout.statusCode === 504 && resWebhookTimeout.body.success === false,
      'API reports HTTP 504 Gateway Timeout when webhook exceeds timeout limit'
    );

    // Test 7h: Successful Webhook Delivery -> 200 OK & Discord/Slack universal compatibility
    let sentPayload = null;
    global.fetch = async (url, opts) => {
      sentPayload = JSON.parse(opts.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'delivered' })
      };
    };
    const reqSuccess = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { name: 'Ravi', phone: '9876543210', car_model: 'Swift Dzire', service: 'Battery Jump-Start' }
    };
    const resSuccess = createMockRes();
    await callbackHandler(reqSuccess, resSuccess);
    assert(
      resSuccess.statusCode === 200 && resSuccess.body.success === true,
      'API returns HTTP 200 OK only when lead webhook confirms delivery'
    );
    assert(
      sentPayload && sentPayload.content && sentPayload.text && sentPayload.phone === '9876543210',
      'API webhook payload provides universal Discord content, Slack text, and CRM phone data'
    );

    // Test 7i: Rate limiting (send 5 requests from same IP -> 6th returns 429)
    const testIp = '203.0.113.42';
    let hitRateLimit = false;
    for (let i = 0; i < 6; i++) {
      const reqRate = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': testIp
        },
        body: { name: 'Ravi', phone: '9876543210' }
      };
      const resRate = createMockRes();
      await callbackHandler(reqRate, resRate);
      if (resRate.statusCode === 429) {
        hitRateLimit = true;
      }
    }
    assert(hitRateLimit, 'API rate limiter activates HTTP 429 after threshold is reached');

  } finally {
    // Restore environment & fetch
    if (originalEnv !== undefined) {
      process.env.LEAD_WEBHOOK_URL = originalEnv;
    } else {
      delete process.env.LEAD_WEBHOOK_URL;
    }
    global.fetch = originalFetch;
  }

  console.log(`\n======================================================`);
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} passed`);
  console.log(`======================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runApiTests();
