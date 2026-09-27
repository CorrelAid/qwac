import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * End-to-end tests against the production build, served by serve.js. The
 * backend is faked per test with page.route() (e2e/backend.ts), so the build
 * points at an address that never resolves.
 */
export default defineConfig({
	testDir: 'e2e',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['list'], ['github']] : 'list',
	use: {
		baseURL: `http://127.0.0.1:${PORT}`,
		locale: 'de-DE',
		trace: 'retain-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				// Where Playwright can't install its own browser, use a local Chromium.
				launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
					? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
					: {}
			}
		}
	],
	webServer: {
		command: 'bun run build && bun serve.js',
		url: `http://127.0.0.1:${PORT}/health`,
		env: {
			PUBLIC_POCKETBASE_URL: 'http://pb.test',
			PORT: String(PORT),
			HOST: '127.0.0.1'
		},
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	}
});
