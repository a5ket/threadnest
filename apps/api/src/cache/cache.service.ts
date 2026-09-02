/**
 * Abstract key-value cache plus a distributed lock primitive — domain services depend on this
 * rather than a concrete implementation directly, so tests can substitute a mock without touching Redis.
 */
export abstract class CacheService {
  /**
   * @param key - The cache key.
   * @returns The stored value, or `null` if the key isn't cached.
   */
  abstract get<T>(key: string): Promise<T | null>

  /**
   * @param key - The cache key.
   * @param value - The value to store.
   * @param ttlMs - Expiry in milliseconds; omit for no expiry.
   */
  abstract set<T>(key: string, value: T, ttlMs?: number): Promise<void>

  /** @param key - The cache key to invalidate. */
  abstract delete(key: string): Promise<void>

  /**
   * Attempts to acquire a distributed lock, failing (rather than blocking) if it's already held.
   *
   * @param key - The lock's key.
   * @param owner - An opaque token identifying this holder, checked by {@link releaseLock} so
   * only the actual holder can release it.
   * @param ttlMs - How long the lock is held before it auto-expires, in case the holder crashes
   * without releasing it.
   * @returns Whether the lock was acquired.
   */
  abstract acquireLock(key: string, owner: string, ttlMs: number): Promise<boolean>

  /**
   * @param key - The lock's key.
   * @param owner - Must match the token passed to {@link acquireLock} — releasing with the wrong
   * owner is a no-op, so a holder can never release a lock it doesn't actually hold (e.g. one
   * that already expired and was re-acquired by someone else).
   * @returns Whether the lock was actually released by this call.
   */
  abstract releaseLock(key: string, owner: string): Promise<boolean>
}
