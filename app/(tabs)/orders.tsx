import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';

const API_URL = 'https://6a032dc50d92f63dd255159e.mockapi.io/orders';

type Order = {
  id: string;
  itemName: string;
  quantity: number;
  status: string;
  total: number;
};

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  delivered: { color: '#16a34a', bg: '#f0fdf4', label: 'Selesai', icon: '✓' },
  pending: { color: '#d97706', bg: '#fffbeb', label: 'Diproses', icon: '◷' },
  cancelled: { color: '#dc2626', bg: '#fef2f2', label: 'Dibatalkan', icon: '✕' },
};

function getStatus(status: string) {
  return statusConfig[status?.toLowerCase()] || { color: '#2563eb', bg: '#eff6ff', label: status, icon: '•' };
}

export default function OrdersScreen() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(() => setError('Gagal memuat pesanan'))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status?.toLowerCase() === activeTab);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (error) return <View style={styles.center}><Text style={{ color: '#dc2626' }}>{error}</Text></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesanan Saya</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {[
          { key: 'all', label: 'Semua' },
          { key: 'pending', label: 'Aktif' },
          { key: 'delivered', label: 'Selesai' },
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

      {/* Orders */}
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
          const s = getStatus(item.status);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push({
                pathname: '/order-detail',
                params: { id: item.id, itemName: item.itemName, quantity: String(item.quantity), status: item.status, total: String(item.total) },
              })}
            >
              {/* Card Header */}
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

              {/* Card Content */}
              <View style={styles.cardContent}>
                <View style={styles.itemRow}>
                  <View style={styles.itemIcon}>
                    <Text style={{ fontSize: 20 }}>🍽️</Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <Text style={styles.itemQty}>{item.quantity}x item</Text>
                  </View>
                </View>
              </View>

              {/* Card Footer */}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '13%',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: { fontSize: 18, color: '#dc2626' },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  list: { padding: 20, paddingTop: 10 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#94a3b8', marginTop: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  orderIdWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderIdLabel: { fontSize: 13, color: '#94a3b8' },
  orderId: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  statusIcon: { fontSize: 12, fontWeight: 'bold' },
  statusLabel: { fontSize: 12, fontWeight: '600' },

  cardContent: { padding: 16, paddingTop: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  itemQty: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 0,
  },
  totalLabel: { fontSize: 12, color: '#94a3b8' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#2563eb', marginTop: 2 },
  detailBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  detailBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
});
