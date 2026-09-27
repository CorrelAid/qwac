import { describe, it, expect, vi } from 'vitest';
import { cached } from './cache';

describe('cached', () => {
	it('fetches once and serves the cached value after that', async () => {
		const fetcher = vi.fn(async () => ({ n: 1 }));
		const first = await cached('test:once', fetcher);
		const second = await cached('test:once', fetcher);
		expect(second).toBe(first);
		expect(fetcher).toHaveBeenCalledOnce();
	});

	it("doesn't cache failures", async () => {
		const fetcher = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(new Error('down'))
			.mockResolvedValueOnce('up');
		await expect(cached('test:failure', fetcher)).rejects.toThrow('down');
		await expect(cached('test:failure', fetcher)).resolves.toBe('up');
	});

	it('caches falsy values', async () => {
		const fetcher = vi.fn(async () => null);
		await cached('test:null', fetcher);
		await cached('test:null', fetcher);
		expect(fetcher).toHaveBeenCalledOnce();
	});
});
