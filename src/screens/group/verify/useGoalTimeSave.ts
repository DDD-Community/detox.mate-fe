import { router } from 'expo-router';
import { useState } from 'react';

import { getUserUsageGoalTime, UserUsageGoalTimeRequestUsageGoalType } from '@/api';

export function useGoalTimeSave(minutes: number) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await getUserUsageGoalTime().setGoalTimes({
        goals: [
          {
            usageGoalType: UserUsageGoalTimeRequestUsageGoalType.TOTAL_USAGE,
            goalMinutes: minutes,
          },
        ],
      });
      router.replace('/(feed)/home');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    handleSave,
    isSaving,
  };
}
