import type { PageLoad } from './$types';
import { fetchApiJson, fetchApiText } from '$lib/pocketbase';
import { cached } from '$lib/cache';
import { failLoad, recordId } from '$lib/load';
import type { QuestionDetail, XlsForm } from '$lib/types';

export const load: PageLoad = async ({ params }) => {
	const id = recordId(params.id);
	let question: QuestionDetail;
	try {
		question = await cached(`question:${id}`, () =>
			fetchApiJson<QuestionDetail>(`/api/questions/${id}`)
		);
	} catch (e) {
		failLoad(e);
	}
	return {
		id,
		question,
		// Not awaited: the tabs render as soon as each one arrives. null when it
		// can't be generated, so the tab says so instead of loading forever.
		xlsform: cached(`xlsform:${id}`, () =>
			fetchApiJson<XlsForm>(`/api/questions/${id}/xlsform`)
		).catch((): XlsForm | null => null),
		xml: cached(`xml:${id}`, () => fetchApiText(`/api/questions/${id}/xml`)).catch(
			(): string | null => null
		)
	};
};
