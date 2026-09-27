<script lang="ts">
	import { resolve } from '$app/paths';
	import { clearOnAuthError, fetchApiBlob } from '$lib/pocketbase';
	import QuestionCard from '$lib/components/QuestionCard.svelte';
	import { metadata } from '$lib/metadata';
	import { stripMarkup } from '$lib/text';
	import { t } from '$lib/i18n';
	import { downloadBlob, safeFilename } from '$lib/download';

	let { data } = $props();

	let study = $derived(data.study);
	// Name and affiliation, e.g. "New Economics Foundation, NEF Consulting".
	let author = $derived([study.author, study.author_affiliation].filter(Boolean).join(', '));
	let questions = $derived(data.questions);
	let exporting = $state(false);
	// The export error belongs to one study; it disappears on navigation.
	let exportFailedFor = $state<string | null>(null);
	let exportFailed = $derived(exportFailedFor === data.id);

	$effect(() => {
		$metadata.title = study.title;
	});

	async function exportDdiXml() {
		const id = data.id;
		exporting = true;
		exportFailedFor = null;
		try {
			const blob = await fetchApiBlob(`/api/studies/${id}/export`);
			downloadBlob(blob, `${safeFilename(study?.title ?? '', `study-${id}`)}.xml`);
		} catch (e) {
			clearOnAuthError(e);
			exportFailedFor = id;
		} finally {
			exporting = false;
		}
	}
</script>

<article class="study-detail">
	<a href={resolve('/')} class="back-link">&larr; {$t('study.back')}</a>

	<div class="title-row">
		<h1>{study.title}</h1>
		<div class="export">
			<button class="export-btn" onclick={exportDdiXml} disabled={exporting}>
				{exporting ? $t('study.exporting') : $t('study.exportDdi')}
			</button>
			{#if exportFailed}
				<p class="export-error" role="alert">{$t('study.exportFailed')}</p>
			{/if}
		</div>
	</div>

	<div class="meta-grid">
		{#if study.author}
			<div class="meta-item">
				<strong>{$t('study.author')}</strong>
				<span>{author}</span>
			</div>
		{/if}
		{#if study.time_period}
			<div class="meta-item">
				<strong>{$t('study.timePeriod')}</strong><span>{study.time_period}</span>
			</div>
		{/if}
		{#if study.analysis_unit}
			<div class="meta-item">
				<strong>{$t('study.analysisUnit')}</strong><span>{study.analysis_unit}</span>
			</div>
		{/if}
		{#if study.universe}
			<div class="meta-item">
				<strong>{$t('study.universe')}</strong><span>{study.universe}</span>
			</div>
		{/if}
		{#if study.language}
			<div class="meta-item">
				<strong>{$t('study.language')}</strong><span>{study.language}</span>
			</div>
		{/if}
		{#if study.data_kind}
			<div class="meta-item">
				<strong>{$t('study.dataKind')}</strong><span>{study.data_kind}</span>
			</div>
		{/if}
		{#if study.holdings_uri}
			<div class="meta-item">
				<strong>{$t('study.source')}</strong>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external source URL -->
				<a href={study.holdings_uri} target="_blank" rel="noopener">
					{study.holdings_description || study.holdings_uri}
				</a>
			</div>
		{/if}
	</div>

	{#if study.topic_classifications?.length}
		<div class="tags">
			{#each study.topic_classifications as tc (tc)}
				<span class="tag">{tc}</span>
			{/each}
		</div>
	{/if}

	{#if study.abstract}
		<div class="abstract">
			<h2>{$t('study.abstract')}</h2>
			<p>{stripMarkup(study.abstract)}</p>
		</div>
	{/if}

	<section class="variables-section">
		<h2>{$t('study.questions')} ({questions.length})</h2>
		{#if questions.length === 0}
			<p>{$t('study.noQuestions')}</p>
		{:else}
			<ul class="variable-list">
				{#each questions as question (question.id)}
					<li id="q-{question.id}">
						<QuestionCard {question} headingLevel={3} />
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</article>

<style>
	.study-detail {
		max-width: 900px;
		margin: var(--spacing-base) auto;
		overflow-wrap: break-word;
		word-break: break-word;
	}

	.back-link {
		font-size: var(--font-size-small-min);
		color: var(--color-secondary);
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.title-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	h1 {
		/* Same size as before it became the page heading. */
		--min-size: var(--font-size-h2-min);
		--max-size: var(--font-size-h2-max);
		color: var(--color-secondary);
		margin: var(--spacing-sm) 0 var(--spacing-base);
	}

	.export {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		max-width: 320px;
	}

	.export-error {
		margin: var(--spacing-2xs) 0 0;
		font-size: var(--font-size-small-min);
		color: var(--color-error);
		text-align: right;
	}

	.export-btn {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-2xs) var(--spacing-sm);
		background: none;
		border: 1.5px solid var(--color-secondary);
		border-radius: var(--radius-sm);
		color: var(--color-secondary);
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-caption-min);
		font-family: var(--font-family-body);
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
	}

	.export-btn:hover:not(:disabled) {
		background-color: var(--color-secondary);
		color: var(--color-white);
	}

	.export-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-base);
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		font-size: var(--font-size-small-min);
	}

	.meta-item strong {
		font-size: var(--font-size-caption-min);
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-wider);
		color: var(--color-text-muted);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2xs);
		margin-bottom: var(--spacing-base);
	}

	.tag {
		font-size: var(--font-size-caption-min);
		padding: var(--spacing-2xs) var(--spacing-xs);
		background-color: var(--color-tertiary);
		border-radius: var(--radius-sm);
		color: var(--color-text-primary);
	}

	.abstract {
		margin-bottom: var(--spacing-lg);
	}

	.abstract h2 {
		--min-size: var(--font-size-h3-min);
		--max-size: var(--font-size-h3-max);
		margin-bottom: var(--spacing-xs);
		color: var(--color-secondary);
	}

	.abstract p {
		line-height: var(--line-height-relaxed);
	}

	.variables-section h2 {
		--min-size: var(--font-size-h3-min);
		--max-size: var(--font-size-h3-max);
		color: var(--color-secondary);
		margin-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-tertiary);
		padding-bottom: var(--spacing-2xs);
	}

	.variable-list {
		list-style: none;
		padding: 0;
	}

	.variable-list > li {
		margin-bottom: var(--spacing-base);
	}
</style>
