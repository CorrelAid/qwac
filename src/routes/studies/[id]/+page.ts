/* eslint-disable @typescript-eslint/no-explicit-any -- TODO(#25): type the API responses */
import type { PageLoad } from './$types';
import { client, fetchApiJson } from '$lib/pocketbase';
import { cached } from '$lib/cache';
import { failLoad, recordId } from '$lib/load';

export const load: PageLoad = async ({ params }) => {
	const id = recordId(params.id);
	try {
		const [study, questions] = await Promise.all([
			cached<any>(`study:${id}`, () =>
				client.collection('studies').getOne(id, { requestKey: null })
			),
			cached<any[]>(`study-questions:${id}`, () => fetchApiJson(`/api/studies/${id}/questions`))
		]);
		return { id, study, questions };
	} catch (e) {
		failLoad(e);
	}
};
