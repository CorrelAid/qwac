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

	<h2>{$t('about.title')}</h2>

	<section>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- build-time CDL snippet; sanitising is #27 -->
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

	h2 {
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
