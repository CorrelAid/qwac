import { describe, it, expect } from 'vitest';
import { questionView } from './questionView';

const cats = [
	{ value: '1', label: 'Yes' },
	{ value: '2', label: 'No' }
];

describe('questionView', () => {
	it('shows a grid group as a grid', () => {
		const group = {
			id: 'g',
			type: 'grid',
			concept: 'Trust',
			description: 'How much do you trust…'
		};
		const variables = [
			{ id: 'v1', answer_type: 'single_choice', question: 'Police', categories: cats },
			{ id: 'v2', answer_type: 'single_choice', question: 'Courts', categories: cats }
		];
		const view = questionView(group, variables, undefined, 'Other');
		expect(view.answerType).toBe('grid');
		expect(view.concept).toBe('Trust');
		expect(view.preview).toMatchObject({
			kind: 'grid',
			question: 'How much do you trust…',
			variables
		});
	});

	it('shows a choice group as one question, with the text variable as "Other"', () => {
		const group = { id: 'g', type: 'multipleResp', concept: 'Gender', description: 'Your gender?' };
		const variables = [
			{ id: 'v1', name: 'w', answer_type: 'multiple_choice', question: 'female' },
			{ id: 'v2', name: 'm', answer_type: 'multiple_choice', question: 'male' },
			{ id: 'v3', name: 'o', answer_type: 'text', question: 'self-described' }
		];
		const view = questionView(group, variables, 'multiple_choice_other', 'Other');
		expect(view.answerType).toBe('multiple_choice_other');
		expect(view.variable).toBeNull();
		expect(view.preview?.kind).toBe('survey');
		const v = (view.preview as { variable: Record<string, unknown> }).variable;
		expect(v).toMatchObject({
			question: 'Your gender?',
			answer_type: 'select_multiple',
			has_other: true,
			other_label: 'self-described',
			categories: [
				{ label: 'female', value: 'w' },
				{ label: 'male', value: 'm' }
			]
		});
	});

	it('uses the fallback label for an "Other" variable without text', () => {
		const group = { id: 'g', type: 'other', concept: 'Status' };
		const variables = [
			{ id: 'v1', answer_type: 'single_choice', concept: 'employed' },
			{ id: 'v2', answer_type: 'text' }
		];
		const v = (
			questionView(group, variables, '', 'Sonstiges').preview as {
				variable: Record<string, unknown>;
			}
		).variable;
		expect(v.other_label).toBe('Sonstiges');
		expect(v.question).toBe('Status');
	});

	it('falls back to the group type, then the first choice type, for the answer type', () => {
		expect(questionView({ type: 'multipleResp' }, [], undefined, '').answerType).toBe(
			'multiple_choice'
		);
		expect(
			questionView({ type: 'other' }, [{ answer_type: 'single_choice' }], undefined, '').answerType
		).toBe('single_choice');
	});

	it('shows a standalone variable with its variant from the flags', () => {
		const variable = {
			id: 'v',
			answer_type: 'single_choice',
			has_long_list: true,
			long_list_standard: 'iso_3166_1',
			concept: 'Country'
		};
		const view = questionView(null, [variable], 'single_choice_long_list', 'Other');
		expect(view.variable).toBe(variable);
		expect(view.longListStandard).toBe('iso_3166_1');
		expect(view.concept).toBe('Country');
		expect(view.preview).toMatchObject({
			kind: 'survey',
			variable: { answer_type: 'select_one_long_list', has_other: false }
		});
	});

	it('has no preview for an empty group', () => {
		expect(questionView({ type: 'grid' }, [], undefined, '').preview).toBeNull();
	});
});
