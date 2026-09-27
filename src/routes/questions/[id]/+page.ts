/* eslint-disable @typescript-eslint/no-explicit-any -- TODO(#25): type the API responses */
import type { PageLoad } from './$types';
import { fetchApiJson, fetchApiText } from '$lib/pocketbase';
import { cached } from '$lib/cache';
import { failLoad, recordId } from '$lib/load';

export const load: PageLoad = async ({ params }) => {
	const id = recordId(params.id);
	let question: any;
	try {
		question = await cached(`question:${id}`, () => fetchApiJson(`/api/questions/${id}`));
	} catch (e) {
		failLoad(e);
	}
	return {
		id,
		question,
		// Not awaited: the tabs render as soon as each one arrives. null when it
		// can't be generated, so the tab says so instead of loading forever.
		xlsform: cached(`xlsform:${id}`, () => fetchApiJson(`/api/questions/${id}/xlsform`)).catch(
			() => null
		) as Promise<any | null>,
		xml: cached(`xml:${id}`, () => fetchApiText(`/api/questions/${id}/xml`)).catch(
			() => null
		) as Promise<string | null>
	};
};
