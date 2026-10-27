/**
 * Automated Verification Script for Manjunath Batteries Landing Page
 * Validates critical conversion flows, CTA links, copy requirements, and API handler.
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

console.log('\n=== RUNNING LANDING PAGE & CONVERSION VERIFICATION ===\n');

// 1. Inspect index.html
const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

console.log('--- 1. Hero Section Copy & CTA Hierarchy ---');
assert(indexHtml.includes('Car Battery Dead?'), 'Hero has required headline start "Car Battery Dead?"');
assert(indexHtml.includes('Get Battery Assistance Fast.'), 'Hero headline includes "Get Battery Assistance Fast."');
assert(indexHtml.includes('Need a jump-start or replacement battery? Call Manjunath Batteries for assistance in'), 'Hero has required supporting text with Manjunath Batteries');
assert(indexHtml.includes('>CALL NOW<') || indexHtml.includes('<span>CALL NOW</span>'), 'Hero primary CTA is "CALL NOW"');
assert(indexHtml.includes('>WHATSAPP US<') || indexHtml.includes('<span>WHATSAPP US</span>'), 'Hero secondary CTA is "WHATSAPP US"');
assert(indexHtml.includes('tel:+918074015911'), 'Working tel: link present');
assert(indexHtml.includes('https://wa.me/918074015911'), 'Working WhatsApp link present');

console.log('\n--- 2. Focused Service Section Requirements ---');
assert(indexHtml.includes('Need a Battery Jump-Start?'), 'Service A headline matches "Need a Battery Jump-Start?"');
assert(indexHtml.includes('Contact us to explain your vehicle\'s battery problem and confirm assistance availability.'), 'Service A description matches specification');
assert(indexHtml.includes('CALL FOR JUMP-START'), 'Service A CTA matches "CALL FOR JUMP-START"');

assert(indexHtml.includes('Need a Replacement Battery?'), 'Service B headline matches "Need a Replacement Battery?"');
assert(indexHtml.includes('Contact us to check battery compatibility, available options, and pricing for your vehicle.'), 'Service B description matches specification');
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

console.log('\n--- 5. Dedicated Pages & Links ---');
const contactPath = path.join(__dirname, '..', 'contact-us.html');
const privacyPath = path.join(__dirname, '..', 'privacy-policy.html');
assert(fs.existsSync(contactPath), 'Dedicated contact-us.html exists');
assert(fs.existsSync(privacyPath), 'Dedicated privacy-policy.html exists');

const contactHtml = fs.readFileSync(contactPath, 'utf8');
assert(contactHtml.includes('30 A, Belathur, Krishnarajapuram, Bengaluru, Karnataka 560067'), 'Contact page has verified full address');
assert(contactHtml.includes('tel:+918074015911'), 'Contact page has working phone link');

console.log('\n--- 6. API Callback Endpoint Validation (/api/callback) ---');
async function runApiTests() {
  // Mock response object
  function createMockRes() {
    return {
      statusCode: 200,
      headers: {},
      body: null,
      setHeader(k, v) { this.headers[k] = v; },
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
      end() { return this; }
    };
  }

  // Test 6a: Valid submission
  const reqValid = {
    method: 'POST',
    body: { name: 'Ravi', phone: '9876543210', car_model: 'Swift Dzire', service: 'Battery Jump-Start' }
  };
  const resValid = createMockRes();
  await callbackHandler(reqValid, resValid);
  assert(resValid.statusCode === 200 && resValid.body.success === true, 'API /api/callback accepts valid phone number');

  // Test 6b: Invalid phone submission
  const reqInvalid = {
    method: 'POST',
    body: { name: 'Bot', phone: '1234', car_model: 'Test' }
  };
  const resInvalid = createMockRes();
  await callbackHandler(reqInvalid, resInvalid);
  assert(resInvalid.statusCode === 400, 'API /api/callback rejects invalid phone number (< 10 digits)');

  // Test 6c: Bot honeypot detection
  const reqBot = {
    method: 'POST',
    body: { name: 'SpamBot', phone: '9876543210', 'bot-field': 'I am a bot' }
  };
  const resBot = createMockRes();
  await callbackHandler(reqBot, resBot);
  assert(resBot.statusCode === 200, 'API /api/callback quietly discards bot submission');

  console.log(`\n======================================================`);
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} passed`);
  console.log(`======================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runApiTests();
