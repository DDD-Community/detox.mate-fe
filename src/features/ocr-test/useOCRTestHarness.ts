import { Asset } from 'expo-asset';
import * as Device from 'expo-device';
import { useMemo, useState } from 'react';

import { OCR_EXPECTED_RESULTS } from './expected';
import { OCR_FIXTURES } from './fixtures';
import { recognizeText } from './nativeOcr';
import { buildStoredSuite, runFixtureOnce } from './runner';
import { saveSuiteResult, shareSuiteResult } from './storage';
import type { ExpectedResult, FixtureDefinition, FixtureRun, StoredSuite, SuiteRunMode } from './types';

function createSuiteId(mode: SuiteRunMode): string {
  return `iphone-${mode}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
}

async function resolveImageUri(fixture: FixtureDefinition): Promise<string> {
  const asset = Asset.fromModule(fixture.asset);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }
  return asset.localUri ?? asset.uri;
}

function findExpected(fixtureId: string): ExpectedResult {
  const expected = OCR_EXPECTED_RESULTS.find((item) => item.fixtureId === fixtureId);
  if (!expected) {
    throw new Error(`No expected result registered for fixture ${fixtureId}`);
  }
  return expected;
}

async function runSingleFixture(
  fixture: FixtureDefinition,
  runIndex: number,
): Promise<FixtureRun> {
  const imageUri = await resolveImageUri(fixture);

  return runFixtureOnce({
    fixtureId: fixture.id,
    imageUri,
    runIndex,
    expected: findExpected(fixture.id),
    recognizeText: (uri) =>
      recognizeText(uri, {
        recognitionLanguages: ['ko-KR', 'en-US'],
        recognitionLevel: 'accurate',
        usesLanguageCorrection: false,
      }),
  });
}

export function useOCRTestHarness() {
  const [selectedFixtureId, setSelectedFixtureId] = useState(OCR_FIXTURES[0]?.id ?? '');
  const [currentSuite, setCurrentSuite] = useState<StoredSuite | null>(null);
  const [savedFileUri, setSavedFileUri] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedFixture = useMemo(
    () => OCR_FIXTURES.find((fixture) => fixture.id === selectedFixtureId) ?? OCR_FIXTURES[0],
    [selectedFixtureId],
  );

  const selectedExpected = useMemo(
    () => OCR_EXPECTED_RESULTS.find((expected) => expected.fixtureId === selectedFixture.id) ?? null,
    [selectedFixture],
  );

  async function finalizeSuite(mode: SuiteRunMode, runs: FixtureRun[]) {
    const suite = buildStoredSuite({
      suiteId: createSuiteId(mode),
      createdAt: new Date().toISOString(),
      runMode: mode,
      deviceModel: Device.modelName ?? Device.deviceName ?? 'unknown-device',
      iosVersion: Device.osVersion ?? 'unknown-ios',
      runs,
    });
    const fileUri = await saveSuiteResult(suite);
    setCurrentSuite(suite);
    setSavedFileUri(fileUri);
  }

  async function withRun<T>(fn: () => Promise<T>) {
    setIsRunning(true);
    setErrorMessage(null);
    try {
      return await fn();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown OCR test error');
      throw error;
    } finally {
      setIsRunning(false);
    }
  }

  async function runOnce() {
    return withRun(async () => {
      const run = await runSingleFixture(selectedFixture, 1);
      await finalizeSuite('single', [run]);
    });
  }

  async function runFiveTimes() {
    return withRun(async () => {
      const runs: FixtureRun[] = [];
      for (let index = 1; index <= 5; index += 1) {
        runs.push(await runSingleFixture(selectedFixture, index));
      }
      await finalizeSuite('repeat5', runs);
    });
  }

  async function runAll() {
    return withRun(async () => {
      const runs: FixtureRun[] = [];
      let runIndex = 1;
      for (const fixture of OCR_FIXTURES) {
        runs.push(await runSingleFixture(fixture, runIndex));
        runIndex += 1;
      }
      await finalizeSuite('all', runs);
    });
  }

  async function shareLatestSuite() {
    if (!savedFileUri) {
      return false;
    }

    return shareSuiteResult(savedFileUri);
  }

  return {
    fixtures: OCR_FIXTURES,
    expectedResults: OCR_EXPECTED_RESULTS,
    selectedFixture,
    selectedExpected,
    selectedFixtureId,
    setSelectedFixtureId,
    currentSuite,
    savedFileUri,
    isRunning,
    errorMessage,
    runOnce,
    runFiveTimes,
    runAll,
    shareLatestSuite,
  };
}
