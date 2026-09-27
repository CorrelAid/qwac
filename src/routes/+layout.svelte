<script lang="ts">
	import '$lib/styles/main.css';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { LanguageSwitcher } from '@correlaid/cdl-design';
	import { locale, t, type Locale } from '$lib/i18n';

	import LoginBadge from '$lib/components/LoginBadge.svelte';
	import { authModel } from '$lib/pocketbase';
	import { metadata } from '$lib/metadata';
	const { children } = $props();

	const siteName = 'QWAC Frontend';

	const locales = [
		{ code: 'en', label: 'EN' },
		{ code: 'de', label: 'DE' }
	];

	function switchLocale(lang: string) {
		locale.set(lang as Locale);
	}

	$effect(() => {
		if ($page.error) {
			$metadata.title = $page.error.message;
		}
	});
</script>

<svelte:head>
	<title>{$metadata.title} | {siteName}</title>
</svelte:head>

<header class="header-full">
	<a href="{base}/" class="site-title"
		>QWAC <span class="site-subtitle">{$t('layout.subtitle')}</span></a
	>
	<nav class="header-nav">
		<LanguageSwitcher {locales} currentLocale={$locale} onLocaleChange={switchLocale} />
		{#if $authModel}
			<a href="{base}/upload" class="nav-link">{$t('layout.upload')}</a>
		{/if}
		<LoginBadge />
	</nav>
</header>

<div class="app-layout">
	<main class="main-content">
		<div class="container">
			{@render children()}
		</div>
	</main>
</div>

<footer class="footer">
	<a href="{base}/about" class="footer-link">{$t('layout.about')}</a>
	<a href="{base}/imprint" class="footer-link">{$t('layout.imprint')}</a>
</footer>

<style>
	:global(body) {
		font-family: var(--font-family-body);
		background-color: var(--color-background-primary);
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		overflow-x: hidden;
	}

	.site-title {
		font-family: var(--font-family-heading);
		font-size: var(--font-size-h4-min);
		font-weight: var(--font-weight-bold);
		color: var(--color-secondary);
		text-decoration: none;
		min-width: 0;
	}

	.site-subtitle {
		font-weight: var(--font-weight-normal);
		font-size: var(--font-size-small-min);
	}

	.header-full {
		background-color: var(--color-white);
		z-index: 100;
		position: sticky;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-base) var(--spacing-lg);
		border-bottom: var(--dimension-border-width) solid var(--color-primary-darker);
		min-height: 3.5rem;
		gap: var(--spacing-sm);
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.nav-link {
		font-size: var(--font-size-small-min);
		color: var(--color-secondary);
		text-decoration: none;
		font-weight: var(--font-weight-medium);
	}

	.nav-link:hover {
		text-decoration: underline;
	}

	@media (max-width: 600px) {
		.header-full {
			padding: var(--spacing-sm) var(--spacing-base);
			min-height: 3rem;
			position: relative;
		}

		.site-subtitle {
			display: none;
		}
	}

	.app-layout {
		flex: 1;
	}

	.main-content {
		padding: var(--spacing-base) 0;
	}

	.container {
		max-width: var(--dimension-content-max-width);
		margin: 0 auto;
		width: 100%;
		padding: 0 var(--spacing-base);
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-base);
		min-height: 3.5rem;
		padding: var(--spacing-sm) var(--spacing-lg);
		font-size: var(--font-size-small-min);
		border-top: var(--dimension-border-width) solid var(--color-primary-darker);
		background-color: var(--color-white);
		flex-shrink: 0;
		color: var(--color-text-primary);
	}

	.footer-link {
		color: var(--color-secondary);
		text-decoration: none;
	}

	.footer-link:hover {
		text-decoration: underline;
	}
</style>
