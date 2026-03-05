<script lang="ts">
  import { client, clearOnAuthError } from "$lib/pocketbase";
  import type { PageStore } from "$lib/pocketbase";
  import FilterBar from "$lib/components/FilterBar.svelte";
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
    answer_type: "",
    survey_type: "",
    has_other: "",
    has_long_list: "",
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

  let answerTypeOptions = $derived(
    [...new Set(variables.map(v => v.answer_type).filter(Boolean))].sort()
  );

  let surveyTypeOptions = $derived(
    [...new Set(variables.flatMap(v => v.expand?.study?.topic_classifications ?? []).filter(Boolean))].sort()
  );

  let isChoiceFilter = $derived(
    filters.answer_type === 'Single Choice' || filters.answer_type === 'Multiple Choice'
  );

  // Match a single variable against a specific filter key/value
  function matchesFilter(v: any, key: string, val: string): boolean {
    switch (key) {
      case 'answer_type': return answerTypeLabel(v.answer_type) === val;
      case 'survey_type': return v.expand?.study?.topic_classifications?.includes(val);
      case 'has_other': return (v.has_other === true) === (val === 'Yes');
      case 'has_long_list': return (v.has_long_list === true) === (val === 'Yes');
      default: return true;
    }
  }

  // Apply all active filters except `excludeKey`
  function applyFilters(data: any[], excludeKey?: string): any[] {
    let result = data;
    for (const [key, val] of Object.entries(filters)) {
      if (!val || key === excludeKey) continue;
      result = result.filter(v => matchesFilter(v, key, val));
    }
    return result;
  }

  // Compute counts for each filter value (with all other filters applied)
  function computeCounts(data: any[], key: string, values: string[]): Record<string, number> {
    const base = applyFilters(data, key);
    const counts: Record<string, number> = {};
    for (const val of values) {
      counts[val] = base.filter(v => matchesFilter(v, key, val)).length;
    }
    return counts;
  }

  let filterOptionsList = $derived.by(() => {
    const atValues = answerTypeOptions.map(t => answerTypeLabel(t));
    const boolValues = ["Yes", "No"];
    return [
      { label: "Kind", key: "survey_type", values: surveyTypeOptions, counts: computeCounts(variables, "survey_type", surveyTypeOptions) },
      { label: "Answer Type", key: "answer_type", values: atValues, counts: computeCounts(variables, "answer_type", atValues) },
      { label: "Other", key: "has_other", values: boolValues, kind: "chip" as const, hidden: !isChoiceFilter, counts: computeCounts(variables, "has_other", boolValues) },
      { label: "Long List", key: "has_long_list", values: boolValues, kind: "chip" as const, hidden: !isChoiceFilter, counts: computeCounts(variables, "has_long_list", boolValues) },
    ];
  });

  let filteredVariables = $derived.by(() => {
    let result = applyFilters(variables);

    if (searchQuery.trim()) {
      const fuse = new Fuse(result, {
        keys: ["name", "label", "question"],
        threshold: 0.3
      });
      result = fuse.search(searchQuery).map(r => r.item);
    }

    return result;
  });

  function answerTypeLabel(type: string): string {
    if (!type) return '';
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function isMatrixOrGrid(variable: any): boolean {
    const type = variable.expand?.group?.type?.toLowerCase() || '';
    return type.includes('matrix') || type.includes('grid');
  }

  function isSelectType(answerType: string): boolean {
    return answerType === 'select_one' || answerType === 'select_multiple'
      || answerType === 'single_choice' || answerType === 'multiple_choice';
  }

  type ListEntry =
    | { kind: 'single'; variable: any }
    | { kind: 'select_group'; group: any; variables: any[]; answerType: string; study: any };

  // Pre-compute all siblings per select group from the full dataset
  let allSelectGroupSiblings = $derived.by(() => {
    const selectMap = new Map<string, any[]>();
    for (const v of variables) {
      const gId = v.expand?.group?.id;
      if (!gId) continue;
      if (isSelectType(v.answer_type) && !isMatrixOrGrid(v)) {
        if (!selectMap.has(gId)) selectMap.set(gId, []);
        selectMap.get(gId)!.push(v);
      }
    }
    return selectMap;
  });

  let groupedEntries = $derived.by(() => {
    const seenGroups = new Set<string>();
    const entries: ListEntry[] = [];

    for (const v of filteredVariables) {
      const g = v.expand?.group;
      const hasGroup = g && g.id;

      if (hasGroup && isSelectType(v.answer_type) && !isMatrixOrGrid(v)) {
        if (!seenGroups.has(g.id)) {
          seenGroups.add(g.id);
          const allSiblings = allSelectGroupSiblings.get(g.id) || [v];
          entries.push({ kind: 'select_group', group: g, variables: allSiblings, answerType: v.answer_type, study: v.expand?.study });
        }
      } else {
        entries.push({ kind: 'single', variable: v });
      }
    }

    return entries;
  });

  const PER_PAGE = 20;
  let clientPage = $state(1);

  // Clear choice-specific filters when answer type changes away from choice types
  $effect(() => {
    if (!isChoiceFilter) {
      filters.has_other = "";
      filters.has_long_list = "";
    }
  });

  // Reset to page 1 whenever search query or filters change
  $effect(() => {
    searchQuery;
    JSON.stringify(filters);
    clientPage = 1;
  });

  const totalPages = $derived(Math.max(1, Math.ceil(groupedEntries.length / PER_PAGE)));
  const currentPage = $derived(Math.min(Math.max(1, clientPage), totalPages));
  const paginatedEntries = $derived(
    groupedEntries.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
  );

  // PageStore-compatible store for Paginator
  const _pageData = writable({ page: 1, perPage: PER_PAGE, totalItems: 0, totalPages: 1, items: [] as any[] });
  $effect(() => {
    _pageData.set({ page: currentPage, perPage: PER_PAGE, totalItems: groupedEntries.length, totalPages, items: paginatedEntries as any[] });
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
      <p>Loading questions...</p>
    {:else if filteredVariables.length === 0}
      <p>No questions found.</p>
    {:else}
      <p class="count">{groupedEntries.length} question{groupedEntries.length === 1 ? '' : 's'}</p>
      <ul class="variable-list">
        {#each paginatedEntries as entry (entry.kind === 'single' ? entry.variable.id : entry.group.id)}
          <li>
            {#if entry.kind === 'select_group'}
              <QuestionCard>
                {#if entry.variables[0]?.prequestion_text}
                  <p class="meta-text"><span class="field-label">Question:</span> {entry.variables[0].prequestion_text}</p>
                {/if}
                <p class="meta-text"><span class="field-label">Concept:</span> {entry.group.label || entry.variables[0].concept}</p>

                <div class="card-tags">
                  <span class="type-tag">{answerTypeLabel(entry.answerType)}</span>
                  {#if entry.study}
                    <a href="/studies/{entry.study.id}" class="study-tag">{entry.study.title}</a>
                  {/if}
                </div>

                <p class="categories-summary">{entry.variables.length} categories</p>

                <a href="/questions/{entry.variables[0].id}" class="detail-link">View details &rarr;</a>
              </QuestionCard>
            {:else}
              {@const variable = entry.variable}
              <QuestionCard>
                {#if variable.question}
                  <p class="meta-text"><span class="field-label">Question:</span> {variable.question}</p>
                {/if}
                <p class="meta-text"><span class="field-label">Concept:</span> {variable.concept}</p>

                <div class="card-tags">
                  {#if variable.answer_type}
                    <span class="type-tag">{answerTypeLabel(variable.answer_type)}</span>
                  {/if}
                  {#if variable.expand?.study}
                    <a href="/studies/{variable.expand.study.id}#q-{variable.id}" class="study-tag">{variable.expand.study.title}</a>
                  {/if}
                </div>

                {#if variable.long_list_standard}
                  <p class="meta-text"><span class="field-label">Standard:</span> {variable.long_list_standard}</p>
                {/if}

                <a href="/questions/{variable.id}" class="detail-link">View details &rarr;</a>
              </QuestionCard>
            {/if}
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
