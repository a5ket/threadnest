/**
 * DI token for a registered queue's `QueueDefinition` provider. Every provider whose token starts
 * with this prefix is discoverable as a registered queue.
 *
 * @param name - The queue's name.
 * @returns The token to provide/inject the queue's definition under.
 */
export function queueDefinitionToken(name: string): string {
  return `QUEUE_DEF_${name}`
}