# Camera, Maps, & Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add camera feature for order proof, maps for location display, and profile screen with location editing.

**Architecture:** Expo Router tabs with 3 screens, react-native-maps for location display/editing, expo-image-picker for camera. Backend stores user/restaurant coordinates.

**Tech Stack:** Expo SDK 57, React Native 0.86, expo-image-picker, react-native-maps, Express.js backend

## Global Constraints

- Expo SDK 57, React 19.2, React Native 0.86
- Backend IP: `http://192.168.1.7:3000`
- JWT auth via `expo-secure-store`
- File-based routing via Expo Router

---

## File Structure

| File | Status | Purpose |
|------|--------|---------|
| `backend/server.js` | Modify | Add user/restaurant coordinates, new endpoints |
| `package.json` | Modify | Add expo-image-picker, react-native-maps |
| `app.json` | Modify | Add camera permission plugin |
| `app/(tabs)/_layout.tsx` | Modify | Add Profile tab |
| `app/(tabs)/profile.tsx` | Create | Profile screen with map |
| `app/order-detail.tsx` | Modify | Add maps + camera sections |

---

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

---

### Task 2: Install Frontend Dependencies

**Files:**
- Modify: `package.json`
- Modify: `app.json`

**Interfaces:**
- Consumes: None
- Produces: Installed packages ready for use

- [ ] **Step 1: Install expo-image-picker**

Run: `npx expo install expo-image-picker`

- [ ] **Step 2: Install react-native-maps**

Run: `npx expo install react-native-maps`

- [ ] **Step 3: Add camera permission to app.json**

Read `app.json`, then add plugins array inside `"expo"`:
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

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json app.json
git commit -m "feat: add expo-image-picker and react-native-maps"
```

---

### Task 3: Update Tab Layout — Add Profile Tab

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: None
- Produces: 3-tab navigation (Katalog, Pesanan, Profile)

- [ ] **Step 1: Add Profile tab to Tabs component**

Add after the `orders` Tabs.Screen:
```tsx
<Tabs.Screen
  name="profile"
  options={{
    title: 'Profile',
    tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
  }}
/>
```

Full file should now have 3 `<Tabs.Screen>` elements.

- [ ] **Step 2: Verify tab appears**

Run: `npx expo start`
Expected: 3 tabs visible — Restoran, Pesanan, Profile. Profile tab shows blank screen (file not yet created).

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/_layout.tsx
git commit -m "feat: add Profile tab to bottom navigation"
```

---

### Task 4: Create Profile Screen

**Files:**
- Create: `app/(tabs)/profile.tsx`

**Interfaces:**
- Consumes: `GET /user/profile`, `PUT /user/location` from Task 1
- Produces: Profile screen with map and location editing

- [ ] **Step 1: Create profile.tsx with basic layout**

```tsx
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';

const API_URL = 'http://192.168.1.7:3000';

type UserProfile = {
  id: number;
  username: string;
  latitude: number;
  longitude: number;
};

export default function ProfileScreen() {
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [markerPosition, setMarkerPosition] = useState({ latitude: -6.2088, longitude: 106.8456 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      if (res.data.latitude && res.data.longitude) {
        setMarkerPosition({ latitude: res.data.latitude, longitude: res.data.longitude });
      }
    } catch (err) {
      console.error('Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    setIsSaving(true);
    try {
      await axios.put(`${API_URL}/user/location`, markerPosition, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Berhasil', 'Lokasi berhasil diperbarui');
    } catch (err) {
      Alert.alert('Gagal', 'Gagal memperbarui lokasi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.username?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>{profile?.username}</Text>
      </View>

      {/* Map Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lokasi Anda</Text>
        <Text style={styles.sectionSubtitle}>Drag marker untuk mengatur lokasi</Text>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: markerPosition.latitude,
              longitude: markerPosition.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={markerPosition}
              draggable
              onDragEnd={(e) => setMarkerPosition(e.nativeEvent.coordinate)}
              pinColor="#2563eb"
            />
          </MapView>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveLocation}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Menyimpan...' : 'Simpan Lokasi'}</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: '13%',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  userInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginTop: 1,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  username: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 12 },
  section: {
    marginTop: 16, marginHorizontal: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#94a3b8', marginBottom: 12 },
  mapContainer: {
    borderRadius: 16, overflow: 'hidden',
    elevation: 2, shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8,
  },
  map: { height: 250, width: '100%' },
  saveButton: {
    marginTop: 12, backgroundColor: '#2563eb',
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#94a3b8' },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  logoutButton: {
    marginHorizontal: 20, marginTop: 24, backgroundColor: '#fff',
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#fecaca',
  },
  logoutButtonText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
});
```

- [ ] **Step 2: Verify Profile screen loads**

Run: `npx expo start`
Expected: Profile tab shows user avatar, map with blue marker, and save button.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat: add Profile screen with map location editing"
```

---

### Task 5: Update Order Detail — Add Maps Section

**Files:**
- Modify: `app/order-detail.tsx`

**Interfaces:**
- Consumes: Restaurant coordinates (from `useLocalSearchParams`), user coordinates (from `GET /user/profile`)
- Produces: Map with 2 markers on Order Detail

- [ ] **Step 1: Add imports and state to Order Detail**

Add at top of `order-detail.tsx`:
```tsx
import { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
```

Add after `useLocalSearchParams`:
```tsx
const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
const [restaurantLocation, setRestaurantLocation] = useState<{latitude: number; longitude: number} | null>(null);
```

- [ ] **Step 2: Add useEffect to fetch locations**

```tsx
useEffect(() => {
  const fetchLocations = async () => {
    // Fetch restaurant coordinates from backend
    try {
      const restaurantRes = await axios.get(`http://192.168.1.7:3000/restaurants/1`);
      if (restaurantRes.data.latitude && restaurantRes.data.longitude) {
        setRestaurantLocation({ latitude: restaurantRes.data.latitude, longitude: restaurantRes.data.longitude });
      }
    } catch {}

    // Fetch user coordinates from backend
    try {
      const token = await SecureStore.getItemAsync('token');
      const userRes = await axios.get(`http://192.168.1.7:3000/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.data.latitude && userRes.data.longitude) {
        setUserLocation({ latitude: userRes.data.latitude, longitude: userRes.data.longitude });
      }
    } catch {}
  };

  fetchLocations();
}, []);
```

- [ ] **Step 3: Add Maps section before Delivery Info section**

Replace the existing Delivery Info section with:
```tsx
{/* Location Map */}
{restaurantLocation && userLocation && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Lokasi</Text>
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: (restaurantLocation.latitude + userLocation.latitude) / 2,
          longitude: (restaurantLocation.longitude + userLocation.longitude) / 2,
          latitudeDelta: Math.abs(restaurantLocation.latitude - userLocation.latitude) * 2 || 0.01,
          longitudeDelta: Math.abs(restaurantLocation.longitude - userLocation.longitude) * 2 || 0.01,
        }}
      >
        <Marker coordinate={restaurantLocation} pinColor="#dc2626" title="Restoran" />
        <Marker coordinate={userLocation} pinColor="#2563eb" title="Lokasi Anda" />
      </MapView>
    </View>
    <View style={styles.legendRow}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
        <Text style={styles.legendText}>Restoran</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
        <Text style={styles.legendText}>Lokasi Anda</Text>
      </View>
    </View>
  </View>
)}

{/* Delivery Info */}
```

- [ ] **Step 4: Add map and legend styles**

Add to StyleSheet:
```tsx
mapContainer: {
  borderRadius: 16, overflow: 'hidden',
  elevation: 2, shadowColor: '#0f172a',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04, shadowRadius: 8,
},
map: { height: 200, width: '100%' },
legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
legendDot: { width: 10, height: 10, borderRadius: 5 },
legendText: { fontSize: 12, color: '#64748b' },
```

- [ ] **Step 5: Verify map displays on Order Detail**

Run: `npx expo start`
Expected: Order Detail shows map with 2 colored markers and legend.

- [ ] **Step 6: Commit**

```bash
git add app/order-detail.tsx
git commit -m "feat: add location map with restaurant and user markers"
```

---

### Task 6: Update Order Detail — Add Camera Section

**Files:**
- Modify: `app/order-detail.tsx`

**Interfaces:**
- Consumes: `expo-image-picker` from Task 2
- Produces: Camera button and photo preview on Order Detail

- [ ] **Step 1: Add image picker import**

Add to imports at top of file:
```tsx
import * as ImagePicker from 'expo-image-picker';
```

- [ ] **Step 2: Add photo state**

Add after existing state:
```tsx
const [photoUri, setPhotoUri] = useState<string | null>(null);
```

- [ ] **Step 3: Add pick image function**

Add inside component:
```tsx
const handleTakePhoto = async () => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Izin Diperlukan', 'Izinkan akses kamera untuk mengambil foto.');
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });

  if (!result.canceled && result.assets[0]) {
    setPhotoUri(result.assets[0].uri);
  }
};
```

- [ ] **Step 4: Add camera section after Delivery Info**

Add before the closing `</ScrollView>`:
```tsx
{/* Camera Section */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Bukti Penerimaan</Text>
  <TouchableOpacity style={styles.cameraButton} onPress={handleTakePhoto}>
    <Text style={styles.cameraButtonIcon}>📷</Text>
    <Text style={styles.cameraButtonText}>Ambil Foto Bukti</Text>
  </TouchableOpacity>
  {photoUri && (
    <View style={styles.photoPreview}>
      <Text style={styles.photoLabel}>Foto Bukti:</Text>
      <Image source={{ uri: photoUri }} style={styles.photoImage} resizeMode="cover" />
    </View>
  )}
</View>
```

- [ ] **Step 5: Add Image import and camera styles**

Add to imports:
```tsx
import { Image } from 'react-native';
```

Add to StyleSheet:
```tsx
cameraButton: {
  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  gap: 8, backgroundColor: '#fff', paddingVertical: 16, borderRadius: 14,
  borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1',
},
cameraButtonIcon: { fontSize: 24 },
cameraButtonText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
photoPreview: { marginTop: 12 },
photoLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
photoImage: { width: '100%', height: 200, borderRadius: 14 },
```

- [ ] **Step 6: Verify camera works**

Run: `npx expo start`
Expected: Tap "Ambil Foto Bukti" → Camera opens → Take photo → Preview shows below button.

- [ ] **Step 7: Commit**

```bash
git add app/order-detail.tsx
git commit -m "feat: add camera for order receipt proof"
```

---

### Task 7: Final Verification

**Files:** None

**Interfaces:**
- Consumes: All previous tasks
- Produces: Working application with all features

- [ ] **Step 1: Start backend**

Run: `node backend/server.js`
Expected: `FlavorDash backend running on http://localhost:3000`

- [ ] **Step 2: Start frontend**

Run: `npx expo start`

- [ ] **Step 3: Test full flow**

1. Login with `admin` / `password123`
2. Navigate to Profile tab → See map → Drag marker → Tap "Simpan Lokasi"
3. Navigate to Katalog → Open any restaurant → Order an item
4. Open Order Detail → See map with 2 markers → Tap "Ambil Foto Bukti" → Take photo → See preview

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "feat: complete camera, maps, and profile features"
```
