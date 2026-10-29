<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { XlsFormDisplay, DdiDisplay } from '@correlaid/cdl-design';
	import SurveyPreview from '$lib/components/SurveyPreview.svelte';
	import GridPreview from '$lib/components/GridPreview.svelte';
	import NumberGridPreview from '$lib/components/NumberGridPreview.svelte';
	import { metadata } from '$lib/metadata';
	import AnswerTypeTag from '$lib/components/AnswerTypeTag.svelte';
	import LicenseNotice from '$lib/components/LicenseNotice.svelte';
	import { t, locale } from '$lib/i18n';
	import { localizeGroup, localizeVariable, questionLabel, questionText } from '$lib/translations';
	import { questionView } from '$lib/questionView';
	import { xlsformSheets } from '$lib/xlsform';
	import { downloadBlob, safeFilename } from '$lib/download';

	let { data } = $props();

	let questionData = $derived(data.question);

	// The tab is in the URL (?tab=xlsform|ddi), so it can be linked to (#23).
	// Another question opens on the preview, since its links carry no tab.
	type Tab = 'preview' | 'xlsform' | 'ddi';
	const TABS: Tab[] = ['preview', 'xlsform', 'ddi'];
	const TAB_LABELS: Record<Tab, string> = {
		preview: 'question.tabPreview',
		xlsform: 'question.tabXlsform',
		ddi: 'question.tabDdi'
	};
	let activeTab = $derived.by((): Tab => {
		const tab = page.url.searchParams.get('tab') as Tab;
		return TABS.includes(tab) ? tab : 'preview';
	});
	// Arrow keys, Home and End move between tabs (WAI-ARIA tabs pattern).
	function onTabKeydown(event: KeyboardEvent) {
		const i = TABS.indexOf(activeTab);
		const next = {
			ArrowRight: TABS[(i + 1) % TABS.length],
			ArrowLeft: TABS[(i - 1 + TABS.length) % TABS.length],
			Home: TABS[0],
			End: TABS[TABS.length - 1]
		}[event.key];
		if (!next) return;
		event.preventDefault();
		selectTab(next);
		document.getElementById(`tab-${next}`)?.focus();
	}

	function selectTab(tab: Tab) {
		const href = resolve('/questions/[id]', { id: data.id });
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- the resolved route plus ?tab
		goto(tab === 'preview' ? href : `${href}?tab=${tab}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	// Derived from the single API response; texts in the UI locale when the
	// study has a translation for it.
	let language = $derived(questionData?.language || questionData?.study?.language || undefined);
	let group = $derived(
		questionData?.group ? localizeGroup(questionData.group, language, $locale) : null
	);
	let study = $derived(questionData?.study ?? null);
	let variables = $derived(
		(questionData?.variables ?? []).map((v) => localizeVariable(v, language, $locale))
	);
	let tags = $derived<{ lang?: string; text: string }[]>(questionData?.tags ?? []);

	let view = $derived(
		questionView(
			group,
			variables,
			questionData?.answer_type,
			$t('preview.other'),
			questionData?.question_text
		)
	);
	let variable = $derived(view.variable);
	// The concept is '' when it is empty or only repeats the question (#68);
	// the page is then titled by the question itself.
	let displayConcept = $derived(view.concept);
	// The name the source prints for the question's group, e.g. "ATTARI-12",
	// heads the page; the question follows in the preview (qwacback#74).
	let label = $derived(group?.label || questionLabel(questionData, $locale));
	let title = $derived(
		label || displayConcept || questionText(questionData, $locale) || questionData?.name || ''
	);

	function downloadXml(xml: string) {
		const name = safeFilename(displayConcept || questionData?.name || '', `question-${data.id}`);
		downloadBlob(new Blob([xml], { type: 'application/xml' }), `${name}.xml`);
	}

	$effect(() => {
		$metadata.title = title;
	});
</script>

<article class="question-detail">
	<a href={resolve('/')} class="back-link">&larr; {$t('question.back')}</a>

	{#if label}
		<h1 class="label-heading">{label}</h1>
		{#if displayConcept}
			<p class="concept-line">
				<span class="field-label">{$t('question.concept')}</span>
				{displayConcept}
			</p>
		{/if}
	{:else if displayConcept}
		<h1 class="concept-line">
			<span class="field-label">{$t('question.concept')}</span>
			{displayConcept}
		</h1>
	{:else}
		<!-- The preview shows the question; the heading is for screen readers. -->
		<h1 class="sr-only">{title}</h1>
	{/if}
	{#if view.longListStandard}
		<p class="concept-line">
			<span class="field-label">{$t('question.standard')}</span>
			{view.longListStandard}
		</p>
	{/if}
	{#if tags.length}
		<p class="concept-line">
			<span class="field-label">{$t('question.tags')}</span>
			{#each tags as tag, i (i)}
				<span class="search-tag" lang={tag.lang || undefined}>{tag.text}</span>
			{/each}
		</p>
	{/if}

	<div class="meta-row">
		{#if view.answerType}
			<AnswerTypeTag type={view.answerType} />
		{/if}
		{#if study}
			<a
				href="{resolve('/studies/[id]', { id: study.id })}#q-{group?.id || variable?.id}"
				class="study-tag"
				title={study.title}>{study.short_title || study.title}</a
			>
		{/if}
	</div>

	<div class="view-tabs" role="tablist" aria-label={$t('question.tabsLabel')}>
		{#each TABS as tab (tab)}
			<button
				id="tab-{tab}"
				class="view-tab"
				class:active={activeTab === tab}
				role="tab"
				aria-selected={activeTab === tab}
				aria-controls="tab-panel"
				tabindex={activeTab === tab ? 0 : -1}
				onclick={() => selectTab(tab)}
				onkeydown={onTabKeydown}>{$t(TAB_LABELS[tab])}</button
			>
		{/each}
	</div>

	<div class="tab-content" id="tab-panel" role="tabpanel" aria-labelledby="tab-{activeTab}">
		{#if activeTab === 'preview'}
			{#if view.preview?.kind === 'grid'}
				<GridPreview variables={view.preview.variables} question={view.preview.question} />
			{:else if view.preview?.kind === 'numberGrid'}
				<NumberGridPreview variables={view.preview.variables} question={view.preview.question} />
			{:else if view.preview?.kind === 'survey'}
				<SurveyPreview variable={view.preview.variable} />
			{/if}
		{:else if activeTab === 'xlsform'}
			{#await data.xlsform}
				<p class="hint">{$t('question.loadingXlsform')}</p>
			{:then xlsform}
				{#if xlsform}
					{#if study}
						<LicenseNotice attribution={study} variant="credit" />
					{/if}
					<XlsFormDisplay worksheets={xlsformSheets(xlsform)} />
				{:else}
					<p class="hint">{$t('question.xlsformUnavailable')}</p>
				{/if}
			{/await}
		{:else if activeTab === 'ddi'}
			{#await data.xml}
				<p class="hint">{$t('question.loadingDdi')}</p>
			{:then xml}
				{#if xml}
					{#if study}
						<LicenseNotice attribution={study} variant="credit" />
					{/if}
					<div class="tab-actions">
						<button class="download-btn" onclick={() => downloadXml(xml)}
							>{$t('question.downloadXml')}</button
						>
					</div>
					<DdiDisplay
						ddiXml={xml}
						copyLabel={$t('question.copy')}
						copiedLabel={$t('question.copied')}
					/>
				{:else}
					<p class="hint">{$t('question.ddiUnavailable')}</p>
				{/if}
			{/await}
		{/if}
	</div>

	<!-- After the question: what to credit when reusing it (#66). -->
	{#if study}
		<div class="license-section">
			<LicenseNotice attribution={study} />
		</div>
	{/if}
</article>

<style>
	.question-detail {
		max-width: 900px;
		margin: var(--spacing-base) auto;
		overflow-wrap: break-word;
	}

	.back-link {
		font-size: var(--font-size-small-min);
		color: var(--color-secondary);
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.label-heading {
		margin: 0 0 var(--spacing-xs);
	}

	.concept-line {
		font-family: var(--font-family-body);
		letter-spacing: normal;
		font-weight: inherit;
		line-height: inherit;
		font-size: var(--font-size-small-min);
		margin: 0 0 var(--spacing-xs);
	}

	.field-label {
		font-size: var(--font-size-caption-min);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-muted);
	}

	.search-tag {
		display: inline-block;
		font-size: var(--font-size-caption-min);
		padding: 1px var(--spacing-xs);
		margin-right: var(--spacing-2xs);
		border: 1px solid var(--color-primary-darker);
		border-radius: var(--radius-sm);
	}

	.meta-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-base);
	}

	.study-tag {
		font-size: var(--font-size-caption-min);
		padding: 1px var(--spacing-xs);
		border-radius: var(--radius-sm);
		background-color: var(--color-tag-bg);
		color: var(--color-white);
		text-decoration: none;
	}

	.study-tag:hover {
		background-color: var(--color-secondary);
	}

	.view-tabs {
		display: flex;
		gap: 0;
		border-bottom: var(--dimension-border-width) solid var(--color-primary-darker);
		margin-bottom: var(--spacing-lg);
		margin-top: var(--spacing-base);
	}

	.view-tab {
		padding: var(--spacing-xs) var(--spacing-sm);
		border: none;
		background: none;
		font-size: var(--font-size-body-min);
		font-family: var(--font-family-body);
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.15s;
		color: var(--color-text-muted);
	}

	.view-tab:hover {
		color: var(--color-secondary);
	}

	.view-tab.active {
		border-bottom-color: var(--color-secondary);
		font-weight: var(--font-weight-bold);
		color: var(--color-secondary);
	}

	.tab-actions {
		display: flex;
		justify-content: flex-end;
		margin-bottom: var(--spacing-sm);
	}

	.download-btn {
		padding: var(--spacing-2xs) var(--spacing-sm);
		background-color: var(--color-white);
		border: 1.5px solid var(--color-secondary);
		border-radius: var(--radius-sm);
		color: var(--color-secondary);
		font-family: var(--font-family-body);
		font-size: var(--font-size-small-min);
		font-weight: var(--font-weight-bold);
		cursor: pointer;
	}

	.download-btn:hover {
		background-color: var(--color-secondary);
		color: var(--color-white);
	}

	.tab-content {
		min-height: 200px;
	}

	.license-section {
		margin-top: var(--spacing-lg);
		padding-top: var(--spacing-base);
		border-top: 1px solid var(--color-tertiary);
	}

	.hint {
		font-size: var(--font-size-small-min);
		margin-bottom: var(--spacing-sm);
		color: var(--color-text-muted);
	}
</style>
