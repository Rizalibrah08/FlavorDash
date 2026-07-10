# Design Spec: Camera, Maps, & Profile Features

## Overview

Menambahkan 3 fitur utama ke FlavorDash app:
1. Fitur Kamera — ambil foto bukti penerimaan pesanan
2. Fitur Maps — tampilkan lokasi restoran & user di order detail
3. Profile Screen — edit lokasi user via peta

## Changes Summary

### 1. Footer Navigation Update

Ubah dari 2 tab menjadi 3 tab:

| Tab | Route | Icon | Screen |
|-----|-------|------|--------|
| Katalog | `(tabs)/index` | house | Restaurant listing (existing) |
| Pesanan | `(tabs)/orders` | paperplane | Order list (existing) |
| Profile | `(tabs)/profile` | person | User profile + location edit |

**File:** `app/(tabs)/_layout.tsx`

### 2. Profile Screen

**File:** `app/(tabs)/profile.tsx` (baru)

Komponen:
- Header dengan username
- Section Lokasi:
  - Peta (`react-native-maps`) dengan draggable marker
  - Marker menunjukkan lokasi user saat ini
  - User drag marker untuk update lokasi
- Tombol "Simpan Lokasi" → call `PUT /user/location`

### 3. Order Detail — Maps & Kamera

**File:** `app/order-detail.tsx` (modifikasi)

#### Maps Section
- Tampilkan peta dengan 2 marker:
  - Marker merah (🔴) = Lokasi Restoran (latitude, longitude dari backend)
  - Marker biru (🔵) = Lokasi User (latitude, longitude dari user)
- Peta `fitToCoordinates` untuk auto-zoom menampilkan kedua titik
- `initialRegion` berpusat di antara kedua titik

#### Kamera Section
- Tombol "Ambil Foto Bukti" di bawah order detail
- Menggunakan `expo-image-picker` (launchCameraAsync)
- Setelah foto diambil:
  - Tampilkan preview foto di bawah tombol
  - Foto tersimpan di state (tidak di-upload untuk demo)

### 4. Backend Changes

**File:** `backend/server.js`

#### User Model Update
```javascript
const USERS = [
  { id: 1, username: 'admin', password: 'password123', latitude: -6.2088, longitude: 106.8456 }
];
```

#### Restaurant Model Update
Tambahkan field `latitude` dan `longitude` ke setiap restoran:
```javascript
{ id: '1', name: 'Pizza Hut', ..., latitude: -6.1234, longitude: 106.7890 }
```

#### Endpoint Baru
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/user/profile` | Yes | Ambil data user + lokasi |
| PUT | `/user/location` | Yes | Update lokasi user (latitude, longitude) |

Request body `PUT /user/location`:
```json
{ "latitude": -6.2088, "longitude": 106.8456 }
```

### 5. Dependencies Baru

**File:** `package.json`

| Package | Versi | Untuk |
|---------|-------|-------|
| `expo-image-picker` | latest | Ambil foto dari kamera |
| `react-native-maps` | latest | Tampilkan peta + marker |

### 6. Config Updates

**File:** `app.json`

Tambahkan plugins:
```json
{
  "expo": {
    "plugins": [
      ["expo-image-picker", {
        "cameraPermission": "Izinkan FlavorDash mengakses kamera untuk mengambil foto bukti penerimaan."
      }]
    ]
  }
}
```

## Data Flow

### Ambil Foto (Order Detail)
```
User tap "Ambil Foto" → expo-image-picker (launchCameraAsync)
→ Foto diambil → setState(photoUri) → Preview ditampilkan
```

### Edit Lokasi (Profile)
```
User buka Profile → Load lokasi dari GET /user/profile
→ Marker ditampilkan di peta → User drag marker
→ User tap "Simpan" → PUT /user/location → Success toast
```

### Lihat Lokasi (Order Detail)
```
User buka Order Detail → Load order + restaurant data
→ Ambil lokasi user dari GET /user/profile
→ Tampilkan peta dengan 2 marker (restoran + user)
```

## File Changes Summary

| File | Status | Deskripsi |
|------|--------|-----------|
| `app/(tabs)/_layout.tsx` | Modify | Tambah Profile tab |
| `app/(tabs)/profile.tsx` | Create | Profile screen + location edit |
| `app/order-detail.tsx` | Modify | Tambah maps section + kamera |
| `backend/server.js` | Modify | Update user/restaurant model + endpoint baru |
| `package.json` | Modify | Tambah dependencies |
| `app.json` | Modify | Tambah plugins (camera permission) |
