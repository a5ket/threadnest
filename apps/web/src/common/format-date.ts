// Explicit locale so server and client render the same string — the runtime's
// default locale differs between Node (server) and the browser, which breaks hydration.
export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}
