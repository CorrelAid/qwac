import { createHash } from 'node:crypto';

/**
 * CSP sources for the inline <script>s in an HTML page (SvelteKit's
 * bootstrap script), so the CSP can allow exactly those instead of
 * 'unsafe-inline'.
 *
 * @param {string} html
 * @returns {string[]}
 */
export function inlineScriptHashes(html) {
	const hashes = [];
	for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
		const [, attrs = '', body] = m;
		if (/\ssrc\s*=/i.test(attrs) || !body) continue;
		hashes.push(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
	}
	return hashes;
}

/**
 * The security headers every response gets: from serve.js in production,
 * and from Vite's dev and preview servers (vite.config.ts), so all three
 * behave the same.
 *
 * @param {string} [backendUrl] the qwacback URL (PUBLIC_POCKETBASE_URL); the
 *   page may fetch from it and show its images (avatars)
 * @param {{ dev?: boolean, scriptHashes?: string[] }} [options] dev allows
 *   Vite's hot-reload websocket and inline scripts; otherwise only the inline
 *   scripts with these hashes (see inlineScriptHashes) may run
 * @returns {Record<string, string>}
 */
export function securityHeaders(backendUrl = '', { dev = false, scriptHashes = [] } = {}) {
	const backend = (backendUrl || '').replace(/\/+$/, '');
	const connect = ["'self'", backend, dev ? 'ws: wss:' : ''].filter(Boolean).join(' ');
	return {
		'X-Content-Type-Options': 'nosniff',
		'X-Frame-Options': 'DENY',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
		'Content-Security-Policy': [
			"default-src 'self'",
			// SvelteKit's bootstrap script is inline: allowed by its hash. The
			// dev server injects its own inline scripts.
			['script-src', "'self'", ...(dev ? ["'unsafe-inline'"] : scriptHashes)].join(' '),
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
