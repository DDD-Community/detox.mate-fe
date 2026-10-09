import * as SecureStore from 'expo-secure-store';

export type PendingInvite = { kind: 'friend' | 'group'; code: string };

// 운영 중인 그룹 초대도 같은 키를 사용하므로 기존 문자열은 그룹 코드로 읽는다.
const PENDING_INVITE_KEY = 'pendingInviteCode';
let operations: Promise<unknown> = Promise.resolve();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = operations.then(operation);
  operations = result.catch(() => undefined);
  return result;
}

function decode(value: string | null): PendingInvite | null {
  if (!value) return null;
  if (!value.startsWith('{')) return { kind: 'group', code: value };
  let invite: unknown;
  try {
    invite = JSON.parse(value);
  } catch {
    throw new Error('저장된 초대 정보를 읽을 수 없습니다.');
  }
  if (
    typeof invite !== 'object' ||
    invite === null ||
    !('kind' in invite) ||
    !('code' in invite) ||
    (invite.kind !== 'friend' && invite.kind !== 'group') ||
    typeof invite.code !== 'string' ||
    !invite.code
  ) {
    throw new Error('저장된 초대 정보를 읽을 수 없습니다.');
  }
  return { kind: invite.kind, code: invite.code };
}

export function setPendingInvite(invite: PendingInvite): Promise<void> {
  return serialize(() => SecureStore.setItemAsync(PENDING_INVITE_KEY, JSON.stringify(invite)));
}

export function peekPendingInvite(): Promise<PendingInvite | null> {
  return serialize(async () => decode(await SecureStore.getItemAsync(PENDING_INVITE_KEY)));
}

/** 라우팅이 확정된 뒤에만 호출한다. 도중에 들어온 다른 초대는 삭제하지 않는다. */
export function clearPendingInvite(invite: PendingInvite): Promise<void> {
  return serialize(async () => {
    const current = decode(await SecureStore.getItemAsync(PENDING_INVITE_KEY));
    if (current?.kind === invite.kind && current.code === invite.code) {
      await SecureStore.deleteItemAsync(PENDING_INVITE_KEY);
    }
  });
}
