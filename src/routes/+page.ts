import type { PageLoad } from './$types';
import { client, clearOnAuthError, fetchApiJson } from '$lib/pocketbase';
import { cached } from '$lib/cache';
import { failLoad } from '$lib/load';
import { MAX_QUERY_LENGTH, searchQuestionIds } from '$lib/search';
import type { Question, Study } from '$lib/types';

export const load: PageLoad = async ({ url }) => {
	// The raw query, as typed; the search uses it trimmed.
	const q = url.searchParams.get('q') ?? '';
	const query = q.trim().slice(0, MAX_QUERY_LENGTH);

	let questions: Question[];
	let studies: Study[];
	try {
		[questions, studies] = await Promise.all([
			cached('questions:all', () => fetchApiJson<Question[]>('/api/questions')),
			cached('studies:all', () =>
				client.collection('studies').getFullList<Study>({ requestKey: null })
			)
		]);
	} catch (e) {
		failLoad(e);
	}

	// A failed search shows a message above the list rather than the error page.
	let searchIds: string[] | null = null;
	let searchFailed = false;
	if (query) {
		try {
			searchIds = await searchQuestionIds(query);
		} catch (e) {
			clearOnAuthError(e);
			searchFailed = true;
		}
	}

	return { questions, studies, q, searchIds, searchFailed };
};
