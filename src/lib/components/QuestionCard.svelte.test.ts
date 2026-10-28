import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { locale } from '$lib/i18n';
import QuestionCard from './QuestionCard.svelte';
import type { Question } from '$lib/types';

const mkQuestion = (p: Partial<Question>): Question => ({
	id: 'q1',
	study_id: 's1',
	name: 'f2_8_043',
	concept: '',
	question_text: '',
	answer_type: 'single_choice',
	variable_ids: ['q1'],
	order: 0,
	...p
});

describe('QuestionCard', () => {
	it('titles the card by a concept that differs from the question', async () => {
		locale.set('de');
		const { container } = await render(QuestionCard, {
			question: mkQuestion({
				concept: 'Perceived community safety (day)',
				question_text: 'How safe do you feel during the day?'
			})
		});
		await expect
			.element(page.getByRole('link', { name: 'Perceived community safety (day)' }))
			.toBeInTheDocument();
		expect(container.querySelector('.text')?.textContent).toBe(
			'How safe do you feel during the day?'
		);
	});

	it('shows the question once when the concept repeats it', async () => {
		const { container } = await render(QuestionCard, {
			question: mkQuestion({
				concept: 'Themen der Weiterbildung ',
				question_text: 'Themen der Weiterbildung'
			})
		});
		await expect
			.element(page.getByRole('link', { name: 'Themen der Weiterbildung' }))
			.toBeInTheDocument();
		expect(container.querySelector('.text')).toBeNull();
	});

	it('titles the card by the question when it has no concept', async () => {
		await render(QuestionCard, {
			question: mkQuestion({ question_text: 'Wie alt sind Sie?' })
		});
		await expect.element(page.getByRole('link', { name: 'Wie alt sind Sie?' })).toBeInTheDocument();
	});
});
