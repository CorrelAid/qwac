<script lang="ts">
	import { t } from '$lib/i18n';

	const {
		page,
		totalPages,
		totalItems,
		perPage,
		onchange,
		showIfSinglePage = false
	}: {
		page: number;
		totalPages: number;
		/** With perPage, shows the range ("21–40 of 312"). */
		totalItems?: number;
		perPage?: number;
		onchange: (page: number) => void;
		showIfSinglePage?: boolean;
	} = $props();

	let range = $derived(
		totalItems != null && perPage
			? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, totalItems)} ${$t('paginator.of')} ${totalItems}`
			: null
	);
</script>

{#if showIfSinglePage || totalPages > 1}
	<nav class="paginator" aria-label={$t('paginator.label')}>
		<button
			type="button"
			aria-label={$t('paginator.previous')}
			onclick={() => onchange(page - 1)}
			disabled={page <= 1}>&laquo;</button
		>
		<div class="status">
			<span>{$t('paginator.page')} {page} {$t('paginator.of')} {totalPages}</span>
			{#if range}<span class="range">{range}</span>{/if}
		</div>
		<button
			type="button"
			aria-label={$t('paginator.next')}
			onclick={() => onchange(page + 1)}
			disabled={page >= totalPages}>&raquo;</button
		>
	</nav>
{/if}

<style>
	.paginator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-base);
		margin: var(--spacing-lg) auto 0;
	}

	.status {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-size: var(--font-size-small-min);
	}

	.range {
		font-size: var(--font-size-caption-min);
		color: var(--color-text-muted);
	}

	button {
		min-width: 2.5rem;
		padding: var(--spacing-2xs) var(--spacing-sm);
		background-color: var(--color-white);
		border: 1.5px solid var(--color-secondary);
		border-radius: var(--radius-sm);
		color: var(--color-secondary);
		font-family: var(--font-family-body);
		font-size: var(--font-size-body-min);
		font-weight: var(--font-weight-bold);
		cursor: pointer;
		transition: all 0.15s;
	}

	button:hover:not(:disabled) {
		background-color: var(--color-secondary);
		color: var(--color-white);
	}

	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
