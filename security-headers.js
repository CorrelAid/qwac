/**
 * The security headers every response gets: from serve.js in production,
 * and from Vite's dev and preview servers (vite.config.ts), so all three
 * behave the same.
 *
 * @param {string} [backendUrl] the qwacback URL (PUBLIC_POCKETBASE_URL); the
 *   page may fetch from it and show its images (avatars)
 * @param {{ dev?: boolean }} [options] dev allows Vite's hot-reload websocket
 * @returns {Record<string, string>}
 */
export function securityHeaders(backendUrl = '', { dev = false } = {}) {
	const backend = (backendUrl || '').replace(/\/+$/, '');
	const connect = ["'self'", backend, dev ? 'ws: wss:' : ''].filter(Boolean).join(' ');
	return {
		'X-Content-Type-Options': 'nosniff',
		'X-Frame-Options': 'DENY',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
		'Content-Security-Policy': [
			"default-src 'self'",
			// SvelteKit's bootstrap script is inline.
			"script-src 'self' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline'",
			`img-src 'self' data:${backend ? ` ${backend}` : ''}`,
			"font-src 'self'",
			`connect-src ${connect}`,
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'"
		].join('; ')
	};
}
