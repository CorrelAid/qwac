import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inlineScriptHashes, securityHeaders } from './security-headers.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const BUILD_DIR = join(__dirname, 'build');

const mimeTypes = {
	'.html': 'text/html; charset=utf-8',
	'.htm': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.otf': 'font/otf',
	'.ico': 'image/x-icon',
	'.txt': 'text/plain; charset=utf-8'
};

// Missing files with these extensions get a 404 instead of the SPA fallback.
const assetExtensions = new Set(Object.keys(mimeTypes).filter((e) => !e.startsWith('.htm')));

const HTML = mimeTypes['.html'];

/** The decoded path of a request URL without its query string, or null if it can't be decoded. */
function requestPath(url) {
	try {
		const { pathname } = new URL(url ?? '/', 'http://localhost');
		const decoded = decodeURIComponent(pathname);
		return decoded.includes('\0') ? null : decoded;
	} catch {
		return null;
	}
}

/**
 * Cache-Control for a file: hashed files under _app/immutable never change,
 * HTML must be revalidated so a deploy shows up at once, the rest (favicons,
 * fonts, robots.txt) may be cached for an hour.
 */
function cacheControl(pathname, contentType) {
	if (pathname.startsWith('/_app/immutable/')) return 'public, max-age=31536000, immutable';
	if (contentType === HTML) return 'no-cache';
	return 'public, max-age=3600';
}

/**
 * Request handler serving the static build in `buildDir`, with an SPA
 * fallback. The build doesn't change while the server runs, so file contents
 * are read once and kept in memory. Precompressed .br / .gz files from the
 * adapter are served to clients that accept them.
 */
export function createHandler(buildDir, { backendUrl = process.env.PUBLIC_POCKETBASE_URL } = {}) {
	const root = resolve(buildDir);
	/** @type {Map<string, Buffer | null>} */
	const files = new Map();

	function read(path) {
		if (!files.has(path)) {
			try {
				files.set(path, readFileSync(path));
			} catch {
				// Missing, a directory, or unreadable: all mean "not here".
				files.set(path, null);
			}
		}
		return files.get(path);
	}

	// Every page is the SPA shell (index.html) or a prerendered copy of it, so
	// its inline bootstrap script is the one the CSP has to allow.
	const index = read(join(root, 'index.html'));
	const headers = securityHeaders(backendUrl, {
		scriptHashes: index ? inlineScriptHashes(index.toString('utf8')) : []
	});

	function send(req, res, filePath, pathname, contentType) {
		const accepts = String(req.headers['accept-encoding'] ?? '');
		const extra = {
			'Content-Type': contentType,
			'Cache-Control': cacheControl(pathname, contentType),
			Vary: 'Accept-Encoding'
		};
		for (const [encoding, suffix] of [
			['br', '.br'],
			['gzip', '.gz']
		]) {
			const compressed = accepts.includes(encoding) ? read(filePath + suffix) : null;
			if (compressed) {
				res.writeHead(200, { ...headers, ...extra, 'Content-Encoding': encoding });
				res.end(req.method === 'HEAD' ? undefined : compressed);
				return true;
			}
		}
		const content = read(filePath);
		if (!content) return false;
		res.writeHead(200, { ...headers, ...extra });
		res.end(req.method === 'HEAD' ? undefined : content);
		return true;
	}

	function fail(res, status, text) {
		res.writeHead(status, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' });
		res.end(text);
	}

	return (req, res) => {
		const pathname = requestPath(req.url);
		if (pathname === null) return fail(res, 400, 'Bad Request');

		// Health check endpoint for Coolify
		if (pathname === '/health' || pathname === '/healthz') {
			res.writeHead(200, {
				...headers,
				'Content-Type': 'application/json',
				'Cache-Control': 'no-store'
			});
			res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
			return;
		}

		const filePath = join(root, pathname === '/' ? 'index.html' : pathname);

		// Security check to prevent directory traversal (a sibling like build2/ doesn't count)
		if (filePath !== root && !filePath.startsWith(root + sep)) return fail(res, 403, 'Forbidden');

		const ext = extname(filePath);
		if (send(req, res, filePath, pathname, mimeTypes[ext] || 'application/octet-stream')) return;

		// If no extension, try adding .html for SvelteKit prerendered pages
		if (!ext && send(req, res, filePath + '.html', pathname, HTML)) return;

		// Return 404 for missing assets — don't serve index.html for JS/CSS/etc.
		if (ext && assetExtensions.has(ext)) return fail(res, 404, 'Not Found');

		// Fallback to index.html for SPA page routes
		if (!send(req, res, join(root, 'index.html'), '/index.html', HTML)) fail(res, 404, 'Not Found');
	};
}

// Start the server only when run directly (`bun serve.js`), not when imported by tests.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const PORT = process.env.PORT || 3000;
	const HOST = process.env.HOST || '0.0.0.0';

	const server = createServer(createHandler(BUILD_DIR));

	server.listen(PORT, HOST, () => {
		console.log(
			`Serving ${BUILD_DIR} at http://${HOST}:${PORT} (health checks: /health, /healthz)`
		);
	});

	for (const signal of ['SIGTERM', 'SIGINT']) {
		process.on(signal, () => {
			console.log(`${signal} received, shutting down`);
			server.close(() => process.exit(0));
		});
	}
}
