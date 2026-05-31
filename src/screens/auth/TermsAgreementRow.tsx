import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Checkbox, Icon } from '@/components';
import { primitiveColors, spacing, typography } from '@/lib/token';

const { gray } = primitiveColors;

interface TermsAgreementRowProps {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
  onOpen: () => void;
}

export function TermsAgreementRow({ checked, label, onChange, onOpen }: TermsAgreementRowProps) {
  return (
    <View style={styles.row}>
      <Checkbox checked={checked} onChange={onChange} />
      <TouchableOpacity style={styles.rowRight} onPress={onOpen} activeOpacity={0.7}>
        <Text style={styles.label}>{label}</Text>
        <Icon name="caretRight" size={22} color={gray[400]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  rowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    ...typography.accent.title2,
    color: gray[800],
    letterSpacing: -0.4,
  },
});
