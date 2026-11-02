const users = require('../../data/users.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const body = req.body || {};
  const email = (body.email || body._58_login || '').toString().trim().toLowerCase();
  const password = (body.password || body._58_password || '').toString();

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_FIELDS',
      message: 'Por favor introduzca su dirección de correo y contraseña.'
    });
  }

  const matchedUser = users.find(
    u => u.email.toLowerCase() === email && u.password === password
  );

  if (!matchedUser) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_CREDENTIALS',
      message: 'La autenticación ha fallado. Por favor, inténtelo de nuevo.'
    });
  }

  const { password: _, ...safeUser } = matchedUser;
  const token = 'siele-jwt-' + Buffer.from(`${matchedUser.email}:${matchedUser.id}:${Date.now()}`).toString('base64');

  return res.status(200).json({
    success: true,
    message: `Bienvenido a SIELE (${matchedUser.fullName}).`,
    redirectUrl: '/mi-pagina',
    user: {
      ...safeUser,
      token
    }
  });
};

