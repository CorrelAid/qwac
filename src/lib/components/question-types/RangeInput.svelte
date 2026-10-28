<script lang="ts">
	import { rangeAttrs } from '$lib/questionTypes';
	import type { RangeBounds } from '$lib/types';
	let { range }: { range?: RangeBounds } = $props();

	// Only the bounds qwacback delivers; without them, the browser's defaults.
	let attrs = $derived(rangeAttrs(range));
</script>

<div class="range-field">
	<input type="range" class="range-input" tabindex="-1" aria-disabled="true" {...attrs} />
	{#if attrs.min !== undefined && attrs.max !== undefined}
		<div class="bounds" aria-hidden="true">
			<span>{attrs.min}</span>
			<span>{attrs.max}</span>
		</div>
	{/if}
</div>

<style>
	.range-field {
		width: 100%;
		max-width: 400px;
	}

	.range-input {
		width: 100%;
		accent-color: var(--color-secondary);
	}

	.bounds {
		display: flex;
		justify-content: space-between;
		font-size: var(--font-size-caption-min);
		color: var(--color-text-muted);
	}
</style>
