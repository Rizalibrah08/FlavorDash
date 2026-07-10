# FlavorDash 🍽️

## Summary

FlavorDash adalah aplikasi mobile pemesanan makanan yang dikembangkan menggunakan **React Native + Expo Router**. Pengguna dapat menjelajahi katalog restoran, melihat menu, melakukan checkout, dan memantau status pesanan secara real-time. Aplikasi ini mengimplementasikan autentikasi berbasis **JWT (Stateless)**, proteksi rute (Middleware), layout responsif **Flexbox**, serta fitur tambahan seperti upload foto bukti penerimaan dan akses lokasi pengguna.

---

## Bahasa Pemrograman

| Layer | Bahasa |
|-------|--------|
| Mobile (Frontend) | **TypeScript** (React Native + Expo) |
| Backend (Server) | **JavaScript** (Node.js + Express) |

---

## Stack Teknologi

### 📱 Mobile — React Native (Expo)

| Komponen | Teknologi |
|----------|-----------|
| Framework | React Native 0.86 |
| Bahasa | TypeScript |
| Routing | Expo Router v57 (file-based) |
| HTTP Client | Axios |
| Token Storage | expo-secure-store |
| Lokasi | expo-location |
| Kamera / Foto | expo-image-picker |
| Animasi | react-native-reanimated |

### 🖥️ Backend — Node.js + Express

| Komponen | Teknologi |
|----------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Autentikasi | JSON Web Token (JWT) — `jsonwebtoken` |
| Upload File | Multer (multipart/form-data) |
| CORS | cors |

### 🗄️ Database / API

| Sumber Data | Keterangan |
|-------------|------------|
| **Backend lokal (Express)** | Menyimpan data **orders** ke file `orders.json` (JSON file-based persistence). Data **restaurants** di-hardcode di `server.js`. |
| **MockAPI.io** *(opsional)* | Sebelumnya digunakan sebagai API eksternal untuk data `foods` dan `orders`. Saat ini digantikan oleh backend Express lokal. |

> **Catatan:** Proyek ini **tidak menggunakan AI Recommendation API (OpenAI atau sejenisnya)**. Rekomendasi / filter restoran dilakukan secara lokal melalui query parameter ke endpoint `/restaurants?category=...&search=...` di backend Express.

---

## Flow Aplikasi (Garis Besar)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLOW UTAMA                               │
└─────────────────────────────────────────────────────────────────┘

1. BUKA APLIKASI
   └─► Middleware (_layout.tsx) cek token di SecureStore
         ├─ Token TIDAK ADA / tidak valid → redirect ke /login
         └─ Token VALID → lanjut ke /(tabs) (halaman utama)

2. LOGIN
   └─► User input username & password → submit
         └─► POST /auth/login ke backend Express (port 3000)
               ├─ Kredensial salah → tampil pesan error
               └─ Kredensial benar → backend generate JWT (7 hari)
                     └─► Token disimpan di SecureStore
                           └─► Redirect ke /(tabs)/index (Katalog)

3. KATALOG RESTORAN (Home)
   └─► GET /restaurants (dengan filter opsional: category, search)
         └─► Data restoran ditampilkan dengan FlatList + Flexbox layout
               └─► User pilih restoran → navigasi ke halaman detail restoran
                     └─► GET /restaurants/:id

4. CHECKOUT
   └─► User tambah item ke keranjang → tap Checkout
         └─► POST /orders (dengan Authorization: Bearer <token>)
               └─► Backend simpan order ke orders.json
                     └─► Redirect ke halaman Pesanan (Orders)

5. RIWAYAT PESANAN
   └─► GET /orders (dengan Authorization: Bearer <token>)
         └─► Tampilkan daftar pesanan milik user yang sedang login
               └─► User tap pesanan → GET /orders/:id
                     └─► Halaman Detail Pesanan
                           └─► (Opsional) Upload foto → POST /orders/:id/photo

6. PROFIL & LOGOUT
   └─► GET /user/profile → tampilkan data user + lokasi
         └─► User tap "Keluar" → token dihapus dari SecureStore
               └─► Middleware detect token null → redirect ke /login
```

---

## Struktur Folder

```
FlavorDash/
├── app/
│   ├── _layout.tsx           # Root layout + Auth Middleware
│   ├── login.tsx             # Halaman Login
│   ├── checkout.tsx          # Halaman Checkout
│   ├── order-detail.tsx      # Halaman Detail Pesanan (Protected)
│   └── (tabs)/
│       ├── _layout.tsx       # Tab Navigator
│       ├── index.tsx         # Katalog Restoran (Flexbox responsif)
│       ├── orders.tsx        # Daftar Pesanan (Protected)
│       └── profile.tsx       # Halaman Profil
├── context/
│   └── auth-context.tsx      # Auth Provider + useAuth hook
├── constants/
│   └── config.ts             # Konfigurasi API_URL
├── backend/
│   ├── server.js             # Express + JWT + Orders API
│   ├── orders.json           # Persistent storage pesanan
│   └── package.json          # Dependencies backend
└── README.md
```

---

## Instalasi & Menjalankan

### Prasyarat
- Node.js (v18+)
- npm
- Expo Go app di HP Android (dari Play Store)
- HP dan komputer terhubung ke **WiFi yang sama**

### Langkah 1: Clone & Install Dependencies

```bash
git clone https://github.com/Rizalibrah08/FlavorDash.git
cd FlavorDash

# Install dependencies mobile app
npm install

# Install dependencies backend
cd backend
npm install
cd ..
```

### Langkah 2: Konfigurasi IP Address

1. Cari IP komputer Anda:
   ```bash
   ipconfig
   ```
   Catat IPv4 Address (contoh: `192.168.1.6`)

2. Update `constants/config.ts`:
   ```typescript
   export const API_URL = 'http://<IP_ANDA>:3000';
   ```

### Langkah 3: Jalankan Backend

```bash
cd backend
node server.js
```
Output: `FlavorDash backend running on http://localhost:3000`

### Langkah 4: Jalankan Aplikasi Mobile

```bash
# Di terminal baru (dari root folder FlavorDash)
npx expo start
```

Scan QR code dengan Expo Go di HP Android.

### Langkah 5: Login

```
Username: admin
Password: password123
```

---

## Analisis Keamanan: Stateful vs Stateless

| Aspek | Stateful (Session) | Stateless (JWT) |
|-------|-------------------|-----------------| 
| Penyimpanan | Server (RAM/DB) | Client (device) |
| Skalabilitas | Terbatas | Tinggi |
| Beban Server | Berat (jutaan session) | Ringan (0 byte per user) |
| Horizontal Scaling | Butuh shared session store | Langsung bisa |
| Mobile Friendly | Kurang (cookie-based) | Sangat cocok (header-based) |

---

## Kredensial Demo

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `password123` |
| JWT Expiry | 7 hari |
| Backend Port | 3000 |
