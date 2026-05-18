import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { AppState, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { primitiveColors } from '../../../lib/token/primitive/colors';
import { typography } from '../../../lib/token/primitive/typography';

const { gray, brown } = primitiveColors;

export default function VerifyMethodScreen() {
  const { mode, goal } = useLocalSearchParams<{
    mode?: 'initial' | 'verify';
    goal?: string;
  }>();
  const awaitingReturnRef = useRef(false);

  const forwardParams = {
    ...(mode ? { mode } : {}),
    ...(goal ? { goal } : {}),
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    router.replace({
      pathname: '/(group)/verify/upload',
      params: { imageUri: result.assets[0].uri, ...forwardParams },
    });
  };

  const handleSettings = async () => {
    awaitingReturnRef.current = true;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !awaitingReturnRef.current) return;
      awaitingReturnRef.current = false;
      subscription.remove();
      router.replace({
        pathname: '/(group)/verify/upload',
        params: forwardParams,
      });
    });
    await Linking.openSettings();
  };

  return (
    <Pressable style={styles.overlay} onPress={() => router.back()}>
      <Pressable style={styles.sheet} onPress={() => {}}>
        <View style={styles.grabberWrap}>
          <View style={styles.grabber} />
        </View>

        <View style={styles.content}>
          <View style={styles.textGroup}>
            <Text style={styles.title}>{'내 스크린 타임\n인증하기'}</Text>
            <Text style={styles.description}>둘 중 하나를 선택해주세요.</Text>
          </View>

          <View style={styles.actions}>
            <Button
              label="갤러리로 가기"
              color="assistive"
              onPress={handleGallery}
              style={styles.button}
              leadingIcon={
                <Image
                  source={require('../../../../assets/icons/regular/icon_rg_ImageSquare.png')}
                  style={styles.icon}
                  resizeMode="contain"
                />
              }
            />
            <Button
              label="설정으로 캡쳐하러 가기"
              color="assistive"
              onPress={handleSettings}
              style={styles.button}
              leadingIcon={
                <Image
                  source={require('../../../../assets/icons/regular/icon_rg_GearSix.png')}
                  style={styles.icon}
                  resizeMode="contain"
                />
              }
            />
          </View>
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: brown[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  grabberWrap: {
    paddingTop: 5,
    paddingBottom: 11,
    alignItems: 'center',
  },
  grabber: {
    width: 52,
    height: 5,
    borderRadius: 100,
    backgroundColor: gray[100],
  },
  content: {
    gap: 40,
  },
  textGroup: {
    gap: 12,
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
    letterSpacing: -0.52,
  },
  description: {
    ...typography.primary.body2R,
    color: gray[400],
    letterSpacing: -0.28,
  },
  actions: {
    gap: 12,
  },
  button: {
    alignSelf: 'stretch',
  },
  icon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
  },
});
