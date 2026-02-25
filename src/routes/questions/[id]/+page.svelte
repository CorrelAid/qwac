<script lang="ts">
  import { page } from "$app/stores";
  import { client, clearOnAuthError, fetchApiText } from "$lib/pocketbase";
  import SpreadsheetTable from "$lib/components/SpreadsheetTable.svelte";
  import XmlCodeBlock from "$lib/components/XmlCodeBlock.svelte";
  import SurveyPreview from "$lib/components/SurveyPreview.svelte";
  import MatrixGroupPreview from "$lib/components/MatrixGroupPreview.svelte";
  import { metadata } from "$lib/metadata";
  import { validatePbId, safeRelationFilter, safePath, safeErrorMessage } from "$lib/validation";

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

  let variable = $state<any>(null);
  let groupVariables = $state<any[]>([]);
  let variableXml = $state<string | null>(null);
  let error = $state<string | null>(null);
  let activeTab = $state<'preview' | 'xlsform' | 'ddi'>('preview');

  function isMatrixGroup(group: any): boolean {
    const type = group?.type?.toLowerCase() || '';
    return type.includes('grid') || type.includes('matrix');
  }

  let isMatrix = $derived(isMatrixGroup(variable?.expand?.group));

  $effect(() => {
    const rawId = $page.params.id!;
    const load = async () => {
      try {
        const id = validatePbId(rawId);
        variable = await client.collection("variables").getOne(id, {
          expand: "study,group",
          requestKey: null,
        });
        $metadata.title = variable.concept;
        $metadata.headline = "";
        fetchApiText(`/api/variables/${safePath(id)}/xml`).then(xml => { variableXml = xml; }).catch(() => {});
        const groupId = variable.expand?.group?.id;
        if (groupId && isMatrixGroup(variable.expand?.group)) {
          const validGroupId = validatePbId(groupId);
          const siblings = await client.collection("variables").getFullList({
            filter: safeRelationFilter("group", validGroupId),
            requestKey: null,
          });
          groupVariables = siblings;
        } else {
          groupVariables = [];
        }
      } catch (e: any) {
        clearOnAuthError(e);
        error = safeErrorMessage(e, "Failed to load question.");
      }
    };
    load();
  });

  type Sheet = {
    name: string;
    headers: string[];
    rows: string[][];
  };

  let xlsSheets = $derived.by(() => {
    if (!variable) return [];

    const hasCategories = variable.categories && Array.isArray(variable.categories) && variable.categories.length > 0;
    const listName = variable.name + "_list";
    const qType = variable.question_type || '';
    const isMultiple = qType === 'select_multiple';

    // Determine XLSForm type
    let type: string;
    if (isMultiple && hasCategories) {
      type = `select_multiple ${listName}`;
    } else if (hasCategories) {
      type = `select_one ${listName}`;
    } else if (qType && !hasCategories) {
      type = qType;
    } else {
      type = 'text';
    }

    const sheets: Sheet[] = [];

    // Survey sheet
    sheets.push({
      name: "survey",
      headers: ["type", "name", "label"],
      rows: [[type, variable.name, variable.question || variable.label || ""]],
    });

    // Choices sheet (for select types)
    if (hasCategories) {
      const choiceRows = variable.categories.map((cat: any) => {
        const val = String(cat.value ?? cat.catValu ?? cat.name ?? "");
        const label = String(cat.label ?? cat.labl ?? val);
        return [listName, val, label];
      });
      sheets.push({
        name: "choices",
        headers: ["list_name", "name", "label"],
        rows: choiceRows,
      });
    }

    return sheets;
  });
</script>

{#if error}
  <div class="error-box">{error}</div>
{:else if !variable}
  <p>Loading question...</p>
{:else}
  <article class="question-detail">
    <a href="/" class="back-link">&larr; Back to questions</a>

    <h2>{variable.concept}</h2>

    <div class="meta-row">
      {#if variable.question_type}
        <span class="type-tag">{questionTypeLabel(variable.question_type)}</span>
      {/if}
      {#if variable.expand?.study}
        <a href="/studies/{variable.expand.study.id}#q-{variable.id}" class="study-tag">{variable.expand.study.title}</a>
      {/if}
    </div>

    <div class="view-tabs">
      <button class="view-tab" class:active={activeTab === 'preview'} onclick={() => activeTab = 'preview'}>Survey Preview</button>
      <button class="view-tab" class:active={activeTab === 'xlsform'} onclick={() => activeTab = 'xlsform'}>XLSForm</button>
      <button class="view-tab" class:active={activeTab === 'ddi'} onclick={() => activeTab = 'ddi'}>DDI XML</button>
    </div>

    <div class="tab-content">
      {#if activeTab === 'preview'}
        {#if isMatrix && groupVariables.length > 0}
          <MatrixGroupPreview group={variable.expand.group} variables={groupVariables} activeId={variable.id} />
        {:else}
          <SurveyPreview {variable} />
        {/if}
      {:else if activeTab === 'xlsform'}
        {#if xlsSheets.length > 0}
          <p class="hint">Copy the sheet data and paste into your spreadsheet program.</p>
          <SpreadsheetTable sheets={xlsSheets} />
        {:else}
          <p class="hint">No XLSForm data available.</p>
        {/if}
      {:else if activeTab === 'ddi'}
        {#if variableXml}
          <XmlCodeBlock xml={variableXml} />
        {:else}
          <p class="hint">Loading DDI XML...</p>
        {/if}
      {/if}
    </div>
  </article>
{/if}

<style>
  .question-detail {
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

  h2 {
    color: var(--color-secondary);
    margin: var(--spacing-sm) 0 var(--spacing-xs);
  }

  .meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-base);
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

  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2xs);
    margin-bottom: var(--spacing-base);
  }

  .concept-text {
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

  .group-tag {
    font-size: var(--font-size-caption-min);
    padding: 1px var(--spacing-xs);
    border-radius: var(--radius-sm);
    background-color: var(--color-primary-darker);
    color: var(--color-white);
    text-decoration: none;
    white-space: nowrap;
  }

  .group-tag:hover {
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
    color: var(--color-text-primary);
    opacity: 0.6;
    transition: all 0.15s;
  }

  .view-tab:hover {
    opacity: 1;
  }

  .view-tab.active {
    opacity: 1;
    border-bottom-color: var(--color-secondary);
    font-weight: var(--font-weight-bold);
    color: var(--color-secondary);
  }

  .tab-content {
    min-height: 200px;
  }

  .hint {
    font-size: var(--font-size-small-min);
    color: var(--color-text-primary);
    opacity: 0.6;
    margin-bottom: var(--spacing-sm);
  }

  .error-box {
    padding: var(--spacing-base);
    background-color: #fff1f1;
    border: 1px solid #ffa3a3;
    border-radius: var(--radius-base);
    color: #d32f2f;
  }

</style>
