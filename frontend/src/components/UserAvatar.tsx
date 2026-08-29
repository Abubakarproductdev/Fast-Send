import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface UserAvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: number;
}

function initialsFor(name?: string | null): string {
  const parts = (name || 'Organizer').trim().split(/\s+/).filter(Boolean);
  return parts.map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'O';
}

export function UserAvatar({ name, imageUrl, size = 52 }: UserAvatarProps) {
  const { colors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const radius = size * 0.32;

  useEffect(() => setImageFailed(false), [imageUrl]);

  return (
    <View
      accessibilityLabel={`${name || 'Organizer'} profile picture`}
      style={[styles.container, { width: size, height: size, borderRadius: radius, backgroundColor: colors.primary }]}
    >
      {imageUrl && !imageFailed ? (
        <Image
          source={{ uri: imageUrl }}
          onError={() => setImageFailed(true)}
          style={{ width: size, height: size, borderRadius: radius }}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.max(14, size * 0.32), color: '#FFFDF8' }]}>{initialsFor(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { fontWeight: '900' },
});
