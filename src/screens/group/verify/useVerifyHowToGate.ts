import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  isVerifyHowToHidden,
  setVerifyHowToHidden,
} from '@/features/verify-how-to/howToPreference';
import { buildVerifyFlowParams, getVerifyPath, type VerifyFlowParams } from './verifyFlowParams';

export function useVerifyHowToGate(params: VerifyFlowParams) {
  const isVerifyMode = params.mode === 'verify';
  const [ready, setReady] = useState(!isVerifyMode);
  const methodParams = buildVerifyFlowParams(params);

  const moveToMethod = () => {
    router.replace({
      pathname: getVerifyPath('method', params.verifyRoot),
      params: Object.keys(methodParams).length > 0 ? methodParams : undefined,
    });
  };

  useEffect(() => {
    if (!isVerifyMode) return;

    let active = true;
    isVerifyHowToHidden().then((hidden) => {
      if (!active) return;

      if (hidden) {
        moveToMethod();
        return;
      }

      setReady(true);
    });

    return () => {
      active = false;
    };
  }, [isVerifyMode, params.goal, params.groupChallengeParticipantId, params.verifyRoot]);

  const handleHideForever = async () => {
    await setVerifyHowToHidden();
    moveToMethod();
  };

  return {
    handleConfirm: moveToMethod,
    handleHideForever,
    isVerifyMode,
    ready,
  };
}
