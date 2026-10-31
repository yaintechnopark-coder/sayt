// Language switcher with official SIELE translations (ES, PT, EN, FR)
function setLanguage(lang) {
  if (!window.TRANSLATIONS || !window.TRANSLATIONS[lang]) return;
  const dict = window.TRANSLATIONS[lang];

  document.documentElement.lang = lang;
  localStorage.setItem('siele_lang', lang);

  // Update lang navigation active state
  document.querySelectorAll('.lang a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-lang') === lang);
  });

  // Update plain text elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      el.textContent = dict[key];
    }
  });

  // Update rich HTML elements (with bold, spans, breaks)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (dict[key] !== undefined) {
      el.innerHTML = dict[key];
    }
  });

  // Update attributes (placeholder, content, title)
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const spec = el.getAttribute('data-i18n-attr');
    const [attr, key] = spec.split(':');
    if (attr && key && dict[key] !== undefined) {
      el.setAttribute(attr, dict[key]);
    }
  });


  // Update document title and metadata
  if (dict.page_title) {
    document.title = dict.page_title;
    const ogTitle = document.getElementById('og-title');
    if (ogTitle) ogTitle.setAttribute('content', dict.page_title);
  }
  if (dict.meta_desc) {
    const metaDesc = document.getElementById('meta-desc');
    if (metaDesc) metaDesc.setAttribute('content', dict.meta_desc);
  }

  window.dispatchEvent(new CustomEvent('siele:langchange', { detail: { lang } }));
}

// Bind language tab clicks
document.querySelectorAll('.lang a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const targetLang = a.getAttribute('data-lang');
    if (targetLang) setLanguage(targetLang);
  });
});

// Initialize language from storage or default to Spanish
const initialLang = localStorage.getItem('siele_lang') || 'es';
setLanguage(initialLang);

// Sticky header shadow
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// Mobile menu
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

// Reveal on scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal, .deco').forEach((el, i) => {
  const parent = el.parentElement;
  if (parent && (parent.classList.contains('features') || parent.classList.contains('tests'))) {
    el.style.transitionDelay = `${[...parent.children].indexOf(el) * 0.12}s`;
  }
  io.observe(el);
});

// Video: opens SIELE YouTube channel
const video = document.getElementById('video');
const openVideo = () => window.open('https://www.youtube.com/channel/UCcJZoqQ7Akk5ny714iUMHnQ', '_blank', 'noopener');
if (video) {
  video.addEventListener('click', openVideo);
  video.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVideo(); } });
}

// Cookies
const bar = document.getElementById('cookie-bar');
const showBar = () => { if (bar) bar.classList.add('show'); };
if (!localStorage.getItem('siele_cookies_accepted') && !localStorage.getItem('cookiesAccepted')) {
  setTimeout(showBar, 800);
}
document.getElementById('cookie-close')?.addEventListener('click', () => {
  if (bar) bar.classList.remove('show');
  localStorage.setItem('siele_cookies_accepted', '1');
  localStorage.setItem('cookiesAccepted', '1');
});
document.getElementById('cookie-fab')?.addEventListener('click', () => {
  if (bar) bar.classList.toggle('show');
});
document.getElementById('cookie-config')?.addEventListener('click', e => { e.preventDefault(); showBar(); });

// ================= MODALS & BACKEND API INTEGRATION =================

const modalCert = document.getElementById('modal-cert');
const modalCertClose = document.getElementById('modal-cert-close');
const btnCertificado = document.getElementById('btn-certificado');

const modalBooking = document.getElementById('modal-booking');
const modalBookingClose = document.getElementById('modal-booking-close');
const bookDateInput = document.getElementById('book-date');

if (bookDateInput && !bookDateInput.value) {
  const d = new Date(Date.now() + 7 * 86400000);
  bookDateInput.value = d.toISOString().split('T')[0];
}

// Open Certificate Page
if (btnCertificado) {
  btnCertificado.addEventListener('click', e => {
    e.preventDefault();
    window.location.href = '/comprobar-certificado';
  });
}
if (modalCertClose && modalCert) {
  modalCertClose.addEventListener('click', () => modalCert.classList.remove('active'));
}

// Open Booking Modal from header or course buttons
document.querySelectorAll('#btn-reserva, .btn-reserva').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    if (modalBooking) {
      modalBooking.classList.add('active');
      document.getElementById('book-name')?.focus();
    }
  });
});

const courseModalityMap = {
  'btn-global': 'SIELE Global',
  'btn-s1': 'S1',
  'btn-s2': 'S2',
  'btn-s3': 'S3',
  'btn-s4': 'S4',
  'btn-s5': 'S5',
  'btn-cl': 'S1',
  'btn-ca': 'S1',
  'btn-eie': 'S2',
  'btn-eio': 'S4',
  'btn-mooc': 'SIELE Global'
};

Object.entries(courseModalityMap).forEach(([btnId, modVal]) => {
  const el = document.getElementById(btnId);
  if (el && modalBooking) {
    el.addEventListener('click', e => {
      e.preventDefault();
      const modSelect = document.getElementById('book-modality');
      if (modSelect) modSelect.value = modVal;
      modalBooking.classList.add('active');
      document.getElementById('book-name')?.focus();
    });
  }
});

if (modalBookingClose && modalBooking) {
  modalBookingClose.addEventListener('click', () => modalBooking.classList.remove('active'));
}

// Close modals when clicking backdrop
[modalCert, modalBooking].forEach(m => {
  if (m) {
    m.addEventListener('click', e => {
      if (e.target === m) m.classList.remove('active');
    });
  }
});

// ESC key closes modals
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (modalCert) modalCert.classList.remove('active');
    if (modalBooking) modalBooking.classList.remove('active');
  }
});


// Certificate Form submission
const verifyForm = document.getElementById('verify-form');
const verifyInput = document.getElementById('verify-code-input');
const verifySubmitBtn = document.getElementById('verify-submit-btn');
const certResult = document.getElementById('cert-result');

verifyForm.addEventListener('submit', e => {
  e.preventDefault();
  verifyCertificate(verifyInput.value.trim());
});

async function verifyCertificate(code) {
  if (!code) return;

  const originalBtnText = verifySubmitBtn.innerHTML;
  verifySubmitBtn.disabled = true;
  verifySubmitBtn.innerHTML = '<span class="cc-spinner" style="width:18px;height:18px;border-width:2px;"></span>';

  try {
    const response = await fetch('/api/certificates/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (response.ok) {
      if (certResult) certResult.className = 'cert-result';
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const safeCode = code.trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'Oficial';
      a.download = `Certificado_SIELE_${safeCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      if (verifyInput) verifyInput.value = '';
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
      renderCertificateError(errMsg);
    }
  } catch (err) {
    renderCertificateError('Error de conexión al verificar el certificado.');
  } finally {
    setTimeout(() => {
      verifySubmitBtn.disabled = false;
      verifySubmitBtn.innerHTML = originalBtnText;
    }, 700);
  }
}

function renderCertificateError(msg) {
  certResult.className = 'cert-result cert-result--error show';
  certResult.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;color:#c53030;font-weight:600;margin-bottom:6px;">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
      <span>Verificación Fallida</span>
    </div>
    <p style="font-size:14px;color:#742a2a;line-height:1.5;">${msg}</p>
  `;
}

// Booking Form submission
const bookingForm = document.getElementById('booking-form');
const bookingAlert = document.getElementById('booking-alert');
const bookSubmitBtn = document.getElementById('book-submit-btn');

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
  bookSubmitBtn.textContent = 'Enviando reserva...';

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
      bookingAlert.innerHTML = `<strong>¡Reserva registrada con éxito!</strong><br>${data.message}<br><small style="margin-top:4px;display:inline-block;">Referencia: <b>${data.booking.id}</b></small>`;
      bookingForm.reset();
    } else {
      bookingAlert.className = 'booking-alert booking-alert--error';
      bookingAlert.style.display = 'block';
      bookingAlert.textContent = data.message || 'Error al procesar la reserva.';
    }
  } catch (err) {
    console.error('Error booking exam:', err);
    bookingAlert.className = 'booking-alert booking-alert--error';
    bookingAlert.style.display = 'block';
    bookingAlert.textContent = 'Error de conexión con el servidor.';
  } finally {
    bookSubmitBtn.disabled = false;
    bookSubmitBtn.textContent = 'Confirmar Reserva';
  }
});
