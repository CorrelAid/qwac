<script lang="ts">
  import { page } from "$app/stores";
  import { client, clearOnAuthError, fetchApiText, fetchApiJson } from "$lib/pocketbase";
  import { XlsFormDisplay, DdiDisplay } from "@correlaid/cdl-design";
  import SurveyPreview from "$lib/components/SurveyPreview.svelte";
  import GridPreview from "$lib/components/GridPreview.svelte";
  import { metadata } from "$lib/metadata";
  import { validatePbId, safePath, safeErrorMessage } from "$lib/validation";
  import { getCached, setCached } from "$lib/cache";
  import AnswerTypeTag from "$lib/components/AnswerTypeTag.svelte";
  import { t } from "$lib/i18n";

  function answerTypeLabel(type: string): string {
    if (!type) return '';
    return type.replace(/_other$/, '').replace(/_long_list$/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  let variable = $state<any>(null);
  let group = $state<any>(null);
  let groupVariables = $state<any[]>([]);
  let study = $state<any>(null);
  let variableXml = $state<string | null>(null);
  let xlsformData = $state<any>(null);
  let apiAnswerType = $state<string>('');
  let error = $state<string | null>(null);
  let activeTab = $state<'preview' | 'xlsform' | 'ddi'>('preview');

  let isGroupQuestion = $derived(!!group);
  let groupType = $derived((group?.type || '').toLowerCase());
  let isMatrix = $derived(groupType.includes('grid') || groupType.includes('matrix'));
  let isSelectGroup = $derived(isGroupQuestion && !isMatrix);

  function isChoiceType(t: string): boolean {
    return /^(single_choice|multiple_choice)(_other|_long_list)?$/.test(t || '');
  }

  // Detect "other" from group variables: a text variable among choice variables in select groups
  let isChoiceGroup = $derived(
    isGroupQuestion && !isMatrix &&
    groupVariables.some(v => isChoiceType(v.answer_type))
  );

  let otherVariable = $derived(
    isChoiceGroup
      ? groupVariables.find(v => v.answer_type === 'text') ?? null
      : null
  );

  let hasOther = $derived(!!otherVariable);

  let choiceVariables = $derived(
    hasOther
      ? groupVariables.filter(v => v.answer_type !== 'text')
      : groupVariables
  );

  let otherLabel = $derived(
    otherVariable?.question || otherVariable?.label || otherVariable?.concept || 'Other'
  );

  function normalizeAnswerType(type: string): string {
    return (type || '').replace(/_other$/, '').replace(/_long_list$/, '');
  }

  let rawAnswerType = $derived(apiAnswerType || (() => {
    if (!isGroupQuestion) return variable?.answer_type || '';
    if (isMatrix) return 'grid';
    if (groupType === 'multipleresp') return 'multiple_choice';
    return choiceVariables[0]?.answer_type || group?.type || '';
  })());

  let displayAnswerType = $derived(normalizeAnswerType(rawAnswerType));

  let displayConcept = $derived(
    isGroupQuestion
      ? (group?.concept || groupVariables[0]?.concept || '')
      : (variable?.concept || '')
  );

  $effect(() => {
    const rawId = $page.params.id!;
    const load = async () => {
      try {
        const id = validatePbId(rawId);

        // Fetch authoritative question data (answer_type etc) from API
        const cachedQuestion = getCached<any>(`question:${id}`);
        const questionData = cachedQuestion ?? await fetchApiJson(`/api/questions/${safePath(id)}`).then((d: any) => { setCached(`question:${id}`, d); return d; }).catch(() => null);
        apiAnswerType = questionData?.answer_type || '';

        // Try loading as a variable first
        let loadedVariable: any = getCached<any>(`variable:${id}`);
        if (!loadedVariable) {
          try {
            loadedVariable = await client.collection("variables").getOne(id, {
              expand: "study,group",
              requestKey: null,
            });
            setCached(`variable:${id}`, loadedVariable);
          } catch (e: any) {
            if (e?.status !== 404) throw e;
          }
        }

        // Fetch DDI XML and XLSForm via question-level endpoints
        const cachedXml = getCached<string>(`xml:${id}`);
        const cachedXls = getCached<any>(`xlsform:${id}`);
        if (cachedXml) { variableXml = cachedXml; } else {
          fetchApiText(`/api/questions/${safePath(id)}/xml`).then(xml => { variableXml = xml; setCached(`xml:${id}`, xml); }).catch(() => {});
        }
        if (cachedXls) { xlsformData = cachedXls; } else {
          fetchApiJson(`/api/questions/${safePath(id)}/xlsform`).then(data => { xlsformData = data; setCached(`xlsform:${id}`, data); }).catch(() => {});
        }

        // Fetch group variables by ID using getOne (public) instead of getFullList (auth-only list rule).
        // variable_ids comes from the /api/questions/{id} response.
        async function fetchGroupVars(cacheKey: string): Promise<any[]> {
          const cached = getCached<any[]>(cacheKey);
          if (cached) return cached;
          const varIds: string[] = questionData?.variable_ids ?? [];
          if (varIds.length === 0) return [];
          const vars = await Promise.all(
            varIds.map((vid: string) => {
              const v = validatePbId(vid);
              const cachedVar = getCached<any>(`variable:${v}`);
              return cachedVar ?? client.collection("variables").getOne(v, { requestKey: null })
                .then((d: any) => { setCached(`variable:${v}`, d); return d; });
            })
          );
          setCached(cacheKey, vars);
          return vars;
        }

        if (loadedVariable) {
          // Standalone variable or variable that belongs to a group
          variable = loadedVariable;
          study = loadedVariable.expand?.study || null;
          const g = loadedVariable.expand?.group;

          if (g?.id) {
            group = g;
            const validGroupId = validatePbId(g.id);
            groupVariables = await fetchGroupVars(`group-vars:${validGroupId}`);
          } else {
            group = null;
            groupVariables = [];
          }
        } else {
          // ID is a group ID (from the questions endpoint)
          const cachedGroup = getCached<any>(`group:${id}`);
          const grp = cachedGroup ?? await client.collection("variable_groups").getOne(id, {
            expand: "study",
            requestKey: null,
          }).then((d: any) => { setCached(`group:${id}`, d); return d; });
          group = grp;
          study = grp.expand?.study || null;
          variable = null;
          groupVariables = await fetchGroupVars(`group-vars:${id}`);
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
{:else if !variable && !group}
  <p>{$t('question.loading')}</p>
{:else}
  <article class="question-detail">
    <a href="/" class="back-link">&larr; {$t('question.back')}</a>

    <p class="concept-line"><span class="field-label">{$t('question.concept')}</span> {displayConcept}</p>
    {#if variable?.long_list_standard}
      <p class="concept-line"><span class="field-label">{$t('question.standard')}</span> {variable.long_list_standard}</p>
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
        {#if isMatrix && groupVariables.length > 0}
          <GridPreview variables={groupVariables} question={groupVariables[0]?.prequestion_text || group?.description || group?.concept || ''} />
        {:else if isSelectGroup && choiceVariables.length > 0}
          {@const firstVar = choiceVariables[0]}
          <SurveyPreview variable={{
            ...firstVar,
            prequestion_text: null,
            question: firstVar?.prequestion_text || group?.description || group?.concept || firstVar?.question,
            answer_type: displayAnswerType,
            has_other: hasOther,
            other_label: otherLabel,
            categories: choiceVariables.map(v => ({
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
