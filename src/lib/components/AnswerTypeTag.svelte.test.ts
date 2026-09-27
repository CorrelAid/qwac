import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import AnswerTypeTag from './AnswerTypeTag.svelte';

describe('AnswerTypeTag', () => {
	it('shows the registry label', async () => {
		await render(AnswerTypeTag, { type: 'single_choice_other' });
		await expect.element(page.getByText('Select One with Other')).toBeInTheDocument();
	});

	it('still shows a tag for an unknown type', async () => {
		await render(AnswerTypeTag, { type: 'geo_point_other' });
		await expect.element(page.getByText('Geo Point')).toBeInTheDocument();
	});

	it('renders nothing without a type', async () => {
		const { container } = await render(AnswerTypeTag, { type: '' });
		expect(container.querySelector('.type-tag')).toBeNull();
	});
});
