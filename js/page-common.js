// ==============================================================
// SIELE SUB-PAGES COMMON INTERACTION & LOCALIZATION SCRIPT
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

    // Attributes (placeholder, content, title)
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

    // Update document title if present
    const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
    if (titleKey && dict[titleKey]) {
      document.title = dict[titleKey];
    }

    window.dispatchEvent(new CustomEvent('siele:langchange', { detail: { lang } }));
  }

  // Language button handlers
  document.querySelectorAll('.lang a, .lang-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      applyLanguage(btn.getAttribute('data-lang'));
    });
  });

  // 2. Mobile hamburger menu toggle
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
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

  // University Marquee clone for seamless infinite loop
  const marqueeTrack = document.querySelector('.home-unis-track');
  if (marqueeTrack) {
    marqueeTrack.innerHTML += marqueeTrack.innerHTML;
  }

  // 3. Booking Modal ("Reserva tu examen")
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

  document.querySelectorAll('#btn-reserva, .btn-reserva, .botonGlobal.invert').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      if (modalBooking) {
        modalBooking.classList.add('active');
        document.getElementById('book-name')?.focus();
      }
    });
  });

  // Independent modality rows on /examenes open booking modal with selected modality
  document.querySelectorAll('.indep-item[data-modality]').forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      const mod = item.getAttribute('data-modality');
      const modSelect = document.getElementById('book-modality');
      if (mod && modSelect) modSelect.value = mod;
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

  if (bookingForm) {
    bookingForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fullName = (document.getElementById('book-name')?.value || '').trim();
      const email = (document.getElementById('book-email')?.value || '').trim();
      const phone = (document.getElementById('book-phone')?.value || '').trim();
      const modality = document.getElementById('book-modality')?.value || 'SIELE Global';
      const preferredDate = document.getElementById('book-date')?.value || '';
      const center = modalBooking?.getAttribute('data-selected-center') || '';

      if (!fullName || !email) return;

      if (bookSubmitBtn) {
        bookSubmitBtn.disabled = true;
        bookSubmitBtn.textContent = 'Enviando reserva...';
      }

      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, phone, modality, preferredDate, center })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          if (bookingAlert) {
            bookingAlert.className = 'booking-alert booking-alert--success show';
            bookingAlert.style.display = 'block';
            bookingAlert.innerHTML = `<strong>¡Reserva registrada con éxito!</strong><br>${data.message}<br><small style="margin-top:4px;display:inline-block;">Referencia: <b>${data.booking.id}</b></small>`;
          }
          bookingForm.reset();
        } else if (bookingAlert) {
          bookingAlert.className = 'booking-alert booking-alert--error show';
          bookingAlert.style.display = 'block';
          bookingAlert.textContent = data.message || 'Error al procesar la reserva.';
        }
      } catch (err) {
        if (bookingAlert) {
          bookingAlert.className = 'booking-alert booking-alert--error show';
          bookingAlert.style.display = 'block';
          bookingAlert.textContent = 'Error de conexión con el servidor.';
        }
      } finally {
        if (bookSubmitBtn) {
          bookSubmitBtn.disabled = false;
          bookSubmitBtn.textContent = 'Confirmar Reserva';
        }
      }
    });
  }

  // 4. Cookies bar
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

  // Initial language application
  applyLanguage(currentLang);

})();
