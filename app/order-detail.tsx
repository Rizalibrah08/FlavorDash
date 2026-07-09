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
