import { defineConfig, type Plugin } from 'vitest/config';
import { loadEnv } from 'vite';
import { readFileSync } from 'node:fs';
import { inlineScriptHashes, securityHeaders } from './security-headers.js';
import { cdlContent } from './cdl-content';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { cdlTokens } from '@correlaid/cdl-design/vite-plugin';

/**
 * Sends the production security headers (security-headers.js) on every
 * response of the dev and preview servers, including the HTML SvelteKit
 * renders, which Vite's `server.headers` doesn't reach.
 */
function securityHeadersPlugin(backend: string | undefined): Plugin {
	// The preview serves build/, whose index.html holds the bootstrap script.
	const previewHashes = () => {
		try {
			return inlineScriptHashes(readFileSync('build/index.html', 'utf8'));
		} catch {
			return [];
		}
	};
	const apply = (dev: boolean, scriptHashes: string[] = []) => {
		const headers = securityHeaders(backend, { dev, scriptHashes });
		return (_req: unknown, res: { setHeader(k: string, v: string): void }, next: () => void) => {
			for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
			next();
		};
	};
	return {
		name: 'security-headers',
		configureServer: (server) => void server.middlewares.use(apply(true)),
		configurePreviewServer: (server) => void server.middlewares.use(apply(false, previewHashes()))
	};
}

export default defineConfig(({ mode }) => {
	const backend = loadEnv(mode, process.cwd(), 'PUBLIC_').PUBLIC_POCKETBASE_URL;
	return {
		plugins: [securityHeadersPlugin(backend), cdlTokens(), sveltekit(), cdlContent()],
		build: {
			sourcemap: false
		},
		server: {
			fs: {
				allow: ['..']
			}
		},
		test: {
			expect: { requireAssertions: true },
			projects: [
				{
					// Component tests (*.svelte.test.ts) run in a real browser.
					extends: './vite.config.ts',
					test: {
						name: 'client',
						browser: {
							enabled: true,
							provider: playwright({
								// Where Playwright's own Chromium can't be installed (e.g. an
								// unsupported Linux), point this at a local Chromium.
								launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
									? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
									: {}
							}),
							instances: [{ browser: 'chromium', headless: true }]
						},
						include: ['src/**/*.svelte.{test,spec}.{js,ts}']
					}
				},
				{
					extends: './vite.config.ts',
					test: {
						name: 'server',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}', '*.{test,spec}.{js,ts}'],
						exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
					}
				}
			]
		}
	};
});
