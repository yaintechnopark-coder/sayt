const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data paths & embedded fallbacks for Vercel Serverless
const DEFAULT_CERTIFICATES = require('./data/certificates.json');
const DEFAULT_USERS = require('./data/users.json');

const CERTIFICATES_FILE = path.join(__dirname, 'data', 'certificates.json');
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.json');
const CONTACTS_FILE = path.join(__dirname, 'data', 'contacts.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const TMP_USERS_FILE = '/tmp/siele_users.json';
const TMP_BOOKINGS_FILE = '/tmp/siele_bookings.json';
const TMP_CONTACTS_FILE = '/tmp/siele_contacts.json';
const TMP_CERTIFICATES_FILE = '/tmp/siele_certificates.json';
const PDF_CERTIFICATE_FILE = path.join(__dirname, 'data', 'SIELE_Certificado_Oficial.pdf');
const PDF_CERTIFICATE_EN_FILE = path.join(__dirname, 'data', 'SIELE_Certificado_Oficial_EN.pdf');

// Ensure data files exist
try {
  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
} catch (err) {
  // Ignore on read-only serverless file systems
}

// Authorized Exam Centers Catalog
const CENTERS_CATALOG = [
  {
    id: 'CTR-ES-001',
    name: 'Instituto Cervantes Madrid - Sede Central',
    city: 'Madrid',
    country: 'España',
    address: 'Calle de Alcalá, 49, 28014 Madrid',
    modalities: 'SIELE Global, S1, S2, S3, S4, S5'
  },
  {
    id: 'CTR-ES-002',
    name: 'Universidad de Salamanca - Cursos Internacionales',
    city: 'Salamanca',
    country: 'España',
    address: 'Patio de Escuelas Menores, s/n, 37008 Salamanca',
    modalities: 'SIELE Global, S1-S5'
  },
  {
    id: 'CTR-ES-003',
    name: 'Instituto Cervantes Barcelona',
    city: 'Barcelona',
    country: 'España',
    address: 'Carrer del Consell de Cent, 311, 08007 Barcelona',
    modalities: 'SIELE Global, S1, S2, S5'
  },
  {
    id: 'CTR-MX-001',
    name: 'CEPE - Univ. Nacional Autónoma de México (UNAM)',
    city: 'Ciudad de México',
    country: 'México',
    address: 'Av. Universidad 3002, Copilco Universidad, Coyoacán, CDMX',
    modalities: 'SIELE Global, S1, S2, S3, S4, S5'
  },
  {
    id: 'CTR-AR-001',
    name: 'Laboratorio de Idiomas - UBA',
    city: 'Buenos Aires',
    country: 'Argentina',
    address: '25 de Mayo 221, C1002ABE Buenos Aires',
    modalities: 'SIELE Global, S1-S5'
  },
  {
    id: 'CTR-BR-001',
    name: 'Instituto Cervantes São Paulo',
    city: 'São Paulo',
    country: 'Brasil',
    address: 'Av. Paulista, 2439 - Bela Vista, São Paulo - SP',
    modalities: 'SIELE Global, S1, S3, S4, S5'
  },
  {
    id: 'CTR-CO-001',
    name: 'Centro de Lenguas - Univ. Pontificia Javeriana',
    city: 'Bogotá',
    country: 'Colombia',
    address: 'Carrera 7 No. 40 - 62, Edificio Emilio Arango, S.J., Bogotá',
    modalities: 'SIELE Global, S1-S5'
  },
  {
    id: 'CTR-US-001',
    name: 'Instituto Cervantes New York',
    city: 'New York',
    country: 'Estados Unidos',
    address: '211 E 49th St, New York, NY 10017',
    modalities: 'SIELE Global, S1, S2, S4'
  },
  {
    id: 'CTR-FR-001',
    name: 'Instituto Cervantes Paris',
    city: 'París',
    country: 'Francia',
    address: '7 Rue Quentin-Bauchart, 75008 Paris',
    modalities: 'SIELE Global, S1-S5'
  },
  {
    id: 'CTR-DE-001',
    name: 'Instituto Cervantes Berlin',
    city: 'Berlín',
    country: 'Alemania',
    address: 'Rosenstraße 18-19, 10178 Berlin',
    modalities: 'SIELE Global, S1-S5'
  },
  {
    id: 'CTR-GB-001',
    name: 'Instituto Cervantes London',
    city: 'Londres',
    country: 'Reino Unido',
    address: '15-19 Devereux Ct, Temple, London WC2R 3JJ',
    modalities: 'SIELE Global, S1, S2, S4'
  },
  {
    id: 'CTR-IT-001',
    name: 'Instituto Cervantes Roma',
    city: 'Roma',
    country: 'Italia',
    address: 'Via di Villa Albani, 16, 00198 Roma RM',
    modalities: 'SIELE Global, S1-S5'
  },
  {
    id: 'CTR-JP-001',
    name: 'Instituto Cervantes Tokio',
    city: 'Tokio',
    country: 'Japón',
    address: '2-9 Rokuban-cho, Chiyoda-ku, Tokyo 102-0085',
    modalities: 'SIELE Global, S1-S5'
  },
  {
    id: 'CTR-UZ-001',
    name: 'Centro Hispánico de Cooperación Académica',
    city: 'Tashkent',
    country: "O'zbekiston",
    address: "Amir Temur shoh ko'chasi 108, Toshkent shahri",
    modalities: 'SIELE Global, S1, S2, S3, S4, S5'
  }
];

// Helpers
function loadCertificates() {
  try {
    if (fs.existsSync(TMP_CERTIFICATES_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_CERTIFICATES_FILE, 'utf-8'));
    }
    if (fs.existsSync(CERTIFICATES_FILE)) {
      return JSON.parse(fs.readFileSync(CERTIFICATES_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading certificates:', err);
  }
  return DEFAULT_CERTIFICATES;
}

function saveCertificates(data) {
  try {
    fs.writeFileSync(CERTIFICATES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    try { fs.writeFileSync(TMP_CERTIFICATES_FILE, JSON.stringify(data, null, 2), 'utf-8'); } catch (e2) {}
  }
}

function loadBookings() {
  try {
    if (fs.existsSync(TMP_BOOKINGS_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_BOOKINGS_FILE, 'utf-8'));
    }
    if (fs.existsSync(BOOKINGS_FILE)) {
      return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8'));
    }
  } catch (err) {}
  return [];
}

function saveBookings(data) {
  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    try { fs.writeFileSync(TMP_BOOKINGS_FILE, JSON.stringify(data, null, 2), 'utf-8'); } catch (e2) {}
  }
}

function loadContacts() {
  try {
    if (fs.existsSync(TMP_CONTACTS_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_CONTACTS_FILE, 'utf-8'));
    }
    if (fs.existsSync(CONTACTS_FILE)) {
      return JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf-8'));
    }
  } catch (err) {}
  return [];
}

function saveContacts(data) {
  try {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    try { fs.writeFileSync(TMP_CONTACTS_FILE, JSON.stringify(data, null, 2), 'utf-8'); } catch (e2) {}
  }
}

function loadUsers() {
  try {
    if (fs.existsSync(TMP_USERS_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_USERS_FILE, 'utf-8'));
    }
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch (err) {}
  return DEFAULT_USERS;
}

function saveUsers(data) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    try { fs.writeFileSync(TMP_USERS_FILE, JSON.stringify(data, null, 2), 'utf-8'); } catch (e2) {}
  }
}

function sanitizeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SIELE Verification & Exam API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

function findCertificateByToken(rawToken) {
  const token = (rawToken || '').toString().trim();
  if (!token) return null;
  const certs = loadCertificates();
  return certs.find(c =>
    c.token === token ||
    c.code === token ||
    (c.token && c.token.toUpperCase() === token.toUpperCase()) ||
    (c.code && c.code.toUpperCase() === token.toUpperCase())
  ) || null;
}

// List all certificates (public summary)
app.get('/api/certificates', (req, res) => {
  const certs = loadCertificates();
  res.json({
    success: true,
    total: certs.length,
    certificates: certs.map(c => ({
      token: c.token || c.code,
      code: c.code,
      pdfFile: c.pdfFile || 'SIELE_Certificado_Oficial.pdf',
      candidateName: c.candidateName,
      modality: c.modality,
      globalLevel: c.globalLevel,
      status: c.status
    }))
  });
});

// Serve & download user-specific Spanish & English certificate PDFs (for Ver certificado / Ver certificado en inglés)
app.get('/api/certificates/pdf/es', (req, res) => {
  const email = (req.query.email || '').toString().trim().toLowerCase();
  const users = loadUsers();
  const matchedUser = email ? users.find(u => u.email.toLowerCase() === email) : null;
  const pdfFileName = (matchedUser && matchedUser.pdfFile) || 'SIELE_Certificado_Oficial.pdf';
  const targetPdf = path.join(__dirname, 'data', path.basename(pdfFileName));
  const finalPath = fs.existsSync(targetPdf) ? targetPdf : PDF_CERTIFICATE_FILE;

  if (fs.existsSync(finalPath)) {
    const safeName = matchedUser
      ? `Certificado_SIELE_${matchedUser.lastName}_${matchedUser.firstName}.pdf`.replace(/\s+/g, '_')
      : 'Certificado_SIELE_Oficial.pdf';
    res.download(finalPath, safeName);
  } else {
    res.status(404).json({ success: false, message: 'Archivo PDF no encontrado.' });
  }
});

app.get('/api/certificates/pdf/en', (req, res) => {
  const email = (req.query.email || '').toString().trim().toLowerCase();
  const users = loadUsers();
  const matchedUser = email ? users.find(u => u.email.toLowerCase() === email) : null;
  const pdfFileName = (matchedUser && (matchedUser.pdfFileEn || matchedUser.pdfFile)) || 'SIELE_Certificado_Oficial_EN.pdf';
  const targetPdf = path.join(__dirname, 'data', path.basename(pdfFileName));
  const finalPath = fs.existsSync(targetPdf)
    ? targetPdf
    : (fs.existsSync(PDF_CERTIFICATE_EN_FILE) ? PDF_CERTIFICATE_EN_FILE : PDF_CERTIFICATE_FILE);

  if (fs.existsSync(finalPath)) {
    const safeName = matchedUser
      ? `Certificate_SIELE_EN_${matchedUser.lastName}_${matchedUser.firstName}.pdf`.replace(/\s+/g, '_')
      : 'Certificate_SIELE_EN_Official.pdf';
    res.download(finalPath, safeName);
  } else {
    res.status(404).json({ success: false, message: 'Archivo PDF en inglés no encontrado.' });
  }
});

// Download certificate PDF endpoint by token (GET or POST)
app.get('/api/certificates/download', (req, res) => {
  const rawToken = req.query.token || req.query.code || req.query.codeDiploma || '';
  const found = findCertificateByToken(rawToken);
  if (!found) {
    return res.status(404).json({
      success: false,
      message: 'Token o código de certificación no válido. No se encontró ningún certificado asociado.'
    });
  }
  const pdfPath = path.join(__dirname, 'data', found.pdfFile || 'SIELE_Certificado_Oficial.pdf');
  if (fs.existsSync(pdfPath)) {
    res.download(pdfPath, `Certificado_SIELE_${found.token || found.code}.pdf`);
  } else {
    res.status(404).json({ success: false, message: 'Archivo PDF no encontrado en el servidor.' });
  }
});

app.post('/api/certificates/download', (req, res) => {
  const rawToken = req.body.token || req.body.code || req.body.codeDiploma || '';
  const found = findCertificateByToken(rawToken);
  if (!found) {
    return res.status(404).json({
      success: false,
      message: 'Token o código de certificación no válido. No se encontró ningún certificado asociado.'
    });
  }
  const pdfPath = path.join(__dirname, 'data', found.pdfFile || 'SIELE_Certificado_Oficial.pdf');
  if (fs.existsSync(pdfPath)) {
    res.download(pdfPath, `Certificado_SIELE_${found.token || found.code}.pdf`);
  } else {
    res.status(404).json({ success: false, message: 'Archivo PDF no encontrado en el servidor.' });
  }
});

// Verify a certificate by code/token (GET)
app.get('/api/certificates/:code', (req, res) => {
  const found = findCertificateByToken(req.params.code);

  if (!found) {
    return res.status(404).json({
      success: false,
      message: 'Token o código de certificación no válido / Certificate not found',
      code: req.params.code
    });
  }

  res.json({
    success: true,
    certificate: found
  });
});

// Verify endpoint - validates token in DB and downloads the linked PDF
app.post('/api/certificates/verify', (req, res) => {
  const rawToken = req.body.token || req.body.code || req.body.codeDiploma || '';
  const found = findCertificateByToken(rawToken);

  if (!found) {
    return res.status(404).json({
      success: false,
      message: 'Token o código de certificación no válido. No se encontró ningún certificado asociado.'
    });
  }

  const pdfPath = path.join(__dirname, 'data', found.pdfFile || 'SIELE_Certificado_Oficial.pdf');
  if (fs.existsSync(pdfPath)) {
    res.download(pdfPath, `Certificado_SIELE_${found.token || found.code}.pdf`);
  } else {
    res.status(404).json({
      success: false,
      message: 'Archivo PDF no encontrado'
    });
  }
});

// Create/Register a new certificate
app.post('/api/certificates', (req, res) => {
  const { code, candidateName, documentId, modality, modalityCode, globalLevel, totalScore, maxScore, scores, examCenter } = req.body;

  if (!code || !candidateName || !modality) {
    return res.status(400).json({
      success: false,
      message: 'Campos obligatorios incompletos: code, candidateName, modality son requeridos.'
    });
  }

  const certs = loadCertificates();
  const normalizedCode = code.trim().toUpperCase();

  if (certs.some(c => c.code.toUpperCase() === normalizedCode)) {
    return res.status(409).json({
      success: false,
      message: 'Ya existe una certificación con este código.'
    });
  }

  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setFullYear(validUntil.getFullYear() + 5);

  const newCert = {
    code: normalizedCode,
    candidateName: candidateName.trim(),
    documentId: documentId || 'N/A',
    modality: modality.trim(),
    modalityCode: modalityCode || 'GLOBAL',
    examDate: now.toISOString().slice(0, 10),
    validUntil: validUntil.toISOString().slice(0, 10),
    examCenter: examCenter || 'Centro Oficial Autorizado SIELE',
    globalLevel: globalLevel || 'B2',
    totalScore: Number(totalScore) || 750,
    maxScore: Number(maxScore) || 1000,
    status: 'VALID',
    scores: scores || {
      cl: { name: 'Comprensión de Lectura', score: 200, max: 250, level: 'B2' },
      ca: { name: 'Comprensión Auditiva', score: 200, max: 250, level: 'B2' },
      eie: { name: 'Expresión e Interacción Escritas', score: 180, max: 250, level: 'B1' },
      eio: { name: 'Expresión e Interacción Orales', score: 170, max: 250, level: 'B1' }
    }
  };

  certs.push(newCert);
  saveCertificates(certs);

  res.status(201).json({
    success: true,
    message: 'Certificado creado satisfactoriamente.',
    certificate: newCert
  });
});

// Exam booking reservation endpoints
app.get('/api/bookings', (req, res) => {
  const bookings = loadBookings();
  res.json({
    success: true,
    total: bookings.length,
    bookings
  });
});

app.post('/api/bookings', (req, res) => {
  const { fullName, email, phone, modality, preferredDate, country, center, comments } = req.body;

  if (!fullName || !email || !modality) {
    return res.status(400).json({
      success: false,
      message: 'Por favor complete todos los campos obligatorios (Nombre, Email, Modalidad).'
    });
  }

  const bookings = loadBookings();
  const newBooking = {
    id: 'BK-' + Date.now(),
    fullName: fullName.trim(),
    email: email.trim(),
    phone: phone || '',
    modality,
    preferredDate: preferredDate || '',
    center: center || 'Centro Examinador Autorizado SIELE',
    country: country || 'España',
    comments: comments || '',
    createdAt: new Date().toISOString(),
    status: 'PENDING'
  };

  bookings.push(newBooking);
  saveBookings(bookings);

  res.status(201).json({
    success: true,
    message: 'Reserva registrada con éxito. Un coordinador del centro SIELE se pondrá en contacto con usted.',
    booking: newBooking
  });
});

// Authorized Exam Centers endpoint
app.get('/api/centers', (req, res) => {
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const country = (req.query.country || '').toString().trim().toLowerCase();

  const filtered = CENTERS_CATALOG.filter(c => {
    const matchQuery = !q ||
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q);
    const matchCountry = !country || c.country.toLowerCase() === country;
    return matchQuery && matchCountry;
  });

  res.json({
    success: true,
    total: filtered.length,
    centers: filtered
  });
});

// Contact & Help Desk endpoint
app.get('/api/contact', (req, res) => {
  const contacts = loadContacts();
  res.json({
    success: true,
    total: contacts.length,
    contacts
  });
});

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Por favor complete todos los campos obligatorios (Nombre, Correo y Mensaje).'
    });
  }

  const contacts = loadContacts();
  const newTicket = {
    id: 'TK-' + Date.now(),
    name: name.trim(),
    email: email.trim(),
    subject: (subject || 'Consulta general SIELE').trim(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
    status: 'RECEIVED'
  };

  contacts.push(newTicket);
  saveContacts(contacts);

  res.status(201).json({
    success: true,
    message: `Hemos recibido su consulta ("${newTicket.subject}"). Un coordinador de soporte le responderá a ${newTicket.email}.`,
    ticket: newTicket
  });
});

// Portal Login / Authentication endpoint
app.post('/api/auth/login', (req, res) => {
  const email = (req.body.email || req.body._58_login || '').toString().trim();
  const password = (req.body.password || req.body._58_password || '').toString();

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_FIELDS',
      message: 'Por favor introduzca su dirección de correo y contraseña.'
    });
  }

  const users = loadUsers();
  const matchedUser = users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!matchedUser) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_CREDENTIALS',
      message: 'La autenticación ha fallado. Por favor, inténtelo de nuevo.'
    });
  }

  const safeUser = sanitizeUser(matchedUser);
  const token = 'siele-jwt-' + Buffer.from(`${matchedUser.email}:${matchedUser.id}:${Date.now()}`).toString('base64');

  res.json({
    success: true,
    message: `Bienvenido a SIELE (${matchedUser.fullName}).`,
    redirectUrl: '/mi-pagina',
    user: {
      ...safeUser,
      token
    }
  });
});

// Get candidate profile & reservations
app.get('/api/user/profile', (req, res) => {
  const email = (req.query.email || '').toString().trim();
  const users = loadUsers();
  const user = (email
    ? users.find(u => u.email.toLowerCase() === email.toLowerCase())
    : users[0]) || null;

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado.'
    });
  }

  res.json({
    success: true,
    user: sanitizeUser(user)
  });
});

// Update candidate profile (Editar Perfil)
app.put('/api/user/profile', (req, res) => {
  const { email, firstName, lastName, phone, birthdayDay, birthdayMonth, birthdayYear, inscriptionMails } = req.body;
  const users = loadUsers();
  const idx = users.findIndex(u =>
    email ? u.email.toLowerCase() === email.toLowerCase() : true
  );

  if (idx === -1) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado.'
    });
  }

  const u = users[idx];
  if (typeof firstName === 'string' && firstName.trim()) {
    u.firstName = firstName.trim();
  }
  if (typeof lastName === 'string' && lastName.trim()) {
    u.lastName = lastName.trim();
  }
  u.fullName = `${u.lastName}, ${u.firstName}`;
  if (typeof phone === 'string') {
    u.phone = phone.trim();
  }
  if (birthdayDay !== undefined && birthdayMonth !== undefined && birthdayYear !== undefined) {
    const d = Number(birthdayDay);
    const m = Number(birthdayMonth);
    const y = Number(birthdayYear);
    u.birthdayDay = d;
    u.birthdayMonth = m;
    u.birthdayYear = y;
    const dd = String(d).padStart(2, '0');
    const mm = String(m + 1).padStart(2, '0');
    u.birthday = `${dd}/${mm}/${y}`;
  }
  if (inscriptionMails !== undefined) {
    u.inscriptionMails = Boolean(inscriptionMails === true || inscriptionMails === 'true');
  }

  if (Array.isArray(u.exams)) {
    u.exams.forEach(ex => {
      if (ex.candidateInfo) {
        ex.candidateInfo.fullName = u.fullName;
        ex.candidateInfo.phone = u.phone;
      }
    });
  }

  users[idx] = u;
  saveUsers(users);

  res.json({
    success: true,
    message: 'Su petición ha terminado con éxito.',
    user: sanitizeUser(u)
  });
});

// Update candidate password (Cambiar contraseña)
app.put('/api/user/password', (req, res) => {
  const { email, passwordActually, passwordNew, passwordNew2 } = req.body;
  const users = loadUsers();
  const idx = users.findIndex(u =>
    email ? u.email.toLowerCase() === email.toLowerCase() : true
  );

  if (idx === -1) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado.'
    });
  }

  const u = users[idx];
  if (!passwordActually || u.password !== passwordActually) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_CURRENT_PASSWORD',
      message: 'La contraseña actual no es válida.'
    });
  }

  if (!passwordNew || passwordNew !== passwordNew2) {
    return res.status(400).json({
      success: false,
      code: 'PASSWORD_MISMATCH',
      message: 'Las contraseñas nuevas no coinciden.'
    });
  }

  u.password = passwordNew;
  users[idx] = u;
  saveUsers(users);

  res.json({
    success: true,
    message: 'Su contraseña ha sido actualizada correctamente.'
  });
});

// Serve frontend static files (explicit directory mounts so @vercel/nft bundles css, js, images, data)
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// Dedicated routes for frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/prepare-siele', (req, res) => {
  res.sendFile(path.join(__dirname, 'prepare-siele.html'));
});

app.get('/comprobar-certificado', (req, res) => {
  res.sendFile(path.join(__dirname, 'comprobar-certificado.html'));
});

app.get('/check-certificate', (req, res) => {
  res.sendFile(path.join(__dirname, 'comprobar-certificado.html'));
});

app.get('/examenes', (req, res) => {
  res.sendFile(path.join(__dirname, 'examenes.html'));
});

app.get('/modalidades', (req, res) => {
  res.sendFile(path.join(__dirname, 'examenes.html'));
});

app.get('/conoce-siele', (req, res) => {
  res.sendFile(path.join(__dirname, 'conoce-siele.html'));
});

app.get('/encuentra-centro', (req, res) => {
  res.sendFile(path.join(__dirname, 'encuentra-centro.html'));
});

app.get('/encuentre-el-centro', (req, res) => {
  res.sendFile(path.join(__dirname, 'encuentra-centro.html'));
});

app.get(['/login', '/portallogin', '/es/portallogin', '/pt/portallogin', '/en/portallogin', '/fr/portallogin'], (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get(['/mi-pagina', '/web/guest/mi-pagina', '/es/mi-pagina', '/pt/mi-pagina', '/en/mi-pagina', '/fr/mi-pagina'], (req, res) => {
  res.sendFile(path.join(__dirname, 'mi-pagina.html'));
});

app.get('/ayuda', (req, res) => {
  res.sendFile(path.join(__dirname, 'ayuda.html'));
});

app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, 'ayuda.html'));
});

// Catch-all route to index.html for SPA-like navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`  SIELE Backend & Web Server is running! `);
    console.log(`  Local URL: http://localhost:${PORT}      `);
    console.log(`  Health API: http://localhost:${PORT}/api/health`);
    console.log(`  Verify API: http://localhost:${PORT}/api/certificates/verify`);
    console.log(`=========================================`);
  });
}

module.exports = app;
