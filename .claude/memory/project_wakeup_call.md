---
name: WakeUpCall project overview
description: Full-stack hotel links page with Express backend, JSON file DB, and admin panel for support agents
type: project
---

Wake Up Call is a Node.js/Express app serving a hotel group links page for support agents at TGT (Tyme Global Technologies).

**Why:** Replaces a static page at wuc.tymeglobal.com so support agents can update hotel links without code changes.

**How to apply:** When modifying this project, preserve the flat JSON file database pattern (data.json) — no native DB modules were used intentionally for Windows portability.

Stack:
- Backend: Express + bcryptjs + jsonwebtoken (all pure JS)
- Database: data.json (flat JSON file, no SQLite/MongoDB)
- Frontend: Vanilla HTML/CSS/JS

Files:
- server.js — all API routes + static serving, port 3000
- data.json — auto-created on first run with seed data
- public/index.html — public-facing groups/links page
- public/admin.html — admin login + management panel
- public/css/styles.css — all styles (public + admin)
- public/js/admin.js — admin panel JS

Default credentials: admin / WakeUp2024!
JWT expiry: 8 hours

API routes:
- GET /api/groups (public)
- POST /api/auth/login
- GET/POST/PUT/DELETE /api/admin/groups (JWT)
- POST/PUT/DELETE /api/admin/groups/:id/links (JWT)
- GET/POST/PUT/DELETE /api/admin/users (JWT)
