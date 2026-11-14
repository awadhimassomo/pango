// Single entry point for all persistence. Swap the JSON files for a real DB here
// (Postgres, MongoDB…) without touching the other modules.
const houses = require('./houses');
const users = require('./users');

module.exports = {
  houses,
  users,
  load() {
    houses.load();
    users.load();
  },
};
