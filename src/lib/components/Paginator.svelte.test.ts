import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { locale } from '$lib/i18n';
import Paginator from './Paginator.svelte';

beforeEach(() => locale.set('en'));

describe('Paginator', () => {
	it('is hidden for a single page', async () => {
		const { container } = await render(Paginator, { page: 1, totalPages: 1, onchange: vi.fn() });
		expect(container.querySelector('.paginator')).toBeNull();
	});

	it('shows the page and moves back and forth', async () => {
		const onchange = vi.fn();
		await render(Paginator, { page: 2, totalPages: 3, onchange });
		await expect.element(page.getByText('page 2 of 3')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Previous page' }).click();
		await page.getByRole('button', { name: 'Next page' }).click();
		expect(onchange.mock.calls).toEqual([[1], [3]]);
	});

	it('disables the buttons at the ends', async () => {
		await render(Paginator, { page: 1, totalPages: 2, onchange: vi.fn() });
		await expect.element(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Next page' })).toBeEnabled();
	});
});
