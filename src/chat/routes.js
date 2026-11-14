const express = require('express');
const { chat } = require('./chat');

const router = express.Router();

router.post('/', async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'messages must be a non-empty array of {role, content}' });
  }
  try {
    res.json(await chat(messages.slice(-20)));
  } catch (e) {
    console.error('chat error:', e.message);
    res.status(502).json({ error: 'The assistant is unavailable right now. Please try again.' });
  }
});

module.exports = router;
