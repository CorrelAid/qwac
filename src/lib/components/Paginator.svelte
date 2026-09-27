<script lang="ts">
	import type { PageStore } from '$lib/pocketbase';
	import { t } from '$lib/i18n';

	const {
		store,
		showIfSinglePage = false
	}: {
		store: PageStore;
		showIfSinglePage?: boolean;
	} = $props();
</script>

{#if showIfSinglePage || $store.totalPages > 1}
	<div class="paginator">
		<button type="button" onclick={() => store.prev()} disabled={$store.page <= 1}>&laquo;</button>
		<div>{$t('paginator.page')} {$store.page} {$t('paginator.of')} {$store.totalPages}</div>
		<button type="button" onclick={() => store.next()} disabled={$store.page >= $store.totalPages}
			>&raquo;</button
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
