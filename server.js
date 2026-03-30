'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'wuc-dev-secret-change-in-production';
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve logo files from the project root (not exposed via static to avoid leaking server files)
app.get('/TGT.png',        (req, res) => res.sendFile(path.join(__dirname, 'TGT.png')));
app.get('/WakeUp.png',     (req, res) => res.sendFile(path.join(__dirname, 'WakeUp.png')));
app.get('/WakeUpCall.png', (req, res) => res.sendFile(path.join(__dirname, 'WakeUpCall.png')));

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeData(data) {
  const tmp = DATA_FILE + '.tmp';
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(tmp, content, 'utf-8');
  try {
    fs.renameSync(tmp, DATA_FILE);
  } catch {
    // Windows may fail rename if destination exists; fall back to direct write
    fs.writeFileSync(DATA_FILE, content, 'utf-8');
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function sanitizeUrl(url) {
  if (!url) return '#';
  const t = url.trim();
  return (t.startsWith('http://') || t.startsWith('https://') || t === '#') ? t : '#';
}

// ---------------------------------------------------------------------------
// Seed data.json on first run
// ---------------------------------------------------------------------------

function buildSeedData() {
  const adminHash = bcrypt.hashSync('WakeUp2024!', 10);

  const groups = [
    {
      id: 'group-a', label: 'GROUP A', color: '#2a7d8e', order: 1,
      links: [
        { id: 'ga1', label: 'Candlewood Suites TS', url: '#' },
        { id: 'ga2', label: 'Hampton Inn', url: '#' },
        { id: 'ga3', label: 'Hotel Arlo NoMad \u2013 New York', url: '#' },
        { id: 'ga4', label: 'Hotel Arlo Hudson Square \u2013 New York', url: '#' },
        { id: 'ga5', label: 'Viceroy Chicago', url: '#' },
        { id: 'ga6', label: 'Holiday Inn', url: '#' }
      ]
    },
    {
      id: 'group-b', label: 'GROUP B', color: '#2a7d8e', order: 2,
      links: [
        { id: 'gb1', label: 'Blue Flamingo Resort Key West', url: '#' },
        { id: 'gb2', label: 'Hilton Garden Inn Key West', url: '#' },
        { id: 'gb3', label: 'Hotel Caza SF', url: '#' },
        { id: 'gb4', label: 'Fairfield Inn Key West', url: '#' },
        { id: 'gb5', label: 'Royal Sonesta Minneapolis Downtown', url: '#' }
      ]
    },
    {
      id: 'group-c', label: 'GROUP C', color: '#2a7d8e', order: 3,
      links: [
        { id: 'gc1', label: 'Graduate Roosevelt Island', url: '#' },
        { id: 'gc2', label: 'Royalton Park Ave \u2013 NY', url: '#' },
        { id: 'gc3', label: 'WestHouse hotel New York', url: '#' }
      ]
    },
    {
      id: 'group-d', label: 'GROUP D', color: '#2a7d8e', order: 4,
      links: [
        { id: 'gd1', label: 'Edison', url: '#' },
        { id: 'gd2', label: 'The Wall Street Hotel', url: '#' },
        { id: 'gd3', label: 'Belleclaire', url: '#' },
        { id: 'gd4', label: 'Gabriel South Beach Hotel', url: '#' }
      ]
    },
    {
      id: 'group-e', label: 'GROUP E', color: '#2a7d8e', order: 5,
      links: [
        { id: 'ge1', label: 'Goodtimes Hotel', url: '#' },
        { id: 'ge2', label: 'Hollywood Volume', url: '#' },
        { id: 'ge3', label: 'The Gates Hotel South Beach', url: '#' },
        { id: 'ge4', label: 'Hollywood Grande', url: '#' },
        { id: 'ge5', label: 'Hyatt Regency TS', url: '#' }
      ]
    },
    {
      id: 'group-f', label: 'GROUP F', color: '#2a7d8e', order: 6,
      links: [
        { id: 'gf1', label: 'Hotel Yotel \u2013 NY', url: '#' },
        { id: 'gf2', label: 'Yotel San Francisco', url: '#' },
        { id: 'gf3', label: 'Yotel \u2013 Washington DC', url: '#' },
        { id: 'gf4', label: 'Graduate Princeton', url: '#' },
        { id: 'gf5', label: 'Hotel Effie Sandestin', url: '#' }
      ]
    },
    {
      id: 'group-g', label: 'GROUP G', color: '#2a7d8e', order: 7,
      links: [
        { id: 'gg1', label: 'Moxy East Village', url: '#' },
        { id: 'gg2', label: 'Moxy Chelsea', url: '#' },
        { id: 'gg3', label: 'Moxy Times Square', url: '#' },
        { id: 'gg4', label: 'Paramount Hotel', url: '#' }
      ]
    },
    {
      id: 'group-h', label: 'GROUP H', color: '#2a7d8e', order: 8,
      links: [
        { id: 'gh1', label: 'Arlo Midtown', url: '#' },
        { id: 'gh2', label: 'Hotel Elser', url: '#' },
        { id: 'gh3', label: 'Arlo Chicago', url: '#' },
        { id: 'gh4', label: 'Arlo Williamsburg', url: '#' },
        { id: 'gh5', label: 'Wyndham hotel', url: '#' },
        { id: 'gh6', label: 'Arlo DC', url: '#' }
      ]
    },
    {
      id: 'group-p', label: 'GROUP P', color: '#2a7d8e', order: 9,
      links: []
    },
    {
      id: 'group-parklane', label: 'Park Lane', color: '#2a7d8e', order: 10,
      links: [
        { id: 'gpl1', label: 'Hotel Park Lane', url: '#' }
      ]
    },
    {
      id: 'group-bpp', label: 'Boston Park Plaza', color: '#2a7d8e', order: 11,
      links: [
        { id: 'gbp1', label: 'Boston Park Plaza', url: '#' }
      ]
    },
    {
      id: 'group-5th', label: 'The Fifth Avenue', color: '#2a7d8e', order: 12,
      links: [
        { id: 'g5a1', label: 'The Fifth Avenue', url: '#' }
      ]
    }
  ];

  return {
    groups,
    users: [
      { id: 'user-admin', username: 'admin', passwordHash: adminHash, role: 'admin' }
    ]
  };
}

function isValidData(d) {
  return d && Array.isArray(d.groups) && Array.isArray(d.users);
}

let _existing = null;
if (fs.existsSync(DATA_FILE)) {
  try { _existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); } catch { /* invalid JSON */ }
}
if (!isValidData(_existing)) {
  console.log('Initializing data.json with seed data...');
  writeData(buildSeedData());
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

app.get('/api/groups', (req, res) => {
  const data = readData();
  const groups = data.groups
    .sort((a, b) => a.order - b.order)
    .map(g => ({
      id: g.id,
      label: g.label,
      color: g.color,
      order: g.order,
      links: (g.links || []).map(l => ({
        id: l.id,
        label: l.label,
        url: sanitizeUrl(l.url)
      }))
    }));
  res.json(groups);
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const data = readData();
  const user = data.users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token, username: user.username, role: user.role });
});

// ---------------------------------------------------------------------------
// Admin - Groups
// ---------------------------------------------------------------------------

app.get('/api/admin/groups', authMiddleware, (req, res) => {
  const data = readData();
  res.json(data.groups.sort((a, b) => a.order - b.order));
});

app.post('/api/admin/groups', authMiddleware, (req, res) => {
  const { label, color, order } = req.body || {};
  if (!label || !label.trim()) {
    return res.status(400).json({ error: 'Label is required' });
  }
  const data = readData();
  const maxOrder = data.groups.reduce((m, g) => Math.max(m, g.order || 0), 0);
  const group = {
    id: generateId(),
    label: label.trim(),
    color: color || '#2a7d8e',
    order: parseInt(order) || maxOrder + 1,
    links: []
  };
  data.groups.push(group);
  writeData(data);
  res.status(201).json(group);
});

app.put('/api/admin/groups/:id', authMiddleware, (req, res) => {
  const data = readData();
  const group = data.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  const { label, color, order } = req.body || {};
  if (label !== undefined) group.label = label.trim();
  if (color !== undefined) group.color = color;
  if (order !== undefined) group.order = parseInt(order);
  writeData(data);
  res.json(group);
});

app.delete('/api/admin/groups/:id', authMiddleware, (req, res) => {
  const data = readData();
  const idx = data.groups.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });
  data.groups.splice(idx, 1);
  writeData(data);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Admin - Links
// ---------------------------------------------------------------------------

app.post('/api/admin/groups/:groupId/links', authMiddleware, (req, res) => {
  const { label, url } = req.body || {};
  if (!label || !label.trim()) {
    return res.status(400).json({ error: 'Label is required' });
  }
  const data = readData();
  const group = data.groups.find(g => g.id === req.params.groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  const link = { id: generateId(), label: label.trim(), url: url || '#' };
  group.links.push(link);
  writeData(data);
  res.status(201).json(link);
});

app.put('/api/admin/groups/:groupId/links/:linkId', authMiddleware, (req, res) => {
  const data = readData();
  const group = data.groups.find(g => g.id === req.params.groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  const link = group.links.find(l => l.id === req.params.linkId);
  if (!link) return res.status(404).json({ error: 'Link not found' });
  const { label, url } = req.body || {};
  if (label !== undefined) link.label = label.trim();
  if (url !== undefined) link.url = url;
  writeData(data);
  res.json(link);
});

app.delete('/api/admin/groups/:groupId/links/:linkId', authMiddleware, (req, res) => {
  const data = readData();
  const group = data.groups.find(g => g.id === req.params.groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  const idx = group.links.findIndex(l => l.id === req.params.linkId);
  if (idx === -1) return res.status(404).json({ error: 'Link not found' });
  group.links.splice(idx, 1);
  writeData(data);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Admin - Users
// ---------------------------------------------------------------------------

app.get('/api/admin/users', authMiddleware, (req, res) => {
  const data = readData();
  res.json(data.users.map(u => ({ id: u.id, username: u.username, email: u.email || '', role: u.role })));
});

app.post('/api/admin/users', authMiddleware, (req, res) => {
  const { username, password, role, email } = req.body || {};
  if (!username || !username.trim() || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const data = readData();
  if (data.users.find(u => u.username === username.trim())) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  const user = {
    id: generateId(),
    username: username.trim(),
    email: email ? email.trim().toLowerCase() : '',
    passwordHash: bcrypt.hashSync(password, 10),
    role: role === 'admin' ? 'admin' : 'agent'
  };
  data.users.push(user);
  writeData(data);
  res.status(201).json({ id: user.id, username: user.username, email: user.email, role: user.role });
});

app.put('/api/admin/users/:id', authMiddleware, (req, res) => {
  const data = readData();
  const user = data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { username, password, role, email } = req.body || {};
  if (username && username.trim()) {
    const dup = data.users.find(u => u.username === username.trim() && u.id !== req.params.id);
    if (dup) return res.status(409).json({ error: 'Username already taken' });
    user.username = username.trim();
  }
  if (email !== undefined) user.email = email.trim().toLowerCase();
  if (password) user.passwordHash = bcrypt.hashSync(password, 10);
  if (role) user.role = role === 'admin' ? 'admin' : 'agent';
  writeData(data);
  res.json({ id: user.id, username: user.username, email: user.email || '', role: user.role });
});

app.delete('/api/admin/users/:id', authMiddleware, (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  const data = readData();
  const idx = data.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  data.users.splice(idx, 1);
  writeData(data);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`\nWake Up Call server running at http://localhost:${PORT}`);
  console.log(`Admin panel:  http://localhost:${PORT}/admin.html`);
  console.log(`Default login: admin / WakeUp2024!\n`);
});
