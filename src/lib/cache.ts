import { TTLCache } from '@isaacs/ttlcache';

const cache = new TTLCache<string, unknown>({ ttl: 5 * 60 * 1000 });

/** Returns the cached value for `key`, or fetches it and caches it on success. */
export async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
	if (cache.has(key)) return cache.get(key) as T;
	const data = await fetcher();
	cache.set(key, data);
	return data;
}

/** Forgets everything, e.g. after an import added a study. */
export function clearCache(): void {
	cache.clear();
}
