import { describe, it, expect } from 'vitest';
import { questionView } from './questionView';
import type { Group, PreviewVariable, Variable } from './types';

const mkVar = (p: Partial<Variable>): Variable => ({
	id: '',
	name: '',
	concept: '',
	question: '',
	prequestion_text: '',
	ivu_instructions: '',
	answer_type: '',
	has_other: false,
	has_long_list: false,
	long_list_standard: '',
	categories: [],
	...p
});
const mkGroup = (p: Partial<Group>): Group => ({
	id: 'g',
	type: '',
	concept: '',
	description: '',
	...p
});

const cats = [
	{ value: '1', label: 'Yes' },
	{ value: '2', label: 'No' }
];

describe('questionView', () => {
	it('shows a grid group as a grid', () => {
		const group = mkGroup({
			id: 'g',
			type: 'grid',
			concept: 'Trust',
			description: 'How much do you trust…'
		});
		const variables = [
			mkVar({ id: 'v1', answer_type: 'single_choice', question: 'Police', categories: cats }),
			mkVar({ id: 'v2', answer_type: 'single_choice', question: 'Courts', categories: cats })
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
		const group = mkGroup({
			id: 'g',
			type: 'multipleResp',
			concept: 'Gender',
			description: 'Your gender?'
		});
		const variables = [
			mkVar({ id: 'v1', name: 'w', answer_type: 'multiple_choice', question: 'female' }),
			mkVar({ id: 'v2', name: 'm', answer_type: 'multiple_choice', question: 'male' }),
			mkVar({ id: 'v3', name: 'o', answer_type: 'text', question: 'self-described' })
		];
		const view = questionView(group, variables, 'multiple_choice_other', 'Other');
		expect(view.answerType).toBe('multiple_choice_other');
		expect(view.variable).toBeNull();
		expect(view.preview?.kind).toBe('survey');
		const v = (view.preview as { variable: PreviewVariable }).variable;
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
		const group = mkGroup({ id: 'g', type: 'other', concept: 'Status' });
		const variables = [
			mkVar({ id: 'v1', answer_type: 'single_choice', concept: 'employed' }),
			mkVar({ id: 'v2', answer_type: 'text' })
		];
		const v = (
			questionView(group, variables, '', 'Sonstiges').preview as {
				variable: PreviewVariable;
			}
		).variable;
		expect(v.other_label).toBe('Sonstiges');
		expect(v.question).toBe('Status');
	});

	it('falls back to the group type, then the first choice type, for the answer type', () => {
		expect(questionView(mkGroup({ type: 'multipleResp' }), [], undefined, '').answerType).toBe(
			'multiple_choice'
		);
		expect(
			questionView(
				mkGroup({ type: 'other' }),
				[mkVar({ answer_type: 'single_choice' })],
				undefined,
				''
			).answerType
		).toBe('single_choice');
	});

	it('shows a standalone variable with its full answer type', () => {
		const variable = mkVar({
			id: 'v',
			// qwacback sends the variant in the type.
			answer_type: 'single_choice_long_list',
			has_long_list: true,
			long_list_standard: 'iso_3166_1',
			concept: 'Country'
		});
		const view = questionView(null, [variable], 'single_choice_long_list', 'Other');
		expect(view.variable).toBe(variable);
		expect(view.longListStandard).toBe('iso_3166_1');
		expect(view.concept).toBe('Country');
		expect(view.preview).toMatchObject({
			kind: 'survey',
			variable: { answer_type: 'single_choice_long_list', has_other: false }
		});
	});

	it('has no preview for an empty group', () => {
		expect(questionView(mkGroup({ type: 'grid' }), [], undefined, '').preview).toBeNull();
	});

	it('hides a concept that only repeats the question', () => {
		const text = 'Themen der Weiterbildung';
		const variable = mkVar({ answer_type: 'single_choice', concept: text, question: text });
		expect(questionView(null, [variable], undefined, '').concept).toBe('');
		expect(questionView(null, [mkVar({ question: text })], undefined, '').concept).toBe('');
	});

	it('hides a group concept that repeats the question in the study language', () => {
		// The page localizes the group; the concept stays in the study's language.
		const group = mkGroup({
			type: 'grid',
			concept: 'Was ist Ihr Geschlecht?',
			description: 'What is your gender?'
		});
		const variables = [mkVar({ answer_type: 'single_choice', question: 'female' })];
		expect(questionView(group, variables, undefined, '').concept).toBe('Was ist Ihr Geschlecht?');
		expect(questionView(group, variables, undefined, '', 'Was ist Ihr Geschlecht?').concept).toBe(
			''
		);
	});

	it("hides a group's fallback concept that repeats its first variable", () => {
		const group = mkGroup({ type: 'grid' });
		const variables = [
			mkVar({ answer_type: 'single_choice', concept: 'Local groups', question: 'Local groups' })
		];
		expect(questionView(group, variables, undefined, '').concept).toBe('');
	});

	it('shows a grid of number rows as a table of number fields (#70)', () => {
		const group = mkGroup({ type: 'grid', description: 'Wie viele Beschäftigte?' });
		const variables = [
			mkVar({ id: 'v1', answer_type: 'integer', question: 'Insgesamt' }),
			mkVar({ id: 'v2', answer_type: 'decimal', question: 'Männlich', grid_note: 'davon:' }),
			mkVar({ id: 'v3', answer_type: 'integer', question: 'Weiblich' })
		];
		const view = questionView(group, variables, 'grid', 'Other');
		expect(view.answerType).toBe('grid');
		expect(view.preview).toMatchObject({
			kind: 'numberGrid',
			question: 'Wie viele Beschäftigte?',
			variables
		});
	});

	it('keeps a grid of choice rows a choice matrix', () => {
		const group = mkGroup({ type: 'grid' });
		const variables = [mkVar({ id: 'v1', answer_type: 'grid', categories: cats })];
		expect(questionView(group, variables, 'grid', '').preview?.kind).toBe('grid');
	});
});
