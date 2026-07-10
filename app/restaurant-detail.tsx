import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCart } from '@/context/cart-context';

import { API_URL as BACKEND_URL } from '@/constants/config';
const MOCKAPI_URL = 'https://6a032dc50d92f63dd255159e.mockapi.io/foods';

type Restaurant = {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  distance: string;
  category: string;
  description: string;
  address: string;
  openingHours: string;
  promotionalText: string;
};

type Food = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
};

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem, items } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    fetch(`${BACKEND_URL}/restaurants/${id}`)
      .then(res => res.json())
      .then(data => setRestaurant(data))
      .catch(() => setError('Gagal memuat detail restoran'));

    fetch(MOCKAPI_URL)
      .then(res => res.json())
      .then(data => {
        const allFoods = Array.isArray(data) ? data : [];
        setFoods(allFoods.slice(0, 6));
      })
      .catch(() => setError('Gagal memuat menu'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (error) return <View style={styles.center}><Text style={{ color: '#dc2626' }}>{error}</Text></View>;
  if (!restaurant) return <View style={styles.center}><Text>Restoran tidak ditemukan</Text></View>;

  return (
    <View style={styles.container}>
      <ScrollView>
        <Image source={{ uri: restaurant.imageUrl }} style={styles.headerImage} />
        
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Kembali</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {restaurant.rating}</Text>
            </View>
          </View>
          
          <Text style={styles.distance}>📍 {restaurant.distance}</Text>
          <Text style={styles.address}>{restaurant.address}</Text>
          <Text style={styles.hours}>🕐 {restaurant.openingHours}</Text>
          
          {restaurant.promotionalText && (
            <View style={styles.promoBadge}>
              <Text style={styles.promoText}>🎁 {restaurant.promotionalText}</Text>
            </View>
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Menu Tersedia</Text>
          <FlatList
            data={foods}
            keyExtractor={item => item.id}
            scrollEnabled={false}
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
          />
        </View>

        {items.length > 0 && (
          <TouchableOpacity style={styles.cartFab} onPress={() => router.push('/cart')}>
            <Text style={styles.cartFabIcon}>🛒</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{items.reduce((s, i) => s + i.quantity, 0)}</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerImage: { width: '100%', height: 200, backgroundColor: '#e2e8f0' },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: { color: '#1e293b', fontWeight: '600' },
  infoSection: { padding: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restaurantName: { fontSize: 22, fontWeight: '700', color: '#0f172a', flex: 1 },
  ratingBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#92400e' },
  distance: { fontSize: 14, color: '#64748b', marginTop: 8 },
  address: { fontSize: 13, color: '#64748b', marginTop: 4 },
  hours: { fontSize: 13, color: '#64748b', marginTop: 4 },
  promoBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  promoText: { fontSize: 13, color: '#166534', fontWeight: '500' },
  menuSection: { padding: 20, paddingTop: 0 },
  menuTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  menuImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#e2e8f0' },
  menuInfo: { flex: 1, marginLeft: 12 },
  menuName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  menuDesc: { fontSize: 11, color: '#64748b', marginTop: 4 },
  menuPrice: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginTop: 6 },
  addBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
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
});
