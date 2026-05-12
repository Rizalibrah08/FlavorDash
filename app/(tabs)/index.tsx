import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, ActivityIndicator,
  TextInput, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';

const API_URL = 'https://6a032dc50d92f63dd255159e.mockapi.io/foods';

type Food = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
};

const categories = ['🍔 Semua', '🍕 Pizza', '🍜 Mie', '🥤 Minuman', '🍰 Dessert'];

export default function CatalogScreen() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setFoods(data))
      .catch(() => setError('Gagal memuat katalog'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = foods.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (error) return <View style={styles.center}><Text style={{ color: '#dc2626' }}>{error}</Text></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Delivery to</Text>
                <Text style={styles.headerTitle}>Lokasi Saat Ini 📍</Text>
              </View>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>A</Text>
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari makanan atau restoran..."
                  placeholderTextColor="#94a3b8"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            </View>

            {/* Promo Banner */}
            <View style={styles.banner}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Diskon 30%</Text>
                <Text style={styles.bannerSub}>Untuk pesanan pertamamu!</Text>
                <TouchableOpacity style={styles.bannerBtn}>
                  <Text style={styles.bannerBtnText}>Pesan Sekarang</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.bannerEmoji}>🍔</Text>
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              {categories.map((cat, i) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, activeCategory === i && styles.catChipActive]}
                  onPress={() => setActiveCategory(i)}
                >
                  <Text style={[styles.catText, activeCategory === i && styles.catTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Populer Saat Ini</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            <View style={styles.cardBody}>
              <View style={styles.cardRow}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ 4.8</Text>
                </View>
              </View>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardPrice}>Rp {item.price?.toLocaleString()}</Text>
                <TouchableOpacity style={styles.orderBtn}>
                  <Text style={styles.orderBtnText}>+ Tambah</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '13%',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  greeting: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },

  searchWrap: { paddingHorizontal: 20, marginTop: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: { fontSize: 15, marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: '#1e293b' },

  banner: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#1e40af',
    borderRadius: 18,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  bannerSub: { fontSize: 13, color: '#bfdbfe', marginTop: 4 },
  bannerBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  bannerBtnText: { color: '#1e40af', fontWeight: '700', fontSize: 12 },
  bannerEmoji: { fontSize: 60, marginLeft: 10 },

  catRow: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 10,
  },
  catChipActive: { backgroundColor: '#2563eb' },
  catText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  catTextActive: { color: '#fff' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', paddingHorizontal: 20, marginTop: 18, marginBottom: 12 },

  card: {
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 3,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  cardImage: { width: '100%', height: 180, backgroundColor: '#e2e8f0' },
  cardBody: { padding: 16 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 17, fontWeight: '700', color: '#0f172a', flex: 1 },
  ratingBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#92400e' },
  cardDesc: { fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 19 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  cardPrice: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  orderBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  orderBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
