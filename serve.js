import { createServer } from 'node:http';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const BUILD_DIR = join(__dirname, 'build');

const mimeTypes = {
	'.html': 'text/html',
	'.htm': 'text/html',
	'.css': 'text/css',
	'.js': 'application/javascript',
	'.json': 'application/json',
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
	'.txt': 'text/plain'
};

// --- Security headers ---
const pbUrl = (process.env.PUBLIC_POCKETBASE_URL || '').replace(/\/+$/, '');
const connectSrc = pbUrl ? `'self' ${pbUrl}` : "'self'";

const securityHeaders = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
	'Content-Security-Policy': [
		"default-src 'self'",
		`script-src 'self' 'unsafe-inline'`,
		`style-src 'self' 'unsafe-inline'`,
		`img-src 'self' data: ${pbUrl}`,
		`font-src 'self'`,
		`connect-src ${connectSrc}`,
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'"
	].join('; ')
};

function writeHead(res, status, extraHeaders = {}) {
	res.writeHead(status, { ...securityHeaders, ...extraHeaders });
}

const assetExtensions = [
	'.js',
	'.css',
	'.json',
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.svg',
	'.woff',
	'.woff2',
	'.ttf',
	'.otf',
	'.ico',
	'.txt'
];

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

/** Request handler serving the static build in `buildDir`, with an SPA fallback. */
export function createHandler(buildDir) {
	const root = resolve(buildDir);

	return (req, res) => {
		const pathname = requestPath(req.url);
		if (pathname === null) {
			writeHead(res, 400);
			res.end('Bad Request');
			return;
		}

		// Health check endpoint for Coolify
		if (pathname === '/health' || pathname === '/healthz') {
			writeHead(res, 200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
			return;
		}

		const filePath = join(root, pathname === '/' ? 'index.html' : pathname);

		// Security check to prevent directory traversal (a sibling like build2/ doesn't count)
		if (filePath !== root && !filePath.startsWith(root + sep)) {
			writeHead(res, 403);
			res.end('Forbidden');
			return;
		}

		const ext = extname(filePath);
		try {
			const contentType = mimeTypes[ext] || 'application/octet-stream';
			const content = readFileSync(filePath);

			writeHead(res, 200, { 'Content-Type': contentType });
			res.end(content);
		} catch (err) {
			if (err.code === 'ENOENT' || err.code === 'EISDIR') {
				// If no extension, try adding .html for SvelteKit prerendered pages
				if (!ext) {
					try {
						const htmlContent = readFileSync(filePath + '.html');
						writeHead(res, 200, { 'Content-Type': 'text/html' });
						res.end(htmlContent);
						return;
					} catch {
						// No prerendered page; fall through.
					}
				}

				// Return 404 for missing assets — don't serve index.html for JS/CSS/etc.
				if (ext && assetExtensions.includes(ext)) {
					writeHead(res, 404);
					res.end('Not Found');
					return;
				}

				// Fallback to index.html for SPA page routes
				try {
					const indexContent = readFileSync(join(root, 'index.html'));
					writeHead(res, 200, { 'Content-Type': 'text/html' });
					res.end(indexContent);
				} catch {
					writeHead(res, 404);
					res.end('Not Found');
				}
			} else {
				writeHead(res, 500);
				res.end('Server Error');
			}
		}
	};
}

// Start the server only when run directly (`bun serve.js`), not when imported by tests.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const PORT = process.env.PORT || 3000;
	const HOST = process.env.HOST || '0.0.0.0';

	console.log(`🚀 Starting server on ${HOST}:${PORT}...`);
	console.log(`📁 Working directory: ${process.cwd()}`);

	// Check if build directory exists
	if (existsSync(BUILD_DIR)) {
		console.log(`✅ build directory exists`);
		console.log(`build contents: ${readdirSync(BUILD_DIR).join(', ')}`);
	} else {
		console.error(`❌ build directory NOT FOUND at ${BUILD_DIR}`);
		console.log(`Current directory contents:`, readdirSync('.'));
	}

	const server = createServer(createHandler(BUILD_DIR));

	server.listen(PORT, HOST, () => {
		console.log(`✅ Server running at http://${HOST}:${PORT}`);
		console.log(`📁 Serving static files from ${BUILD_DIR}`);
		console.log(`🌐 Health checks available at /health and /healthz`);
	});

	process.on('SIGTERM', () => {
		console.log('SIGTERM received. Shutting down gracefully...');
		server.close(() => {
			console.log('Server closed');
			process.exit(0);
		});
	});

	process.on('SIGINT', () => {
		console.log('SIGINT received. Shutting down gracefully...');
		server.close(() => {
			console.log('Server closed');
			process.exit(0);
		});
	});
}
