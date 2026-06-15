import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Checkbox, Icon, LoggingButton } from '@/components';
import { trackButtonClick, type AnalyticsEventName } from '@/lib/analytics';
import { primitiveColors, spacing, typography } from '@/lib/token';

const { gray } = primitiveColors;

interface TermsAgreementRowProps {
  checked: boolean;
  label: string;
  openEventName: AnalyticsEventName;
  onChange: (next: boolean) => void;
  onOpen: () => void;
  toggleEventName: AnalyticsEventName;
  toggleButtonName: string;
  openButtonName: string;
}

export function TermsAgreementRow({
  checked,
  label,
  openEventName,
  onChange,
  onOpen,
  toggleEventName,
  toggleButtonName,
  openButtonName,
}: TermsAgreementRowProps) {
  const handleToggleChange = (next: boolean) => {
    trackButtonClick(toggleEventName, 'TermsAgreement', toggleButtonName);
    onChange(next);
  };

  return (
    <View style={styles.row}>
      <Checkbox checked={checked} onChange={handleToggleChange} />
      <LoggingButton
        eventName={openEventName}
        properties={{ pageName: 'TermsAgreement', buttonName: openButtonName }}
      >
        <TouchableOpacity style={styles.rowRight} onPress={onOpen} activeOpacity={0.7}>
          <Text style={styles.label}>{label}</Text>
          <Icon name="caretRight" size={22} color={gray[400]} />
        </TouchableOpacity>
      </LoggingButton>
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
