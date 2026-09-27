import { describe, it, expect, vi, afterEach } from 'vitest';
import { ApiError, client, fetchApiBlob, fetchApiJson, fetchApiText } from './index';

function mockFetch(body: string, init: ResponseInit) {
	const fn = vi.fn(async () => new Response(body, init));
	vi.stubGlobal('fetch', fn);
	return fn;
}

async function thrown(p: Promise<unknown>): Promise<unknown> {
	try {
		await p;
	} catch (e) {
		return e;
	}
	throw new Error('expected a rejection');
}

afterEach(() => {
	vi.unstubAllGlobals();
	client.authStore.clear();
});

describe('fetchApi*', () => {
	it('returns the body on success', async () => {
		mockFetch('{"ok":true}', { status: 200 });
		expect(await fetchApiJson('/api/questions')).toEqual({ ok: true });
		mockFetch('<var/>', { status: 200 });
		expect(await fetchApiText('/api/questions/x/xml')).toBe('<var/>');
	});

	it('keeps the status of a non-JSON error page', async () => {
		mockFetch('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' });
		const e = await thrown(fetchApiJson('/api/questions'));
		expect(e).toBeInstanceOf(ApiError);
		expect(e).toMatchObject({ status: 502, message: 'Bad Gateway' });
	});

	it('keeps the status and message of a JSON error', async () => {
		mockFetch('{"status":404,"message":"Question not found","data":{}}', { status: 404 });
		const e = await thrown(fetchApiText('/api/questions/x/xml'));
		expect(e).toMatchObject({ status: 404, message: 'Question not found' });
	});

	it('clears stale auth on a 401, whatever the body', async () => {
		for (const body of ['', '{"message":"Unauthorized"}', '<html>401</html>']) {
			// A syntactically valid JWT that expires far in the future, so isValid is true.
			const payload = btoa(JSON.stringify({ exp: 4102444800 }));
			client.authStore.save(`x.${payload}.y`, null);
			expect(client.authStore.isValid).toBe(true);
			mockFetch(body, { status: 401 });
			const e = await thrown(fetchApiBlob('/api/studies/x/export'));
			expect(e).toMatchObject({ status: 401 });
			expect(client.authStore.isValid).toBe(false);
		}
	});

	it('allows ".." and "//" in the query string but not in the path', async () => {
		const fetch = mockFetch('{"items":[]}', { status: 200 });
		await fetchApiJson('/api/search/questions?q=usw..%20http://x');
		expect(fetch).toHaveBeenCalledOnce();
		await expect(fetchApiJson('/api/../_/')).rejects.toThrow('invalid sequences');
		await expect(fetchApiJson('/other')).rejects.toThrow('must start with /api/');
	});
});
