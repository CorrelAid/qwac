<script lang="ts">
	let {
		variables,
		activeId = null,
		question = ''
	}: { variables: any[]; activeId?: string | null; question?: string } = $props();

	let categories = $derived(variables[0]?.categories || []);
	let isMultiple = $derived(
		variables[0]?.answer_type === 'select_multiple' ||
			variables[0]?.answer_type === 'multiple_choice'
	);
</script>

{#if question}
	<p class="grid-question">{question}</p>
{/if}
<div class="grid-table-wrapper">
	<table class="grid-table">
		<thead>
			<tr>
				<th class="item-col"></th>
				{#each categories as cat, i (i)}
					<th class="cat-col">{cat.label ?? cat.labl ?? cat.value ?? cat.catValu ?? ''}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each variables as variable (variable.id)}
				<tr class:active-row={activeId && variable.id === activeId}>
					<td class="item-cell">
						<a href="/questions/{variable.id}" class="item-name"
							>{variable.question || variable.concept}</a
						>
					</td>
					{#each categories as _, i (i)}
						<td class="input-cell">
							{#if isMultiple}
								<input type="checkbox" disabled />
							{:else}
								<input type="radio" name="grid-{variable.id}" disabled />
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.grid-question {
		font-size: var(--font-size-body-min);
		font-weight: var(--font-weight-semibold);
		margin-bottom: var(--spacing-sm);
	}

	.grid-table-wrapper {
		overflow-x: auto;
	}

	.grid-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-size-small-min);
	}

	.grid-table th,
	.grid-table td {
		padding: var(--spacing-xs) var(--spacing-sm);
		border-bottom: 1px solid var(--color-tertiary);
		text-align: center;
		vertical-align: middle;
	}

	.item-col {
		text-align: left;
		min-width: 200px;
	}

	.cat-col {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		font-size: var(--font-size-caption-min);
		min-width: 80px;
	}

	.item-cell {
		text-align: left;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.item-name {
		font-weight: var(--font-weight-semibold);
		color: var(--color-secondary);
		font-size: var(--font-size-body-min);
		text-decoration: none;
	}

	.item-name:hover {
		text-decoration: underline;
	}

	.input-cell {
		text-align: center;
	}

	.input-cell input {
		accent-color: var(--color-secondary);
		width: 18px;
		height: 18px;
		cursor: default;
	}

	tbody tr:hover {
		background-color: #fafafa;
	}

	tbody tr.active-row {
		background-color: var(--color-tertiary);
	}
</style>
