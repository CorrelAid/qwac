import { describe, it, expect } from 'vitest';
import { securityHeaders } from './security-headers.js';

describe('securityHeaders', () => {
	it('allows only the app itself without a backend', () => {
		const csp = securityHeaders('')['Content-Security-Policy'];
		expect(csp).toContain("connect-src 'self';");
		expect(csp).toContain("img-src 'self' data:;");
	});

	it('adds the websocket for the dev server only', () => {
		expect(
			securityHeaders('http://127.0.0.1:8090/', { dev: true })['Content-Security-Policy']
		).toContain("connect-src 'self' http://127.0.0.1:8090 ws: wss:");
	});

	it('sends no cross-origin isolation headers', () => {
		const h = securityHeaders('x');
		expect(h).not.toHaveProperty('Cross-Origin-Embedder-Policy');
		expect(h).not.toHaveProperty('Cross-Origin-Opener-Policy');
	});
});
