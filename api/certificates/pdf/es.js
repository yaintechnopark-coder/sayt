const path = require('path');
const fs = require('fs');
const users = require('../../../data/users.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query || {};
  const email = (query.email || '').toString().trim().toLowerCase();
  const matchedUser = email ? users.find(u => u.email.toLowerCase() === email) : users[0];
  const pdfFileName = (matchedUser && matchedUser.pdfFile) || 'SIELE_Certificado_Oficial.pdf';

  const candidatePaths = [
    path.join(__dirname, '..', '..', '..', 'data', pdfFileName),
    path.join(__dirname, '..', '..', '..', 'public', 'data', pdfFileName),
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

  const downloadFilename = matchedUser
    ? `Certificado_SIELE_${matchedUser.lastName}_${matchedUser.firstName}.pdf`.replace(/\s+/g, '_')
    : 'Certificado_SIELE_Oficial.pdf';

  if (foundPath) {
    try {
      const fileData = fs.readFileSync(foundPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      return res.status(200).send(fileData);
    } catch (err) {
      return res.redirect(302, `/data/${pdfFileName}`);
    }
  }

  return res.redirect(302, `/data/${pdfFileName}`);
};
