// A submitted attachment key is only trustworthy if it lives under the uploader's own
// namespace — otherwise nothing stops one user from attaching a key they never uploaded.
export function isAttachmentKeyOwnedBy(key: string, userId: string): boolean {
  return key.startsWith(`attachments/${userId}/`)
}
