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
	import { baseType, typeLabel } from '$lib/questionTypes';

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

	// Questions matching the search, in relevance order; all questions without a query.
	let searchedQuestions = $derived.by(() => {
		if (!data.searchIds) return data.searchFailed ? [] : questions;
		const rank = new Map(data.searchIds.map((id, i) => [id, i]));
		return questions
			.filter((q) => rank.has(q.id))
			.sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
	});

	function studyForQuestion(q: any): any | undefined {
		return studies.get(q.study_id);
	}

	let answerTypeOptions = $derived(
		[...new Set(questions.map((q) => baseType(q.answer_type)).filter(Boolean))].sort()
	);

	let surveyTypeOptions = $derived(
		[
			...new Set(
				questions.flatMap((q) => studyForQuestion(q)?.topic_classifications ?? []).filter(Boolean)
			)
		].sort()
	);

	function matchesFilter(q: any, key: string, val: string): boolean {
		switch (key) {
			case 'answer_type':
				return baseType(q.answer_type) === val;
			case 'survey_type':
				return studyForQuestion(q)?.topic_classifications?.includes(val);
			default:
				return true;
		}
	}

	function applyFilters(data: any[], excludeKey?: string): any[] {
		let result = data;
		for (const [key, val] of Object.entries(filters)) {
			if (!val || key === excludeKey) continue;
			result = result.filter((q) => matchesFilter(q, key, val));
		}
		return result;
	}

	function computeCounts(data: any[], key: string, values: string[]): Record<string, number> {
		const base = applyFilters(data, key);
		const counts: Record<string, number> = {};
		for (const val of values) {
			counts[val] = base.filter((q) => matchesFilter(q, key, val)).length;
		}
		return counts;
	}

	let filterOptionsList = $derived([
		{
			label: $t('explore.filterKind'),
			key: 'survey_type',
			values: surveyTypeOptions,
			counts: computeCounts(searchedQuestions, 'survey_type', surveyTypeOptions)
		},
		{
			label: $t('explore.filterAnswerType'),
			key: 'answer_type',
			values: answerTypeOptions,
			labels: Object.fromEntries(answerTypeOptions.map((v) => [v, typeLabel(v)])),
			counts: computeCounts(searchedQuestions, 'answer_type', answerTypeOptions)
		}
	]);

	let filteredQuestions = $derived(applyFilters(searchedQuestions));

	const totalPages = $derived(Math.max(1, Math.ceil(filteredQuestions.length / PER_PAGE)));
	const currentPage = $derived(
		Math.min(
			Math.max(1, Number.parseInt(page.url.searchParams.get('page') ?? '1') || 1),
			totalPages
		)
	);
	const paginatedQuestions = $derived(
		filteredQuestions.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
	);

	function setPage(n: number) {
		updateUrl({ page: n > 1 ? String(n) : '' }, { keepPage: true });
	}
</script>

<div class="explore-container">
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
				{#each paginatedQuestions as question (question.id)}
					{@const study = studyForQuestion(question)}
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
			<Paginator page={currentPage} {totalPages} onchange={setPage} />
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
		opacity: 0.6;
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
		background-color: var(--color-primary-darker);
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
		color: var(--color-text-primary);
		opacity: 0.6;
		font-weight: var(--font-weight-medium);
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
		color: var(--color-text-primary);
		opacity: 0.6;
		margin: var(--spacing-xs) 0;
	}

	.error-box {
		padding: var(--spacing-base);
		background-color: #fff1f1;
		border: 1px solid #ffa3a3;
		border-radius: var(--radius-base);
		color: #d32f2f;
	}

	:global(.paginator) {
		margin-top: var(--spacing-lg);
	}
</style>
