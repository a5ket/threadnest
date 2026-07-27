export abstract class CacheService {
  abstract get<T>(key: string): Promise<T | null>
  abstract set<T>(key: string, value: T, ttlMs?: number): Promise<void>
  abstract delete(key: string): Promise<void>
  abstract acquireLock(key: string, owner: string, ttlMs: number): Promise<boolean>
  abstract releaseLock(key: string, owner: string): Promise<boolean>
}
