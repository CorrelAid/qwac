<script lang="ts">
	import { t } from '$lib/i18n';

	const {
		page,
		totalPages,
		onchange,
		showIfSinglePage = false
	}: {
		page: number;
		totalPages: number;
		onchange: (page: number) => void;
		showIfSinglePage?: boolean;
	} = $props();
</script>

{#if showIfSinglePage || totalPages > 1}
	<div class="paginator">
		<button
			type="button"
			aria-label={$t('paginator.previous')}
			onclick={() => onchange(page - 1)}
			disabled={page <= 1}>&laquo;</button
		>
		<div>{$t('paginator.page')} {page} {$t('paginator.of')} {totalPages}</div>
		<button
			type="button"
			aria-label={$t('paginator.next')}
			onclick={() => onchange(page + 1)}
			disabled={page >= totalPages}>&raquo;</button
		>
	</div>
{/if}

<style>
	.paginator {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: auto;
	}
</style>
