/**
 * A submitted attachment key is only trustworthy if it lives under the uploader's own namespace
 * — otherwise nothing stops one user from attaching a key they never uploaded.
 *
 * @param key - The storage key to check.
 * @param userId - The user who must own it.
 * @returns Whether `key` lives under `userId`'s own attachment namespace.
 */
export function isAttachmentKeyOwnedBy(key: string, userId: string): boolean {
  return key.startsWith(`attachments/${userId}/`)
}
