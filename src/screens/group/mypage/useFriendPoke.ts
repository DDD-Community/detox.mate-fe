import { useState } from 'react';

import { getPoke } from '../../../api/generated/poke/poke';

interface UseFriendPokeOptions {
  challengeRecordId?: string;
  friendUserId?: string;
}

export function useFriendPoke({ challengeRecordId, friendUserId }: UseFriendPokeOptions) {
  const [isPoking, setIsPoking] = useState(false);

  const poke = async () => {
    if (isPoking) return;
    if (!challengeRecordId || !friendUserId) {
      // 콕 찌르기에 필요한 정보가 없으면 무시 (라우팅하는 쪽에서 채워주어야 함)
      return;
    }

    setIsPoking(true);
    try {
      await getPoke().pokeUser(Number(challengeRecordId), Number(friendUserId));
    } finally {
      setIsPoking(false);
    }
  };

  return {
    isPoking,
    poke,
  };
}
