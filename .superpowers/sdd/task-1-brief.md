### Task 1: Backend — Add Coordinates to Users & Restaurants

**Files:**
- Modify: `backend/server.js:13-89`

**Interfaces:**
- Consumes: None
- Produces: `GET /user/profile`, `PUT /user/location`, restaurants with coordinates

- [ ] **Step 1: Update USERS array with coordinates**

```javascript
const USERS = [
  { id: 1, username: 'admin', password: 'password123', latitude: -6.2088, longitude: 106.8456 }
];
```

- [ ] **Step 2: Add latitude/longitude to each RESTAURANTS entry**

Add to each restaurant object:
```javascript
// Example for Pizza Hut (id: "1")
{
  id: "1",
  name: "Pizza Hut",
  // ... existing fields ...
  latitude: -6.1234,
  longitude: 106.7890
}
```

Use these coordinates for all 6 restaurants:
| Restaurant | Latitude | Longitude |
|------------|----------|-----------|
| Pizza Hut | -6.1234 | 106.7890 |
| Bakmi GM | -6.1751 | 106.8272 |
| KFC | -6.2088 | 106.8456 |
| Starbucks | -6.2297 | 106.7995 |
| Baskin Robbins | -6.2385 | 106.8025 |
| McDonald's | -6.2250 | 106.8150 |

- [ ] **Step 3: Add auth middleware helper**

Add after `app.use(express.json())`:
```javascript
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token tidak ditemukan' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token tidak valid' });
  }
}
```

- [ ] **Step 4: Add GET /user/profile endpoint**

```javascript
// GET /user/profile
app.get('/user/profile', authMiddleware, (req, res) => {
  const user = USERS.find(u => u.id === req.user.userId);
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

  res.json({
    id: user.id,
    username: user.username,
    latitude: user.latitude,
    longitude: user.longitude
  });
});
```

- [ ] **Step 5: Add PUT /user/location endpoint**

```javascript
// PUT /user/location
app.put('/user/location', authMiddleware, (req, res) => {
  const { latitude, longitude } = req.body;
  const user = USERS.find(u => u.id === req.user.userId);
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

  user.latitude = latitude;
  user.longitude = longitude;

  res.json({ message: 'Lokasi berhasil diperbarui', latitude, longitude });
});
```

- [ ] **Step 6: Verify backend runs**

Run: `node backend/server.js`
Expected: `FlavorDash backend running on http://localhost:3000`

- [ ] **Step 7: Commit**

```bash
git add backend/server.js
git commit -m "feat: add user/restaurant coordinates and profile endpoints"
```
