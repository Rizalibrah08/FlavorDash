import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const steps = [
  { key: 'confirmed', label: 'Pesanan Dikonfirmasi', icon: '✓' },
  { key: 'preparing', label: 'Sedang Disiapkan', icon: '👨‍🍳' },
  { key: 'delivery', label: 'Dalam Pengiriman', icon: '🚗' },
  { key: 'delivered', label: 'Pesanan Diterima', icon: '📦' },
];

function getActiveStep(status: string) {
  switch (status?.toLowerCase()) {
    case 'delivered': return 3;
    case 'pending': return 1;
    case 'cancelled': return -1;
    default: return 0;
  }
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id, itemName, quantity, status, total } = useLocalSearchParams<{
    id: string; itemName: string; quantity: string; status: string; total: string;
  }>();

  const activeStep = getActiveStep(status);
  const isCancelled = status?.toLowerCase() === 'cancelled';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Order ID Card */}
      <View style={styles.orderIdCard}>
        <View style={styles.orderIdRow}>
          <Text style={styles.orderIdLabel}>Nomor Pesanan</Text>
          <Text style={styles.orderIdValue}>#{id}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: isCancelled ? '#fef2f2' : '#eff6ff' }]}>
          <Text style={[styles.statusText, { color: isCancelled ? '#dc2626' : '#2563eb' }]}>
            {isCancelled ? '✕ Dibatalkan' : status}
          </Text>
        </View>
      </View>

      {/* Progress Tracker */}
      {!isCancelled && (
        <View style={styles.trackerCard}>
          <Text style={styles.sectionTitle}>Status Pesanan</Text>
          <View style={styles.tracker}>
            {steps.map((step, i) => {
              const isActive = i <= activeStep;
              const isLast = i === steps.length - 1;
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
                    {isActive && i === activeStep && (
                      <Text style={styles.stepTime}>Saat ini</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Item Pesanan</Text>
        <View style={styles.itemCard}>
          <View style={styles.itemIconWrap}>
            <Text style={{ fontSize: 24 }}>🍽️</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{itemName}</Text>
            <Text style={styles.itemQty}>{quantity}x item</Text>
          </View>
          <Text style={styles.itemPrice}>Rp {Number(total)?.toLocaleString()}</Text>
        </View>
      </View>

      {/* Payment Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ringkasan Pembayaran</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rp {Number(total)?.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ongkos Kirim</Text>
            <Text style={styles.summaryValue}>Rp 10.000</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Biaya Layanan</Text>
            <Text style={styles.summaryValue}>Rp 2.000</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>Rp {(Number(total) + 12000)?.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Delivery Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Info Pengiriman</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View>
              <Text style={styles.infoLabel}>Alamat Pengiriman</Text>
              <Text style={styles.infoValue}>Jl. Contoh No. 123, Kota</Text>
            </View>
          </View>
          <View style={styles.infoSep} />
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💳</Text>
            <View>
              <Text style={styles.infoLabel}>Metode Pembayaran</Text>
              <Text style={styles.infoValue}>Transfer Bank</Text>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '13%',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: '#0f172a' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },

  orderIdCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  orderIdRow: {},
  orderIdLabel: { fontSize: 12, color: '#94a3b8' },
  orderIdValue: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },

  trackerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  tracker: { marginTop: 14 },
  stepRow: { flexDirection: 'row', minHeight: 56 },
  stepLeft: { alignItems: 'center', width: 40 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
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
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  itemIconWrap: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },
  itemInfo: { flex: 1, marginLeft: 14 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  itemQty: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: 'bold', color: '#2563eb' },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 13, color: '#64748b' },
  summaryValue: { fontSize: 13, color: '#334155', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  totalValue: { fontSize: 17, fontWeight: 'bold', color: '#2563eb' },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { fontSize: 20 },
  infoLabel: { fontSize: 12, color: '#94a3b8' },
  infoValue: { fontSize: 14, color: '#0f172a', fontWeight: '500', marginTop: 2 },
  infoSep: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 },
});
