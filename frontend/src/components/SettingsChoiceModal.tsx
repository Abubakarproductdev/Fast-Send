import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme/spacing';

export type SettingsChoice = {
  value: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

type SettingsChoiceModalProps = {
  visible: boolean;
  eyebrow: string;
  title: string;
  description: string;
  choices: SettingsChoice[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  saving?: boolean;
};

export function SettingsChoiceModal({
  visible,
  eyebrow,
  title,
  description,
  choices,
  selectedValue,
  onSelect,
  onClose,
  saving = false,
}: SettingsChoiceModalProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}><Ionicons name="sparkles-outline" size={19} color="#FFFDF8" /></View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton} accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <ScrollView style={styles.choiceScroller} contentContainerStyle={styles.choiceList} showsVerticalScrollIndicator>
            {choices.map((choice) => {
              const selected = choice.value === selectedValue;
              return (
                <Pressable
                  key={choice.value}
                  onPress={() => onSelect(choice.value)}
                  disabled={saving}
                  style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.choicePressed, saving && styles.choiceDisabled]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: saving }}
                >
                  <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>
                    <Ionicons name={choice.icon} size={18} color={selected ? colors.paper : colors.textSecondary} />
                  </View>
                  <View style={styles.choiceCopy}>
                    <Text style={styles.choiceTitle}>{choice.title}</Text>
                    <Text style={styles.choiceDescription}>{choice.description}</Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.primaryDark} />
            <Text style={styles.footerText}>You can change this anytime in Settings.</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17, 25, 22, 0.58)' },
  card: { width: '100%', maxWidth: 420, height: 560, maxHeight: '84%', backgroundColor: colors.paper, borderRadius: 26, padding: 22, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  headerIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sageDark },
  closeButton: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgElevated },
  eyebrow: { color: colors.primaryDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginBottom: 6 },
  title: { color: colors.textPrimary, fontSize: 23, fontWeight: '800', letterSpacing: -0.3, marginBottom: 6 },
  description: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 18 },
  choiceScroller: { flex: 1, marginHorizontal: -2 },
  choiceList: { gap: 9, paddingHorizontal: 2, paddingBottom: 4 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  choicePressed: { opacity: 0.78 },
  choiceDisabled: { opacity: 0.6 },
  choiceIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgElevated },
  choiceIconSelected: { backgroundColor: colors.primary },
  choiceCopy: { flex: 1 },
  choiceTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 2 },
  choiceDescription: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.sage, borderRadius: radius.md, padding: 11, marginTop: 15 },
  footerText: { flex: 1, color: colors.sageDark, fontSize: 11, lineHeight: 16, fontWeight: '600' },
});
