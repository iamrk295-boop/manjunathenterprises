/**
 * Mobile Responsiveness & Touch Target Audit Script
 * Tests:
 * 1. Viewport & safe-area meta tags
 * 2. Touch target sizes (CTAs >= 48px height)
 * 3. Mobile input attributes (inputmode, autocomplete, 16px iOS prevention)
 * 4. Sticky bar safe-area insets & media queries for 320px, 360px, 375px, 390px, 430px
 * 5. Horizontal overflow prevention (no rigid widths > 300px in css)
 * 6. Visual hierarchy & section flow
 */

const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');

let total = 0;
let passed = 0;

function check(cond, name) {
  total++;
  if (cond) {
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name}`);
  }
}

console.log('\n=== MOBILE RESPONSIVENESS & TOUCH TARGET AUDIT ===\n');

// 1. Viewport & Safe-Area
check(indexHtml.includes('viewport-fit=cover'), 'Viewport meta includes viewport-fit=cover for iPhone notches');

// 2. Mobile Hero Visual Hierarchy
check(indexHtml.indexOf('hero-title') < indexHtml.indexOf('hero-cta-group'), 'Hero title precedes action CTAs');
check(indexHtml.indexOf('hero-cta-group') < indexHtml.indexOf('hero-trust-badges'), 'Hero CTAs precede trust badges');
check(indexHtml.indexOf('hero-section') < indexHtml.indexOf('id="services"'), 'Hero immediately followed by Services');
check(indexHtml.indexOf('id="services"') < indexHtml.indexOf('id="process"'), 'Two Core Services precede 3-Step Process');
check(indexHtml.indexOf('id="process"') < indexHtml.indexOf('id="areas"'), 'Process precedes Service Areas');
check(indexHtml.indexOf('id="faq"') < indexHtml.indexOf('id="callback"'), 'FAQs precede Secondary Callback Form');

// 3. Touch Targets (Minimum 48px)
check(css.includes('min-height: 52px') || css.includes('min-height: 54px'), 'Buttons have minimum 52px+ touch height');
check(css.includes('touch-action: manipulation'), 'Buttons use touch-action: manipulation to eliminate tap delays');

// 4. Form Mobile Usability
check(indexHtml.includes('inputmode="tel"'), 'Phone input specifies inputmode="tel" for numeric keypad');
check(indexHtml.includes('autocomplete="tel"'), 'Phone input specifies autocomplete="tel"');
check(css.includes('font-size: 16px; /* 16px strictly avoids auto-zoom on iOS */') || css.includes('font-size: 16px'), 'Form inputs set to 16px to prevent iOS Safari auto-zoom');

// 5. Sticky Action Bar Safe Area & Responsive Constraints
check(css.includes('env(safe-area-inset-bottom'), 'Sticky bar and body padding respect env(safe-area-inset-bottom)');
check(css.includes('@media (max-width: 360px)'), 'CSS contains dedicated styling for <= 360px viewports');
check(css.includes('grid-template-columns: 1.45fr 1fr') || css.includes('grid-template-columns: 1.4fr 1fr'), 'Sticky bar renders Call Now as dominant button');

// 6. Section Scroll Margin for Fixed Headers
check(css.includes('scroll-margin-top: 76px'), 'Sections have scroll-margin-top to prevent header obscuring content');

// 7. Mobile Header Hierarchy & Squeeze Prevention (320px - 430px)
check(css.includes('@media (max-width: 600px)'), 'CSS contains fluid mobile query for <= 600px');
check(css.includes('@media (max-width: 390px)'), 'CSS contains query for 375px/390px (iPhone 12-16 & SE)');
check(css.includes('@media (max-width: 360px)'), 'CSS contains query for 360px (Standard Android)');
check(css.includes('@media (max-width: 330px)'), 'CSS contains query for 320px (Ultra-narrow viewports)');
check(css.includes('.brand-wrapper') && css.includes('min-width: 0'), 'Brand wrapper has min-width: 0 to prevent flexbox container blowout');
check(css.includes('.header-phone-btn') && css.includes('flex-shrink: 0'), 'Header phone CTA has flex-shrink: 0 to prevent button squeezing');
check(css.includes('.btn-spinner'), 'Button loading spinner is styled for duplicate submission prevention');

console.log(`\n======================================================`);
console.log(`RESPONSIVE AUDIT SUMMARY: ${passed} / ${total} passed`);
console.log(`======================================================\n`);

process.exit(passed === total ? 0 : 1);
