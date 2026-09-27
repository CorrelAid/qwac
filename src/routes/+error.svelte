<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { metadata } from '$lib/metadata';

	let notFound = $derived(page.status === 404);
	let title = $derived(notFound ? $t('error.notFoundTitle') : $t('error.title'));
	let retrying = $state(false);

	$effect(() => {
		$metadata.title = title;
	});

	async function retry() {
		retrying = true;
		try {
			// Re-runs the page's load; on success SvelteKit renders the page instead.
			await invalidateAll();
		} finally {
			retrying = false;
		}
	}
</script>

<main class="container">
	<h1>{title}</h1>
	<p>{notFound ? $t('error.notFoundText') : $t('error.text')}</p>

	<div class="actions">
		{#if !notFound}
			<button class="retry-btn" onclick={retry} disabled={retrying}>
				{retrying ? $t('error.retrying') : $t('error.retry')}
			</button>
		{/if}
		<a href={resolve('/')} class="back-link">&larr; {$t('error.back')}</a>
	</div>
</main>

<style>
	.container {
		max-width: 700px;
		margin: var(--spacing-base) auto;
	}

	h1 {
		color: var(--color-secondary);
		margin-bottom: var(--spacing-base);
	}

	p {
		line-height: var(--line-height-relaxed);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-base);
		margin-top: var(--spacing-lg);
	}

	.retry-btn {
		padding: var(--spacing-2xs) var(--spacing-sm);
		background: none;
		border: 1.5px solid var(--color-secondary);
		border-radius: var(--radius-sm);
		color: var(--color-secondary);
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-small-min);
		font-family: var(--font-family-body);
		cursor: pointer;
	}

	.retry-btn:hover:not(:disabled) {
		background-color: var(--color-secondary);
		color: var(--color-white);
	}

	.back-link {
		font-size: var(--font-size-small-min);
		color: var(--color-secondary);
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}
</style>
