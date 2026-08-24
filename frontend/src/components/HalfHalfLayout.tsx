import React from 'react';
import { View, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme/spacing';

const { height } = Dimensions.get('window');

interface HalfHalfLayoutProps {
  yellowContent: React.ReactNode;
  whiteContent: React.ReactNode;
}

/**
 * Enforces the 45% Yellow / 55% White visual rule.
 * Top half contains the yellow background and hero elements.
 * Bottom half contains interactive elements on a white rounded card.
 */
export const HalfHalfLayout = ({ yellowContent, whiteContent }: HalfHalfLayoutProps) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.container}>
      {/* 45% Yellow Zone */}
      <SafeAreaView style={styles.yellowZone}>
        <View style={styles.yellowInner}>
          {yellowContent}
        </View>
      </SafeAreaView>

      {/* 55% White Zone */}
      <View style={styles.whiteZone}>
        <View style={styles.whiteInner}>
          {whiteContent}
        </View>
      </View>
    </View>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.yellow,
  },
  yellowZone: {
    height: height * 0.45,
    backgroundColor: colors.yellow,
    zIndex: 1,
  },
  yellowInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  whiteZone: {
    height: height * 0.55,
    backgroundColor: colors.offWhite,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: 2,
    // Add shadow so it floats over yellow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  whiteInner: {
    flex: 1,
    padding: 24,
  }
});
