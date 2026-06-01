import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getFeed, getPoke } from '@/api';
import { pokeStore } from '@/lib/pokeStore';

interface UseFriendPokeOptions {
  challengeRecordId?: string;
  groupChallengeId?: string;
  friendUserId?: string;
  initialIsPoked?: boolean;
}

const toFiniteNumber = (value?: string) => {
  if (!value) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

export function useFriendPoke({
  challengeRecordId,
  groupChallengeId,
  friendUserId,
  initialIsPoked = false,
}: UseFriendPokeOptions) {
  const [isPoking, setIsPoking] = useState(false);
  const [isPoked, setIsPoked] = useState(initialIsPoked);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const syncPokedState = async () => {
        if (!friendUserId) {
          setIsPoked(false);
          return;
        }

        if (initialIsPoked || pokeStore.has(friendUserId)) {
          pokeStore.add(friendUserId);
          setIsPoked(true);
          return;
        }

        setIsPoked(false);
        const numericChallengeRecordId = toFiniteNumber(challengeRecordId);
        if (numericChallengeRecordId == null) return;

        try {
          const numericGroupChallengeId = toFiniteNumber(groupChallengeId);
          const feed = numericGroupChallengeId
            ? await getFeed().getGroupChallengeRecordDetail(
                numericGroupChallengeId,
                numericChallengeRecordId
              )
            : await getFeed().getFeedDetail(numericChallengeRecordId);
          if (cancelled) return;

          const pokeState = feed as { isPoked?: boolean; poked?: boolean };
          const fetchedIsPoked = pokeState.isPoked === true || pokeState.poked === true;
          setIsPoked(fetchedIsPoked);
          if (fetchedIsPoked) {
            pokeStore.add(friendUserId);
          }
        } catch {
          // Keep the current local state if the status check fails.
        }
      };

      syncPokedState();

      return () => {
        cancelled = true;
      };
    }, [challengeRecordId, friendUserId, groupChallengeId, initialIsPoked])
  );

  const poke = async () => {
    if (isPoking || isPoked) return;
    const numericChallengeRecordId = toFiniteNumber(challengeRecordId);
    const numericFriendUserId = toFiniteNumber(friendUserId);
    if (numericChallengeRecordId == null || numericFriendUserId == null || !friendUserId) {
      // 콕 찌르기에 필요한 정보가 없으면 무시 (라우팅하는 쪽에서 채워주어야 함)
      return;
    }

    setIsPoking(true);
    setIsPoked(true);
    pokeStore.add(friendUserId);
    try {
      await getPoke().pokeUser(numericChallengeRecordId, numericFriendUserId);
    } finally {
      setIsPoking(false);
    }
  };

  return {
    isPoking,
    isPoked,
    poke,
  };
}
