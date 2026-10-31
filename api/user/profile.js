const users = require('../../data/users.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query || {};
  const email = (query.email || '').toString().trim().toLowerCase();

  const user = email ? users.find(u => u.email.toLowerCase() === email) : users[0];

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado.'
    });
  }

  const { password: _, ...safeUser } = user;
  return res.status(200).json({
    success: true,
    user: safeUser
  });
};
