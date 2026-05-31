import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getUser } from '@/api';
import { Button, HeaderAction } from '@/components';
import { primitiveColors, radius, spacing, typography } from '@/lib/token';

const { brown, gray } = primitiveColors;

const NICKNAME_MAX_LENGTH = 10;

export default function EditNicknameScreen() {
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = nickname.length > 0;

  const handleChange = (next: string) => {
    // 공백 포함 그대로 허용, 10자 초과만 컷
    setNickname(next.slice(0, NICKNAME_MAX_LENGTH));
  };

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await getUser().updateMe({ displayName: nickname });
      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <HeaderAction label="닉네임 변경" onPress={handleBack} accessibilityLabel="뒤로가기" />
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <Text style={styles.title}>새로운 닉네임을{'\n'}입력해주세요</Text>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={handleChange}
            placeholder="닉네임을 입력해주세요"
            placeholderTextColor={gray[300]}
            maxLength={NICKNAME_MAX_LENGTH}
            autoFocus
          />
          <Text style={styles.counter}>
            {nickname.length}/{NICKNAME_MAX_LENGTH}
          </Text>
        </View>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.ctaWrap}>
        <Button
          label="변경 완료"
          color="primary"
          disabled={!isValid || isSubmitting}
          onPress={handleSubmit}
          style={styles.cta}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  header: {
    height: 54,
    paddingHorizontal: spacing[16],
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[20],
    gap: spacing[40],
  },
  title: {
    ...typography.accent.h3,
    color: gray[800],
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius[12],
    height: 50,
    paddingLeft: spacing[16],
    paddingRight: spacing[16],
  },
  input: {
    flex: 1,
    ...typography.primary.body1R,
    color: gray[900],
    padding: 0,
  },
  counter: {
    ...typography.primary.body3R,
    color: gray[300],
    marginLeft: spacing[8],
  },
  ctaWrap: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
  },
  cta: {
    alignSelf: 'stretch',
  },
});
