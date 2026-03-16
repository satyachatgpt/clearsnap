// src/components/BottomBar.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { formatSize } from '../utils/imageAnalyzer';
import { colors } from '../utils/theme';

interface Props {
  selectedCount: number;
  selectedBytes: number;
  deleting: boolean;
  onDelete: () => void;
  onClear: () => void;
}

export function BottomBar({ selectedCount, selectedBytes, deleting, onDelete, onClear }: Props) {
  const hasSelection = selectedCount > 0;

  return (
    <View style={styles.bar}>
      <View>
        <Text style={styles.count}>
          {hasSelection ? `${selectedCount} selected` : 'Tap photos to select'}
        </Text>
        {hasSelection && (
          <Text style={styles.size}>{formatSize(selectedBytes)} to free up</Text>
        )}
      </View>

      <View style={styles.btns}>
        {hasSelection && (
          <TouchableOpacity style={styles.clearBtn} onPress={onClear} activeOpacity={0.7}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.delBtn, !hasSelection && styles.delBtnDisabled]}
          onPress={hasSelection ? onDelete : undefined}
          activeOpacity={hasSelection ? 0.7 : 1}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.delText, !hasSelection && styles.delTextDisabled]}>
              Delete
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingBottom: 28,          // safe area buffer
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  count: { fontSize: 14, fontWeight: '600', color: colors.text },
  size:  { fontSize: 11, color: colors.muted, marginTop: 2 },
  btns:  { flexDirection: 'row', gap: 8, alignItems: 'center' },
  clearBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  clearText: { fontSize: 13, color: colors.sub, fontWeight: '600' },
  delBtn: {
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20, backgroundColor: colors.red,
    minWidth: 70, alignItems: 'center',
  },
  delBtnDisabled: { backgroundColor: colors.card },
  delText:        { fontSize: 13, fontWeight: '700', color: '#fff' },
  delTextDisabled:{ color: colors.muted },
});
