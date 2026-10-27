<script lang="ts">
	import { asset } from '$app/paths';
	import { t } from '$lib/i18n';
	import { ccLicense } from '$lib/license';
	import type { Attribution } from '$lib/types';

	// `full` lists the terms with the license's button; `credit` is one line to
	// put next to an export, saying what to credit (#66).
	let {
		attribution,
		variant = 'full',
		source = true
	}: {
		attribution: Attribution;
		variant?: 'full' | 'credit';
		/** Whether to link the source (the study page lists it already). */
		source?: boolean;
	} = $props();

	let cc = $derived(ccLicense(attribution.license_id));
</script>

{#if variant === 'credit'}
	<p class="credit">
		<strong>{$t('license.credit')}</strong>
		{#if attribution.citation}{attribution.citation}{/if}
		{#if cc}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external license deed -->
			<a href={cc.deed} target="_blank" rel="license noopener">{cc.name}</a>.
			{#if cc.shareAlike}{$t('license.shareAlike')}{/if}
		{:else if !attribution.license}
			{$t('license.notStated')}.
		{:else if !attribution.citation}
			{attribution.copyright || attribution.license}
		{/if}
	</p>
{:else}
	<section class="license" aria-labelledby="license-heading">
		<h2 id="license-heading">{$t('license.heading')}</h2>
		<dl>
			<div>
				<dt>{$t('license.license')}</dt>
				<dd>
					{#if cc}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external license deed -->
						<a class="cc-button" href={cc.deed} target="_blank" rel="license noopener">
							<img src={asset(cc.button)} alt={cc.name} width="88" height="31" />
						</a>
					{/if}
					<span class="terms">{attribution.license || $t('license.notStated')}</span>
					{#if cc?.shareAlike}
						<span class="share-alike">{$t('license.shareAlike')}</span>
					{/if}
				</dd>
			</div>
			{#if attribution.copyright}
				<div>
					<dt>{$t('license.copyright')}</dt>
					<dd>{attribution.copyright}</dd>
				</div>
			{/if}
			{#if attribution.citation}
				<div>
					<dt>{$t('license.citation')}</dt>
					<dd>{attribution.citation}</dd>
				</div>
			{/if}
			{#if source && attribution.source_uri}
				<div>
					<dt>{$t('license.source')}</dt>
					<dd>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external source URL -->
						<a href={attribution.source_uri} target="_blank" rel="noopener"
							>{attribution.source_uri}</a
						>
					</dd>
				</div>
			{/if}
		</dl>
	</section>
{/if}

<style>
	.license {
		margin-bottom: var(--spacing-base);
		font-size: var(--font-size-small-min);
	}

	h2 {
		--min-size: var(--font-size-h3-min);
		--max-size: var(--font-size-h3-max);
		color: var(--color-secondary);
		margin-bottom: var(--spacing-xs);
	}

	dl {
		margin: 0;
		display: grid;
		gap: var(--spacing-xs);
	}

	dt {
		font-size: var(--font-size-caption-min);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-muted);
	}

	dd {
		margin: 0;
	}

	.cc-button {
		display: inline-block;
		vertical-align: middle;
		margin-right: var(--spacing-xs);
	}

	.cc-button img {
		display: block;
	}

	.share-alike {
		display: block;
		margin-top: var(--spacing-2xs);
		font-weight: var(--font-weight-medium);
	}

	.credit {
		font-size: var(--font-size-small-min);
		margin: 0 0 var(--spacing-sm);
		color: var(--color-text-muted);
	}

	.credit a {
		white-space: nowrap;
	}
</style>
