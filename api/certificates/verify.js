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

  return res.status(200).json({
    success: true,
    certificate: found,
    downloadUrl: `/api/certificates/download?token=${encodeURIComponent(found.token || found.code)}`,
    pdfUrl: `/data/${found.pdfFile || 'SIELE_Certificado_Oficial.pdf'}`
  });
};

