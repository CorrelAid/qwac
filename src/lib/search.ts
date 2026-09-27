import { fetchApiJson } from '$lib/pocketbase';
import { cached } from '$lib/cache';
import type { SearchPage } from '$lib/types';

/** qwacback rejects longer queries. */
export const MAX_QUERY_LENGTH = 200;
const PER_PAGE = 100;

/**
 * IDs of the questions matching `q`, in the backend's relevance order
 * (stemming, umlaut folding, German/English tags and translations).
 * Fetches every result page.
 */
export function searchQuestionIds(q: string): Promise<string[]> {
	return cached(`search:${q}`, async () => {
		const ids: string[] = [];
		for (let page = 1; ; page++) {
			const params = new URLSearchParams({ q, page: String(page), perPage: String(PER_PAGE) });
			const res = await fetchApiJson<SearchPage>(`/api/search/questions?${params}`);
			for (const item of res.items ?? []) ids.push(item.id);
			if (page >= (res.totalPages ?? 0)) return ids;
		}
	});
}
