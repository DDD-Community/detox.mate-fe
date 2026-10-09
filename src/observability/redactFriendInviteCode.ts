// Personal invite codes resolve a profile; retain the endpoint without recording the code.
export function redactFriendInviteCode(url: string): string {
  return url.replace(
    /^((?:https?:\/\/[^/?#]+)?\/friends\/invite\/)[^/?#]+(?:[?#].*)?$/,
    '$1[Filtered]'
  );
}
