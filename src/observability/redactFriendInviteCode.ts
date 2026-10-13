// Personal invite codes resolve a profile; retain the endpoint without recording the code.
export function redactFriendInviteCode(url: string): string {
  return url
    .replace(/^(.*\/friends\/search)\?[^#]*(?:#.*)?$/, '$1')
    .replace(/^((?:https?:\/\/[^/?#]+)?\/friends\/invite\/)[^/?#]+(?:[?#].*)?$/, '$1[Filtered]');
}
