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

  // Initialize dataLayer safely
  window.dataLayer = window.dataLayer || [];

  /**
   * Helper to push events to Google Tag Manager
   * @param {string} eventName
   * @param {object} eventParams
   */
  function trackEvent(eventName, eventParams) {
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

  // Handle Lead Form Submissions with strict error handling and recovery
  var leadForms = document.querySelectorAll('form[data-netlify="true"], form.emergency-lead-form');
  leadForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit';
      var formName = form.getAttribute('name') || 'callback-request';
      var container = form.parentElement;

      var successBox = container.querySelector('.form-success-alert');
      var errorBox = container.querySelector('.form-error-alert');
      var errorTextEl = errorBox ? errorBox.querySelector('.error-text') : null;

      // Reset any previous alert states
      if (errorBox) errorBox.style.display = 'none';
      if (successBox) successBox.style.display = 'none';

      // 1. Strict Client-side Phone Validation
      var phoneInput = form.querySelector('input[type="tel"]');
      if (phoneInput) {
        var rawPhone = phoneInput.value.trim().replace(/[\s\-\(\)\+]/g, '');
        if (rawPhone.startsWith('91') && rawPhone.length === 12) {
          rawPhone = rawPhone.substring(2);
        } else if (rawPhone.startsWith('0') && rawPhone.length === 11) {
          rawPhone = rawPhone.substring(1);
        }

        var indianMobileRegex = /^[6-9]\d{9}$/;
        if (!rawPhone || !indianMobileRegex.test(rawPhone)) {
          alert('Please enter a valid 10-digit Indian mobile number (e.g., 9876543210).');
          phoneInput.focus();
          return;
        }
      }

      // 2. Prevent Duplicate Submissions
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Connecting to Dispatch...';
      }

      var formData = new FormData(form);
      var formObj = {};
      formData.forEach(function (val, key) {
        formObj[key] = val;
      });

      // Submit to /api/callback
      fetch('/api/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formObj)
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, status: res.status, data: data };
          }).catch(function () {
            return { ok: res.ok, status: res.status, data: {} };
          });
        })
        .then(function (result) {
          if (result.ok && result.data && result.data.success === true) {
            // Priority 1 & 4: Only record conversion event when backend has accepted lead
            trackEvent('form_submit', {
              form_name: formName,
              service_type: form.querySelector('[name="service"]')?.value || 'Emergency Assistance',
              conversion_status: 'verified_lead'
            });

            // Display success message and hide form
            form.style.display = 'none';
            if (successBox) {
              successBox.style.display = 'block';
            }
          } else {
            // Backend rejected or webhook delivery failed (e.g. 503 unconfigured or 502 webhook error)
            // DO NOT display success! Show honest error and keep form recoverable.
            var errorMessage = (result.data && result.data.error)
              ? result.data.error
              : 'Unable to process online dispatch at this moment. Please tap to call directly for immediate assistance.';

            if (errorTextEl) {
              errorTextEl.textContent = errorMessage;
            }
            if (errorBox) {
              errorBox.style.display = 'block';
            } else {
              alert(errorMessage);
            }

            // Re-enable submit button so customer can retry
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalBtnText;
            }
          }
        })
        .catch(function (networkErr) {
          console.warn('[NETWORK_FAILURE] Lead submission network error:', networkErr);
          // Network failure: DO NOT show success, DO NOT push GTM conversion
          var netErrorMessage = 'Network connection issue. For immediate battery assistance, please tap to call our dispatch team directly.';

          if (errorTextEl) {
            errorTextEl.textContent = netErrorMessage;
          }
          if (errorBox) {
            errorBox.style.display = 'block';
          } else {
            alert(netErrorMessage);
          }

          // Re-enable submit button
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
        });
    });
  });

  // FAQ Accordion Interaction
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

})();
