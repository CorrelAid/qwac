<script lang="ts">
  import { client, clearOnAuthError, fetchApiJson } from "$lib/pocketbase";
  import type { PageStore } from "$lib/pocketbase";
  import FilterBar from "$lib/components/FilterBar.svelte";
  import QuestionCard from "$lib/components/QuestionCard.svelte";
  import Paginator from "$lib/components/Paginator.svelte";
  import { metadata } from "$lib/metadata";
  import { safeErrorMessage } from "$lib/validation";
  import { writable } from "svelte/store";
  import { getCached, setCached } from "$lib/cache";
  import AnswerTypeTag from "$lib/components/AnswerTypeTag.svelte";
  import { t, locale } from "$lib/i18n";
  import { questionText } from "$lib/translations";

  $effect(() => { $metadata.title = $t('explore.title'); });
  $metadata.headline = "";

  let questions = $state<any[]>([]);
  let studies = $state<Map<string, any>>(new Map());
  let loaded = $state(false);
  let searchQuery = $state("");
  let filters = $state<Record<string, string>>({
    answer_type: "",
    survey_type: "",
  });
  let error = $state<string | null>(null);

  // Search runs on the backend (stemming, umlaut folding, German/English
  // tags and translations); searchRank maps question id → rank.
  let searchRank = $state<Map<string, number> | null>(null);
  let searching = $state(false);
  let searchError = $state<string | null>(null);
  let searchSeq = 0;

  const SEARCH_PER_PAGE = 100;
  const SEARCH_DEBOUNCE_MS = 250;

  async function searchQuestions(q: string): Promise<string[]> {
    const key = `search:${q}`;
    const cached = getCached<string[]>(key);
    if (cached) return cached;
    const ids: string[] = [];
    for (let page = 1; ; page++) {
      const params = new URLSearchParams({ q, page: String(page), perPage: String(SEARCH_PER_PAGE) });
      const res = await fetchApiJson(`/api/search/questions?${params}`);
      for (const item of res.items ?? []) ids.push(item.id);
      if (page >= (res.totalPages ?? 0)) break;
    }
    setCached(key, ids);
    return ids;
  }

  $effect(() => {
    // Backend limit is 200 characters.
    const q = searchQuery.trim().slice(0, 200);
    const seq = ++searchSeq;
    searchError = null;
    if (!q) {
      searchRank = null;
      searching = false;
      return;
    }
    searching = true;
    const timer = setTimeout(() => {
      searchQuestions(q)
        .then((ids) => {
          if (seq === searchSeq) searchRank = new Map(ids.map((id, i) => [id, i]));
        })
        .catch((e: any) => {
          if (seq !== searchSeq) return;
          clearOnAuthError(e);
          searchRank = new Map();
          searchError = safeErrorMessage(e, $t('explore.searchError'));
        })
        .finally(() => {
          if (seq === searchSeq) searching = false;
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  });

  // Questions matching the search, in relevance order; all questions without a query.
  let searchedQuestions = $derived.by(() => {
    if (!searchRank) return questions;
    const rank = searchRank;
    return questions
      .filter(q => rank.has(q.id))
      .sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
  });

  async function loadAll(skipCache = false) {
    const cachedQuestions = !skipCache ? getCached<any[]>("questions:all") : undefined;
    const cachedStudies = !skipCache ? getCached<any[]>("studies:all") : undefined;

    const [questionsData, studiesList] = await Promise.all([
      cachedQuestions ?? fetchApiJson('/api/questions').then((d: any[]) => { setCached("questions:all", d); return d; }),
      cachedStudies ?? client.collection("studies").getFullList({ requestKey: null }).then((d: any[]) => { setCached("studies:all", d); return d; }),
    ]);
    questions = questionsData;
    studies = new Map(studiesList.map((s: any) => [s.id, s]));
    loaded = true;
  }

  $effect(() => {
    loaded = false;
    loadAll().catch((e: any) => {
      clearOnAuthError(e);
      error = safeErrorMessage(e, $t('explore.loadError'));
      loaded = true;
    });
  });

  function normalizeAnswerType(type: string): string {
    return (type || '').replace(/_other$/, '').replace(/_long_list$/, '');
  }

  function answerTypeLabel(type: string): string {
    if (!type) return '';
    return normalizeAnswerType(type).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function studyForQuestion(q: any): any | undefined {
    return studies.get(q.study_id);
  }

  let answerTypeOptions = $derived(
    [...new Set(questions.map(q => normalizeAnswerType(q.answer_type)).filter(Boolean))].sort()
  );

  let surveyTypeOptions = $derived(
    [...new Set(questions.flatMap(q => studyForQuestion(q)?.topic_classifications ?? []).filter(Boolean))].sort()
  );

  function matchesFilter(q: any, key: string, val: string): boolean {
    switch (key) {
      case 'answer_type': return answerTypeLabel(normalizeAnswerType(q.answer_type)) === val;
      case 'survey_type': return studyForQuestion(q)?.topic_classifications?.includes(val);
      default: return true;
    }
  }

  function applyFilters(data: any[], excludeKey?: string): any[] {
    let result = data;
    for (const [key, val] of Object.entries(filters)) {
      if (!val || key === excludeKey) continue;
      result = result.filter(q => matchesFilter(q, key, val));
    }
    return result;
  }

  function computeCounts(data: any[], key: string, values: string[]): Record<string, number> {
    const base = applyFilters(data, key);
    const counts: Record<string, number> = {};
    for (const val of values) {
      counts[val] = base.filter(q => matchesFilter(q, key, val)).length;
    }
    return counts;
  }

  let filterOptionsList = $derived.by(() => {
    const atValues = answerTypeOptions.map(t => answerTypeLabel(t));
    return [
      { label: $t('explore.filterKind'), key: "survey_type", values: surveyTypeOptions, counts: computeCounts(searchedQuestions, "survey_type", surveyTypeOptions) },
      { label: $t('explore.filterAnswerType'), key: "answer_type", values: atValues, counts: computeCounts(searchedQuestions, "answer_type", atValues) },
    ];
  });

  let filteredQuestions = $derived(applyFilters(searchedQuestions));

  const PER_PAGE = 20;
  let clientPage = $state(1);

  // Reset to page 1 whenever search query or filters change
  $effect(() => {
    searchQuery;
    JSON.stringify(filters);
    clientPage = 1;
  });

  const totalPages = $derived(Math.max(1, Math.ceil(filteredQuestions.length / PER_PAGE)));
  const currentPage = $derived(Math.min(Math.max(1, clientPage), totalPages));
  const paginatedQuestions = $derived(
    filteredQuestions.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
  );

  // PageStore-compatible store for Paginator
  const _pageData = writable({ page: 1, perPage: PER_PAGE, totalItems: 0, totalPages: 1, items: [] as any[] });
  $effect(() => {
    _pageData.set({ page: currentPage, perPage: PER_PAGE, totalItems: filteredQuestions.length, totalPages, items: paginatedQuestions as any[] });
  });
  const pageStore: PageStore = {
    subscribe: _pageData.subscribe,
    setPage: async (n: number) => { clientPage = n; },
    next: async () => { clientPage = Math.min(clientPage + 1, totalPages); },
    prev: async () => { clientPage = Math.max(clientPage - 1, 1); },
  };
</script>

<div class="explore-container">
  <FilterBar
    bind:searchQuery
    bind:filters
    filterOptions={filterOptionsList}
  />

  <div class="results">
    {#if error}
      <div class="error-box">{error}</div>
    {:else if !loaded}
      <p>{$t('explore.loading')}</p>
    {:else if searchError}
      <div class="error-box">{searchError}</div>
    {:else if searching && !searchRank}
      <p>{$t('explore.searching')}</p>
    {:else if filteredQuestions.length === 0}
      <p>{$t('explore.noResults')}</p>
    {:else}
      <p class="count">{filteredQuestions.length} {filteredQuestions.length === 1 ? $t('explore.question') : $t('explore.questions')}</p>
      <ul class="variable-list">
        {#each paginatedQuestions as question (question.id)}
          {@const study = studyForQuestion(question)}
          {@const text = questionText(question, $locale)}
          <li>
            <QuestionCard>
              {#if text}
                <p class="meta-text"><span class="field-label">{$t('explore.questionLabel')}</span> {text}</p>
              {/if}
              <p class="meta-text"><span class="field-label">{$t('explore.conceptLabel')}</span> {question.concept}</p>

              <div class="card-tags">
                {#if question.answer_type}
                  <AnswerTypeTag type={question.answer_type} />
                {/if}
                {#if study}
                  <a href="/studies/{study.id}" class="study-tag">{study.title}</a>
                {/if}
              </div>

              {#if question.variable_ids?.length > 1}
                <p class="categories-summary">{question.variable_ids.length} {$t('explore.variables')}</p>
              {/if}

              <a href="/questions/{question.id}" class="detail-link">{$t('explore.viewDetails')}</a>
            </QuestionCard>
          </li>
        {/each}
      </ul>
      <Paginator store={pageStore} />
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
