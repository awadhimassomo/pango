const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const seed = require('./seed');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'houses.json');

let houses = [];

function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(FILE)) {
    houses = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } else {
    houses = seed;
    save();
  }
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(houses, null, 2));
}

function newId() {
  return crypto.randomUUID();
}

const FIELDS = [
  'title', 'description', 'price', 'type', 'listingType', 'bedrooms', 'bathrooms',
  'areaSqm', 'city', 'address', 'lat', 'lng', 'amenities', 'images', 'videos', 'models3d',
];

function pick(body) {
  const out = {};
  for (const k of FIELDS) if (body[k] !== undefined) out[k] = body[k];
  for (const k of ['price', 'bedrooms', 'bathrooms', 'areaSqm', 'lat', 'lng']) {
    if (out[k] !== undefined && out[k] !== null && out[k] !== '') out[k] = Number(out[k]);
  }
  if (typeof out.amenities === 'string') {
    out.amenities = out.amenities.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return out;
}

function validate(h) {
  const errors = [];
  if (!h.title) errors.push('title is required');
  if (!Number.isFinite(h.price) || h.price < 0) errors.push('price must be a non-negative number');
  if (!h.city) errors.push('city is required');
  return errors;
}

function search(q = {}) {
  const num = (v) => (v === undefined || v === '' ? undefined : Number(v));
  const minPrice = num(q.minPrice), maxPrice = num(q.maxPrice);
  const bedrooms = num(q.bedrooms), bathrooms = num(q.bathrooms);
  const text = (q.q || '').toLowerCase().trim();
  const city = (q.city || '').toLowerCase().trim();
  const amenities = (q.amenities || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

  let res = houses.filter((h) => {
    if (minPrice !== undefined && h.price < minPrice) return false;
    if (maxPrice !== undefined && h.price > maxPrice) return false;
    if (bedrooms !== undefined && h.bedrooms < bedrooms) return false;
    if (bathrooms !== undefined && h.bathrooms < bathrooms) return false;
    if (q.type && h.type !== q.type) return false;
    if (q.listingType && h.listingType !== q.listingType) return false;
    if (city && !(h.city || '').toLowerCase().includes(city)) return false;
    if (q.hasVideo === 'true' && !(h.videos && h.videos.length)) return false;
    if (q.has3d === 'true' && !(h.models3d && h.models3d.length)) return false;
    if (amenities.length) {
      const have = (h.amenities || []).map((a) => a.toLowerCase());
      if (!amenities.every((a) => have.includes(a))) return false;
    }
    if (text) {
      const hay = `${h.title} ${h.description} ${h.city} ${h.address} ${(h.amenities || []).join(' ')}`.toLowerCase();
      if (!text.split(/\s+/).every((t) => hay.includes(t))) return false;
    }
    return true;
  });

  const sorts = {
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    newest: (a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''),
  };
  if (sorts[q.sort]) res = res.sort(sorts[q.sort]);
  return res;
}

module.exports = {
  load,
  all: () => houses,
  get: (id) => houses.find((h) => h.id === id),
  search,
  create(body, ownerId = null) {
    const data = pick(body);
    const errors = validate(data);
    if (errors.length) return { errors };
    const house = {
      id: newId(), type: 'house', listingType: 'sale', bedrooms: 0, bathrooms: 0,
      amenities: [], images: [], videos: [], models3d: [], ...data,
      ownerId, createdAt: new Date().toISOString(),
    };
    houses.push(house);
    save();
    return { house };
  },
  update(id, body) {
    const h = houses.find((x) => x.id === id);
    if (!h) return null;
    const merged = { ...h, ...pick(body) };
    const errors = validate(merged);
    if (errors.length) return { errors };
    Object.assign(h, merged);
    save();
    return { house: h };
  },
  remove(id) {
    const i = houses.findIndex((x) => x.id === id);
    if (i < 0) return null;
    const [h] = houses.splice(i, 1);
    save();
    return h;
  },
  addMedia(id, kind, item) {
    const h = houses.find((x) => x.id === id);
    if (!h) return null;
    h[kind] = h[kind] || [];
    h[kind].push(item);
    save();
    return h;
  },
};
