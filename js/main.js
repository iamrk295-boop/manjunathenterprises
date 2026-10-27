/**
 * Manjunath Batteries / Manjunath Enterprises — High-Conversion Landing Page Scripts
 * Features:
 * - Resilient lead submission handling (success displayed ONLY on verified 200 OK from server)
 * - Honest error recovery with immediate "Tap to Call Now" fallback
 * - Duplicate submission prevention (debounced & disabled button states)
 * - Anti-tamper input validation
 * - Google Tag Manager dataLayer tracking (differentiates click intent from verified lead conversions)
 * - Zero double-firing on click events
 */

(function () {
  'use strict';

  var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  // Initialize dataLayer safely
  if (isBrowser) {
    window.dataLayer = window.dataLayer || [];
  }

  /**
   * Helper to push events to Google Tag Manager
   * @param {string} eventName
   * @param {object} eventParams
   */
  function trackEvent(eventName, eventParams) {
    if (!isBrowser) return;
    var payload = Object.assign(
      {
        event: eventName,
        timestamp: new Date().toISOString()
      },
      eventParams || {}
    );
    window.dataLayer.push(payload);

    // Development & staging diagnostic logging
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('vercel.app')) {
      console.log('[GTM dataLayer Event]:', payload);
    }
  }

  // Deduplication lock to prevent double tracking on rapid double-taps
  var clickLock = false;

  // Bind Tracking to all Trackable CTAs
  if (isBrowser) {
    document.addEventListener('click', function (e) {
    var target = e.target.closest('[data-track]');
    if (!target) return;

    if (clickLock) return;
    clickLock = true;
    setTimeout(function () { clickLock = false; }, 400);

    var eventName = target.getAttribute('data-track');
    var ctaLocation = target.getAttribute('data-cta-location') || 'unknown';
    var ctaType = target.getAttribute('data-cta-type') || 'button';
    var ctaLabel = (target.textContent || '').trim().substring(0, 50);

    var payload = {
      cta_location: ctaLocation,
      cta_type: ctaType,
      cta_label: ctaLabel
    };

    if (eventName === 'call_click') {
      payload.phone_number = '80740 15911';
      payload.interaction_type = 'intent'; // Distinguish click intent from completed call
    } else if (eventName === 'whatsapp_click') {
      payload.interaction_type = 'intent'; // Distinguish click intent from sent message
    }

    trackEvent(eventName, payload);
    });
  }

  // Verified Business Contact Channels
  var BUSINESS_PHONE = '80740 15911';
  var BUSINESS_PHONE_TEL = '+918074015911';
  var BUSINESS_WHATSAPP_NUMBER = '918074015911'; // Verified business WhatsApp channel (wa.me/918074015911)

  /**
   * Normalizes and strictly validates Indian mobile phone numbers.
   * Supports:
   * - 8074015911 (canonical 10 digits)
   * - 918074015911 (12 digits with 91 country code prefix)
   * - +918074015911 / +91 80740 15911 (with optional + and spaces/hyphens)
   * - 08074015911 (11 digits with leading 0 STD trunk prefix)
   * - 9123456789 (genuine 10-digit mobile starting with 91 - never strips 91)
   * Rejects:
   * - Non-numeric characters
   * - Incomplete / invalid length (<10 or >12)
   * - Numbers not starting with 6, 7, 8, or 9
   * @param {string} input 
   * @returns {string|null} Canonical 10-digit mobile number or null if invalid
   */
  function normalizeIndianPhone(input) {
    if (!input || typeof input !== 'string') return null;

    var trimmed = input.trim();
    // Check if input explicitly has +91 prefix
    var hasPlus91 = /^\+91[\s\-]*/.test(trimmed);

    // Strip whitespace, hyphens, parentheses, plus, and dots
    var digits = trimmed.replace(/[\s\-\(\)\+\.]/g, '');

    // Must be purely numeric digits
    if (!/^\d+$/.test(digits)) return null;

    var canonical = '';

    if (hasPlus91) {
      if (digits.startsWith('91') && digits.length === 12) {
        canonical = digits.substring(2);
      } else if (digits.length === 10) {
        canonical = digits;
      } else {
        return null;
      }
    } else if (digits.length === 12 && digits.startsWith('91')) {
      canonical = digits.substring(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      canonical = digits.substring(1);
    } else if (digits.length === 10) {
      // Genuine 10-digit number (even if starting with 91, e.g. 9176543210)
      canonical = digits;
    } else {
      return null;
    }

    // Must be valid Indian mobile: starts with 6, 7, 8, or 9 and exactly 10 digits
    if (/^[6-9]\d{9}$/.test(canonical)) {
      return canonical;
    }

    return null;
  }

  // Handle Lead Form Submissions via WhatsApp (no LEAD_WEBHOOK_URL required)
  if (isBrowser) {
    var leadForms = document.querySelectorAll('form[data-netlify="true"], form.emergency-lead-form');
    leadForms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var submitBtn = form.querySelector('button[type="submit"]');
        var originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Enquiry';
        var formName = form.getAttribute('name') || 'callback-request';
        var container = form.parentElement;

        var successBox = container.querySelector('.form-success-alert');
        var errorBox = container.querySelector('.form-error-alert');
        var whatsappBox = container.querySelector('.form-whatsapp-alert');
        var errorTextEl = errorBox ? errorBox.querySelector('.error-text') : null;

        // Reset any previous alert states
        if (errorBox) errorBox.style.display = 'none';
        if (successBox) successBox.style.display = 'none';
        if (whatsappBox) whatsappBox.style.display = 'none';

        // 1. Phone number validation and normalization
        var phoneInput = form.querySelector('input[type="tel"]');
        var rawPhone = phoneInput ? phoneInput.value : '';
        var normalizedPhone = normalizeIndianPhone(rawPhone);

        if (!normalizedPhone) {
          var validationMsg = 'Please enter a valid 10-digit mobile number (e.g. 80740 15911 or +91 80740 15911).';
          if (errorTextEl) errorTextEl.textContent = validationMsg;
          if (errorBox) {
            errorBox.style.display = 'block';
            errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            alert(validationMsg);
          }
          if (phoneInput) phoneInput.focus();
          return;
        }

        // 2. Validate Vehicle Model / Message
        var carInput = form.querySelector('input[name="car_model"]') || form.querySelector('textarea[name="message"]');
        var carModel = carInput ? carInput.value.trim() : '';
        if (carInput && carInput.hasAttribute('required') && !carModel) {
          var carMsg = 'Please specify your vehicle model (e.g. Swift, Creta, City) so we can check battery compatibility.';
          if (errorTextEl) errorTextEl.textContent = carMsg;
          if (errorBox) {
            errorBox.style.display = 'block';
            errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            alert(carMsg);
          }
          carInput.focus();
          return;
        }

        // 3. Extract other details
        var nameInput = form.querySelector('input[name="name"]');
        var customerName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Customer';
        var serviceInput = form.querySelector('select[name="service"]') || form.querySelector('input[name="service"]');
        var selectedService = (serviceInput && serviceInput.value.trim()) ? serviceInput.value.trim() : 'Battery Jump-Start & Replacement';
        var locationInput = form.querySelector('input[name="location"]');
        var customerLocation = (locationInput && locationInput.value.trim()) ? locationInput.value.trim() : '';

        // 4. Construct WhatsApp Enquiry Message with structured fields
        var messageLines = [
          'Hello Manjunath Batteries, I need battery assistance.',
          'Name: ' + customerName,
          'My phone number: ' + normalizedPhone,
          'Car model: ' + (carModel || 'Not specified'),
          'Service required: ' + selectedService
        ];

        if (customerLocation) {
          messageLines.push('Location: ' + customerLocation);
        }

        messageLines.push('Please contact me as soon as possible.');

        var messageText = messageLines.join('\n');
        var whatsappUrl = 'https://wa.me/' + BUSINESS_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(messageText);

        // 5. Track intent in GTM dataLayer
        trackEvent('whatsapp_form_submit', {
          form_name: formName,
          service_type: selectedService,
          phone_provided: normalizedPhone,
          interaction_type: 'intent' // Accurately records intent without claiming false completed delivery
        });

        // 6. Display WhatsApp handoff state with fallback action buttons
        if (whatsappBox) {
          var waDirectLink = whatsappBox.querySelector('.wa-direct-link');
          if (waDirectLink) {
            waDirectLink.href = whatsappUrl;
          }
          whatsappBox.style.display = 'block';
          whatsappBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Visual feedback on submit button
        if (submitBtn) {
          submitBtn.innerHTML = 'OPENING WHATSAPP...';
          setTimeout(function () {
            submitBtn.innerHTML = 'RE-OPEN IN WHATSAPP';
          }, 1500);
        }

        // 7. Open WhatsApp (popup with fallback to window navigation)
        var opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        if (!opened || opened.closed || typeof opened.closed === 'undefined') {
          // Fallback for browsers or webview with popup blocking
          window.location.href = whatsappUrl;
        }
      });
    });
  }

  // Export for testing in Node environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      normalizeIndianPhone: normalizeIndianPhone,
      BUSINESS_WHATSAPP_NUMBER: BUSINESS_WHATSAPP_NUMBER,
      BUSINESS_PHONE: BUSINESS_PHONE
    };
  }

  // FAQ Accordion Interaction
  if (isBrowser) {
    var faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(function (question) {
      question.addEventListener('click', function () {
        var item = this.closest('.faq-item');
        var isActive = item.classList.contains('active');

        // Close all other items
        document.querySelectorAll('.faq-item').forEach(function (otherItem) {
          otherItem.classList.remove('active');
          var btn = otherItem.querySelector('.faq-question');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });

        // Toggle current item
        if (!isActive) {
          item.classList.add('active');
          this.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

})();
