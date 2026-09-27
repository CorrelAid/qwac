import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { locale } from '$lib/i18n';
import SurveyPreview from './SurveyPreview.svelte';

const categories = [
	{ value: '1', label: 'Yes' },
	{ value: '2', label: 'No' }
];

beforeEach(() => locale.set('en'));

function inputs(container: HTMLElement, selector = 'input, select') {
	return [...container.querySelectorAll<HTMLInputElement>(selector)];
}

describe('SurveyPreview', () => {
	it('shows the question, pre-question text and interviewer note', async () => {
		await render(SurveyPreview, {
			variable: {
				answer_type: 'text',
				question: 'What do you do?',
				prequestion_text: 'About your work',
				ivu_instructions: 'Read out'
			}
		});
		await expect.element(page.getByText('What do you do?')).toBeInTheDocument();
		await expect.element(page.getByText('About your work')).toBeInTheDocument();
		await expect.element(page.getByText('Read out')).toBeInTheDocument();
		await expect.element(page.getByText('Interviewer note')).toBeInTheDocument();
	});

	it('shows the hint and the skip-logic condition without evaluating it (#60)', async () => {
		await render(SurveyPreview, {
			variable: {
				answer_type: 'integer',
				question: 'Seit wann sind Sie in Rente?',
				hint: 'Jahr angeben',
				universe: 'Only if “Wie alt sind Sie?” > 60'
			}
		});
		await expect.element(page.getByText('Jahr angeben')).toBeInTheDocument();
		await expect.element(page.getByText('Only if “Wie alt sind Sie?” > 60')).toBeInTheDocument();
		await expect.element(page.getByText('Condition')).toBeInTheDocument();
	});

	it.each([
		['text', 'input[type=text]'],
		['integer', 'input[type=number][step="1"]'],
		['decimal', 'input[type=number][step=any]'],
		['date', 'input[type=date]'],
		['time', 'input[type=time]'],
		['datetime', 'input[type=datetime-local]'],
		// New in qwacback (#61).
		['range', 'input[type=range]']
	])('renders %s as %s', async (answer_type, selector) => {
		const { container } = await render(SurveyPreview, { variable: { answer_type } });
		const found = inputs(container);
		expect(found).toHaveLength(1);
		expect(found[0].matches(selector)).toBe(true);
	});

	it('renders single choice as radio buttons', async () => {
		const { container } = await render(SurveyPreview, {
			variable: { answer_type: 'single_choice', categories }
		});
		expect(inputs(container, 'input[type=radio]')).toHaveLength(2);
		await expect.element(page.getByText('Yes')).toBeInTheDocument();
	});

	it('renders multiple choice as checkboxes', async () => {
		const { container } = await render(SurveyPreview, {
			variable: { answer_type: 'select_multiple', categories }
		});
		expect(inputs(container, 'input[type=checkbox]')).toHaveLength(2);
	});

	it('adds an "Other" option with a text field', async () => {
		const { container } = await render(SurveyPreview, {
			variable: { answer_type: 'single_choice_other', categories }
		});
		expect(inputs(container, 'input[type=radio]')).toHaveLength(3);
		expect(inputs(container, 'input[type=text]')).toHaveLength(1);
		await expect.element(page.getByText('Other:')).toBeInTheDocument();
	});

	it('uses the given "Other" label and the has_other flag', async () => {
		const { container } = await render(SurveyPreview, {
			variable: {
				answer_type: 'multiple_choice',
				categories,
				has_other: true,
				other_label: 'Something else'
			}
		});
		expect(inputs(container, 'input[type=checkbox]')).toHaveLength(3);
		await expect.element(page.getByText('Something else:')).toBeInTheDocument();
	});

	it('renders a long list as a select with its standard', async () => {
		const { container } = await render(SurveyPreview, {
			variable: {
				answer_type: 'select_one_long_list',
				concept: 'Country',
				long_list_standard: 'iso_3166_1'
			}
		});
		expect(inputs(container, 'select')).toHaveLength(1);
		await expect.element(page.getByText('Standard: iso_3166_1')).toBeInTheDocument();
	});

	it('renders no input for a choice without categories or an unknown type', async () => {
		for (const variable of [{ answer_type: 'single_choice' }, { answer_type: 'geo_point' }]) {
			const { container, unmount } = await render(SurveyPreview, { variable });
			expect(inputs(container), variable.answer_type).toHaveLength(0);
			await unmount();
		}
	});
});
