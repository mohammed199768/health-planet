// Universal Analytics Tracking Script
// Add this script to any website to track events
(function() {
  'use strict';

  // Firebase configuration - Replace with your Firebase config
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  // Session management
  function getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
      trackEvent('session_start', {});
    }
    return sessionId;
  }

  const sessionId = getOrCreateSessionId();
  const sessionStart = Date.now();

  // Get UTM parameters
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign')
    };
  }

  // Track event function
  async function trackEvent(eventType, metadata = {}) {
    const utm = getUTMParams();

    const eventData = {
      eventType,
      path: window.location.pathname,
      fullUrl: window.location.href,
      referrer: document.referrer || null,
      sessionId: sessionId,
      lang: navigator.language,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      metadata: metadata,
      createdAt: new Date().toISOString(),
      domain: window.location.hostname
    };

    try {
      // Send to your backend endpoint
      await fetch('https://YOUR_CLOUD_FUNCTION_URL/track-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Track page view on load
  trackEvent('page_view');

  // Track session end on unload
  window.addEventListener('beforeunload', function() {
    const duration = Date.now() - sessionStart;
    trackEvent('session_end', { duration_ms: duration });
  });

  // Expose tracking function globally
  window.trackEvent = function(eventType, metadata) {
    trackEvent(eventType, metadata);
  };

  // Auto-track clicks on important elements
  document.addEventListener('click', function(e) {
    const target = e.target;

    // Track button clicks
    if (target.tagName === 'BUTTON') {
      trackEvent('button_click', {
        buttonText: target.textContent,
        buttonId: target.id,
        buttonClass: target.className
      });
    }

    // Track link clicks
    if (target.tagName === 'A') {
      trackEvent('link_click', {
        linkText: target.textContent,
        linkUrl: target.href,
        linkId: target.id
      });
    }
  });

  // Track form submissions
  document.addEventListener('submit', function(e) {
    const form = e.target;
    trackEvent('form_submit', {
      formId: form.id,
      formAction: form.action,
      formClass: form.className
    });
  });

})();
