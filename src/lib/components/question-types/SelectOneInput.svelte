<script lang="ts">
	let { categories }: { categories: any[] } = $props();
</script>

<fieldset disabled>
	<legend class="sr-only">Select one</legend>
	{#each categories as cat, i (i)}
		<label class="option">
			<input type="radio" name="preview-radio" disabled />
			<span>{cat.label ?? cat.labl ?? cat.value ?? cat.catValu ?? ''}</span>
		</label>
	{/each}
</fieldset>

<style>
	fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
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
