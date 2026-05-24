import * as ImagePicker from 'expo-image-picker';

export async function pickImageFromLibrary() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) return undefined;
  return result.assets[0];
}
