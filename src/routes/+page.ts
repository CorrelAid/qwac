/* eslint-disable @typescript-eslint/no-explicit-any -- TODO(#25): type the API responses */
import type { PageLoad } from './$types';
import { client, fetchApiJson } from '$lib/pocketbase';
import { cached } from '$lib/cache';
import { failLoad } from '$lib/load';

export const load: PageLoad = async () => {
	try {
		const [questions, studies] = await Promise.all([
			cached<any[]>('questions:all', () => fetchApiJson('/api/questions')),
			cached<any[]>('studies:all', () =>
				client.collection('studies').getFullList({ requestKey: null })
			)
		]);
		return { questions, studies };
	} catch (e) {
		failLoad(e);
	}
};
