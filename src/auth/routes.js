const express = require('express');
const db = require('../database');
const passwords = require('./passwords');
const tokens = require('./tokens');
const { requireAuth } = require('./middleware');

const router = express.Router();

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Roles: "user" (browse + chat), "agent" (can list houses), "admin" (everything).
// Anyone can sign up as user or agent; set ADMIN_EMAIL to make that account admin.
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body || {};
  const errors = [];
  if (!name) errors.push('name is required');
  if (!EMAIL_RE.test(email || '')) errors.push('a valid email is required');
  if (typeof password !== 'string' || password.length < 8) errors.push('password must be at least 8 characters');
  if (errors.length) return res.status(400).json({ errors });
  if (db.users.findByEmail(email)) return res.status(409).json({ error: 'Email already registered' });

  const isAdmin = process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.toLowerCase() === email.toLowerCase();
  const user = db.users.create({
    name, email, passwordHash: passwords.hash(password),
    role: isAdmin ? 'admin' : role === 'agent' ? 'agent' : 'user',
  });
  res.status(201).json({ user: publicUser(user), token: tokens.sign(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.users.findByEmail(email || '');
  // Same message for unknown email and wrong password.
  if (!user || !passwords.verify(String(password || ''), user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ user: publicUser(user), token: tokens.sign(user) });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
