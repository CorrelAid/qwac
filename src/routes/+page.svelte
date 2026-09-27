<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any -- TODO(#25): type the API responses */
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import QuestionCard from '$lib/components/QuestionCard.svelte';
	import Paginator from '$lib/components/Paginator.svelte';
	import { metadata } from '$lib/metadata';
	import AnswerTypeTag from '$lib/components/AnswerTypeTag.svelte';
	import { t, locale } from '$lib/i18n';
	import { questionText } from '$lib/translations';
	import { typeLabel } from '$lib/questionTypes';
	import {
		answerTypeOptions,
		applyFilters,
		computeCounts,
		paginate,
		rankBySearch,
		topicOptions
	} from '$lib/explore';

	$effect(() => {
		$metadata.title = $t('explore.title');
	});

	let { data } = $props();

	// Search, filters and page live in the URL (?q=&topic=&type=&page=), so
	// Back, bookmarks and shared links restore the same view (#23).
	const FILTER_PARAMS: Record<string, string> = { survey_type: 'topic', answer_type: 'type' };
	const PER_PAGE = 20;
	const SEARCH_DEBOUNCE_MS = 300;

	/** Changes the given URL parameters (empty removes them) without a new history entry. */
	function updateUrl(changes: Record<string, string>, { keepPage = false } = {}) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a temporary copy, not state
		const params = new URLSearchParams(page.url.searchParams);
		for (const [key, value] of Object.entries(changes)) {
			if (value) params.set(key, value);
			else params.delete(key);
		}
		if (!keepPage) params.delete('page');
		const search = params.toString();
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve('/') plus a query string
		return goto(`${resolve('/')}${search ? `?${search}` : ''}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	let questions = $derived<any[]>(data.questions);
	let studies = $derived(new Map<string, any>(data.studies.map((s: any) => [s.id, s])));

	let filters = $derived(
		Object.fromEntries(
			Object.entries(FILTER_PARAMS).map(([key, param]) => [
				key,
				page.url.searchParams.get(param) ?? ''
			])
		)
	);

	// What's in the search box: the URL's query, unless the user is typing.
	let typed = $state<string | null>(null);
	let searchQuery = $derived(typed ?? data.q);
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	function setSearchQuery(value: string) {
		typed = value;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(async () => {
			await updateUrl({ q: value });
			// Keep showing what the user typed meanwhile; otherwise follow the URL again.
			if (typed === value) typed = null;
		}, SEARCH_DEBOUNCE_MS);
	}

	function setFilter(key: string, value: string) {
		updateUrl({ [FILTER_PARAMS[key]]: value });
	}

	function clearAll() {
		clearTimeout(searchTimer);
		typed = null;
		updateUrl({ q: '', ...Object.fromEntries(Object.values(FILTER_PARAMS).map((p) => [p, ''])) });
	}

	// A search started from this page is on its way.
	let searching = $derived(
		!!navigating.to && navigating.to.route.id === '/' && navigating.from?.route.id === '/'
	);

	let searchedQuestions = $derived(rankBySearch(questions, data.searchIds, data.searchFailed));

	let answerTypes = $derived(answerTypeOptions(questions));
	let topics = $derived(topicOptions(questions, studies));

	let filterOptionsList = $derived([
		{
			label: $t('explore.filterKind'),
			key: 'survey_type',
			values: topics,
			counts: computeCounts(searchedQuestions, filters, studies, 'survey_type', topics)
		},
		{
			label: $t('explore.filterAnswerType'),
			key: 'answer_type',
			values: answerTypes,
			labels: Object.fromEntries(answerTypes.map((v) => [v, typeLabel(v)])),
			counts: computeCounts(searchedQuestions, filters, studies, 'answer_type', answerTypes)
		}
	]);

	let filteredQuestions = $derived(applyFilters(searchedQuestions, filters, studies));
	let paged = $derived(paginate(filteredQuestions, page.url.searchParams.get('page'), PER_PAGE));

	function setPage(n: number) {
		updateUrl({ page: n > 1 ? String(n) : '' }, { keepPage: true });
	}
</script>

<div class="explore-container">
	<h1 class="sr-only">{$t('explore.title')}</h1>
	<FilterBar
		bind:searchQuery={() => searchQuery, setSearchQuery}
		{filters}
		filterOptions={filterOptionsList}
		onfilter={setFilter}
		onclear={clearAll}
	/>

	<div class="results">
		{#if data.searchFailed}
			<div class="error-box">{$t('explore.searchError')}</div>
		{:else if filteredQuestions.length === 0}
			<p>{$t('explore.noResults')}</p>
		{:else}
			<p class="count" aria-live="polite">
				{filteredQuestions.length}
				{filteredQuestions.length === 1 ? $t('explore.question') : $t('explore.questions')}
				{#if searching}<span class="searching">· {$t('explore.searching')}</span>{/if}
			</p>
			<ul class="variable-list">
				{#each paged.items as question (question.id)}
					{@const study = studies.get(question.study_id)}
					{@const text = questionText(question, $locale)}
					<li>
						<QuestionCard>
							{#if text}
								<p class="meta-text">
									<span class="field-label">{$t('explore.questionLabel')}</span>
									{text}
								</p>
							{/if}
							<p class="meta-text">
								<span class="field-label">{$t('explore.conceptLabel')}</span>
								{question.concept}
							</p>

							<div class="card-tags">
								{#if question.answer_type}
									<AnswerTypeTag type={question.answer_type} />
								{/if}
								{#if study}
									<a href={resolve('/studies/[id]', { id: study.id })} class="study-tag"
										>{study.title}</a
									>
								{/if}
							</div>

							{#if question.variable_ids?.length > 1}
								<p class="categories-summary">
									{question.variable_ids.length}
									{$t('explore.variables')}
								</p>
							{/if}

							<a href={resolve('/questions/[id]', { id: question.id })} class="detail-link"
								>{$t('explore.viewDetails')}</a
							>
						</QuestionCard>
					</li>
				{/each}
			</ul>
			<Paginator page={paged.page} totalPages={paged.totalPages} onchange={setPage} />
		{/if}
	</div>
</div>

<style>
	.explore-container {
		margin-top: var(--spacing-base);
	}

	.count {
		font-size: var(--font-size-small-min);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-sm);
	}

	.searching {
		color: var(--color-text-muted);
	}

	.variable-list {
		list-style: none;
		padding: 0;
		margin: 0;
		max-width: none;
	}

	.variable-list li {
		margin-bottom: var(--spacing-lg);
	}

	.card-tags {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-sm);
		margin: var(--spacing-xs) 0;
		flex-wrap: wrap;
	}

	.study-tag {
		font-size: var(--font-size-caption-min);
		padding: 1px var(--spacing-xs);
		border-radius: var(--radius-sm);
		background-color: var(--color-tag-bg);
		color: var(--color-white);
		text-decoration: none;
		white-space: normal;
		word-break: break-word;
	}

	.study-tag:hover {
		background-color: var(--color-secondary);
	}

	.meta-text {
		font-size: var(--font-size-small-min);
		line-height: var(--line-height-relaxed);
		margin: 0 0 var(--spacing-2xs);
	}

	.field-label {
		font-size: var(--font-size-caption-min);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-muted);
	}

	.detail-link {
		font-size: var(--font-size-small-min);
		color: var(--color-secondary);
		text-decoration: none;
	}

	.detail-link:hover {
		text-decoration: underline;
	}

	.categories-summary {
		font-size: var(--font-size-small-min);
		margin: var(--spacing-xs) 0;
		color: var(--color-text-muted);
	}

	.error-box {
		padding: var(--spacing-base);
		background-color: var(--color-error-bg);
		border: 1px solid var(--color-error-border);
		border-radius: var(--radius-base);
		color: var(--color-error);
	}

	:global(.paginator) {
		margin-top: var(--spacing-lg);
	}
</style>
