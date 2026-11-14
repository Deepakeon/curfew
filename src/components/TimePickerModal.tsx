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
import { generate15MinuteIntervals, TimeInterval, formatTime } from '../services/schedule';

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

  // Exact slot index (0 to 95)
  const selectedIndex = useMemo(() => {
    const slotMinuteIndex = Math.floor(selectedMinute / 15);
    const index = selectedHour * 4 + slotMinuteIndex;
    return Math.max(0, Math.min(index, intervals.length - 1));
  }, [selectedHour, selectedMinute, intervals.length]);

  const formattedSelected = useMemo(
    () => formatTime(selectedHour, selectedMinute),
    [selectedHour, selectedMinute]
  );

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: selectedIndex,
            animated: false,
            viewPosition: 0.3,
          });
        } catch {
          flatListRef.current?.scrollToOffset({
            offset: Math.max(0, selectedIndex * ITEM_HEIGHT - 60),
            animated: false,
          });
        }
      }, 30);
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
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>{formattedSelected}</Text>
              </View>
            </View>

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

          <Text style={styles.subtitle}>Select a 15-minute interval</Text>

          {/* Time Slots List */}
          <FlatList
            ref={flatListRef}
            data={intervals}
            keyExtractor={(item) => `${item.hour}:${item.minute}`}
            initialScrollIndex={selectedIndex}
            onScrollToIndexFailed={(info) => {
              flatListRef.current?.scrollToOffset({
                offset: Math.max(0, info.index * ITEM_HEIGHT - 60),
                animated: false,
              });
            }}
            getItemLayout={(_, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected =
                item.hour === selectedHour &&
                Math.abs(item.minute - selectedMinute) < 8;

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
                      name="checkmark-circle"
                      size={18}
                      color={theme.colors.accentGreen}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />

          {/* Footer Cancel */}
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
    maxHeight: '78%',
    backgroundColor: theme.colors.surfaceCard,
    borderColor: theme.colors.hairlineStrong,
    borderWidth: 1,
    borderRadius: theme.rounded.xl,
    padding: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  title: {
    ...theme.typography.headingMd,
    color: theme.colors.ink,
    fontWeight: '600',
  },
  selectedBadge: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    borderRadius: theme.rounded.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  selectedBadgeText: {
    ...theme.typography.captionSm,
    fontSize: 11,
    color: theme.colors.accentGreen,
    fontWeight: '600',
  },
  closeIconButton: {
    padding: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.captionSm,
    color: theme.colors.mute,
    marginBottom: theme.spacing.sm,
  },
  list: {
    maxHeight: 320,
    marginVertical: theme.spacing.xs,
  },
  listContent: {
    paddingVertical: theme.spacing.xxs,
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
    backgroundColor: theme.colors.surfaceElevated,
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
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
    paddingTop: theme.spacing.sm,
  },
  cancelButton: {
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.rounded.md,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
  },
  cancelButtonText: {
    ...theme.typography.buttonMd,
    fontSize: 13,
    color: theme.colors.mute,
  },
});
