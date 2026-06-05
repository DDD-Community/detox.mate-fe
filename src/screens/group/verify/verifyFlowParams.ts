export type VerifyMode = 'initial' | 'verify';
export type VerifyRoot = 'feed';
export type VerifyScreen =
  | 'method'
  | 'upload'
  | 'done'
  | 'error'
  | 'complete'
  | 'wrong-time'
  | 'retro';

export interface VerifyFlowParams {
  mode?: VerifyMode;
  goal?: string;
  groupChallengeParticipantId?: string;
  verifyRoot?: VerifyRoot;
  ocrImageUri?: string;
  ocrImageObjectKey?: string;
  ocrRecordDate?: string;
}

export interface VerifyValueParams extends VerifyFlowParams {
  value?: string;
}

export const buildVerifyFlowParams = ({
  mode,
  goal,
  groupChallengeParticipantId,
  verifyRoot,
  ocrImageUri,
  ocrImageObjectKey,
  ocrRecordDate,
}: VerifyFlowParams) => ({
  ...(mode ? { mode } : {}),
  ...(goal ? { goal } : {}),
  ...(groupChallengeParticipantId ? { groupChallengeParticipantId } : {}),
  ...(verifyRoot ? { verifyRoot } : {}),
  ...(ocrImageUri ? { ocrImageUri } : {}),
  ...(ocrImageObjectKey ? { ocrImageObjectKey } : {}),
  ...(ocrRecordDate ? { ocrRecordDate } : {}),
});

export const buildVerifyValueParams = ({ value, ...flowParams }: VerifyValueParams) => ({
  ...(value ? { value } : {}),
  ...buildVerifyFlowParams(flowParams),
});

export const parseParticipantId = (groupChallengeParticipantId?: string) => {
  if (!groupChallengeParticipantId) return undefined;

  const participantId = Number(groupChallengeParticipantId);
  return Number.isNaN(participantId) ? undefined : participantId;
};

export const getVerifyPath = (screen: VerifyScreen | undefined, verifyRoot?: VerifyRoot) => {
  if (verifyRoot === 'feed') {
    switch (screen) {
      case 'method':
        return '/(feed)/verify/method';
      case 'upload':
        return '/(feed)/verify/upload';
      case 'done':
        return '/(feed)/verify/done';
      case 'error':
        return '/(feed)/verify/error';
      case 'complete':
        return '/(feed)/verify/complete';
      case 'wrong-time':
        return '/(feed)/verify/wrong-time';
      case 'retro':
        return '/(feed)/verify/retro';
      default:
        return '/(feed)/verify';
    }
  }

  switch (screen) {
    case 'method':
      return '/(group)/verify/method';
    case 'upload':
      return '/(group)/verify/upload';
    case 'done':
      return '/(group)/verify/done';
    case 'error':
      return '/(group)/verify/error';
    case 'complete':
      return '/(group)/verify/complete';
    case 'wrong-time':
      return '/(group)/verify/wrong-time';
    case 'retro':
      return '/(group)/verify/retro';
    default:
      return '/(group)/verify';
  }
};
