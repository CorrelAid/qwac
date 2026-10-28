import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import NumberGridPreview from './NumberGridPreview.svelte';
import type { GridRow } from '$lib/types';

// CVTS7, question 1.1.
const rows: GridRow[] = [
	{ id: 'v1', answer_type: 'integer', question: 'Beschäftigte am 31.12.2025 insgesamt' },
	{
		id: 'v2',
		answer_type: 'integer',
		question: 'Männlich',
		grid_note: 'davon: Geschlecht (nach Geburtenregister)'
	},
	{ id: 'v3', answer_type: 'integer', question: 'Weiblich' }
];

describe('NumberGridPreview', () => {
	it('shows the question and a number field per row', async () => {
		const { container } = await render(NumberGridPreview, {
			variables: rows,
			question: 'Wie viele in Deutschland Beschäftigte hatte Ihr Unternehmen insgesamt?'
		});
		await expect
			.element(page.getByText('Wie viele in Deutschland Beschäftigte hatte Ihr Unternehmen'))
			.toBeInTheDocument();
		const inputs = [...container.querySelectorAll('input[type=number]')];
		expect(inputs).toHaveLength(3);
		expect(inputs.map((i) => i.getAttribute('step'))).toEqual(['1', '1', '1']);
		await expect.element(page.getByRole('spinbutton', { name: 'Männlich' })).toBeInTheDocument();
		expect(container.querySelectorAll('input[type=radio], input[type=checkbox]')).toHaveLength(0);
	});

	it('shows a grid note as a heading before its row', async () => {
		const { container } = await render(NumberGridPreview, { variables: rows });
		expect(container.querySelector('th[scope=rowgroup]')?.textContent).toBe(
			'davon: Geschlecht (nach Geburtenregister)'
		);
		const cells = [...container.querySelectorAll('tbody th')].map((th) => th.textContent);
		expect(cells).toEqual([
			'Beschäftigte am 31.12.2025 insgesamt',
			'davon: Geschlecht (nach Geburtenregister)',
			'Männlich',
			'Weiblich'
		]);
	});

	it('works without grid notes', async () => {
		const plain = rows.map((row) => ({ ...row, grid_note: undefined }));
		const { container } = await render(NumberGridPreview, { variables: plain });
		expect(container.querySelectorAll('.note-row')).toHaveLength(0);
		expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
	});

	it('gives range rows the bounds qwacback delivers (qwacback#65)', async () => {
		const ranges: GridRow[] = [
			{ id: 'a', answer_type: 'range', question: 'Mo', range: { min: 0, max: 24, step: 2 } },
			{ id: 'b', answer_type: 'range', question: 'Di', range: { min: 1, max: 10 } },
			{ id: 'c', answer_type: 'range', question: 'Mi' }
		];
		const { container } = await render(NumberGridPreview, { variables: ranges });
		const attrs = [...container.querySelectorAll('input')].map((i) =>
			['min', 'max', 'step'].map((a) => i.getAttribute(a))
		);
		expect(attrs).toEqual([
			['0', '24', '2'],
			['1', '10', '1'],
			[null, null, '1']
		]);
	});

	it('heads the column with a hint all rows share, otherwise shows it per row', async () => {
		const shared = rows.map((row) => ({ ...row, hint: 'Anzahl' }));
		const a = await render(NumberGridPreview, { variables: shared });
		expect(a.container.querySelector('thead th')?.textContent).toBe('Anzahl');
		expect(a.container.querySelectorAll('.hint')).toHaveLength(0);
		await a.unmount();

		const mixed: GridRow[] = [
			{ id: 'a', answer_type: 'integer', question: 'Kurse', hint: 'Anzahl' },
			{ id: 'b', answer_type: 'decimal', question: 'Kosten', hint: 'Volle Euro' }
		];
		const b = await render(NumberGridPreview, { variables: mixed });
		expect(b.container.querySelector('thead')).toBeNull();
		expect([...b.container.querySelectorAll('.hint')].map((h) => h.textContent)).toEqual([
			'Anzahl',
			'Volle Euro'
		]);
		expect(b.container.querySelectorAll('input')[1].getAttribute('step')).toBe('any');
	});
});
