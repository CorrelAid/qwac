import type { LayoutLoad } from './$types';
import { fetchApiJson } from '$lib/pocketbase';
import { cached } from '$lib/cache';
import { setCatalogue, type Catalogue } from '$lib/questionTypes';

export const ssr = false;
export const prerender = false;

/**
 * The question-type catalogue (labels, variants, presentation) from qwacback.
 * Without it the app still works: types show a label made from their name.
 */
export const load: LayoutLoad = async () => {
	try {
		setCatalogue(
			await cached('question-types', () => fetchApiJson<Catalogue>('/api/question-types'))
		);
	} catch {
		setCatalogue({});
	}
};
