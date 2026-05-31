export type VerifyMode = 'initial' | 'verify';
export type VerifyRoot = 'root';
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
}

export interface VerifyValueParams extends VerifyFlowParams {
  value?: string;
}

export const buildVerifyFlowParams = ({
  mode,
  goal,
  groupChallengeParticipantId,
  verifyRoot,
}: VerifyFlowParams) => ({
  ...(mode ? { mode } : {}),
  ...(goal ? { goal } : {}),
  ...(groupChallengeParticipantId ? { groupChallengeParticipantId } : {}),
  ...(verifyRoot ? { verifyRoot } : {}),
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
  if (verifyRoot === 'root') {
    switch (screen) {
      case 'method':
        return '/verify/method';
      case 'upload':
        return '/verify/upload';
      case 'done':
        return '/verify/done';
      case 'error':
        return '/verify/error';
      case 'complete':
        return '/verify/complete';
      case 'wrong-time':
        return '/verify/wrong-time';
      case 'retro':
        return '/verify/retro';
      default:
        return '/verify';
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
