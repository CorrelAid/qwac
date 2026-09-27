<script lang="ts">
	import { typeLabel } from '$lib/questionTypes';

	let { type }: { type: string } = $props();

	// The registry's label; an unknown type still gets a tag, made from its name.
	let label = $derived(typeLabel(type));
</script>

{#if type}
	<span class="type-tag">{label}</span>
{/if}

<style>
	.type-tag {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-size: var(--font-size-caption-min);
		padding: 1px var(--spacing-xs);
		border-radius: var(--radius-sm);
		background-color: var(--color-tertiary);
		color: var(--color-text-primary);
		white-space: nowrap;
	}
</style>
