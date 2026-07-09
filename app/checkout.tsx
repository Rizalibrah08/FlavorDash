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
  const [address] = useState('Jl. Contoh No. 123, Kota');

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