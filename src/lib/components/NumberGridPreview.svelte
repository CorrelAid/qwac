<script lang="ts">
	import { baseType } from '$lib/questionTypes';
	import type { GridRow } from '$lib/types';
	let { variables = [], question = '' }: { variables?: GridRow[]; question?: string } = $props();

	const rowLabel = (row: GridRow): string => row.question || row.concept || '';

	// A hint every row shares (e.g. "Anzahl") heads the column instead of
	// repeating on each row.
	let sharedHint = $derived.by(() => {
		const hint = variables[0]?.hint?.trim() ?? '';
		return hint && variables.every((row) => (row.hint?.trim() ?? '') === hint) ? hint : '';
	});

	// A grid note (e.g. "davon: Geschlecht") starts a new group of rows.
	let sections = $derived.by(() => {
		const out: { note: string; rows: GridRow[] }[] = [];
		for (const row of variables) {
			const note = row.grid_note?.trim() ?? '';
			if (note || out.length === 0) out.push({ note, rows: [] });
			out[out.length - 1].rows.push(row);
		}
		return out;
	});

	function inputAttrs(row: GridRow) {
		switch (baseType(row.answer_type)) {
			case 'decimal':
				return { step: 'any', placeholder: '0.00' };
			default:
				return { step: 1, placeholder: '0' };
		}
	}
</script>

{#if question}
	<p class="grid-question">{question}</p>
{/if}
<div class="grid-table-wrapper">
	<table class="number-table">
		{#if sharedHint}
			<thead>
				<tr>
					<td></td>
					<th scope="col" class="hint-col">{sharedHint}</th>
				</tr>
			</thead>
		{/if}
		{#each sections as section, i (i)}
			<tbody>
				{#if section.note}
					<tr class="note-row">
						<th scope="rowgroup" colspan="2">{section.note}</th>
					</tr>
				{/if}
				{#each section.rows as row (row.id)}
					{@const hint = sharedHint ? '' : (row.hint?.trim() ?? '')}
					<tr>
						<!-- A grid row is a variable inside a group, not a question of its own (#14). -->
						<th scope="row" class="item-cell">{rowLabel(row)}</th>
						<td class="input-cell">
							<input
								type="number"
								class="number-input"
								aria-label={hint ? `${rowLabel(row)} (${hint})` : rowLabel(row)}
								readonly
								tabindex="-1"
								aria-disabled="true"
								{...inputAttrs(row)}
							/>
							{#if hint}
								<span class="hint">{hint}</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		{/each}
	</table>
</div>

<style>
	/* See SurveyPreview: full contrast, but not interactive. */
	.number-input {
		pointer-events: none;
	}

	.grid-question {
		font-size: var(--font-size-body-min);
		line-height: var(--line-height-relaxed);
		margin-bottom: var(--spacing-sm);
	}

	.grid-table-wrapper {
		overflow-x: auto;
	}

	.number-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-size-small-min);
	}

	.number-table th,
	.number-table td {
		padding: var(--spacing-xs) var(--spacing-sm);
		border-bottom: 1px solid var(--color-tertiary);
		text-align: left;
		vertical-align: middle;
	}

	.hint-col {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		font-size: var(--font-size-caption-min);
	}

	.item-cell {
		font-weight: var(--font-weight-normal);
		font-size: var(--font-size-body-min);
		min-width: 200px;
	}

	.note-row th {
		font-weight: var(--font-weight-medium);
		font-size: var(--font-size-small-min);
		color: var(--color-text-muted);
		padding-top: var(--spacing-sm);
	}

	.input-cell {
		white-space: nowrap;
	}

	.number-input {
		width: 10rem;
		max-width: 100%;
		padding: var(--spacing-2xs) var(--spacing-xs);
		border: var(--dimension-border-width) solid var(--color-primary-darker);
		border-radius: var(--radius-sm);
		font-family: var(--font-family-body);
		font-size: var(--font-size-body-min);
		background-color: var(--color-white);
		color: var(--color-text-primary);
	}

	.hint {
		margin-left: var(--spacing-xs);
		font-size: var(--font-size-caption-min);
		color: var(--color-text-muted);
	}

	tbody tr:not(.note-row):hover {
		background-color: var(--color-surface-subtle);
	}
</style>
