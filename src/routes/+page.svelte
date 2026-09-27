<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto, invalidateAll } from '$app/navigation';
	import Notice from '$lib/components/Notice.svelte';
	import { navigating, page } from '$app/state';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import QuestionCard from '$lib/components/QuestionCard.svelte';
	import Paginator from '$lib/components/Paginator.svelte';
	import { metadata } from '$lib/metadata';
	import { t, locale } from '$lib/i18n';
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
	const FILTER_PARAMS: Record<string, string> = { topic: 'topic', answer_type: 'type' };
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

	let questions = $derived(data.questions);
	let studies = $derived(new Map(data.studies.map((s) => [s.id, s])));

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
			label: $t('explore.filterTopic'),
			key: 'topic',
			values: topics,
			counts: computeCounts(searchedQuestions, filters, studies, 'topic', topics)
		},
		{
			label: $t('explore.filterAnswerType'),
			key: 'answer_type',
			values: answerTypes,
			labels: Object.fromEntries(answerTypes.map((v) => [v, typeLabel(v, $locale)])),
			counts: computeCounts(searchedQuestions, filters, studies, 'answer_type', answerTypes)
		}
	]);

	let filteredQuestions = $derived(applyFilters(searchedQuestions, filters, studies));
	let paged = $derived(paginate(filteredQuestions, page.url.searchParams.get('page'), PER_PAGE));

	async function setPage(n: number) {
		await updateUrl({ page: n > 1 ? String(n) : '' }, { keepPage: true });
		// Start reading the new page from its top.
		document.getElementById('results')?.scrollIntoView({ block: 'start' });
	}
</script>

<div class="explore-container">
	<h1 class="sr-only">{$t('explore.title')}</h1>
	<div class="scope-notice">
		<Notice><p>{$t('notice.onlineSurveys')}</p></Notice>
	</div>

	<FilterBar
		bind:searchQuery={() => searchQuery, setSearchQuery}
		{filters}
		filterOptions={filterOptionsList}
		onfilter={setFilter}
		onclear={clearAll}
	/>

	<div class="results" id="results">
		{#if data.searchFailed}
			<Notice kind="error">
				{$t('explore.searchError')}
				{#snippet action()}
					<button onclick={() => invalidateAll()}>{$t('error.retry')}</button>
				{/snippet}
			</Notice>
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
					<li>
						<QuestionCard {question} study={studies.get(question.study_id)} />
					</li>
				{/each}
			</ul>
			<Paginator
				page={paged.page}
				totalPages={paged.totalPages}
				totalItems={filteredQuestions.length}
				perPage={PER_PAGE}
				onchange={setPage}
			/>
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

	.scope-notice {
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

	:global(.paginator) {
		margin-top: var(--spacing-lg);
	}
</style>
