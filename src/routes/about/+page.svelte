<script lang="ts">
	import { resolve } from '$app/paths';
	import { metadata } from '$lib/metadata';
	import { locale, t } from '$lib/i18n';
	import { content } from 'virtual:cdl-content';

	$effect(() => {
		$metadata.title = $t('about.title');
	});
</script>

<article class="about">
	<a href={resolve('/')} class="back-link">&larr; {$t('about.back')}</a>

	<h1>{$t('about.title')}</h1>

	<section>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- CDL snippet, sanitised at build time (cdl-content.ts) -->
		{@html content.qwac[$locale]}
	</section>
</article>

<style>
	.back-link {
		font-size: var(--font-size-small-min);
		color: var(--color-secondary);
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.about {
		max-width: 700px;
		margin: var(--spacing-base) auto;
	}

	h1 {
		/* Same size as before it became the page heading. */
		--min-size: var(--font-size-h2-min);
		--max-size: var(--font-size-h2-max);
		color: var(--color-secondary);
		margin-bottom: var(--spacing-lg);
	}

	section {
		margin-bottom: var(--spacing-lg);
	}

	a {
		color: var(--color-secondary);
	}
</style>
