# FlavorDash 🍽️

Aplikasi katalog makanan mobile yang dikembangkan menggunakan React Native + Expo Router. Aplikasi ini mengimplementasikan **layout responsif Flexbox**, **autentikasi Stateless (JWT)**, dan **proteksi rute (Middleware)** untuk halaman Detail Pesanan.

## Fitur Utama

### 1. Katalog Makanan (Layout Responsif)
- Menampilkan daftar makanan dari MockAPI.io
- Layout menggunakan **Flexbox** (`flexDirection: 'row'`) dengan unit proporsional (`flex: 1`, `flex: 2`)
- Gambar dan deskripsi ditampilkan sejajar tanpa terpotong di berbagai ukuran layar
- Komponen: `<View>`, `<Text>`, `<Image>`, `<FlatList>`

### 2. Autentikasi Stateless (JWT)
- Sistem login menggunakan **JSON Web Token** tanpa penyimpanan sesi di server
- Backend Express.js memvalidasi kredensial dan mengembalikan JWT
- Token terdiri dari: **Header** (algoritma), **Payload** (data user + expiry), **Signature** (validasi integritas)
- Token disimpan di **SecureStore** pada device

### 3. Proteksi Halaman (Middleware)
- Halaman "Detail Pesanan" hanya bisa diakses oleh pengguna yang sudah login
- Middleware pada `app/_layout.tsx` menggunakan `useSegments()` dan `useRouter()` dari Expo Router
- Jika token tidak valid/kosong → redirect otomatis ke halaman Login

---

## Workflow Sistem

### Alur 1: Rendering Katalog Makanan
```
User membuka app → Middleware cek token → Token valid → Tampilkan Katalog
  → App fetch GET ke MockAPI.io/foods
  → Data diterima (array JSON)
  → FlatList merender setiap item dengan Flexbox (row layout)
  → Gambar (flex:1) | Deskripsi + Harga (flex:2)
  → Tampilan proporsional di semua ukuran layar
```

### Alur 2: Autentikasi & Proteksi Rute
```
User buka app → Middleware cek token di SecureStore
  → Token TIDAK ADA → Redirect ke /login
  → User input username & password → Submit
  → App kirim POST /auth/login ke backend Express
  → Backend validasi kredensial
  → Backend generate JWT (Header.Payload.Signature, expiry 1 jam)
  → App terima token → Simpan di SecureStore
  → Middleware detect token → Redirect ke /(tabs)

User navigasi ke "Detail Pesanan"
  → Middleware cek token → Token VALID → Izinkan akses
  → App fetch data pesanan dari MockAPI.io dengan header Authorization
  → Tampilkan halaman Detail Pesanan
```

### Alur 3: Logout
```
User tap "Keluar" → Token dihapus dari SecureStore
  → State token = null → Middleware detect
  → Redirect ke /login
```

---

## Struktur Folder

```
FlavorDash/
├── app/
│   ├── _layout.tsx           # Root layout + Auth Middleware
│   ├── login.tsx             # Halaman Login
│   ├── order-detail.tsx      # Halaman Detail Pesanan Individual
│   └── (tabs)/
│       ├── _layout.tsx       # Tab Navigator
│       ├── index.tsx         # Katalog Makanan (Flexbox responsif)
│       └── orders.tsx        # Daftar Pesanan (Protected)
├── context/
│   └── auth-context.tsx      # Auth Provider + useAuth hook
├── backend/
│   ├── server.js             # Express + JWT Authentication
│   └── package.json          # Dependencies backend
└── README.md
```

---

## Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Framework | React Native |
| Routing | Expo Router (file-based) |
| Backend | Node.js + Express |
| Autentikasi | JSON Web Token (JWT) |
| Token Storage | expo-secure-store |
| HTTP Client | Axios |
| Data API | MockAPI.io |
| Repository | Git |

---

## Instalasi & Menjalankan

### Prasyarat
- Node.js (v18+)
- npm
- Expo Go app di HP Android (dari Play Store)
- HP dan komputer terhubung ke **WiFi yang sama**

### Langkah 1: Clone & Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd FlavorDash

# Install dependencies mobile app
npm install

# Install dependencies backend
cd backend
npm install
cd ..
```

### Langkah 2: Setup MockAPI.io

1. Buka [mockapi.io](https://mockapi.io) dan buat project baru
2. Buat resource **`foods`** dengan fields:
   - `name` (String)
   - `description` (String)
   - `imageUrl` (String / Image URL)
   - `price` (Number)
3. Buat resource **`orders`** dengan fields:
   - `itemName` (String)
   - `quantity` (Number)
   - `status` (String: "pending" / "delivered" / "cancelled")
   - `total` (Number)
4. Generate sample data (5-10 item per resource)
5. Update URL di `app/(tabs)/index.tsx` dan `app/(tabs)/orders.tsx` dengan URL project MockAPI.io Anda

### Langkah 3: Konfigurasi IP Address

1. Cari IP komputer Anda:
   ```bash
   ipconfig
   ```
   Catat IPv4 Address (contoh: `192.168.1.6`)

2. Update `context/auth-context.tsx`:
   ```typescript
   const API_URL = 'http://<IP_ANDA>:3000';
   ```

### Langkah 4: Jalankan Backend

```bash
cd backend
node server.js
```
Output: `FlavorDash backend running on http://localhost:3000`

### Langkah 5: Jalankan Aplikasi Mobile

```bash
# Di terminal baru (dari root folder FlavorDash)
npx expo start
```

Scan QR code dengan Expo Go di HP Android.

### Langkah 6: Login

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

**Mengapa Stateless lebih efisien untuk jutaan pengguna:**
1. Server tidak menyimpan data session → hemat memori
2. Setiap server bisa verify token secara independen → mudah di-scale
3. Tidak ada dependency ke external session store → performa lebih cepat
4. Token dikirim via Authorization header → natural untuk REST API mobile

---

## Kredensial Demo

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `password123` |
| JWT Expiry | 1 jam |
| Backend Port | 3000 |
