<script lang="ts">
	import { t } from '$lib/i18n';

	let { type }: { type: string } = $props();

	let base = $derived((type || '').replace(/_other$/, '').replace(/_long_list$/, ''));
	let baseLabel = $derived(
		base.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
	);
	let suffix = $derived(
		(type || '').endsWith('_other')
			? $t('answerType.other')
			: (type || '').endsWith('_long_list')
				? $t('answerType.longList')
				: null
	);
</script>

{#if type}
	<span class="type-tag">
		{baseLabel}{#if suffix}
			<span class="sep">&rsaquo;</span> {suffix}{/if}
	</span>
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

	.sep {
		opacity: 0.4;
		font-weight: var(--font-weight-bold);
	}
</style>
