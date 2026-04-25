import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import type { StoredSuite } from './types';

const RESULTS_DIR = `${FileSystem.documentDirectory ?? ''}ocr-test-results`;

async function ensureResultsDirectory() {
  const info = await FileSystem.getInfoAsync(RESULTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RESULTS_DIR, { intermediates: true });
  }
}

export async function saveSuiteResult(suite: StoredSuite): Promise<string> {
  await ensureResultsDirectory();
  const fileUri = `${RESULTS_DIR}/${suite.suiteId}.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(suite, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return fileUri;
}

export async function shareSuiteResult(fileUri: string): Promise<boolean> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    return false;
  }

  await Sharing.shareAsync(fileUri);
  return true;
}
