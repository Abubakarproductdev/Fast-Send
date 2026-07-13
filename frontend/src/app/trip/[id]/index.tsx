import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function TripDashboardScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Mock data for Phase 6A
  const trip = {
    inviteCode: 'FA3B2C89',
    attendeeCount: 14,
    mediaCount: 102,
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my trip on FastSend! Invite Code: ${trip.inviteCode}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1E293B', '#0F172A']} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Trip Dashboard</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inviteCard}>
          <Text style={styles.inviteLabel}>INVITE CODE</Text>
          <Text style={styles.inviteCode} selectable={true}>{trip.inviteCode}</Text>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>Share Code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{trip.attendeeCount}</Text>
            <Text style={styles.statLabel}>Attendees</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{trip.mediaCount}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 24, paddingTop: 40 },
  backButton: { marginBottom: 16 },
  backButtonText: { color: '#94A3B8', fontSize: 16 },
  title: { fontSize: 32, fontWeight: '700', color: '#F8FAFC' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  inviteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
  },
  inviteLabel: { color: '#94A3B8', fontSize: 14, fontWeight: '600', letterSpacing: 2, marginBottom: 16 },
  inviteCode: { fontSize: 48, fontWeight: '800', color: '#6366F1', letterSpacing: 8, marginBottom: 32 },
  shareButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  shareButtonText: { color: '#818CF8', fontSize: 16, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', gap: 16 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  statValue: { fontSize: 32, fontWeight: '700', color: '#F8FAFC', marginBottom: 8 },
  statLabel: { color: '#94A3B8', fontSize: 14 },
});
