import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import GridPreview from './GridPreview.svelte';

const categories = [
	{ value: '1', label: 'Yes' },
	{ value: '2', label: 'Not sure' },
	{ value: '3', label: 'No' }
];

const rows = (answer_type: string) => [
	{ id: 'v1', answer_type, question: 'Local groups', categories },
	{ id: 'v2', answer_type, question: 'Council', categories }
];

describe('GridPreview', () => {
	it('shows the question, the categories as columns and one row per variable', async () => {
		const { container } = await render(GridPreview, {
			variables: rows('single_choice'),
			question: 'Do you know whom to contact?'
		});
		await expect.element(page.getByText('Do you know whom to contact?')).toBeInTheDocument();
		expect([...container.querySelectorAll('th.cat-col')].map((th) => th.textContent)).toEqual([
			'Yes',
			'Not sure',
			'No'
		]);
		expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
		expect(container.querySelectorAll('input[type=radio]')).toHaveLength(6);
	});

	it('uses checkboxes for multiple choice rows', async () => {
		const { container } = await render(GridPreview, { variables: rows('multiple_choice') });
		expect(container.querySelectorAll('input[type=checkbox]')).toHaveLength(6);
	});

	it('shows row labels as plain text, not links (#14)', async () => {
		const { container } = await render(GridPreview, { variables: rows('single_choice') });
		await expect.element(page.getByText('Local groups')).toBeInTheDocument();
		expect(container.querySelectorAll('a')).toHaveLength(0);
	});
});
