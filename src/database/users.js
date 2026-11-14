const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'users.json');

let users = [];

function save() {
  fs.writeFileSync(FILE, JSON.stringify(users, null, 2));
}

module.exports = {
  load() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    users = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : [];
  },
  findByEmail: (email) => users.find((u) => u.email === String(email).toLowerCase()),
  findById: (id) => users.find((u) => u.id === id),
  create({ name, email, passwordHash, role }) {
    const user = {
      id: crypto.randomUUID(), name, email: String(email).toLowerCase(), passwordHash, role,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    save();
    return user;
  },
};
