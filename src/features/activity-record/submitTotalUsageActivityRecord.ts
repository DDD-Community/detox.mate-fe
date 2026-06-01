import {
  ActivityRecordDetailRequestUsageGoalType,
  type ActivityRecordCreateResponse,
} from '../../api/generated/model';
import { customAxios } from '../../api/mutator';

type SubmitTotalUsageActivityRecordParams = {
  value?: string;
  groupChallengeParticipantId?: string | number;
  reflectionText?: string;
  activityImageObjectKey?: string;
};

export function parseScreenTimeValueToMinutes(value: string | undefined): number {
  if (!value) return 0;
  const [hStr, mStr] = value.split(':');
  return Number(hStr ?? 0) * 60 + Number(mStr ?? 0);
}

function parseParticipantId(value: string | number | undefined): number | null {
  if (value == null) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function submitTotalUsageActivityRecord({
  value,
  groupChallengeParticipantId,
  reflectionText,
  activityImageObjectKey,
}: SubmitTotalUsageActivityRecordParams) {
  const participantId = parseParticipantId(groupChallengeParticipantId);

  if (participantId == null) {
    throw new Error('인증 기록 등록에 필요한 참여자 정보가 없습니다.');
  }

  return customAxios<ActivityRecordCreateResponse>(
    {
      url: '/activity-records',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        groupChallengeParticipantId: participantId,
        reflectionText,
        details: [
          {
            usageGoalType: ActivityRecordDetailRequestUsageGoalType.TOTAL_USAGE,
            usedMinutes: parseScreenTimeValueToMinutes(value),
          },
        ],
        activityImageObjectKey,
      },
    },
    {
      errorPolicy: { presentation: 'dialog', context: 'activityRecord.create' },
      retryPolicy: 'none',
      skipGlobalError: true,
    }
  );
}
