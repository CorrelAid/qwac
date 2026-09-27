import { TTLCache } from '@isaacs/ttlcache';

const cache = new TTLCache<string, unknown>({ ttl: 5 * 60 * 1000 });

export function getCached<T>(key: string): T | undefined {
	return cache.get(key) as T | undefined;
}

export function setCached(key: string, data: unknown): void {
	cache.set(key, data);
}

export function invalidatePrefix(prefix: string): void {
	for (const key of cache.keys()) {
		if (key.startsWith(prefix)) cache.delete(key);
	}
}

export function invalidateAll(): void {
	cache.clear();
}

/** Returns the cached value for `key`, or fetches it and caches it on success. */
export async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
	const hit = getCached<T>(key);
	if (hit !== undefined) return hit;
	const data = await fetcher();
	setCached(key, data);
	return data;
}
