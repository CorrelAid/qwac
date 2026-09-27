<script lang="ts">
	import { resolve } from '$app/paths';
	import { locale, t } from '$lib/i18n';
	import { metadata } from '$lib/metadata';
	import { content } from 'virtual:cdl-content';

	$effect(() => {
		$metadata.title = $t('imprint.title');
	});
</script>

<main class="container">
	<a href={resolve('/')} class="back-link">&larr; {$t('imprint.back')}</a>
	<h1>{$t('imprint.title')}</h1>

	<section>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own i18n string -->
		<p>{@html $t('imprint.text')}</p>
	</section>

	<!-- eslint-disable-next-line svelte/no-at-html-tags -- build-time CDL snippet; sanitising is #27 -->
	{@html content.liability[$locale]}
</main>

<style>
	.container {
		max-width: 700px;
		margin: var(--spacing-base) auto;
	}

	h1 {
		color: var(--color-secondary);
		margin-bottom: var(--spacing-lg);
	}

	section {
		margin-bottom: var(--spacing-lg);
	}

	p {
		line-height: var(--line-height-relaxed);
	}

	.back-link {
		display: inline-block;
		margin-bottom: var(--spacing-base);
		font-size: var(--font-size-small-min);
		color: var(--color-secondary);
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	a {
		color: var(--color-secondary);
	}
</style>
