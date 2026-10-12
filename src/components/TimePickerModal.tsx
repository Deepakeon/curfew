import React, { useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { generate15MinuteIntervals, TimeInterval } from '../services/schedule';

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  selectedHour: number;
  selectedMinute: number;
  onSelect: (hour: number, minute: number) => void;
  onClose: () => void;
}

const ITEM_HEIGHT = 46;

export function TimePickerModal({
  visible,
  title,
  selectedHour,
  selectedMinute,
  onSelect,
  onClose,
}: TimePickerModalProps) {
  const intervals = useMemo(() => generate15MinuteIntervals(), []);
  const flatListRef = useRef<FlatList<TimeInterval>>(null);

  // Approximate slot index
  const selectedIndex = useMemo(() => {
    const slotMinuteIndex = Math.floor(selectedMinute / 15);
    const index = selectedHour * 4 + slotMinuteIndex;
    return Math.max(0, Math.min(index, intervals.length - 1));
  }, [selectedHour, selectedMinute, intervals.length]);

  useEffect(() => {
    if (visible && flatListRef.current) {
      // Auto-scroll to selected time slot after modal mounts
      const timer = setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: selectedIndex,
            animated: false,
            viewPosition: 0.3,
          });
        } catch {
          // In case items not yet measured
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [visible, selectedIndex]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeIconButton}
              accessibilityRole="button"
              accessibilityLabel="Close time picker"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={theme.colors.mute} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Choose a 15-minute time increment</Text>

          <FlatList
            ref={flatListRef}
            data={intervals}
            keyExtractor={(item) => `${item.hour}:${item.minute}`}
            getItemLayout={(_, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected =
                item.hour === selectedHour &&
                Math.abs(item.minute - selectedMinute) < 8; // Closest 15m bucket

              return (
                <TouchableOpacity
                  style={[
                    styles.slotItem,
                    isSelected ? styles.slotItemSelected : styles.slotItemDefault,
                  ]}
                  onPress={() => {
                    onSelect(item.hour, item.minute);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={item.formatted}
                >
                  <Text
                    style={[
                      styles.slotText,
                      isSelected ? styles.slotTextSelected : styles.slotTextDefault,
                    ]}
                  >
                    {item.formatted}
                  </Text>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={theme.colors.accentGreen}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancel time selection"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 8, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '75%',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairlineStrong,
    borderWidth: 1,
    borderRadius: theme.rounded.xl,
    padding: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xxs,
  },
  title: {
    ...theme.typography.headingMd,
    color: theme.colors.ink,
  },
  closeIconButton: {
    padding: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.captionMd,
    color: theme.colors.mute,
    marginBottom: theme.spacing.md,
  },
  list: {
    maxHeight: 320,
    marginVertical: theme.spacing.xs,
  },
  listContent: {
    paddingVertical: theme.spacing.xs,
  },
  slotItem: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.rounded.md,
    marginBottom: 4,
  },
  slotItemDefault: {
    backgroundColor: 'transparent',
  },
  slotItemSelected: {
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.accentGreen,
    borderWidth: 1,
  },
  slotText: {
    ...theme.typography.bodyMd,
  },
  slotTextDefault: {
    color: theme.colors.body,
  },
  slotTextSelected: {
    color: theme.colors.accentGreen,
    fontWeight: '600',
  },
  footerRow: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
    paddingTop: theme.spacing.md,
  },
  cancelButton: {
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.rounded.md,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
  },
  cancelButtonText: {
    ...theme.typography.buttonMd,
    color: theme.colors.mute,
  },
});
