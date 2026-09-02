const EXCERPT_LENGTH = 140

/**
 * @param content - The text to excerpt (e.g. for a notification preview).
 * @returns The trimmed text, truncated to {@link EXCERPT_LENGTH} chars with a trailing ellipsis
 * if it was longer.
 */
export function toExcerpt(content: string): string {
  const trimmed = content.trim()
  return trimmed.length > EXCERPT_LENGTH ? `${trimmed.slice(0, EXCERPT_LENGTH)}…` : trimmed
}
