<script lang="ts">
  import { client, clearOnAuthError } from "$lib/pocketbase";
  import type { PageStore } from "$lib/pocketbase";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import QuestionCard from "$lib/components/QuestionCard.svelte";
  import Paginator from "$lib/components/Paginator.svelte";
  import { metadata } from "$lib/metadata";
  import Fuse from "fuse.js";
  import { safeErrorMessage } from "$lib/validation";
  import { writable } from "svelte/store";

  $metadata.title = "Explore Questions";
  $metadata.headline = "";

  let variables = $state<any[]>([]);
  let loaded = $state(false);
  let searchQuery = $state("");
  let filters = $state<Record<string, string>>({
    question_type: "",
    survey_type: "",
  });
  let error = $state<string | null>(null);

  const queryParams = { expand: "study,group", requestKey: null };

  async function loadAll() {
    variables = await client.collection("variables").getFullList(queryParams);
    loaded = true;
  }

  $effect(() => {
    loaded = false;
    loadAll().catch((e: any) => {
      clearOnAuthError(e);
      error = safeErrorMessage(e, "Failed to load variables.");
      loaded = true;
    });

    // Reload on any realtime change
    let unsub: (() => void) | undefined;
    client.collection("variables").subscribe("*", () => {
      loadAll().catch(() => {});
    }).then(fn => unsub = fn);

    return () => { unsub?.(); };
  });

  let questionTypeOptions = $derived(
    [...new Set(variables.map(v => v.question_type).filter(Boolean))].sort()
  );

  let surveyTypeOptions = $derived(
    [...new Set(variables.flatMap(v => v.expand?.study?.topic_classifications ?? []).filter(Boolean))].sort()
  );

  let filterOptionsList = $derived([
    { label: "Question Type", key: "question_type", values: questionTypeOptions.map(t => questionTypeLabel(t)) },
    { label: "Kind", key: "survey_type", values: surveyTypeOptions },
  ]);

  let filteredVariables = $derived.by(() => {
    let result = variables;

    if (filters.question_type) {
      result = result.filter(v => questionTypeLabel(v.question_type) === filters.question_type);
    }
    if (filters.survey_type) {
      result = result.filter(v => v.expand?.study?.topic_classifications?.includes(filters.survey_type));
    }

    if (searchQuery.trim()) {
      const fuse = new Fuse(result, {
        keys: ["name", "label", "question"],
        threshold: 0.3
      });
      result = fuse.search(searchQuery).map(r => r.item);
    }

    return result;
  });

  const questionTypeLabels: Record<string, string> = {
    'select_one': 'Single Select',
    'select_multiple': 'Multiple Select',
    'text': 'Free Text',
    'integer': 'Integer',
    'decimal': 'Decimal',
    'note': 'Note',
    'date': 'Date',
    'time': 'Time',
    'datetime': 'Date & Time',
    'calculate': 'Calculate',
    'range': 'Range',
  };

  function questionTypeLabel(type: string): string {
    if (!type) return '';
    return questionTypeLabels[type] || type;
  }

  function isMatrixOrGrid(variable: any): boolean {
    const type = variable.expand?.group?.type?.toLowerCase() || '';
    return type.includes('matrix') || type.includes('grid');
  }

  const PER_PAGE = 20;
  let clientPage = $state(1);

  // Reset to page 1 whenever search query or filters change
  $effect(() => {
    searchQuery;
    JSON.stringify(filters);
    clientPage = 1;
  });

  const totalPages = $derived(Math.max(1, Math.ceil(filteredVariables.length / PER_PAGE)));
  const currentPage = $derived(Math.min(Math.max(1, clientPage), totalPages));
  const paginatedVariables = $derived(
    filteredVariables.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
  );

  // PageStore-compatible store for Paginator
  const _pageData = writable({ page: 1, perPage: PER_PAGE, totalItems: 0, totalPages: 1, items: [] as any[] });
  $effect(() => {
    _pageData.set({ page: currentPage, perPage: PER_PAGE, totalItems: filteredVariables.length, totalPages, items: paginatedVariables });
  });
  const pageStore: PageStore = {
    subscribe: _pageData.subscribe,
    setPage: async (n: number) => { clientPage = n; },
    next: async () => { clientPage = Math.min(clientPage + 1, totalPages); },
    prev: async () => { clientPage = Math.max(clientPage - 1, 1); },
  };
</script>

<div class="explore-container">
  <Sidebar
    bind:searchQuery
    bind:filters
    filterOptions={filterOptionsList}
  />

  <div class="results">
    {#if error}
      <div class="error-box">{error}</div>
    {:else if !loaded}
      <p>Loading questions...</p>
    {:else if filteredVariables.length === 0}
      <p>No questions found.</p>
    {:else}
      <p class="count">{filteredVariables.length} question{filteredVariables.length === 1 ? '' : 's'}</p>
      <ul class="variable-list">
        {#each paginatedVariables as variable (variable.id)}
          <li>
            <QuestionCard>
              <div class="card-header">
                <a href="/questions/{variable.id}" class="name">{variable.concept}</a>
                {#if variable.question_type}
                  <span class="type-tag">{questionTypeLabel(variable.question_type)}</span>
                {/if}
                {#if variable.expand?.study}
                  <a href="/studies/{variable.expand.study.id}#q-{variable.id}" class="study-tag">{variable.expand.study.title}</a>
                {/if}
              </div>

              {#if isMatrixOrGrid(variable) && variable.prequestion_text}
                {#if variable.question}
                  <p class="item-text"><span class="field-label">Item:</span> "{variable.question}"</p>
                {/if}
                <p class="question-text"><span class="field-label">Question:</span> "{variable.prequestion_text}"</p>
              {:else if variable.question}
                <p class="question-text"><span class="field-label">Question:</span> "{variable.question}"</p>
              {/if}

              <a href="/questions/{variable.id}" class="detail-link">View details &rarr;</a>
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
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-base);
    margin-top: var(--spacing-base);
    align-items: flex-start;
  }

  .results {
    flex: 1;
  }

  .count {
    font-size: var(--font-size-small-min);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .variable-list {
    list-style: none;
    padding: 0;
  }

  .variable-list li {
    margin-bottom: var(--spacing-lg);
  }

  .card-header {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .name {
    font-weight: var(--font-weight-bold);
    color: var(--color-secondary);
    text-decoration: none;
    font-size: var(--font-size-h4-min);
  }

  .name:hover {
    text-decoration: underline;
  }

  .type-tag,
  .study-tag {
    font-size: var(--font-size-caption-min);
    padding: 1px var(--spacing-xs);
    border-radius: var(--radius-sm);
    white-space: nowrap;
  }

  .type-tag {
    background-color: var(--color-tertiary);
    color: var(--color-text-primary);
  }

  .study-tag {
    background-color: var(--color-primary-darker);
    color: var(--color-white);
    text-decoration: none;
  }

  .study-tag:hover {
    background-color: var(--color-secondary);
  }

  .question-text {
    font-size: var(--font-size-body-min);
    line-height: var(--line-height-relaxed);
    margin: 0 0 var(--spacing-xs);
  }

  .item-text {
    font-size: var(--font-size-body-min);
    line-height: var(--line-height-relaxed);
    margin: 0 0 var(--spacing-xs);
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
