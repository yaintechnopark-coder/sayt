const path = require('path');
const fs = require('fs');
const certificates = require('../../data/certificates.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query || {};
  const body = req.body || {};
  const rawToken = (query.token || query.code || query.codeDiploma || body.token || body.code || body.codeDiploma || '').toString().trim();

  if (!rawToken) {
    return res.status(400).json({
      success: false,
      message: 'Token o código de certificación requerido.'
    });
  }

  const found = certificates.find(c =>
    c.token === rawToken ||
    c.code === rawToken ||
    (c.token && c.token.toUpperCase() === rawToken.toUpperCase()) ||
    (c.code && c.code.toUpperCase() === rawToken.toUpperCase())
  );

  if (!found) {
    return res.status(404).json({
      success: false,
      message: 'Token o código de certificación no válido. No se encontró ningún certificado asociado.'
    });
  }

  const pdfFileName = found.pdfFile || 'SIELE_Certificado_Oficial.pdf';
  const candidatePaths = [
    path.join(__dirname, '..', '..', 'data', pdfFileName),
    path.join(__dirname, '..', '..', 'public', 'data', pdfFileName),
    path.join(process.cwd(), 'data', pdfFileName),
    path.join(process.cwd(), 'public', 'data', pdfFileName)
  ];

  let foundPath = null;
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    } catch (_) {}
  }

  const downloadFilename = `Certificado_SIELE_${(found.candidateName || 'Oficial').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

  if (foundPath) {
    try {
      const fileData = fs.readFileSync(foundPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      return res.status(200).send(fileData);
    } catch (err) {
      // Fallback to static URL redirect
      return res.redirect(302, `/data/${pdfFileName}`);
    }
  }

  // If file path not resolved in lambda filesystem, redirect directly to static CDN URL
  return res.redirect(302, `/data/${pdfFileName}`);
};

