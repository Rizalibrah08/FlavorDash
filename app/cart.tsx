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
