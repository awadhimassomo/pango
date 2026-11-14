const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('../database');
const { requireRole } = require('../auth/middleware');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const canWrite = requireRole('agent', 'admin');

const KINDS = {
  videos: { exts: ['.mp4', '.webm', '.mov'] },
  models3d: { exts: ['.glb', '.gltf'] },
  images: { exts: ['.jpg', '.jpeg', '.png', '.webp'] },
};

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) =>
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const kind = KINDS[req.params.kind];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!kind) return cb(new Error('kind must be one of: videos, models3d, images'));
    if (!kind.exts.includes(ext)) return cb(new Error(`Allowed for ${req.params.kind}: ${kind.exts.join(', ')}`));
    cb(null, true);
  },
});

// Admins can touch any listing; agents only their own.
function loadOwned(req, res, next) {
  const h = db.houses.get(req.params.id);
  if (!h) return res.status(404).json({ error: 'House not found' });
  if (req.user.role !== 'admin' && h.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'You can only change your own listings' });
  }
  next();
}

router.get('/', (req, res) => {
  const results = db.houses.search(req.query);
  res.json({ count: results.length, results });
});

router.get('/:id', (req, res) => {
  const h = db.houses.get(req.params.id);
  if (!h) return res.status(404).json({ error: 'House not found' });
  res.json(h);
});

router.post('/', canWrite, (req, res) => {
  const r = db.houses.create(req.body, req.user.id);
  if (r.errors) return res.status(400).json({ errors: r.errors });
  res.status(201).json(r.house);
});

router.put('/:id', canWrite, loadOwned, (req, res) => {
  const r = db.houses.update(req.params.id, req.body);
  if (r.errors) return res.status(400).json({ errors: r.errors });
  res.json(r.house);
});

router.delete('/:id', canWrite, loadOwned, (req, res) => {
  db.houses.remove(req.params.id);
  res.status(204).end();
});

// POST /api/houses/:id/media/:kind — multipart field "file" (+ optional "title"),
// or JSON {url, title} to link external media.
router.post('/:id/media/:kind', canWrite, loadOwned, (req, res) => {
  const { kind, id } = req.params;
  if (!KINDS[kind]) return res.status(400).json({ error: 'kind must be one of: videos, models3d, images' });

  if (req.is('application/json')) {
    const { url, title } = req.body || {};
    if (!/^https?:\/\//i.test(url || '')) return res.status(400).json({ error: 'url must be http(s)' });
    return res.status(201).json(db.houses.addMedia(id, kind, kind === 'images' ? url : { url, title: title || '' }));
  }

  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (field name "file")' });
    const url = `/uploads/${req.file.filename}`;
    const item = kind === 'images' ? url : { url, title: req.body.title || req.file.originalname };
    res.status(201).json(db.houses.addMedia(id, kind, item));
  });
});

module.exports = router;
