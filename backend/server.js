const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const SECRET = 'flavordash-secret-key-2024';
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Hardcoded user for demo
const USERS = [{ id: 1, username: 'admin', password: 'password123' }];

// POST /auth/login
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Username atau password salah' });
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, SECRET, { expiresIn: '1h' });
  res.json({ token, username: user.username });
});

// GET /auth/verify
app.get('/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token tidak ditemukan' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ valid: false, message: 'Token tidak valid' });
  }
});

app.listen(PORT, () => console.log(`FlavorDash backend running on http://localhost:${PORT}`));
