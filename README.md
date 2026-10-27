# Manjunath Batteries (Manjunath Enterprises) — Google Ads Landing Page

> Optimized, mobile-first, high-conversion landing page engineered for Google Search Ads visitors needing urgent automotive battery assistance in East Bengaluru (Whitefield, Belathur, Kadugodi & ITPL).

---

## 1. Project Overview & Architecture

- **Current Deployment (Staging):** [https://manjunathenterprises.vercel.app/](https://manjunathenterprises.vercel.app/)
- **Target Production Domain:** `https://manjunathabatteries.in/` *(Domain not yet purchased; do not claim live until DNS is pointed).*
- **Operating Brand:** Manjunath Batteries (JumpStart Experts)
- **Legal Entity:** Manjunath Enterprises
- **Direct Dispatch Line:** `+91 80740 15911` (Display: `80740 15911`)
- **Verified Shop Address:** `30 A, Belathur, Krishnarajapuram, Bengaluru, Karnataka 560067`
- **Google Plus Code:** `2Q54+67 Bengaluru, Karnataka`
- **Primary Conversion Actions:**
  1. **Primary:** Phone Call (`tel:+918074015911`) — "CALL NOW"
  2. **Secondary:** WhatsApp Inquiry (`https://wa.me/918074015911`) — "WHATSAPP US"
  3. **Tertiary:** Non-blocking 4-field callback form

---

## 2. File Structure

```
c:\GitHub\manjunathenterprises\
├── index.html              # Optimized Google Ads landing page (focused 2-service architecture)
├── contact-us.html         # Dedicated Contact Us page (store location, map embed, form)
├── privacy-policy.html     # Dedicated Google Ads compliant Privacy Policy page
├── api/
│   └── callback.js         # Vercel serverless function (input validation, honeypot spam filter)
├── css/
│   └── styles.css          # Zero-framework, high-contrast, outdoor-readable CSS (<28KB)
├── js/
│   └── main.js             # Vanilla JS: GTM tracking, serverless API + Netlify fallback, accordion
├── scripts/
│   └── verify_site.js      # Automated test suite (28 passing checks for copy, CTAs, and API)
├── vercel.json             # Vercel configuration (security headers, clean URLs, immutable asset caching)
├── netlify.toml            # Netlify deployment fallback configuration
├── robots.txt              # Search engine directives pointing to proposed domain
├── sitemap.xml             # XML sitemap indexing home, contact, and privacy pages
└── README.md               # Documentation, audit results, and launch checklist
```

---

## 3. What Was Inspected & Identified

During our pre-implementation audit:
1. **Vercel POST Bug Fixed:** The live Vercel site returned `405 Method Not Allowed` on form submission because static files cannot process POST requests without an API handler. We engineered `api/callback.js` to process requests natively with phone validation and honeypot protection, while preserving Netlify Forms fallback.
2. **Hero Copy & Content Hierarchy:** Updated hero copy to the exact requested copy (*"Car Battery Dead? Get Battery Assistance Fast."*) and ensured the primary **CALL NOW** button is the single most prominent conversion action above the fold.
3. **Streamlined Service Focus:** Replaced the multi-card layout with the **two core automotive services**:
   - **Service A:** *Need a Battery Jump-Start?*
   - **Service B:** *Need a Replacement Battery?*
4. **Three-Step Process Copy:** Aligned with exact step text (*Step 1 — Call Us, Step 2 — Share Your Location, Step 3 — Confirm the Service*).
5. **Truth-in-Advertising & Compliance:** Removed unverified guarantees (such as "callback within 60 seconds" and guaranteed "15-minute arrival") to comply strictly with Google Ads policies, presenting them instead as prompt local dispatch across verified coverage zones.

---

## 4. Verification & Automated Test Results

Run tests locally at any time:
```bash
node scripts/verify_site.js
```

**Results (28 / 28 Tests Passing):**
- ✓ Hero headline matches exact copy: `"Car Battery Dead? Get Battery Assistance Fast."`
- ✓ Hero supporting copy matches: `"Need a jump-start or replacement battery? Call Manjunath Batteries for assistance in Whitefield, Belathur, Kadugodi & ITPL."`
- ✓ Primary CTA is `"CALL NOW"` with valid `tel:+918074015911`.
- ✓ Secondary CTA is `"WHATSAPP US"` with valid `https://wa.me/918074015911`.
- ✓ Service A matches `"Need a Battery Jump-Start?"` and `"CALL FOR JUMP-START"`.
- ✓ Service B matches `"Need a Replacement Battery?"` and `"CALL FOR REPLACEMENT"`.
- ✓ Three-step process matches Steps 1, 2, and 3.
- ✓ Mobile sticky CTA bar is active on all pages with safe area padding.
- ✓ Dedicated `contact-us.html` and `privacy-policy.html` pages exist and resolve.
- ✓ `/api/callback` accepts valid 10-digit mobile numbers, rejects invalid numbers, and silently discards bot honeypot submissions.

---

## 5. Google Tag Manager & Conversion Tracking

All buttons fire structured events to `window.dataLayer`:

| Event Name | Trigger | Parameters Passed |
| :--- | :--- | :--- |
| `call_click` | Clicking any phone button or `tel:` link | `cta_location`, `cta_type: 'phone'`, `phone_number: '80740 15911'` |
| `whatsapp_click` | Clicking any WhatsApp button | `cta_location`, `cta_type: 'whatsapp'` |
| `form_submit` | Successfully submitting the lead form | `form_name: 'callback-request'`, `service_type` |

> **Important Note:** In Google Tag Manager and Google Ads, note that `call_click` tracks customer click intent to initiate a call; it should be configured as a primary micro-conversion or matched with call-forwarding numbers for completed call attribution.

---

## 6. Pre-Launch Checklist & Owner Confirmation Items

### A. Items Requiring Owner Confirmation
1. **Service Radius:** Primary verified coverage is set to **Whitefield, Belathur, Kadugodi, and ITPL**. Confirm whether outlying areas (e.g. Hoskote, Budigere Cross, Marathahalli) should be added to the ad campaign or excluded to maintain rapid response times.
2. **Brand Name Priority:** The page features **Manjunath Batteries** as the primary consumer-facing brand, with **Manjunath Enterprises** stated as the legal entity in subtitles, footers, and legal schema.
3. **Phone Number:** Confirm `80740 15911` is staffed throughout all operating hours (`8:00 AM – 9:00 PM, all 7 days`).

### B. Steps Before Google Ads Launch
1. **Purchase Target Domain:** Buy `manjunathabatteries.in` via your preferred registrar.
2. **Configure Vercel Custom Domain:**
   - Go to **Vercel Project Settings > Domains**.
   - Add `manjunathabatteries.in` and `www.manjunathabatteries.in`.
   - Set up the DNS `A` / `CNAME` records as directed by Vercel.
3. **Update GTM Container ID:**
   - Replace `GTM-XXXXXXX` in `index.html`, `contact-us.html`, and `privacy-policy.html` with your live GTM container ID.
4. **Deploy:** Push your git repository to trigger production deployment.
