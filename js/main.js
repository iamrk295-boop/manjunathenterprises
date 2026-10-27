/**
 * Manjunath Enterprises — High-Conversion Landing Page Scripts
 * Handles Google Tag Manager dataLayer events, Netlify Form AJAX, and FAQ accordion.
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
    var payload = Object.assign({ event: eventName, timestamp: new Date().toISOString() }, eventParams || {});
    window.dataLayer.push(payload);
    // Debug logging in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[GTM dataLayer Event]:', payload);
    }
  }

  // Bind Tracking to all Trackable CTAs
  document.addEventListener('click', function (e) {
    var target = e.target.closest('[data-track]');
    if (!target) return;

    var eventName = target.getAttribute('data-track');
    var ctaLocation = target.getAttribute('data-cta-location') || 'unknown';
    var ctaType = target.getAttribute('data-cta-type') || 'button';
    var ctaLabel = (target.textContent || '').trim().substring(0, 50);

    trackEvent(eventName, {
      cta_location: ctaLocation,
      cta_type: ctaType,
      cta_label: ctaLabel
    });
  });

  // Handle Netlify Lead Forms via AJAX with inline thank you state
  var leadForms = document.querySelectorAll('form[data-netlify="true"]');
  leadForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit';
      var formName = form.getAttribute('name') || 'callback-request';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Connecting...';
      }

      var formData = new FormData(form);
      // Netlify requires form-name in urlencoded format
      var encodedData = new URLSearchParams(formData).toString();

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodedData
      })
        .then(function (response) {
          if (response.ok) {
            // Track successful conversion in GTM
            trackEvent('form_submit', {
              form_name: formName,
              service_type: form.querySelector('[name="service"]')?.value || 'Emergency'
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
          } else {
            throw new Error('Network response was not ok');
          }
        })
        .catch(function (error) {
          console.error('Form submission error:', error);
          alert('Notice: If urgent, please tap Call Now directly to reach our dispatch team instantly.');
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
