import { env } from '$env/dynamic/private';

const BASE =
	'https://api.github.com/repos/CorrelAid/cdl-wp-eins/contents/src/content/snippets';

function ghHeaders(): Record<string, string> {
	const h: Record<string, string> = { Accept: 'application/vnd.github.raw+json' };
	if (env.GITHUB_TOKEN) h['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
	return h;
}

export async function fetchSnippet(
	fetch: typeof globalThis.fetch,
	snippetId: string,
	lang = 'en'
): Promise<string> {
	const res = await fetch(`${BASE}/${snippetId}/${lang}.html`, { headers: ghHeaders() });
	if (!res.ok) {
		console.warn(`Failed to fetch snippet ${snippetId}/${lang}.html: ${res.status}`);
		return '';
	}
	return res.text();
}
