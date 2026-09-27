import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHandler } from './serve.js';

let dir;
let server;
let base;

beforeAll(async () => {
	dir = mkdtempSync(join(tmpdir(), 'qwac-serve-'));
	const build = join(dir, 'build');
	mkdirSync(join(build, '_app', 'immutable'), { recursive: true });
	writeFileSync(join(build, 'index.html'), '<!doctype html><title>index</title>');
	writeFileSync(join(build, '_app', 'immutable', 'x.js'), 'console.log(1);');
	writeFileSync(join(build, '_app', 'immutable', 'x.js.gz'), gzipSync('console.log(1);'));
	writeFileSync(join(build, 'robots.txt'), 'User-agent: *');
	writeFileSync(join(build, 'with space.txt'), 'spaced');
	writeFileSync(join(build, 'prerendered.html'), '<title>prerendered</title>');
	// A sibling directory whose name starts with the build directory's name.
	mkdirSync(join(dir, 'build2'));
	writeFileSync(join(dir, 'build2', 'secret.txt'), 'secret');

	server = createServer(createHandler(build, { backendUrl: 'https://api.example.org/' }));
	await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
	base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => {
	server?.close();
	rmSync(dir, { recursive: true, force: true });
});

async function get(path, init) {
	const res = await fetch(base + path, init);
	return {
		status: res.status,
		type: res.headers.get('content-type'),
		headers: res.headers,
		body: await res.text()
	};
}

describe('serve.js', () => {
	it('serves an asset with a query string as the asset', async () => {
		const r = await get('/_app/immutable/x.js?v=1');
		expect(r).toMatchObject({
			status: 200,
			type: 'application/javascript; charset=utf-8',
			body: 'console.log(1);'
		});
	});

	it('returns 404 for a missing asset with a query string, not index.html', async () => {
		const r = await get('/missing.js?v=1');
		expect(r.status).toBe(404);
		expect(r.body).not.toContain('<title>index</title>');
	});

	it('decodes percent-encoded paths', async () => {
		expect(await get('/with%20space.txt')).toMatchObject({ status: 200, body: 'spaced' });
	});

	it('falls back to index.html for app routes, with or without a query string', async () => {
		for (const path of ['/', '/questions/abc/', '/studies/abc/?tab=ddi']) {
			const r = await get(path);
			expect(r, path).toMatchObject({ status: 200, type: 'text/html; charset=utf-8' });
			expect(r.body).toContain('<title>index</title>');
		}
	});

	it('does not serve files outside the build directory', async () => {
		for (const path of ['/..%2Fbuild2%2Fsecret.txt', '/%2e%2e/build2/secret.txt']) {
			const r = await get(path);
			expect([403, 404], path).toContain(r.status);
			expect(r.body).not.toContain('secret');
		}
	});

	it('rejects undecodable paths', async () => {
		expect((await get('/%E0%A4%A')).status).toBe(400);
		expect((await get('/a%00.js')).status).toBe(400);
	});

	it('serves a prerendered page for a path without extension', async () => {
		expect(await get('/prerendered')).toMatchObject({
			status: 200,
			type: 'text/html; charset=utf-8',
			body: '<title>prerendered</title>'
		});
	});

	it('sends the security headers on every response', async () => {
		for (const path of ['/', '/_app/immutable/x.js', '/missing.js', '/%E0%A4%A', '/health']) {
			const { headers } = await get(path);
			expect(headers.get('x-content-type-options'), path).toBe('nosniff');
			expect(headers.get('x-frame-options'), path).toBe('DENY');
			expect(headers.get('referrer-policy'), path).toBe('strict-origin-when-cross-origin');
			expect(headers.get('content-security-policy'), path).toContain("frame-ancestors 'none'");
		}
	});

	it('lets browsers cache hashed assets forever and revalidate HTML', async () => {
		const asset = await get('/_app/immutable/x.js');
		expect(asset.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
		for (const path of ['/', '/questions/abc/', '/prerendered']) {
			expect((await get(path)).headers.get('cache-control'), path).toBe('no-cache');
		}
		expect((await get('/robots.txt')).headers.get('cache-control')).toBe('public, max-age=3600');
	});

	it('serves the precompressed file to clients that accept it', async () => {
		// fetch() asks for gzip and decompresses transparently.
		const r = await get('/_app/immutable/x.js');
		expect(r.headers.get('content-encoding')).toBe('gzip');
		expect(r.headers.get('vary')).toBe('Accept-Encoding');
		expect(r.body).toBe('console.log(1);');

		const plain = await get('/_app/immutable/x.js', { headers: { 'accept-encoding': 'identity' } });
		expect(plain.headers.get('content-encoding')).toBeNull();
		expect(plain.body).toBe('console.log(1);');
	});

	it('answers HEAD without a body', async () => {
		const r = await get('/', { method: 'HEAD' });
		expect(r.status).toBe(200);
		expect(r.body).toBe('');
	});

	it('allows the backend in the CSP', async () => {
		const csp = (await get('/')).headers.get('content-security-policy');
		expect(csp).toContain("connect-src 'self' https://api.example.org");
		expect(csp).toContain("img-src 'self' data: https://api.example.org");
		expect(csp).not.toContain('ws:');
	});

	it('answers health checks', async () => {
		expect(await get('/health?probe=1')).toMatchObject({ status: 200, type: 'application/json' });
	});
});
