export type VerifyMode = 'initial' | 'verify';

export interface VerifyFlowParams {
  mode?: VerifyMode;
  goal?: string;
  groupChallengeParticipantId?: string;
}

export interface VerifyValueParams extends VerifyFlowParams {
  value?: string;
}

export const buildVerifyFlowParams = ({
  mode,
  goal,
  groupChallengeParticipantId,
}: VerifyFlowParams) => ({
  ...(mode ? { mode } : {}),
  ...(goal ? { goal } : {}),
  ...(groupChallengeParticipantId ? { groupChallengeParticipantId } : {}),
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
