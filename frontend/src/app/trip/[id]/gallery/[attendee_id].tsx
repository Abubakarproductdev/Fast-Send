import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const SPACING = 16;
const IMAGE_SIZE = (width - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

// Mock Data for Phase 6A
const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=500&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&q=80',
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=500&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80',
];

export default function GalleryScreen() {
  const { id, attendee_id } = useLocalSearchParams();
  const [photos, setPhotos] = useState(MOCK_PHOTOS);

  const uploadPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Need camera roll permissions to upload photos!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      // Mock upload
      const newUris = result.assets.map(a => a.uri);
      // Wait for AI processing mockup
      setTimeout(() => {
        setPhotos(prev => [...newUris, ...prev]);
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1E293B', '#0F172A']} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Your Gallery</Text>
        <Text style={styles.subtitle}>Photos from this trip containing you.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.galleryContent}>
        <View style={styles.grid}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={uploadPhotos} activeOpacity={0.8}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 24, paddingTop: 40, paddingBottom: 20 },
  title: { fontSize: 32, fontWeight: '700', color: '#F8FAFC', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94A3B8' },
  galleryContent: { padding: SPACING, paddingBottom: 100 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE * 1.2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: '300',
    marginTop: -4,
  },
});
