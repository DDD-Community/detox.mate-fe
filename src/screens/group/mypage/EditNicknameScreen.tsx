import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/Button';
import { primitiveColors, radius, spacing, typography } from '../../../lib/token';

const { brown, gray } = primitiveColors;

const NICKNAME_MAX_LENGTH = 10;

const ICONS = {
  caretLeft: require('../../../../assets/icons/regular/icon_rg_CaretLeft.png'),
  info: require('../../../../assets/icons/regular/icon_rg_Info.png'),
} as const;

export default function EditNicknameScreen() {
  const [nickname, setNickname] = useState('');

  const isValid = nickname.length > 0;

  const handleChange = (next: string) => {
    const sanitized = next.replace(/\s/g, '').slice(0, NICKNAME_MAX_LENGTH);
    setNickname(sanitized);
  };

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = () => {
    if (!isValid) return;
    // TODO: PATCH /users/me { displayName: nickname }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Image source={ICONS.caretLeft} style={styles.headerIcon} resizeMode="contain" />
          </Pressable>
          <Text style={styles.headerTitle}>닉네임 변경</Text>
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
          disabled={!isValid}
          onPress={handleSubmit}
          leadingIcon={
            <Image source={ICONS.info} style={styles.ctaIcon} resizeMode="contain" />
          }
          trailingIcon={
            <Image source={ICONS.info} style={styles.ctaIcon} resizeMode="contain" />
          }
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    ...typography.accent.title2,
    color: gray[800],
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
  ctaIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
  },
});
