import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { locale } from '$lib/i18n';
import FilterBar from './FilterBar.svelte';

beforeEach(() => locale.set('en'));

const filterOptions = [
	{
		label: 'Answer Type',
		key: 'answer_type',
		values: ['select_one', 'integer'],
		labels: { select_one: 'Select One', integer: 'Integer' },
		counts: { select_one: 12, integer: 3 }
	},
	{ label: 'Topic', key: 'topic', values: ['Impact'], kind: 'chip' as const },
	{ label: 'Hidden', key: 'hidden', values: ['x'], hidden: true }
];

async function setup(filters: Record<string, string> = {}, searchQuery = '') {
	const onfilter = vi.fn();
	const onclear = vi.fn();
	const result = await render(FilterBar, {
		searchQuery,
		filters,
		filterOptions,
		onfilter,
		onclear
	});
	return { ...result, onfilter, onclear };
}

describe('FilterBar', () => {
	it('shows options with labels and counts, and hides hidden filters', async () => {
		const { container } = await setup();
		await expect.element(page.getByRole('option', { name: 'Select One (12)' })).toBeInTheDocument();
		expect(container.querySelectorAll('select')).toHaveLength(1);
		expect(container.textContent).not.toContain('Hidden');
	});

	it('reports a select change', async () => {
		const { onfilter } = await setup();
		await page.getByRole('combobox', { name: 'Answer Type' }).selectOptions('integer');
		expect(onfilter).toHaveBeenCalledWith('answer_type', 'integer');
	});

	it('toggles a chip on and off', async () => {
		const first = await setup();
		await page.getByRole('button', { name: 'Impact' }).click();
		expect(first.onfilter).toHaveBeenCalledWith('topic', 'Impact');
		await first.unmount();

		const second = await setup({ topic: 'Impact' });
		const chip = page.getByRole('button', { name: 'Impact' });
		await expect.element(chip).toHaveAttribute('aria-pressed', 'true');
		await chip.click();
		expect(second.onfilter).toHaveBeenCalledWith('topic', '');
	});

	it('shows "Clear" only with an active filter or search, and reports it', async () => {
		const idle = await setup({ answer_type: '' });
		expect(idle.container.querySelector('.clear-btn')).toBeNull();
		await idle.unmount();

		const active = await setup({}, 'trust');
		await page.getByRole('button', { name: 'Clear' }).click();
		expect(active.onclear).toHaveBeenCalledOnce();
	});
});
