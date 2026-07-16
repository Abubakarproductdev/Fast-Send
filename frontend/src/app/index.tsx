import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Check Firebase Auth state here later.
    // For now, mock a 2 second delay then go to onboarding.
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Yellow background with white logo/text per spec */}
      <View style={styles.logoPlaceholder}>
        <Text style={styles.icon}>📷</Text>
      </View>
      <Text style={styles.title}>FastSend</Text>
      <Text style={styles.tagline}>Your moments, delivered.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: colors.white,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  tagline: {
    fontSize: typography.size.base,
    color: colors.white,
  }
});
