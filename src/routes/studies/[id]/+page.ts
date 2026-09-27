import type { PageLoad } from './$types';
import { client, fetchApiJson } from '$lib/pocketbase';
import { cached } from '$lib/cache';
import { failLoad, recordId } from '$lib/load';
import type { Question, Study } from '$lib/types';

export const load: PageLoad = async ({ params }) => {
	const id = recordId(params.id);
	try {
		const [study, questions] = await Promise.all([
			cached(`study:${id}`, () =>
				client.collection('studies').getOne<Study>(id, { requestKey: null })
			),
			cached(`study-questions:${id}`, () =>
				fetchApiJson<Question[]>(`/api/studies/${id}/questions`)
			)
		]);
		return { id, study, questions };
	} catch (e) {
		failLoad(e);
	}
};
