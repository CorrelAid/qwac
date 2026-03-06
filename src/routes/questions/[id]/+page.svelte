<script lang="ts">
  import { page } from "$app/stores";
  import { client, clearOnAuthError, fetchApiText, fetchApiJson } from "$lib/pocketbase";
  import { XlsFormDisplay, DdiDisplay } from "@correlaid/cdl-design";
  import SurveyPreview from "$lib/components/SurveyPreview.svelte";
  import GridPreview from "$lib/components/GridPreview.svelte";
  import { metadata } from "$lib/metadata";
  import { validatePbId, safeRelationFilter, safePath, safeErrorMessage } from "$lib/validation";

  function answerTypeLabel(type: string): string {
    if (!type) return '';
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  let variable = $state<any>(null);
  let groupVariables = $state<any[]>([]);
  let variableXml = $state<string | null>(null);
  let xlsformData = $state<any>(null);
  let error = $state<string | null>(null);
  let activeTab = $state<'preview' | 'xlsform' | 'ddi'>('preview');

  function isMatrixGroup(group: any): boolean {
    const type = group?.type?.toLowerCase() || '';
    return type.includes('grid') || type.includes('matrix');
  }

  function isSelectType(answerType: string): boolean {
    return answerType === 'select_one' || answerType === 'select_multiple'
      || answerType === 'single_choice' || answerType === 'multiple_choice';
  }

  let isMatrix = $derived(isMatrixGroup(variable?.expand?.group));
  let isSelectGroup = $derived(
    variable?.expand?.group?.id && isSelectType(variable?.answer_type || '') && !isMatrix
  );

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
        const groupId = variable.expand?.group?.id;
        const isSelect = groupId && isSelectType(variable.answer_type) && !isMatrixGroup(variable.expand?.group);
        const shouldLoadSiblings = groupId && (
          isMatrixGroup(variable.expand?.group) || isSelect
        );

        if (isSelect) {
          const validGroupId = validatePbId(groupId);
          // Use group-level endpoints for select groups
          fetchApiText(`/api/variable-groups/${safePath(validGroupId)}/codebook`).then(xml => { variableXml = xml; }).catch(() => {});
          fetchApiJson(`/api/variable-groups/${safePath(validGroupId)}/xlsform`).then(data => { xlsformData = data; }).catch(() => {});
        } else {
          fetchApiText(`/api/variables/${safePath(id)}/xml`).then(xml => { variableXml = xml; }).catch(() => {});
          fetchApiJson(`/api/variables/${safePath(id)}/xlsform`).then(data => { xlsformData = data; }).catch(() => {});
        }

        if (shouldLoadSiblings) {
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

</script>

{#if error}
  <div class="error-box">{error}</div>
{:else if !variable}
  <p>Loading question...</p>
{:else}
  <article class="question-detail">
    <a href="/" class="back-link">&larr; Back to questions</a>

    <p class="concept-line"><span class="field-label">Concept:</span> {variable.concept}</p>
    {#if variable.long_list_standard}
      <p class="concept-line"><span class="field-label">Standard:</span> {variable.long_list_standard}</p>
    {/if}

    <div class="meta-row">
      {#if variable.answer_type}
        <span class="type-tag">{answerTypeLabel(variable.answer_type)}</span>
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
        {#if isMatrix}
          <GridPreview variables={[variable]} />
        {:else if isSelectGroup && groupVariables.length > 0}
          <SurveyPreview variable={{
            ...variable,
            question: variable.prequestion_text || variable.expand?.group?.label || variable.question,
            categories: groupVariables.map(v => ({
              label: v.question || v.label || v.concept,
              value: v.name || v.id
            }))
          }} />
        {:else}
          <SurveyPreview {variable} />
        {/if}
      {:else if activeTab === 'xlsform'}
        {#if xlsformData}
          <XlsFormDisplay survey={xlsformData.survey} choices={xlsformData.choices} />
        {:else}
          <p class="hint">Loading XLSForm data...</p>
        {/if}
      {:else if activeTab === 'ddi'}
        {#if variableXml}
          <DdiDisplay ddiXml={variableXml} />
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

  .concept-line {
    font-size: var(--font-size-small-min);
    margin: 0 0 var(--spacing-xs);
  }

  .field-label {
    font-size: var(--font-size-caption-min);
    color: var(--color-text-primary);
    opacity: 0.6;
    font-weight: var(--font-weight-medium);
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
