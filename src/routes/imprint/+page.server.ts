import { fetchSnippet } from '$lib/snippets';

export const prerender = true;
export const ssr = true;

export async function load({ fetch }) {
	const [en, de] = await Promise.all([
		fetchSnippet(fetch, 'liability', 'en'),
		fetchSnippet(fetch, 'liability', 'de')
	]);
	return { liabilityHtml: { en, de } };
}
