import { adminTheme } from '@/constants/adminTheme';
import { createElement, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type AdminDateInputProps = {
  label: string;
  /** Boş veya `YYYY-MM-DD` (HTML date input ile uyumlu) */
  value: string;
  onChange: (isoDate: string) => void;
};

/**
 * Web: tarayıcı tarih seçici; `lang="tr"`.
 * Değer `YYYY-MM-DD`; metin rengi placeholder’a yakın soluk.
 */
export function AdminDateInput({ label, value, onChange }: AdminDateInputProps) {
  const inputStyle = useMemo(
    () =>
      ({
        width: '100%',
        boxSizing: 'border-box',
        border: `1px solid ${adminTheme.border}`,
        borderRadius: adminTheme.radiusSm,
        padding: '6px 8px',
        backgroundColor: adminTheme.surfaceMuted,
        fontSize: 13,
        color: adminTheme.textMuted,
        outline: 'none',
      }) as const,
    []
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {createElement('input', {
        type: 'date',
        lang: 'tr',
        value: value || '',
        onChange: (e: { currentTarget: { value: string } }) => onChange(e.currentTarget.value),
        style: inputStyle,
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: adminTheme.textMuted,
    marginBottom: 3,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
