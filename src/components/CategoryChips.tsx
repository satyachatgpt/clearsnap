// src/components/CategoryChips.tsx

import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterCategory } from '../hooks/useGallery';
import { CAT_CONFIG, CAT_KEYS, colors } from '../utils/theme';

interface Props {
  active: FilterCategory;
  counts: Record<string, number>;
  onChange: (cat: FilterCategory) => void;
}

export function CategoryChips({ active, counts, onChange }: Props) {
  const all: Array<{ key: FilterCategory; label: string; color: string; icon?: string }> = [
    { key: 'all', label: 'All', color: colors.green },
    ...CAT_KEYS.map(k => ({
      key: k as FilterCategory,
      label: CAT_CONFIG[k].label.split(' ')[0], // short label
      color: CAT_CONFIG[k].color,
      icon: CAT_CONFIG[k].icon,
    })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {all.map(item => {
        const isOn = active === item.key;
        const count = item.key === 'all'
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : (counts[item.key] ?? 0);

        return (
          <TouchableOpacity
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[
              styles.chip,
              isOn && { backgroundColor: item.color, borderColor: item.color },
            ]}
            activeOpacity={0.7}
          >
            {item.icon && (
              <Ionicons
                name={item.icon as any}
                size={13}
                color={isOn ? '#000' : item.color}
                style={{ marginRight: 4 }}
              />
            )}
            <Text style={[styles.chipText, isOn && styles.chipTextOn]}>
              {item.label}
            </Text>
            {count > 0 && (
              <View style={[styles.badge, isOn && styles.badgeOn]}>
                <Text style={[styles.badgeText, isOn && styles.badgeTextOn]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  chipTextOn: { color: '#000' },
  badge: {
    marginLeft: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeOn: { backgroundColor: 'rgba(0,0,0,0.2)' },
  badgeText: { fontSize: 10, color: colors.muted, fontWeight: '700' },
  badgeTextOn: { color: '#000' },
});
