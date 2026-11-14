# Team layout (6 people)

Each folder has one owner group, so people rarely edit the same files.

```
pango/
├── views/            UI team (2 people)      – HTML, CSS, client JS, templates
│   ├── index.html    listing grid, filters, video / 3D modal, chat widget
│   ├── login.html    sign in / register page
│   ├── app.js        listing + detail + chat UI logic
│   ├── auth.js       client-side session helper
│   └── styles.css
├── src/
│   ├── database/     Database team (2 people) – all persistence
│   │   ├── index.js    the ONLY module others import (db.houses, db.users)
│   │   ├── houses.js   house queries, search, filters
│   │   ├── users.js    user records
│   │   └── seed.js     sample data
│   ├── auth/         Auth owner (1 person)   – register, login, JWT, roles
│   │   ├── routes.js     /api/auth/*
│   │   ├── middleware.js authenticate, requireAuth, requireRole
│   │   ├── passwords.js  scrypt hashing
│   │   └── tokens.js     JWT sign/verify
│   ├── chat/         Chat owner (1 person)   – chatbot
│   │   ├── routes.js     /api/chat
│   │   └── chat.js       Claude tool-use + keyword fallback
│   ├── houses/       Shared (database + auth owners) – listings API and media uploads
│   │   └── routes.js     /api/houses/*
│   ├── app.js        wires the modules together (change rarely, tell the team)
│   └── server.js     starts the server
├── test/             each owner adds tests for their module
└── uploads/ data/    runtime files (git-ignored)
```

## Rules
- **Talk to other modules only through their public surface**: `require('../database')` – never `require('../database/houses')` from outside the database folder. That lets the database team swap JSON files for Postgres/MongoDB without breaking anyone.
- **API contract** (what the UI and chat rely on) is in `README.md`. Change it only after telling the UI team.
- Auth owner: `requireAuth` / `requireRole('agent','admin')` are what other modules use to protect routes.
- Use one git branch per person/module and open pull requests; `src/app.js` changes need a second reviewer.

## Suggested split
| Person | Folder |
|---|---|
| 1, 2 | `views/` (one on listing/detail/3D/video, one on chat widget, login and styling) |
| 3, 4 | `src/database/` (one on schema/queries/migration to a real DB, one on seed data, search and media records) |
| 5 | `src/chat/` |
| 6 | `src/auth/` (+ review of `src/houses/`) |
