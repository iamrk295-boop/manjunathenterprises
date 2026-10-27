# Manjutha Batteries (Manjunath Enterprises) — Google Ads Landing Page

> High-conversion, mobile-first emergency automotive battery assistance landing page for East Bengaluru (Whitefield, Belathur, Kadugodi & ITPL). Engineered with fail-closed lead delivery, honest client error handling, anti-spam honeypot filtering, and verified conversion tracking.

---

## 1. Project Overview & Production Domains

- **Staging Deployment:** [https://manjunathenterprises.vercel.app/](https://manjunathenterprises.vercel.app/)
- **Proposed Production Domain:** `https://manjunathabatteries.in/` *(Domain not yet purchased; do not declare live until DNS is pointed).*
- **Operating Brand:** Manjutha Batteries (JumpStart Experts)
- **Legal Entity:** Manjunath Enterprises
- **Direct Dispatch Line:** `+91 80740 15911` (Display: `80740 15911`)
- **Store & Hub Address:** `30 A, Belathur, Krishnarajapuram, Bengaluru, Karnataka 560067`
- **Google Plus Code:** `2Q54+67 Bengaluru, Karnataka`

---

## 2. Architecture & File Structure

```
c:\GitHub\manjunathenterprises\
├── index.html              # High-converting landing page (hero, 2 core services, 3 steps, form)
├── contact-us.html         # Dedicated Contact Us page (store location, map embed, inquiry form)
├── privacy-policy.html     # Dedicated Google Ads compliant Privacy Policy page
├── api/
│   └── callback.js         # Secure serverless function (fail-closed webhook, rate limiter, honeypot)
├── css/
│   └── styles.css          # High-contrast, outdoor-readable CSS (<28KB unminified, zero frameworks)
├── js/
│   └── main.js             # Vanilla JS: GTM dataLayer tracking, robust form submit, error recovery
├── scripts/
│   └── verify_site.js      # Automated test runner (40 / 40 passing checks)
├── vercel.json             # Vercel deployment headers & caching rules
├── netlify.toml            # Netlify fallback deployment configuration
├── .env.example            # Environment variable documentation (LEAD_WEBHOOK_URL)
├── robots.txt              # Search engine directives
├── sitemap.xml             # XML sitemap covering all 3 pages
└── README.md               # Complete audit report, security review & launch guide
```

---

## 3. Lead Reliability & Error Handling (Priority 1 & 2)

### The Problem Fixed:
Previously, the frontend catch block displayed a green "Request Received" success message even when the serverless API failed, when Netlify fallback failed, or when network was disconnected. This created a false-positive promise to stranded motorists while their enquiry was lost.

### The Solution:
1. **Strict Success Verification**:
   - The green success state is displayed **only** when `/api/callback` returns `HTTP 200` with `{ success: true }` confirming that the enquiry was accepted by a functioning lead destination.
2. **Honest Error State & Call Now Alternative**:
   - On any 4xx/5xx response, network disconnect, or delivery timeout, the form displays a clear red alert (`.form-error-alert`) inside the card:
     > *"Unable to process online dispatch at this moment. Please tap to call our technician directly for immediate assistance."*
   - Features a prominent, working click-to-call button: **CALL NOW: 80740 15911**.
3. **Form Recoverability & Duplicate Prevention**:
   - The form remains visible on failure, and the submit button is automatically re-enabled with its original text so the visitor can correct errors or retry.
   - During active submission, the button is disabled to prevent duplicate entries.
4. **Fail-Closed Backend (`/api/callback`)**:
   - The API requires `LEAD_WEBHOOK_URL` to be configured in Vercel.
   - If unconfigured, it returns **`HTTP 503 Service Unavailable`** with an explicit message: *"Lead dispatch notification is currently unconfigured. Please call +91 80740 15911 directly."*
   - If the webhook fails or times out (5-second `AbortSignal` limit), it returns **`HTTP 502`** or **`HTTP 504`**, preventing any false claim of success.
   - Phone numbers in server logs are strictly masked for privacy (e.g., `987****210`).

---

## 4. Security Hardening (Priority 3)

1. **Origin Restriction (CORS)**:
   - Wildcard `*` headers have been removed.
   - Cross-origin requests from untrusted origins are rejected with **`HTTP 403 Forbidden`**.
   - Allowed origins: `manjunathabatteries.in`, `www.manjunathabatteries.in`, `manjunathenterprises.vercel.app`, and local test ports.
2. **In-Memory Rate Limiting**:
   - Enforces a threshold of **max 5 submissions per 10 minutes per client IP**.
   - Violating IPs receive **`HTTP 429 Too Many Requests`**.
   - Stale IP timestamps are periodically purged to avoid memory leaks.
3. **Payload Size Guard**:
   - Enforces a strict **10KB maximum payload limit** (`Content-Length` and streaming byte counter).
   - Oversized requests are immediately aborted with **`HTTP 413 Payload Too Large`**.
4. **Input Sanitization & Validation**:
   - Phone numbers must be valid 10-digit Indian mobile numbers (`/^[6-9]\d{9}$/`).
   - Text inputs (name, car model, service) are stripped of HTML tags (`<`, `>`) and length-capped.
5. **Anti-Spam Honeypot**:
   - Invisible `bot-field` input traps automated scrapers. If filled, the API silently returns 200 without sending spam to the dispatcher or expending rate limit quota.

---

## 5. Google Ads Tracking & Analytics (Priority 4)

### GTM Container Setup:
The live Google Tag Manager Container ID **`GTM-5W6HQ7G3`** is installed across [index.html](file:///c:/GitHub/manjunathenterprises/index.html#L21), [contact-us.html](file:///c:/GitHub/manjunathenterprises/contact-us.html#L4), and [privacy-policy.html](file:///c:/GitHub/manjunathenterprises/privacy-policy.html#L4) with official script loaders in `<head>` and noscript iframes immediately following `<body>`.

### Event Definitions:
All interactions push structured objects to `window.dataLayer`:

```javascript
// 1. Phone CTA Click Event
{
  event: 'call_click',
  cta_location: 'hero_primary', // or 'header', 'sticky_mobile_bar', 'service_a_jumpstart', etc.
  cta_type: 'phone',
  cta_label: 'CALL NOW',
  phone_number: '80740 15911',
  interaction_type: 'intent' // NOTE: Click intent to dial, NOT proof of completed call
}

// 2. WhatsApp CTA Click Event
{
  event: 'whatsapp_click',
  cta_location: 'hero_whatsapp', // or 'sticky_mobile_bar'
  cta_type: 'whatsapp',
  cta_label: 'WHATSAPP US',
  interaction_type: 'intent' // NOTE: Click intent to chat, NOT proof of sent message
}

// 3. Form Submission Event (FIRED ONLY UPON VERIFIED 200 OK ACCEPTANCE)
{
  event: 'form_submit',
  form_name: 'callback-request', // or 'contact-page'
  service_type: 'Battery Jump-Start',
  conversion_status: 'verified_lead'
}
```

> **Important for Google Ads:** Failed form submissions, honeypot spam, or network drops **never** push `form_submit`. Set your Google Ads Primary Conversion Action to trigger on custom event `form_submit`. Set `call_click` as a Secondary / Micro-conversion or link your Google Ads account to a Google Forwarding Number for call duration tracking.

---

## 6. Mobile Conversion Optimization & Architecture

### High-Impact UX Improvements:
1. **Uncluttered Mobile First Screen**:
   - The heavy callback form has been moved out of the mobile hero into a dedicated `#callback` section.
   - On mobile screens (320px–430px), visitors immediately see the emergency location badge, the clear headline ("Car Battery Dead? Get Battery Assistance Fast."), supporting copy, and dominant **CALL NOW** & **WHATSAPP US** action buttons.
   - Compact trust badges ("Local Whitefield & Belathur Hub", "On-Site Diagnostics", "Amaron & Exide Stockist") build instant credibility without vertical bloat.
2. **Priority Section Flow (Reduced Scrolling)**:
   - **Hero & Contact Buttons** (Immediate call/WhatsApp access).
   - **Two Core Services** (Jump-Start & Battery Replacement brought directly below hero).
   - **How It Works** (3-step emergency process).
   - **Stocked Brands** (Amaron, Exide, Livguard, SF Sonic with retailer disclaimer).
   - **Service Areas & Map** (Core coverage chips & Belathur hub map).
   - **Concise FAQs** (5 common questions with tap accordion).
   - **Secondary Callback Form** (Streamlined with mobile keyboard input types and Call Now fallback).
   - **Final Conversion CTA** (Closing direct call and WhatsApp).
3. **Mobile Sticky Action Bar**:
   - Dominant **CALL NOW** button (~60% width) paired with accessible **WHATSAPP US** button.
   - Strict `env(safe-area-inset-bottom)` integration and dynamic body padding to prevent overlapping page content.
   - Dedicated media query for compact 320px screens (iPhone SE 1st gen).
4. **Mobile Input Usability**:
   - Form inputs set to 16px to prevent iOS Safari automatic viewport zoom.
   - `inputmode="tel"` and `autocomplete="tel"` for rapid mobile numeric entry.
   - `touch-action: manipulation` applied to interactive elements to eliminate the 300ms tap delay.

---

## 7. Automated Test Suite

Run the full verification suites locally:
```bash
# 1. Functional, Security & Tracking Verification (40 tests)
node scripts/verify_site.js

# 2. Mobile Responsiveness & Touch Target Audit (16 tests)
node scripts/verify_responsive.js
```

### Total Verified Test Cases: 56 / 56 Passing

---

## 7. Environment Variables (.env.example)

Configure in **Vercel Project Settings > Environment Variables**:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `LEAD_WEBHOOK_URL` | **Required.** The endpoint where new leads are posted (Discord, Slack, Telegram, CRM). | `https://discord.com/api/webhooks/...` |
| `ALLOWED_ORIGIN` | *Optional.* Explicit allowed origin if calling from another domain. | `https://manjunathabatteries.in` |

---

## 8. What Remains Before Google Ads Launch

1. **Set `LEAD_WEBHOOK_URL` in Vercel**:
   - Provide a webhook URL (such as a Discord channel webhook, Telegram bot, or CRM webhook) so incoming leads reach your team's phones immediately.
2. **Purchase Domain `manjunathabatteries.in`**:
   - Purchase the domain through a registrar.
   - In Vercel Project Settings > Domains, add `manjunathabatteries.in` and update DNS records.
3. **Configure Google Tag Manager Container ID**:
   - Container `GTM-5W6HQ7G3` is already installed in `<head>` and `<body>` across `index.html`, `contact-us.html`, and `privacy-policy.html`.
4. **Link Google Ads Conversion Actions in GTM Dashboard**:
   - In your Google Tag Manager dashboard for container `GTM-5W6HQ7G3`, configure Google Ads conversion tags.
   - Create a Custom Event trigger in GTM for `whatsapp_form_submit` (Form intent).
   - Create Custom Event triggers for `call_click` and `whatsapp_click` (Direct call & chat intent).
