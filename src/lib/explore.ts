/** Search ranking, filters, facet counts and paging for the explore page. */
import { baseType } from '$lib/questionTypes';
import type { Question, Study } from '$lib/types';

/** What filtering needs of a question. */
type QuestionLike = Pick<Question, 'id' | 'study_id' | 'answer_type'>;

/** Filter key → selected value ('' = no filter). */
export type Filters = Record<string, string>;
export type StudyMap = Map<string, Study>;

/**
 * The questions matching a search, in the backend's relevance order; all
 * questions when there's no search; none when the search failed.
 */
export function rankBySearch<Q extends Pick<Question, 'id'>>(
	questions: Q[],
	ids: string[] | null,
	failed = false
): Q[] {
	if (!ids) return failed ? [] : questions;
	const rank = new Map(ids.map((id, i) => [id, i]));
	return questions.filter((q) => rank.has(q.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
}

export function matchesFilter(
	q: QuestionLike,
	key: string,
	value: string,
	studies: StudyMap
): boolean {
	switch (key) {
		case 'answer_type':
			return baseType(q.answer_type) === value;
		case 'topic':
			return !!studies.get(q.study_id)?.topic_classifications?.includes(value);
		default:
			return true;
	}
}

/** The questions matching every set filter, except `excludeKey`. */
export function applyFilters<Q extends QuestionLike>(
	questions: Q[],
	filters: Filters,
	studies: StudyMap,
	excludeKey?: string
): Q[] {
	let result = questions;
	for (const [key, value] of Object.entries(filters)) {
		if (!value || key === excludeKey) continue;
		result = result.filter((q) => matchesFilter(q, key, value, studies));
	}
	return result;
}

/**
 * How many questions each value of filter `key` would give. The other
 * filters apply; `key`'s own selection doesn't, so every option shows what
 * choosing it would give.
 */
export function computeCounts<Q extends QuestionLike>(
	questions: Q[],
	filters: Filters,
	studies: StudyMap,
	key: string,
	values: string[]
): Record<string, number> {
	const base = applyFilters(questions, filters, studies, key);
	return Object.fromEntries(
		values.map((v) => [v, base.filter((q) => matchesFilter(q, key, v, studies)).length])
	);
}

/** The distinct answer types (without variants), sorted. */
export function answerTypeOptions(questions: QuestionLike[]): string[] {
	return [...new Set(questions.map((q) => baseType(q.answer_type)).filter(Boolean))].sort();
}

/** The distinct topic classifications of the questions' studies, sorted. */
export function topicOptions(questions: QuestionLike[], studies: StudyMap): string[] {
	return [
		...new Set(
			questions.flatMap((q) => studies.get(q.study_id)?.topic_classifications ?? []).filter(Boolean)
		)
	].sort();
}

/** One page of `items`; `page` (e.g. from the URL) is clamped to the existing pages. */
export function paginate<T>(
	items: T[],
	page: string | number | null | undefined,
	perPage: number
): { page: number; totalPages: number; items: T[] } {
	const totalPages = Math.max(1, Math.ceil(items.length / perPage));
	const requested = typeof page === 'number' ? page : Number.parseInt(page ?? '1');
	const current = Math.min(Math.max(1, Number.isFinite(requested) ? requested : 1), totalPages);
	return {
		page: current,
		totalPages,
		items: items.slice((current - 1) * perPage, current * perPage)
	};
}
