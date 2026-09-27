/**
 * The About and Imprint texts come from CorrelAid/cdl-wp-eins, fetched at
 * build time and bundled as the virtual module `virtual:cdl-content`.
 *
 * - The fetch is pinned to a commit: new texts go live through a deliberate
 *   bump of CDL_CONTENT_REF here, not whenever cdl-wp-eins changes.
 * - The HTML is sanitised to text and links before the pages {@html} it.
 * - In CI a missing snippet fails the build: the Imprint is required
 *   content. Locally the build goes on with a warning.
 */
import sanitizeHtml from 'sanitize-html';
import type { Plugin } from 'vite';

type Content = Record<string, Record<string, string>>;

export const CDL_CONTENT_REF = '91e32f414ef37dcec08c3712e290a558f0ab1b56';

const SNIPPETS: Record<string, string[]> = {
	qwac: ['en', 'de'],
	liability: ['en', 'de']
};

/** Text, headings, lists and links; no scripts, handlers, styles or images. */
export function sanitizeSnippet(html: string): string {
	return sanitizeHtml(html, {
		allowedTags: ['section', 'h2', 'h3', 'h4', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
		allowedAttributes: { a: ['href', 'target', 'rel'] },
		allowedSchemes: ['https', 'mailto'],
		// Links that open a new tab can't reach back to this page.
		transformTags: {
			a: (tagName, attribs) => ({
				tagName,
				attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs
			})
		}
	}).trim();
}

async function fetchSnippet(path: string, fetchImpl: typeof fetch): Promise<string> {
	const url = `https://raw.githubusercontent.com/CorrelAid/cdl-wp-eins/${CDL_CONTENT_REF}/src/content/snippets/${path}`;
	try {
		const res = await fetchImpl(url);
		if (!res.ok) {
			console.warn(`[cdl-content] Failed to fetch ${path}: ${res.status}`);
			return '';
		}
		return sanitizeSnippet(await res.text());
	} catch (e) {
		console.warn(`[cdl-content] Error fetching ${path}:`, e);
		return '';
	}
}

/**
 * Fetches and sanitises every snippet. Returns the content and the paths
 * that came back empty.
 */
export async function loadCdlContent(
	fetchImpl: typeof fetch = fetch
): Promise<{ content: Content; missing: string[] }> {
	const content: Content = {};
	const missing: string[] = [];
	await Promise.all(
		Object.entries(SNIPPETS).flatMap(([name, locales]) =>
			locales.map(async (locale) => {
				const path = `${name}/${locale}.html`;
				const html = await fetchSnippet(path, fetchImpl);
				(content[name] ??= {})[locale] = html;
				if (!html) missing.push(path);
			})
		)
	);
	return { content, missing };
}

/** Vite plugin providing `virtual:cdl-content`. */
export function cdlContent(): Plugin {
	let content: Content = {};
	return {
		name: 'cdl-content',
		async buildStart() {
			const loaded = await loadCdlContent();
			content = loaded.content;
			if (loaded.missing.length) {
				const message = `Missing CDL content snippets: ${loaded.missing.join(', ')}`;
				if (process.env.CI) this.error(message);
				else this.warn(message);
			}
		},
		resolveId(id: string) {
			if (id === 'virtual:cdl-content') return '\0virtual:cdl-content';
		},
		load(id: string) {
			if (id === '\0virtual:cdl-content') {
				return `export const content = ${JSON.stringify(content)};`;
			}
		}
	};
}
