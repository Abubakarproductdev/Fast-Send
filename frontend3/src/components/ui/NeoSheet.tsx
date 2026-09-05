import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface NeoSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const NeoSheet: React.FC<NeoSheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'transparent',
    },
    sheetContainer: {
      backgroundColor: colors.cream,
      borderTopWidth: 2,
      borderLeftWidth: 2,
      borderRightWidth: 2,
      borderColor: colors.ink,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      maxHeight: '86%',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    },
    dragHandle: {
      alignSelf: 'center',
      width: 40,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(16, 16, 16, 0.2)',
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    headerCopy: {
      flex: 1,
      paddingRight: 12,
    },
    title: {
      fontFamily: 'Nunito_800ExtraBold',
      fontSize: 23,
      fontWeight: '800',
      color: colors.ink,
    },
    subtitle: {
      fontFamily: 'Nunito_600SemiBold',
      fontSize: 14,
      fontWeight: '600',
      color: colors.mut,
      marginTop: 4,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.white,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      paddingBottom: 20,
    },
  });

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.sheetContainer}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.8}
            >
              <X size={17} strokeWidth={3} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
