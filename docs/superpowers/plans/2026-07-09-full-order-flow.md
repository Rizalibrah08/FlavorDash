# Full Order Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete order lifecycle: Browse Menu → Add to Cart → Checkout → Place Order → Track Status → Delivery

**Architecture:** React Context for cart state, Express backend for order CRUD, 4-step progress tracker for status flow (pending → preparing → delivering → delivered + cancelled)

**Tech Stack:** React Native (Expo SDK 57), Expo Router, Express.js, JWT auth, TypeScript

## Global Constraints

- Expo SDK 57, React Native 0.86, TypeScript 6.0
- Backend URL: `http://192.168.1.7:3000`
- Auth via JWT stored in expo-secure-store
- UI theme: blue (#2563eb) primary, slate grays for text
- Indonesian language for all user-facing text
- No external state management libraries (use React Context)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `constants/orders.ts` | Order status enum + shared types |
| Create | `context/cart-context.tsx` | Cart state management (items, add/remove/update) |
| Create | `app/cart.tsx` | Cart screen (view/edit items, proceed to checkout) |
| Create | `app/checkout.tsx` | Checkout screen (confirm order, place order) |
| Modify | `app/_layout.tsx` | Add cart + checkout routes, wrap with CartProvider |
| Modify | `app/(tabs)/_layout.tsx` | Add cart badge to tab icon |
| Modify | `app/restaurant-detail.tsx` | Connect "+ Tambah" to cart context |
| Modify | `app/(tabs)/orders.tsx` | Fetch from backend, use shared status types |
| Modify | `app/order-detail.tsx` | Fetch from backend, use shared status types, fix restaurant ID |
| Modify | `backend/server.js` | Add order CRUD endpoints |

---

### Task 1: Shared Order Constants

**Files:**
- Create: `constants/orders.ts`

**Interfaces:**
- Produces: `OrderStatus` type, `ORDER_STATUSES` array, `STATUS_CONFIG` map, `OrderItem` type, `Order` type

- [ ] **Step 1: Create constants/orders.ts**

```typescript
export const ORDER_STATUSES = ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const STATUS_CONFIG: Record<OrderStatus, { color: string; bg: string; label: string; icon: string }> = {
  pending:    { color: '#d97706', bg: '#fffbeb', label: 'Menunggu',    icon: '◷' },
  preparing:  { color: '#2563eb', bg: '#eff6ff', label: 'Disiapkan',   icon: '👨‍🍳' },
  delivering: { color: '#7c3aed', bg: '#f5f3ff', label: 'Dikirim',     icon: '🚗' },
  delivered:  { color: '#16a34a', bg: '#f0fdf4', label: 'Selesai',     icon: '✓' },
  cancelled:  { color: '#dc2626', bg: '#fef2f2', label: 'Dibatalkan',  icon: '✕' },
};

export const ORDER_STEPS = [
  { key: 'pending',    label: 'Pesanan Diterima',    icon: '✓' },
  { key: 'preparing',  label: 'Sedang Disiapkan',    icon: '👨‍🍳' },
  { key: 'delivering', label: 'Dalam Pengiriman',    icon: '🚗' },
  { key: 'delivered',  label: 'Pesanan Diterima',    icon: '📦' },
];

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  serviceFee: number;
  total: number;
  restaurantId: string;
  restaurantName: string;
  deliveryAddress: string;
  paymentMethod: string;
  createdAt: string;
};

export function getActiveStep(status: OrderStatus): number {
  switch (status) {
    case 'pending':    return 0;
    case 'preparing':  return 1;
    case 'delivering': return 2;
    case 'delivered':  return 3;
    default:           return -1;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add constants/orders.ts
git commit -m "feat: add shared order constants and types"
```

---

### Task 2: Cart Context

**Files:**
- Create: `context/cart-context.tsx`

**Interfaces:**
- Produces: `CartProvider`, `useCart` hook with `{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }`

- [ ] **Step 1: Create context/cart-context.tsx**

```typescript
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
};

type CartContextType = {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextType>({
  items: [],
  restaurantId: null,
  restaurantName: null,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  subtotal: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      if (restaurantId && restaurantId !== item.restaurantId) {
        return [{ ...item, quantity: 1 }];
      }
      setRestaurantId(item.restaurantId);
      setRestaurantName(item.restaurantName);

      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, [restaurantId]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      if (next.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return next;
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, restaurantId, restaurantName,
      addItem, removeItem, updateQuantity, clearCart,
      itemCount, subtotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
```

- [ ] **Step 2: Commit**

```bash
git add context/cart-context.tsx
git commit -m "feat: add cart context with item management"
```

---

### Task 3: Backend Order Endpoints

**Files:**
- Modify: `backend/server.js`

**Interfaces:**
- Consumes: JWT auth (existing `authMiddleware`)
- Produces: `POST /orders`, `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status`

- [ ] **Step 1: Add orders array after RESTAURANTS in server.js**

```javascript
let ORDERS = [];
let nextOrderId = 1;
```

- [ ] **Step 2: Add order endpoints before `app.listen`**

```javascript
// POST /orders
app.post('/orders', authMiddleware, (req, res) => {
  const { items, restaurantId, restaurantName, deliveryAddress, paymentMethod, subtotal, shippingCost, serviceFee, total } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ message: 'Items tidak boleh kosong' });
  }

  const order = {
    id: String(nextOrderId++),
    userId: req.user.userId,
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

  ORDERS.push(order);
  res.status(201).json(order);
});

// GET /orders
app.get('/orders', authMiddleware, (req, res) => {
  const userOrders = ORDERS.filter(o => o.userId === req.user.userId);
  res.json(userOrders);
});

// GET /orders/:id
app.get('/orders/:id', authMiddleware, (req, res) => {
  const order = ORDERS.find(o => o.id === req.params.id && o.userId === req.user.userId);
  if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
  res.json(order);
});

// PATCH /orders/:id/status
app.patch('/orders/:id/status', authMiddleware, (req, res) => {
  const order = ORDERS.find(o => o.id === req.params.id && o.userId === req.user.userId);
  if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid' });
  }

  order.status = status;
  res.json(order);
});
```

- [ ] **Step 3: Commit**

```bash
git add backend/server.js
git commit -m "feat: add order CRUD endpoints to backend"
```

---

### Task 4: Cart Screen

**Files:**
- Create: `app/cart.tsx`

**Interfaces:**
- Consumes: `useCart` from `context/cart-context`
- Produces: Cart screen with item list, quantity controls, totals, checkout button

- [ ] **Step 1: Create app/cart.tsx**

```typescript
import { View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '@/context/cart-context';

export default function CartScreen() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, subtotal, itemCount, restaurantName } = useCart();

  const shippingCost = 10000;
  const serviceFee = 2000;
  const total = subtotal + shippingCost + serviceFee;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Keranjang</Text>
        <View style={{ width: 40 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Keranjang kosong</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.back()}>
            <Text style={styles.emptyBtnText}>Tambah Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {restaurantName && (
            <View style={styles.restaurantBadge}>
              <Text style={styles.restaurantText}>📍 {restaurantName}</Text>
            </View>
          )}

          <FlatList
            data={items}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardPrice}>Rp {item.price.toLocaleString()}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeItem(item.id)}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({itemCount} item)</Text>
              <Text style={styles.summaryValue}>Rp {subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ongkos Kirim</Text>
              <Text style={styles.summaryValue}>Rp {shippingCost.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Biaya Layanan</Text>
              <Text style={styles.summaryValue}>Rp {serviceFee.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Rp {total.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => router.push('/checkout')}
          >
            <Text style={styles.checkoutBtnText}>Checkout →</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: '13%', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: '#0f172a' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#94a3b8', marginTop: 12 },
  emptyBtn: {
    marginTop: 16, backgroundColor: '#2563eb',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  restaurantBadge: {
    marginHorizontal: 20, marginTop: 12, backgroundColor: '#eff6ff',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  restaurantText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  list: { padding: 20, paddingTop: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  cardPrice: { fontSize: 14, color: '#2563eb', fontWeight: '600', marginTop: 4 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  qtyValue: { fontSize: 15, fontWeight: '600', color: '#0f172a', minWidth: 20, textAlign: 'center' },
  removeBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#fef2f2',
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
  },
  removeBtnText: { fontSize: 14, color: '#dc2626', fontWeight: '600' },
  summary: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 14, padding: 18,
    elevation: 2, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 13, color: '#64748b' },
  summaryValue: { fontSize: 13, color: '#334155', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  totalValue: { fontSize: 17, fontWeight: 'bold', color: '#2563eb' },
  checkoutBtn: {
    backgroundColor: '#2563eb', marginHorizontal: 20, marginTop: 16, marginBottom: 30,
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/cart.tsx
git commit -m "feat: add cart screen with item management"
```

---

### Task 5: Checkout Screen

**Files:**
- Create: `app/checkout.tsx`

**Interfaces:**
- Consumes: `useCart` from `context/cart-context`, `useAuth` from `context/auth-context`
- Produces: POST to `/orders`, navigates to order detail on success

- [ ] **Step 1: Create app/checkout.tsx**

```typescript
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const BACKEND_URL = 'http://192.168.1.7:3000';

export default function CheckoutScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { items, restaurantId, restaurantName, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('Jl. Contoh No. 123, Kota');

  const shippingCost = 10000;
  const serviceFee = 2000;
  const total = subtotal + shippingCost + serviceFee;

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/(tabs)');
    }
  }, [items]);

  const handlePlaceOrder = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const authToken = token || await SecureStore.getItemAsync('token');
      const res = await axios.post(`${BACKEND_URL}/orders`, {
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        restaurantId,
        restaurantName,
        deliveryAddress: address,
        paymentMethod: 'Transfer Bank',
        subtotal,
        shippingCost,
        serviceFee,
        total,
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      clearCart();
      router.replace({
        pathname: '/order-detail',
        params: { id: res.data.id },
      });
    } catch (err) {
      Alert.alert('Gagal', 'Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
        <View style={styles.card}>
          {restaurantName && (
            <Text style={styles.restaurantName}>📍 {restaurantName}</Text>
          )}
          {items.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemPrice}>Rp {(item.price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
        <View style={styles.card}>
          <Text style={styles.addressText}>{address}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ringkasan Pembayaran</Text>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rp {subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ongkos Kirim</Text>
            <Text style={styles.summaryValue}>Rp {shippingCost.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Biaya Layanan</Text>
            <Text style={styles.summaryValue}>Rp {serviceFee.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>Rp {total.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
        <View style={styles.card}>
          <Text style={styles.paymentText}>💳 Transfer Bank</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.payBtn, loading && styles.payBtnDisabled]}
        onPress={handlePlaceOrder}
        disabled={loading}
      >
        <Text style={styles.payBtnText}>
          {loading ? 'Memproses...' : `Bayar Sekarang — Rp ${total.toLocaleString()}`}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: '13%', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: '#0f172a' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  section: { marginTop: 16, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18,
    elevation: 2, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8,
  },
  restaurantName: { fontSize: 14, fontWeight: '600', color: '#2563eb', marginBottom: 12 },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10,
  },
  itemName: { flex: 1, fontSize: 14, color: '#0f172a' },
  itemQty: { fontSize: 14, color: '#64748b', marginHorizontal: 12 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  addressText: { fontSize: 14, color: '#0f172a', lineHeight: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 13, color: '#64748b' },
  summaryValue: { fontSize: 13, color: '#334155', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  totalValue: { fontSize: 17, fontWeight: 'bold', color: '#2563eb' },
  paymentText: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
  payBtn: {
    backgroundColor: '#2563eb', marginHorizontal: 20, marginTop: 20,
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/checkout.tsx
git commit -m "feat: add checkout screen with order placement"
```

---

### Task 6: Update Restaurant Detail — Connect to Cart

**Files:**
- Modify: `app/restaurant-detail.tsx`

**Interfaces:**
- Consumes: `useCart` from `context/cart-context`

- [ ] **Step 1: Add cart import and connect button**

In `app/restaurant-detail.tsx`, add import at top:
```typescript
import { useCart } from '@/context/cart-context';
```

Inside `RestaurantDetailScreen`, add after `const router = useRouter();`:
```typescript
const { addItem, items } = useCart();
```

Replace the menu item render (lines 96-108) to connect the add button:
```typescript
renderItem={({ item }) => (
  <View style={styles.menuItem}>
    <Image source={{ uri: item.imageUrl }} style={styles.menuImage} />
    <View style={styles.menuInfo}>
      <Text style={styles.menuName}>{item.name}</Text>
      <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.menuPrice}>Rp {item.price?.toLocaleString()}</Text>
    </View>
    <TouchableOpacity
      style={styles.addBtn}
      onPress={() => addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        restaurantId: id || '',
        restaurantName: restaurant?.name || '',
      })}
    >
      <Text style={styles.addBtnText}>+ Tambah</Text>
    </TouchableOpacity>
  </View>
)}
```

Add a floating cart button before the closing `</ScrollView>`:
```typescript
{items.length > 0 && (
  <TouchableOpacity style={styles.cartFab} onPress={() => router.push('/cart')}>
    <Text style={styles.cartFabIcon}>🛒</Text>
    <View style={styles.cartBadge}>
      <Text style={styles.cartBadgeText}>{items.reduce((s, i) => s + i.quantity, 0)}</Text>
    </View>
  </TouchableOpacity>
)}
```

Add these styles to the StyleSheet:
```typescript
cartFab: {
  position: 'absolute', bottom: 20, right: 20,
  width: 56, height: 56, borderRadius: 28,
  backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center',
  elevation: 4, shadowColor: '#1e40af', shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2, shadowRadius: 8,
},
cartFabIcon: { fontSize: 24 },
cartBadge: {
  position: 'absolute', top: -4, right: -4,
  backgroundColor: '#dc2626', width: 22, height: 22,
  borderRadius: 11, justifyContent: 'center', alignItems: 'center',
},
cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
```

- [ ] **Step 2: Commit**

```bash
git add app/restaurant-detail.tsx
git commit -m "feat: connect restaurant menu to cart context"
```

---

### Task 7: Update Root Layout — Routes + CartProvider

**Files:**
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `CartProvider` from `context/cart-context`

- [ ] **Step 1: Add CartProvider and new routes**

Add import:
```typescript
import { CartProvider } from '@/context/cart-context';
```

Wrap `RootLayoutNav` with `CartProvider` in `RootLayout`:
```typescript
export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <RootLayoutNav />
      </CartProvider>
    </AuthProvider>
  );
}
```

Add routes in `Stack`:
```typescript
<Stack.Screen name="cart" options={{ headerShown: false }} />
<Stack.Screen name="checkout" options={{ headerShown: false }} />
```

Add `cart` and `checkout` to protected routes:
```typescript
const isProtectedRoute = segments.includes('restaurant-detail') || 
                         segments.includes('orders') || 
                         segments.includes('order-detail') ||
                         segments.includes('cart') ||
                         segments.includes('checkout');
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: add cart/checkout routes and CartProvider"
```

---

### Task 8: Update Orders List — Backend + Shared Types

**Files:**
- Modify: `app/(tabs)/orders.tsx`

**Interfaces:**
- Consumes: `Order`, `STATUS_CONFIG` from `constants/orders`

- [ ] **Step 1: Refactor orders.tsx to use backend and shared types**

Replace the entire file content:

```typescript
import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { Order, STATUS_CONFIG, OrderStatus } from '@/constants/orders';

const BACKEND_URL = 'http://192.168.1.7:3000';

export default function OrdersScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!token) return;
    fetch(`${BACKEND_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setError('Gagal memuat pesanan'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (error) return <View style={styles.center}><Text style={{ color: '#dc2626' }}>{error}</Text></View>;

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => {
        if (activeTab === 'active') return ['pending', 'preparing', 'delivering'].includes(o.status);
        if (activeTab === 'done') return o.status === 'delivered';
        return true;
      });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesanan Saya</Text>
      </View>

      <View style={styles.tabRow}>
        {[
          { key: 'all', label: 'Semua' },
          { key: 'active', label: 'Aktif' },
          { key: 'done', label: 'Selesai' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Belum ada pesanan</Text>
          </View>
        }
        renderItem={({ item }) => {
          const s = STATUS_CONFIG[item.status as OrderStatus] || STATUS_CONFIG.pending;
          const firstItem = item.items?.[0];
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/order-detail', params: { id: item.id } })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.orderIdWrap}>
                  <Text style={styles.orderIdLabel}>Order</Text>
                  <Text style={styles.orderId}>#{item.id}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statusIcon, { color: s.color }]}>{s.icon}</Text>
                  <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.itemRow}>
                  <View style={styles.itemIcon}>
                    <Text style={{ fontSize: 20 }}>🍽️</Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{firstItem?.name || 'Item'}</Text>
                    <Text style={styles.itemQty}>{item.items?.length || 0} item</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>Rp {item.total?.toLocaleString()}</Text>
                </View>
                <TouchableOpacity style={styles.detailBtn}>
                  <Text style={styles.detailBtnText}>Detail →</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: '13%', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', gap: 8,
  },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9' },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  list: { padding: 20, paddingTop: 10 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#94a3b8', marginTop: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, marginBottom: 16, overflow: 'hidden',
    elevation: 2, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  orderIdWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderIdLabel: { fontSize: 13, color: '#94a3b8' },
  orderId: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 8, gap: 4,
  },
  statusIcon: { fontSize: 12, fontWeight: 'bold' },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  cardContent: { padding: 16, paddingTop: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: {
    width: 46, height: 46, borderRadius: 12, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  itemQty: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 0,
  },
  totalLabel: { fontSize: 12, color: '#94a3b8' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#2563eb', marginTop: 2 },
  detailBtn: {
    backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  detailBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/\(tabs\)/orders.tsx
git commit -m "feat: refactor orders list to use backend and shared types"
```

---

### Task 9: Update Order Detail — Backend Fetch + Fix Restaurant ID

**Files:**
- Modify: `app/order-detail.tsx`

**Interfaces:**
- Consumes: `Order`, `STATUS_CONFIG`, `ORDER_STEPS`, `getActiveStep` from `constants/orders`

- [ ] **Step 1: Refactor order-detail.tsx to fetch from backend**

Replace the entire file content:

```typescript
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import LeafletMap from '@/components/LeafletMap';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Order, STATUS_CONFIG, ORDER_STEPS, getActiveStep, OrderStatus } from '@/constants/orders';

const BACKEND_URL = 'http://192.168.1.7:3000';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [restaurantLocation, setRestaurantLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const res = await axios.get(`${BACKEND_URL}/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(res.data);

        if (res.data.restaurantId) {
          const restRes = await axios.get(`${BACKEND_URL}/restaurants/${res.data.restaurantId}`);
          if (restRes.data.latitude && restRes.data.longitude) {
            setRestaurantLocation({ latitude: restRes.data.latitude, longitude: restRes.data.longitude });
          }
        }

        const userRes = await axios.get(`${BACKEND_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userRes.data.latitude && userRes.data.longitude) {
          setUserLocation({ latitude: userRes.data.latitude, longitude: userRes.data.longitude });
        }
      } catch {
        setError('Gagal memuat detail pesanan');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin Diperlukan', 'Izinkan akses kamera untuk mengambil foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (error) return <View style={styles.center}><Text style={{ color: '#dc2626' }}>{error}</Text></View>;
  if (!order) return <View style={styles.center}><Text>Pesanan tidak ditemukan</Text></View>;

  const statusConf = STATUS_CONFIG[order.status as OrderStatus] || STATUS_CONFIG.pending;
  const activeStep = getActiveStep(order.status as OrderStatus);
  const isCancelled = order.status === 'cancelled';

  const getMapCenter = () => {
    if (restaurantLocation && userLocation) {
      return {
        latitude: (restaurantLocation.latitude + userLocation.latitude) / 2,
        longitude: (restaurantLocation.longitude + userLocation.longitude) / 2,
      };
    }
    return { latitude: -6.2088, longitude: 106.8456 };
  };

  const getMapZoom = () => {
    if (restaurantLocation && userLocation) {
      const latDiff = Math.abs(restaurantLocation.latitude - userLocation.latitude);
      const lngDiff = Math.abs(restaurantLocation.longitude - userLocation.longitude);
      const maxDiff = Math.max(latDiff, lngDiff);
      if (maxDiff > 0.1) return 10;
      if (maxDiff > 0.05) return 12;
      if (maxDiff > 0.01) return 14;
      return 15;
    }
    return 15;
  };

  const mapMarkers = [];
  if (restaurantLocation) {
    mapMarkers.push({ id: 'restaurant', ...restaurantLocation, title: 'Restoran', color: '#dc2626' });
  }
  if (userLocation) {
    mapMarkers.push({ id: 'user', ...userLocation, title: 'Lokasi Anda', color: '#2563eb' });
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.orderIdCard}>
        <View style={styles.orderIdRow}>
          <Text style={styles.orderIdLabel}>Nomor Pesanan</Text>
          <Text style={styles.orderIdValue}>#{order.id}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusConf.bg }]}>
          <Text style={[styles.statusText, { color: statusConf.color }]}>
            {statusConf.icon} {statusConf.label}
          </Text>
        </View>
      </View>

      {!isCancelled && (
        <View style={styles.trackerCard}>
          <Text style={styles.sectionTitle}>Status Pesanan</Text>
          <View style={styles.tracker}>
            {ORDER_STEPS.map((step, i) => {
              const isActive = i <= activeStep;
              const isLast = i === ORDER_STEPS.length - 1;
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[styles.stepDot, isActive && styles.stepDotActive]}>
                      <Text style={[styles.stepIcon, isActive && styles.stepIconActive]}>
                        {isActive ? step.icon : '○'}
                      </Text>
                    </View>
                    {!isLast && <View style={[styles.stepLine, isActive && styles.stepLineActive]} />}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{step.label}</Text>
                    {isActive && i === activeStep && <Text style={styles.stepTime}>Saat ini</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Item Pesanan</Text>
        {order.items?.map((item, idx) => (
          <View key={idx} style={styles.itemCard}>
            <View style={styles.itemIconWrap}>
              <Text style={{ fontSize: 24 }}>🍽️</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>{item.quantity}x item</Text>
            </View>
            <Text style={styles.itemPrice}>Rp {(item.price * item.quantity).toLocaleString()}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ringkasan Pembayaran</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rp {order.subtotal?.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ongkos Kirim</Text>
            <Text style={styles.summaryValue}>Rp {order.shippingCost?.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Biaya Layanan</Text>
            <Text style={styles.summaryValue}>Rp {order.serviceFee?.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>Rp {order.total?.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {restaurantLocation && userLocation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lokasi</Text>
          <View style={styles.mapContainer}>
            <LeafletMap
              latitude={getMapCenter().latitude}
              longitude={getMapCenter().longitude}
              zoom={getMapZoom()}
              markers={mapMarkers}
            />
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Info Pengiriman</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View>
              <Text style={styles.infoLabel}>Alamat Pengiriman</Text>
              <Text style={styles.infoValue}>{order.deliveryAddress}</Text>
            </View>
          </View>
          <View style={styles.infoSep} />
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💳</Text>
            <View>
              <Text style={styles.infoLabel}>Metode Pembayaran</Text>
              <Text style={styles.infoValue}>{order.paymentMethod}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: '13%', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: '#0f172a' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  orderIdCard: {
    backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16, borderRadius: 16,
    padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8,
  },
  orderIdRow: {},
  orderIdLabel: { fontSize: 12, color: '#94a3b8' },
  orderIdValue: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  trackerCard: {
    backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16, borderRadius: 16,
    padding: 18, elevation: 2, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8,
  },
  tracker: { marginTop: 14 },
  stepRow: { flexDirection: 'row', minHeight: 56 },
  stepLeft: { alignItems: 'center', width: 40 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: '#dbeafe' },
  stepIcon: { fontSize: 14, color: '#94a3b8' },
  stepIconActive: { color: '#2563eb' },
  stepLine: { width: 2, flex: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },
  stepLineActive: { backgroundColor: '#2563eb' },
  stepContent: { flex: 1, paddingLeft: 12, paddingTop: 5 },
  stepLabel: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  stepLabelActive: { color: '#0f172a', fontWeight: '600' },
  stepTime: { fontSize: 11, color: '#2563eb', marginTop: 2 },
  section: { marginTop: 16, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  itemCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row',
    alignItems: 'center', marginBottom: 10, elevation: 2, shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
  },
  itemIconWrap: {
    width: 50, height: 50, borderRadius: 14, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
  },
  itemInfo: { flex: 1, marginLeft: 14 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  itemQty: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: 'bold', color: '#2563eb' },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18, elevation: 2,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 13, color: '#64748b' },
  summaryValue: { fontSize: 13, color: '#334155', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  totalValue: { fontSize: 17, fontWeight: 'bold', color: '#2563eb' },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18, elevation: 2,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { fontSize: 20 },
  infoLabel: { fontSize: 12, color: '#94a3b8' },
  infoValue: { fontSize: 14, color: '#0f172a', fontWeight: '500', marginTop: 2 },
  infoSep: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 },
  mapContainer: {
    borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, height: 200,
  },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#64748b' },
  cameraButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', paddingVertical: 16, borderRadius: 14,
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1',
  },
  cameraButtonIcon: { fontSize: 24 },
  cameraButtonText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  photoPreview: { marginTop: 12 },
  photoLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  photoImage: { width: '100%', height: 200, borderRadius: 14 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/order-detail.tsx
git commit -m "feat: refactor order detail to fetch from backend with proper restaurant ID"
```

---

### Task 10: Update Tabs Layout — Cart Badge

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `useCart` from `context/cart-context`

- [ ] **Step 1: Add cart badge to Pesanan tab**

Add import:
```typescript
import { useCart } from '@/context/cart-context';
```

Create a wrapper component for the orders tab icon with badge. Replace the tabs layout:

```typescript
import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCart } from '@/context/cart-context';

function OrdersTabIcon({ color }: { color: string }) {
  const { itemCount } = useCart();
  return (
    <View>
      <IconSymbol size={26} name="paperplane.fill" color={color} />
      {itemCount > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -8,
          backgroundColor: '#dc2626', minWidth: 18, height: 18,
          borderRadius: 9, justifyContent: 'center', alignItems: 'center',
          paddingHorizontal: 4,
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{itemCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e2e8f0',
          elevation: 8,
          shadowColor: '#1e40af',
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Restoran',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pesanan',
          tabBarIcon: ({ color }) => <OrdersTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(tabs\)/_layout.tsx
git commit -m "feat: add cart badge to orders tab icon"
```

---

### Task 11: Remove Logout Button from Orders Header

**Files:**
- Modify: `app/(tabs)/orders.tsx`

**Interfaces:**
- None (cleanup task)

- [ ] **Step 1: Remove logout button from orders header**

In `app/(tabs)/orders.tsx`, remove the logout import and button. The header should just show the title:

```typescript
// Remove this import line:
// import { useAuth } from '@/context/auth-context';

// In the component, remove:
// const { token } = useAuth();
// Change to just: const token = useAuth().token;

// Remove the logout button from the header:
// <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
//   <Text style={styles.logoutIcon}>↗</Text>
// </TouchableOpacity>
```

- [ ] **Step 2: Commit**

```bash
git add app/\(tabs\)/orders.tsx
git commit -m "fix: remove logout button from orders header"
```

---

## Verification

After all tasks, verify by:

1. Start backend: `node backend/server.js`
2. Start Expo: `npx expo start`
3. Test flow:
   - Login → Browse restaurant → Add items to cart (see badge)
   - View cart → Adjust quantities → Proceed to checkout
   - Place order → Redirect to order detail with status tracker
   - Orders list shows new order with correct status
   - Order detail shows correct restaurant location on map
