// ==============================================================
// COMPROBAR CERTIFICADO - INTERACTION & API INTEGRATION SCRIPT
// ==============================================================

(function() {
  'use strict';

  // 1. Language state
  const SUPPORTED_LANGS = ['es', 'pt', 'en', 'fr'];
  let currentLang = localStorage.getItem('siele_lang') || 'es';
  if (!SUPPORTED_LANGS.includes(currentLang)) currentLang = 'es';

  function applyLanguage(lang) {
    if (!window.TRANSLATIONS || !window.TRANSLATIONS[lang]) return;
    currentLang = lang;
    localStorage.setItem('siele_lang', lang);
    document.documentElement.lang = lang;

    const dict = window.TRANSLATIONS[lang];

    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    // HTML content
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (dict[key]) el.innerHTML = dict[key];
    });

    // Attributes (e.g. placeholder)
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const spec = el.getAttribute('data-i18n-attr');
      const [attr, key] = spec.split(':');
      if (attr && key && dict[key]) {
        el.setAttribute(attr, dict[key]);
      }
    });

    // Language buttons
    document.querySelectorAll('.lang a, .lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Update document title
    if (dict.cc_page_title) {
      document.title = dict.cc_page_title;
    }
  }

  // Language button click handlers
  document.querySelectorAll('.lang a, .lang-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      applyLanguage(btn.getAttribute('data-lang'));
    });
  });

  // 2. Mobile hamburger menu toggle
  const burger = document.getElementById('burger') || document.getElementById('menu-toggle');
  const nav = document.getElementById('nav') || document.getElementById('main-nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 820) link.parentElement.classList.toggle('open');
      });
    });
  }

  // Header scroll shadow
  const header = document.getElementById('header') || document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 15);
    }
  }, { passive: true });

  // 3. Elements for verification & download
  const verifyForm = document.getElementById('cc-verify-form');
  const codeInput = document.getElementById('cc-code-input');
  const submitBtn = document.getElementById('cc-submit-btn');
  const ccFeedback = document.getElementById('cc-feedback');

  // Form submit
  if (verifyForm) {
    verifyForm.addEventListener('submit', e => {
      e.preventDefault();
      const code = (codeInput ? codeInput.value : '').trim();
      if (code) {
        verifyCertificate(code);
      }
    });
  }

  async function verifyCertificate(code) {
    if (!submitBtn) return;
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="cc-spinner" aria-label="Cargando..."></span>';
    if (ccFeedback) ccFeedback.style.display = 'none';

    try {
      const response = await fetch('/api/certificates/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code, code })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const cleanToken = code.trim();
        const safeCode = cleanToken.replace(/[^a-zA-Z0-9_-]/g, '') || 'Oficial';
        a.download = `Certificado_SIELE_${safeCode}.pdf`;
        document.body.appendChild(a);
        a.click();
        if (codeInput) codeInput.value = '';
        if (ccFeedback) ccFeedback.style.display = 'none';
        setTimeout(() => {
          a.remove();
          window.URL.revokeObjectURL(url);
        }, 1500);
      } else {
        let errMsg = 'Token o código de certificación no válido.';
        try {
          const errData = await response.json();
          if (errData && errData.message) errMsg = errData.message;
        } catch (_) {}
        if (ccFeedback) {
          ccFeedback.style.display = 'block';
          ccFeedback.style.background = '#f8d7da';
          ccFeedback.style.color = '#721c24';
          ccFeedback.style.border = '1px solid #f5c6cb';
          ccFeedback.textContent = errMsg;
        }
      }
    } catch (err) {
      if (ccFeedback) {
        ccFeedback.style.display = 'block';
        ccFeedback.style.background = '#f8d7da';
        ccFeedback.style.color = '#721c24';
        ccFeedback.style.border = '1px solid #f5c6cb';
        ccFeedback.textContent = 'Error de conexión con el servidor.';
      }
    } finally {
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
      }, 450);
    }
  }

  // 4. Booking Modal handler
  const modalBooking = document.getElementById('modal-booking');
  const btnBookingClose = document.getElementById('modal-booking-close');
  const bookingForm = document.getElementById('booking-form');
  const bookingAlert = document.getElementById('booking-alert');
  const bookSubmitBtn = document.getElementById('book-submit-btn');
  const bookDateInput = document.getElementById('book-date');

  if (bookDateInput && !bookDateInput.value) {
    const d = new Date(Date.now() + 7 * 86400000);
    bookDateInput.value = d.toISOString().split('T')[0];
  }

  document.querySelectorAll('#btn-reserva, .btn-reserva, #header-btn-reserva').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      if (modalBooking) {
        modalBooking.classList.add('active');
        document.getElementById('book-name')?.focus();
      }
    });
  });

  if (btnBookingClose && modalBooking) {
    btnBookingClose.addEventListener('click', () => {
      modalBooking.classList.remove('active');
      if (bookingAlert) {
        bookingAlert.className = 'booking-alert';
        bookingAlert.style.display = 'none';
      }
    });
  }
  if (modalBooking) {
    modalBooking.addEventListener('click', e => {
      if (e.target === modalBooking) {
        modalBooking.classList.remove('active');
        if (bookingAlert) {
          bookingAlert.className = 'booking-alert';
          bookingAlert.style.display = 'none';
        }
      }
    });
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalBooking) {
      modalBooking.classList.remove('active');
    }
  });

  // 4b. Cookies bar
  const cookieBar = document.getElementById('cookie-bar');
  const cookieClose = document.getElementById('cookie-close');
  const cookieFab = document.getElementById('cookie-fab');
  const cookieConfig = document.getElementById('cookie-config');

  const showCookieBar = () => {
    if (cookieBar) cookieBar.classList.add('show');
  };

  if (!localStorage.getItem('siele_cookies_accepted') && !localStorage.getItem('cookiesAccepted')) {
    setTimeout(showCookieBar, 800);
  }

  if (cookieClose) {
    cookieClose.addEventListener('click', () => {
      if (cookieBar) cookieBar.classList.remove('show');
      localStorage.setItem('siele_cookies_accepted', '1');
      localStorage.setItem('cookiesAccepted', '1');
    });
  }

  if (cookieFab) {
    cookieFab.addEventListener('click', () => {
      if (cookieBar) cookieBar.classList.toggle('show');
    });
  }

  if (cookieConfig) {
    cookieConfig.addEventListener('click', e => {
      e.preventDefault();
      showCookieBar();
    });
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = {
        fullName: document.getElementById('book-name').value.trim(),
        email: document.getElementById('book-email').value.trim(),
        phone: document.getElementById('book-phone').value.trim(),
        modality: document.getElementById('book-modality').value,
        preferredDate: document.getElementById('book-date').value
      };

      bookSubmitBtn.disabled = true;
      bookSubmitBtn.textContent = 'Enviando...';

      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          bookingAlert.className = 'booking-alert booking-alert--success';
          bookingAlert.style.display = 'block';
          bookingAlert.innerHTML = `<strong>¡Reserva registrada con éxito!</strong><br>${data.message}<br><small>Referencia: <b>${data.booking.id}</b></small>`;
          bookingForm.reset();
        } else {
          bookingAlert.className = 'booking-alert booking-alert--error';
          bookingAlert.style.display = 'block';
          bookingAlert.textContent = data.message || 'Error al procesar la reserva.';
        }
      } catch (err) {
        console.error('Error:', err);
        bookingAlert.className = 'booking-alert booking-alert--error';
        bookingAlert.style.display = 'block';
        bookingAlert.textContent = 'Error de conexión con el servidor.';
      } finally {
        bookSubmitBtn.disabled = false;
        bookSubmitBtn.textContent = 'Confirmar Reserva';
      }
    });
  }

  // 5. Initialize language on page load
  applyLanguage(currentLang);

  // Check URL params for auto-verification
  const urlParams = new URLSearchParams(window.location.search);
  const codeParam = urlParams.get('code') || urlParams.get('codeDiploma');
  if (codeParam && codeInput) {
    codeInput.value = codeParam;
    verifyCertificate(codeParam);
  }
})();
