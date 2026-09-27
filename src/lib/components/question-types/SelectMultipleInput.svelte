<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Category } from '$lib/types';
	let { categories }: { categories: Pick<Category, 'label' | 'value'>[] } = $props();
</script>

<fieldset>
	<legend class="sr-only">{$t('preview.selectAll')}</legend>
	{#each categories as cat, i (i)}
		<label class="option">
			<input type="checkbox" tabindex="-1" aria-disabled="true" />
			<span>{cat.label || cat.value}</span>
		</label>
	{/each}
</fieldset>

<style>
	fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}

	.option {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) 0;
		font-size: var(--font-size-body-min);
		color: var(--color-text-primary);
		cursor: default;
	}

	.option input {
		accent-color: var(--color-secondary);
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}
</style>
