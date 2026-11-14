require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { authenticate } = require('./auth/middleware');

db.load();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(authenticate);

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./auth/routes'));
app.use('/api/houses', require('./houses/routes'));
app.use('/api/chat', require('./chat/routes'));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'views')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
