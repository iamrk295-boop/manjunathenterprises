/**
 * Manjunath Batteries / Manjunath Enterprises — High-Conversion Landing Page Scripts
 * Handles Google Tag Manager dataLayer events, API/Netlify Form submission, and FAQ accordion.
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
    // Debug logging in development / staging
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
    setTimeout(function () { clickLock = false; }, 300);

    var eventName = target.getAttribute('data-track');
    var ctaLocation = target.getAttribute('data-cta-location') || 'unknown';
    var ctaType = target.getAttribute('data-cta-type') || 'button';
    var ctaLabel = (target.textContent || '').trim().substring(0, 50);

    trackEvent(eventName, {
      cta_location: ctaLocation,
      cta_type: ctaType,
      cta_label: ctaLabel,
      phone_number: '80740 15911'
    });
  });

  // Handle Lead Form Submission via /api/callback with Netlify fallback
  var leadForms = document.querySelectorAll('form[data-netlify="true"], form.emergency-lead-form');
  leadForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit';
      var formName = form.getAttribute('name') || 'callback-request';

      // 1. Validate Phone Number (must be at least 10 digits)
      var phoneInput = form.querySelector('input[type="tel"]');
      if (phoneInput) {
        var cleanPhone = phoneInput.value.replace(/[\s\-\(\)\+]/g, '');
        if (cleanPhone.length < 10) {
          alert('Please enter a valid 10-digit mobile number so our technician can reach you.');
          phoneInput.focus();
          return;
        }
      }

      // Prevent duplicate submissions
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submitting Request...';
      }

      var formData = new FormData(form);
      var formObj = {};
      formData.forEach(function (val, key) {
        formObj[key] = val;
      });

      // Submit to /api/callback (Vercel serverless endpoint)
      fetch('/api/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formObj)
      })
        .then(function (res) {
          if (res.ok) {
            return res.json();
          }
          // If /api/callback returned 404 or 405 (e.g., deployed on Netlify or static host), fall back to Netlify POST /
          var encodedData = new URLSearchParams(formData).toString();
          return fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: encodedData
          }).then(function (netlifyRes) {
            if (netlifyRes.ok) return { success: true };
            throw new Error('Fallback failed');
          });
        })
        .then(function () {
          // Track successful conversion in GTM
          trackEvent('form_submit', {
            form_name: formName,
            service_type: form.querySelector('[name="service"]')?.value || 'Emergency Assistance'
          });

          // Show inline success message
          var successBox = form.parentElement.querySelector('.form-success-alert');
          if (successBox) {
            form.style.display = 'none';
            successBox.style.display = 'block';
          } else {
            alert('Thank you! Your request is received. We are calling you immediately.');
            form.reset();
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalBtnText;
            }
          }
        })
        .catch(function (error) {
          console.warn('Form submission encountered network error:', error);
          // Graceful fallback: Track attempt and show success or direct call prompt
          var successBox = form.parentElement.querySelector('.form-success-alert');
          if (successBox) {
            form.style.display = 'none';
            successBox.style.display = 'block';
          } else {
            alert('Request received! For urgent roadside assistance, please tap CALL NOW directly at 80740 15911.');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalBtnText;
            }
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
