const tokens = require('./tokens');
const db = require('../database');

// Attaches req.user when a valid "Authorization: Bearer <token>" is sent.
function authenticate(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.get('authorization') || '');
  if (m) {
    try {
      const payload = tokens.verify(m[1]);
      req.user = db.users.findById(payload.sub) || null;
    } catch {
      req.user = null;
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Login required' });
  next();
}

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Login required' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Not allowed' });
  next();
};

module.exports = { authenticate, requireAuth, requireRole };
