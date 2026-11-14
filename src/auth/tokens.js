const crypto = require('crypto');
const jwt = require('jsonwebtoken');

let secret = process.env.JWT_SECRET;
if (!secret) {
  // Dev fallback: tokens stop working on restart. Set JWT_SECRET in production.
  secret = crypto.randomBytes(32).toString('hex');
  console.warn('[auth] JWT_SECRET not set – using a temporary secret.');
}

const sign = (user) => jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '7d' });
const verify = (token) => jwt.verify(token, secret);

module.exports = { sign, verify };
