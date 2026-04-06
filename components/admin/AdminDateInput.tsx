import { adminTheme } from '@/constants/adminTheme';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

export type AdminDateInputProps = {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
};

/** Native: admin paneli web dışında bu ekranı göstermez */
export function AdminDateInput({ label, value, onChange }: AdminDateInputProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-AA-GG"
        placeholderTextColor={adminTheme.textMuted}
        keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 0 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: adminTheme.textMuted,
    marginBottom: 3,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: adminTheme.border,
    borderRadius: adminTheme.radiusSm,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 7 : 5,
    backgroundColor: adminTheme.surfaceMuted,
    fontSize: 12,
    color: adminTheme.textMuted,
  },
});
