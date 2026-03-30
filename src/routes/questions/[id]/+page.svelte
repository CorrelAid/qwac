<script lang="ts">
  import { page } from "$app/stores";
  import { clearOnAuthError, fetchApiText, fetchApiJson } from "$lib/pocketbase";
  import { XlsFormDisplay, DdiDisplay } from "@correlaid/cdl-design";
  import SurveyPreview from "$lib/components/SurveyPreview.svelte";
  import GridPreview from "$lib/components/GridPreview.svelte";
  import { metadata } from "$lib/metadata";
  import { validatePbId, safePath, safeErrorMessage } from "$lib/validation";
  import { getCached, setCached } from "$lib/cache";
  import AnswerTypeTag from "$lib/components/AnswerTypeTag.svelte";
  import { t } from "$lib/i18n";

  let questionData = $state<any>(null);
  let variableXml = $state<string | null>(null);
  let xlsformData = $state<any>(null);
  let error = $state<string | null>(null);
  let activeTab = $state<'preview' | 'xlsform' | 'ddi'>('preview');

  // Derived from the single API response
  let group = $derived(questionData?.group ?? null);
  let study = $derived(questionData?.study ?? null);
  let variables = $derived(questionData?.variables ?? []);

  // For standalone questions, the single variable is variables[0]
  let variable = $derived(group ? null : (variables[0] ?? null));

  let groupType = $derived((group?.type || '').toLowerCase());
  let isMatrix = $derived(groupType.includes('grid') || groupType.includes('matrix'));
  let isSelectGroup = $derived(!!group && !isMatrix);

  function isChoiceType(t: string): boolean {
    return /^(single_choice|multiple_choice)(_other|_long_list)?$/.test(t || '');
  }

  let isChoiceGroup = $derived(
    isSelectGroup && variables.some((v: any) => isChoiceType(v.answer_type))
  );

  let otherVariable = $derived(
    isChoiceGroup ? (variables.find((v: any) => v.answer_type === 'text') ?? null) : null
  );

  let hasOther = $derived(!!otherVariable);

  let choiceVariables = $derived(
    hasOther ? variables.filter((v: any) => v.answer_type !== 'text') : variables
  );

  let otherLabel = $derived(
    otherVariable?.question || otherVariable?.label || otherVariable?.concept || $t('preview.other')
  );

  function normalizeAnswerType(type: string): string {
    return (type || '').replace(/_other$/, '').replace(/_long_list$/, '');
  }

  let rawAnswerType = $derived((() => {
    const at = questionData?.answer_type || '';
    if (at) return at;
    if (!group) return variable?.answer_type || '';
    if (isMatrix) return 'grid';
    if (groupType === 'multipleresp') return 'multiple_choice';
    return choiceVariables[0]?.answer_type || group?.type || '';
  })());

  let displayAnswerType = $derived(normalizeAnswerType(rawAnswerType));

  let displayConcept = $derived(
    group
      ? (group.concept || variables[0]?.concept || '')
      : (variable?.concept || '')
  );

  let longListStandard = $derived(
    !group ? (variable?.long_list_standard || '') : ''
  );

  $effect(() => {
    const rawId = $page.params.id!;
    const load = async () => {
      try {
        const id = validatePbId(rawId);

        const cached = getCached<any>(`question:${id}`);
        const data = cached ?? await fetchApiJson(`/api/questions/${safePath(id)}`)
          .then((d: any) => { setCached(`question:${id}`, d); return d; });
        questionData = data;

        // Lazy-load tabs in background
        const cachedXml = getCached<string>(`xml:${id}`);
        const cachedXls = getCached<any>(`xlsform:${id}`);
        if (cachedXml) { variableXml = cachedXml; } else {
          fetchApiText(`/api/questions/${safePath(id)}/xml`).then(xml => { variableXml = xml; setCached(`xml:${id}`, xml); }).catch(() => {});
        }
        if (cachedXls) { xlsformData = cachedXls; } else {
          fetchApiJson(`/api/questions/${safePath(id)}/xlsform`).then(d => { xlsformData = d; setCached(`xlsform:${id}`, d); }).catch(() => {});
        }

        $metadata.title = displayConcept;
        $metadata.headline = "";
      } catch (e: any) {
        clearOnAuthError(e);
        error = safeErrorMessage(e, $t('question.loadError'));
      }
    };
    load();
  });

</script>

{#if error}
  <div class="error-box">{error}</div>
{:else if !questionData}
  <p>{$t('question.loading')}</p>
{:else}
  <article class="question-detail">
    <a href="/" class="back-link">&larr; {$t('question.back')}</a>

    <p class="concept-line"><span class="field-label">{$t('question.concept')}</span> {displayConcept}</p>
    {#if longListStandard}
      <p class="concept-line"><span class="field-label">{$t('question.standard')}</span> {longListStandard}</p>
    {/if}

    <div class="meta-row">
      {#if rawAnswerType}
        <AnswerTypeTag type={rawAnswerType} />
      {/if}
      {#if study}
        <a href="/studies/{study.id}#q-{group?.id || variable?.id}" class="study-tag">{study.title}</a>
      {/if}
    </div>

    <div class="view-tabs">
      <button class="view-tab" class:active={activeTab === 'preview'} onclick={() => activeTab = 'preview'}>{$t('question.tabPreview')}</button>
      <button class="view-tab" class:active={activeTab === 'xlsform'} onclick={() => activeTab = 'xlsform'}>{$t('question.tabXlsform')}</button>
      <button class="view-tab" class:active={activeTab === 'ddi'} onclick={() => activeTab = 'ddi'}>{$t('question.tabDdi')}</button>
    </div>

    <div class="tab-content">
      {#if activeTab === 'preview'}
        {#if isMatrix && variables.length > 0}
          <GridPreview {variables} question={variables[0]?.prequestion_text || group?.description || group?.concept || ''} />
        {:else if isSelectGroup && choiceVariables.length > 0}
          {@const firstVar = choiceVariables[0]}
          <SurveyPreview variable={{
            ...firstVar,
            prequestion_text: null,
            question: firstVar?.prequestion_text || group?.description || group?.concept || firstVar?.question,
            answer_type: displayAnswerType,
            has_other: hasOther,
            other_label: otherLabel,
            categories: choiceVariables.map((v: any) => ({
              label: v.question || v.label || v.concept,
              value: v.name || v.id
            }))
          }} />
        {:else if variable}
          <SurveyPreview variable={{
            ...variable,
            answer_type: normalizeAnswerType(variable.answer_type),
            has_other: variable.has_other === true || (variable.answer_type || '').endsWith('_other'),
          }} />
        {/if}
      {:else if activeTab === 'xlsform'}
        {#if xlsformData}
          <XlsFormDisplay survey={xlsformData.survey} choices={xlsformData.choices} />
        {:else}
          <p class="hint">{$t('question.loadingXlsform')}</p>
        {/if}
      {:else if activeTab === 'ddi'}
        {#if variableXml}
          <DdiDisplay ddiXml={variableXml} />
        {:else}
          <p class="hint">{$t('question.loadingDdi')}</p>
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

  .study-tag {
    font-size: var(--font-size-caption-min);
    padding: 1px var(--spacing-xs);
    border-radius: var(--radius-sm);
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
