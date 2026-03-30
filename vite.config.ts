import { defineConfig, type Plugin } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { cdlTokens } from '@correlaid/cdl-design/vite-plugin';

interface CdlContent {
	qwac: { en: string; de: string };
	liability: { en: string; de: string };
}

function fetchCdlContent(): Plugin {
	let content: CdlContent = {
		qwac: { en: '', de: '' },
		liability: { en: '', de: '' }
	};

	function ghHeaders(): Record<string, string> {
		const h: Record<string, string> = { Accept: 'application/vnd.github.raw+json' };
		const token = process.env.GITHUB_TOKEN;
		if (token) h['Authorization'] = `Bearer ${token}`;
		return h;
	}

	async function fetchSnippet(path: string): Promise<string> {
		try {
			const res = await fetch(
				`https://api.github.com/repos/CorrelAid/cdl-wp-eins/contents/src/content/snippets/${path}`,
				{ headers: ghHeaders() }
			);
			if (!res.ok) {
				console.warn(`[cdl-content] Failed to fetch ${path}: ${res.status}`);
				if (!process.env.GITHUB_TOKEN) console.warn('[cdl-content] GITHUB_TOKEN not set — you may hit rate limits');
				return '';
			}
			return res.text();
		} catch (e) {
			console.warn(`[cdl-content] Error fetching ${path}:`, e);
			return '';
		}
	}

	return {
		name: 'cdl-content',
		async buildStart() {
			const [qwacEn, qwacDe, liEn, liDe] = await Promise.all([
				fetchSnippet('qwac/en.html'),
				fetchSnippet('qwac/de.html'),
				fetchSnippet('liability/en.html'),
				fetchSnippet('liability/de.html')
			]);
			content = {
				qwac: { en: qwacEn, de: qwacDe },
				liability: { en: liEn, de: liDe }
			};
		},
		resolveId(id) {
			if (id === 'virtual:cdl-content') return '\0virtual:cdl-content';
		},
		load(id) {
			if (id === '\0virtual:cdl-content') {
				return `export const content = ${JSON.stringify(content)};`;
			}
		}
	};
}

export default defineConfig({
	plugins: [cdlTokens(), sveltekit(), fetchCdlContent()],
	build: {
		sourcemap: false
	},
	server: {
		fs: {
			allow: ['..']
		},
		headers: {
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin'
		}
	},
	preview: {
		headers: {
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin'
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
