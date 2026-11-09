const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db.cjs');

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('JWT_SECRET must be set when NODE_ENV=production');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const COOKIE_NAME = 'token';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const app = express();
app.use(express.json());
app.use(cookieParser());

const findUserByName = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
const findUserById = db.prepare('SELECT id, username FROM users WHERE id = ?');
const insertUser = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
const insertScore = db.prepare('INSERT INTO scores (user_id, score) VALUES (?, ?)');
const recentScores = db.prepare(
  'SELECT id, score, played_at FROM scores WHERE user_id = ? ORDER BY id DESC LIMIT 10'
);
const scoreStats = db.prepare(
  'SELECT MAX(score) AS best, COUNT(*) AS games FROM scores WHERE user_id = ?'
);

function issueSession(res, user) {
  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
}

function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  try {
    const { sub } = jwt.verify(token, JWT_SECRET);
    const user = findUserById.get(sub);
    if (!user) return res.status(401).json({ error: 'Not signed in' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Not signed in' });
  }
}

function validateCredentials(body) {
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return { error: 'Username must be 3-20 letters, numbers or underscores' };
  }
  if (password.length < 6 || password.length > 100) {
    return { error: 'Password must be at least 6 characters' };
  }
  return { username, password };
}

app.post('/api/signup', (req, res) => {
  const v = validateCredentials(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  if (findUserByName.get(v.username)) {
    return res.status(409).json({ error: 'Username is already taken' });
  }
  const hash = bcrypt.hashSync(v.password, 10);
  const { lastInsertRowid } = insertUser.run(v.username, hash);
  const user = { id: Number(lastInsertRowid), username: v.username };
  issueSession(res, user);
  res.status(201).json({ user });
});

app.post('/api/signin', (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const row = username && findUserByName.get(username);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const user = { id: row.id, username: row.username };
  issueSession(res, user);
  res.json({ user });
});

app.post('/api/signout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: undefined });
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/scores', requireAuth, (req, res) => {
  const score = req.body?.score;
  if (!Number.isInteger(score) || Math.abs(score) > 1000) {
    return res.status(400).json({ error: 'Invalid score' });
  }
  insertScore.run(req.user.id, score);
  res.status(201).json(scoreStats.get(req.user.id));
});

app.get('/api/scores', requireAuth, (req, res) => {
  res.json({ ...scoreStats.get(req.user.id), recent: recentScores.all(req.user.id) });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
