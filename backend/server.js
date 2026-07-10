const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
const app = express();
const SECRET = 'flavordash-secret-key-2024';
const PORT = 3000;
const ORDERS_FILE = path.join(__dirname, 'orders.json');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Hardcoded user for demo
const USERS = [
  { id: 1, username: 'admin', password: 'password123', latitude: -6.33486, longitude: 106.9955 }
];

// Hardcoded restaurants for demo (sekitar Jagakarsa, Jakarta Selatan)
const RESTAURANTS = [
  {
    id: "1",
    name: "Pizza Hut",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
    rating: 4.8,
    distance: "1.2 km",
    category: "Pizza",
    description: "Restoran pizza terbaik dengan berbagai pilihan topping lezat",
    address: "Jl. Tanjung Barat No. 15, Jakarta Selatan",
    openingHours: "10:00 - 22:00",
    promotionalText: "Gratis ongkir min. Rp 50rb",
    latitude: -6.3250,
    longitude: 106.8980
  },
  {
    id: "2",
    name: "Bakmi GM",
    imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
    rating: 4.6,
    distance: "2.5 km",
    category: "Mie",
    description: "Bakmi enak dengan mie telur handmade dan berbagai pilihan topping",
    address: "Jl. Raya Lenteng Agung No. 20, Jakarta Selatan",
    openingHours: "09:00 - 21:00",
    promotionalText: "Beli 2 gratis 1 untuk minuman",
    latitude: -6.3420,
    longitude: 106.9120
  },
  {
    id: "3",
    name: "KFC",
    imageUrl: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400",
    rating: 4.5,
    distance: "0.8 km",
    category: "Ayam",
    description: "Ayam goreng renyah dengan bumbu rahasia KFC",
    address: "Jl. Jagakarsa Raya No. 8, Jakarta Selatan",
    openingHours: "10:00 - 23:00",
    promotionalText: "Paket hemat mulai Rp 30rb",
    latitude: -6.3380,
    longitude: 106.8990
  },
  {
    id: "4",
    name: "Starbucks",
    imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
    rating: 4.7,
    distance: "1.8 km",
    category: "Minuman",
    description: "Kopi premium dan minuman kekinian untuk menemani harimu",
    address: "Jl. TB Simatupang No. 45, Jakarta Selatan",
    openingHours: "07:00 - 22:00",
    promotionalText: "Buy 1 Get 1 setiap hari Rabu",
    latitude: -6.3200,
    longitude: 106.9150
  },
  {
    id: "5",
    name: "Baskin Robbins",
    imageUrl: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400",
    rating: 4.4,
    distance: "3.2 km",
    category: "Dessert",
    description: "Es krim premium dengan 31 rasa favorit",
    address: "Jl. Mampang Prapatan No. 12, Jakarta Selatan",
    openingHours: "10:00 - 22:00",
    promotionalText: "Diskon 20% untuk pembelian 2 scoop",
    latitude: -6.3450,
    longitude: 106.9180
  },
  {
    id: "6",
    name: "McDonald's",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    rating: 4.3,
    distance: "1.5 km",
    category: "Burger",
    description: "Burger cepat saji dengan rasa yang konsisten di seluruh dunia",
    address: "Jl. Raya Pasar Minggu No. 30, Jakarta Selatan",
    openingHours: "24 Jam",
    promotionalText: "McDelivery gratis ongkir",
    latitude: -6.3500,
    longitude: 106.9050
  }
];

let ORDERS = [];
let nextOrderId = 1;

if (fs.existsSync(ORDERS_FILE)) {
  try {
    ORDERS = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    nextOrderId = ORDERS.length > 0 ? Math.max(...ORDERS.map(o => Number(o.id))) + 1 : 1;
    console.log('Loaded', ORDERS.length, 'orders from file');
  } catch (e) {
    console.log('Error loading orders:', e.message);
  }
}

function saveOrders() {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(ORDERS, null, 2));
}

// POST /auth/login
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Username atau password salah' });
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, SECRET, { expiresIn: '7d' });
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

// PUT /user/location
app.put('/user/location', authMiddleware, (req, res) => {
  const { latitude, longitude } = req.body;
  const user = USERS.find(u => u.id === req.user.userId);
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

  user.latitude = latitude;
  user.longitude = longitude;

  res.json({ message: 'Lokasi berhasil diperbarui', latitude, longitude });
});

// GET /restaurants
app.get('/restaurants', (req, res) => {
  const { category, search } = req.query;
  let results = RESTAURANTS;

  if (category && category !== 'Semua') {
    results = results.filter(r => r.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    results = results.filter(r => 
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.json(results);
});

// GET /restaurants/:id
app.get('/restaurants/:id', (req, res) => {
  const restaurant = RESTAURANTS.find(r => r.id === req.params.id);
  if (!restaurant) {
    return res.status(404).json({ message: 'Restoran tidak ditemukan' });
  }
  res.json(restaurant);
});

// POST /orders
app.post('/orders', authMiddleware, (req, res) => {
  const { items, restaurantId, restaurantName, deliveryAddress, paymentMethod, subtotal, shippingCost, serviceFee, total } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ message: 'Items tidak boleh kosong' });
  }

  const userId = Number(req.user.userId);
  const order = {
    id: String(nextOrderId++),
    userId: userId,
    items,
    status: 'pending',
    restaurantId,
    restaurantName,
    deliveryAddress: deliveryAddress || 'Jl. Contoh No. 123, Kota',
    paymentMethod: paymentMethod || 'Transfer Bank',
    subtotal: subtotal || 0,
    shippingCost: shippingCost || 10000,
    serviceFee: serviceFee || 2000,
    total: total || 0,
    createdAt: new Date().toISOString(),
  };

  console.log('New order:', order.id, 'for user:', userId);
  ORDERS.push(order);
  saveOrders();
  console.log('Total orders:', ORDERS.length);
  res.status(201).json(order);
});

// GET /orders/debug - debug endpoint (hapus di production)
app.get('/orders/debug', (req, res) => {
  res.json({ total: ORDERS.length, orders: ORDERS.map(o => ({ id: o.id, userId: o.userId, status: o.status })) });
});

// GET /orders
app.get('/orders', authMiddleware, (req, res) => {
  const userId = Number(req.user.userId);
  console.log('GET /orders for user:', userId, 'total orders:', ORDERS.length);
  const userOrders = ORDERS.filter(o => Number(o.userId) === userId);
  console.log('Found orders:', userOrders.length);
  res.json(userOrders);
});

// GET /orders/:id
app.get('/orders/:id', authMiddleware, (req, res) => {
  const userId = Number(req.user.userId);
  const order = ORDERS.find(o => o.id === req.params.id && Number(o.userId) === userId);
  if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
  res.json(order);
});

// PATCH /orders/:id/status
app.patch('/orders/:id/status', authMiddleware, (req, res) => {
  const userId = Number(req.user.userId);
  const order = ORDERS.find(o => o.id === req.params.id && Number(o.userId) === userId);
  if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid' });
  }

  order.status = status;
  saveOrders();
  res.json(order);
});

// POST /orders/:id/photo
app.post('/orders/:id/photo', authMiddleware, upload.single('photo'), (req, res) => {
  const userId = Number(req.user.userId);
  const order = ORDERS.find(o => o.id === req.params.id && Number(o.userId) === userId);
  if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const photoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  
  order.photoUrl = photoUrl;
  saveOrders();
  
  res.json({ message: 'Foto berhasil diunggah', photoUrl });
});

app.listen(PORT, () => console.log(`FlavorDash backend running on http://localhost:${PORT}`));
