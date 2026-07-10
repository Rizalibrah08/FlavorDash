import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import LeafletMap from '@/components/LeafletMap';
import * as Location from 'expo-location';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';

import { API_URL } from '@/constants/config';

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
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      if (res.data.latitude && res.data.longitude) {
        setMarkerPosition({ latitude: res.data.latitude, longitude: res.data.longitude });
      } else {
        await getCurrentLocation();
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      await getCurrentLocation();
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Diperlukan', 'Izinkan akses lokasi untuk menentukan lokasi pengiriman.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setMarkerPosition({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (err) {
      console.error('Failed to get location:', err);
    }
  };

  const handleMarkerDragEnd = useCallback((markerId: string, lat: number, lng: number) => {
    setMarkerPosition({ latitude: lat, longitude: lng });
  }, []);

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.username?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{profile?.username}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lokasi Anda</Text>
          <Text style={styles.sectionSubtitle}>Drag marker untuk mengatur lokasi</Text>
          <View style={styles.mapContainer}>
            <LeafletMap
              latitude={markerPosition.latitude}
              longitude={markerPosition.longitude}
              zoom={15}
              markers={[
                {
                  id: 'user',
                  latitude: markerPosition.latitude,
                  longitude: markerPosition.longitude,
                  title: 'Lokasi Anda',
                  draggable: true,
                },
              ]}
              onMarkerDragEnd={handleMarkerDragEnd}
            />
          </View>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
          >
            <Text style={styles.locationButtonText}>Ambil Lokasi Saat Ini</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveLocation}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Menyimpan...' : 'Simpan Lokasi'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
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
    height: 250,
  },
  locationButton: {
    marginTop: 12, backgroundColor: '#f1f5f9',
    paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  locationButtonText: { color: '#475569', fontSize: 14, fontWeight: '600' },
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
