const EXCERPT_LENGTH = 140

export function toExcerpt(content: string): string {
  const trimmed = content.trim()
  return trimmed.length > EXCERPT_LENGTH ? `${trimmed.slice(0, EXCERPT_LENGTH)}…` : trimmed
}
