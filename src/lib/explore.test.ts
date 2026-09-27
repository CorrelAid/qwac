import { describe, it, expect } from 'vitest';
import {
	answerTypeOptions,
	applyFilters,
	computeCounts,
	paginate,
	rankBySearch,
	topicOptions
} from './explore';

const studies = new Map([
	['s1', { id: 's1', topic_classifications: ['Impact', 'Demographics'] }],
	['s2', { id: 's2', topic_classifications: ['Impact'] }],
	['s3', { id: 's3', topic_classifications: [] }]
]);

const questions = [
	{ id: 'a', study_id: 's1', answer_type: 'single_choice' },
	{ id: 'b', study_id: 's1', answer_type: 'single_choice_other' },
	{ id: 'c', study_id: 's2', answer_type: 'integer' },
	{ id: 'd', study_id: 's3', answer_type: 'multiple_choice_long_list' },
	{ id: 'e', study_id: 'unknown', answer_type: 'text' }
];

const ids = (qs: { id: string }[]) => qs.map((q) => q.id);

describe('rankBySearch', () => {
	it('keeps every question without a search', () => {
		expect(rankBySearch(questions, null)).toBe(questions);
	});

	it('keeps the matches in the backend order', () => {
		expect(ids(rankBySearch(questions, ['d', 'a', 'zzz']))).toEqual(['d', 'a']);
	});

	it('shows nothing when the search failed', () => {
		expect(rankBySearch(questions, null, true)).toEqual([]);
	});
});

describe('applyFilters', () => {
	it('matches answer types without their variant', () => {
		expect(ids(applyFilters(questions, { answer_type: 'select_one' }, studies))).toEqual([
			'a',
			'b'
		]);
	});

	it('matches the study topic, and questions of unknown studies never match', () => {
		expect(ids(applyFilters(questions, { topic: 'Impact' }, studies))).toEqual(['a', 'b', 'c']);
	});

	it('combines filters and ignores empty ones', () => {
		expect(
			ids(applyFilters(questions, { topic: 'Impact', answer_type: 'integer' }, studies))
		).toEqual(['c']);
		expect(applyFilters(questions, { topic: '', answer_type: '' }, studies)).toEqual(questions);
	});
});

describe('computeCounts', () => {
	it("counts each option with the other filters, not the key's own selection", () => {
		const filters = { topic: 'Demographics', answer_type: 'integer' };
		// Answer type counts: only Demographics applies (a, b), not answer_type=integer.
		expect(
			computeCounts(questions, filters, studies, 'answer_type', ['select_one', 'integer'])
		).toEqual({ select_one: 2, integer: 0 });
		// Topic counts: only answer_type=integer applies (c).
		expect(computeCounts(questions, filters, studies, 'topic', ['Impact', 'Demographics'])).toEqual(
			{ Impact: 1, Demographics: 0 }
		);
	});
});

describe('options', () => {
	it('lists distinct base answer types', () => {
		expect(answerTypeOptions(questions)).toEqual([
			'integer',
			'select_multiple',
			'select_one',
			'text'
		]);
	});

	it('lists distinct topics', () => {
		expect(topicOptions(questions, studies)).toEqual(['Demographics', 'Impact']);
	});
});

describe('paginate', () => {
	const items = Array.from({ length: 45 }, (_, i) => i);

	it('returns the requested page', () => {
		expect(paginate(items, '2', 20)).toMatchObject({ page: 2, totalPages: 3 });
		expect(paginate(items, 3, 20).items).toEqual([40, 41, 42, 43, 44]);
	});

	it('clamps pages out of range or not a number', () => {
		expect(paginate(items, '99', 20).page).toBe(3);
		expect(paginate(items, '0', 20).page).toBe(1);
		expect(paginate(items, 'abc', 20).page).toBe(1);
		expect(paginate(items, null, 20).page).toBe(1);
	});

	it('has one page when empty', () => {
		expect(paginate([], '5', 20)).toEqual({ page: 1, totalPages: 1, items: [] });
	});
});
