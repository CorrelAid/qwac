<script lang="ts">
  import { page } from "$app/stores";
  import { client, clearOnAuthError, fetchApiBlob, fetchApiJson } from "$lib/pocketbase";
  import QuestionCard from "$lib/components/QuestionCard.svelte";
  import { metadata } from "$lib/metadata";
  import { extractText, extractUri, parseGoValue } from "$lib/ddi";
  import { validatePbId, safePath, safeErrorMessage } from "$lib/validation";
  import { getCached, setCached } from "$lib/cache";
  import AnswerTypeTag from "$lib/components/AnswerTypeTag.svelte";
  import { t } from "$lib/i18n";

  function answerTypeLabel(type: string): string {
    if (!type) return '';
    return type.replace(/_other$/, '').replace(/_long_list$/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function formatAuthor(val: unknown): string {
    let parsed = typeof val === "string" && val.trim().startsWith("map[") ? parseGoValue(val) : val;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      const name = extractText(obj["#text"] ?? "");
      const affiliation = extractText(obj["-affiliation"] ?? "");
      if (name && affiliation) return `${name}, ${affiliation}`;
      return name || affiliation;
    }
    return extractText(val);
  }

  let study = $state<any>(null);
  let questions = $state<any[]>([]);
  let error = $state<string | null>(null);
  let exporting = $state(false);

  $effect(() => {
    const rawId = $page.params.id!;
    const load = async () => {
      try {
        const id = validatePbId(rawId);
        const cachedStudy = getCached<any>(`study:${id}`);
        const cachedQuestions = getCached<any[]>(`study-questions:${id}`);
        const [studyData, questionsData] = await Promise.all([
          cachedStudy ?? client.collection("studies").getOne(id, { requestKey: null }).then(d => { setCached(`study:${id}`, d); return d; }),
          cachedQuestions ?? fetchApiJson(`/api/studies/${safePath(id)}/questions`).then((d: any[]) => { setCached(`study-questions:${id}`, d); return d; }),
        ]);
        study = studyData;
        questions = questionsData;
        $metadata.title = study.title;
        $metadata.headline = "";
      } catch (e: any) {
        clearOnAuthError(e);
        error = safeErrorMessage(e, $t('study.loadError'));
      }
    };
    load();
  });

  async function exportDdiXml() {
    const id = validatePbId($page.params.id!);
    exporting = true;
    try {
      const blob = await fetchApiBlob(`/api/studies/${safePath(id)}/export`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${study?.title || id}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      clearOnAuthError(e);
    } finally {
      exporting = false;
    }
  }
</script>

{#if error}
  <div class="error-box">{error}</div>
{:else if !study}
  <p>{$t('study.loading')}</p>
{:else}
  <article class="study-detail">
    <a href="/" class="back-link">&larr; {$t('study.back')}</a>

    <div class="title-row">
      <h2>{study.title}</h2>
      <button class="export-btn" onclick={exportDdiXml} disabled={exporting}>
        {exporting ? $t('study.exporting') : $t('study.exportDdi')}
      </button>
    </div>

    <div class="meta-grid">
      {#if study.author}
        <div class="meta-item">
          <strong>{$t('study.author')}</strong>
          <span>{formatAuthor(study.author)}</span>
        </div>
      {/if}
      {#if study.time_period}
        <div class="meta-item"><strong>{$t('study.timePeriod')}</strong><span>{study.time_period}</span></div>
      {/if}
      {#if study.analysis_unit}
        <div class="meta-item"><strong>{$t('study.analysisUnit')}</strong><span>{study.analysis_unit}</span></div>
      {/if}
      {#if study.universe}
        <div class="meta-item"><strong>{$t('study.universe')}</strong><span>{study.universe}</span></div>
      {/if}
      {#if study.data_kind}
        <div class="meta-item"><strong>{$t('study.dataKind')}</strong><span>{study.data_kind}</span></div>
      {/if}
      {#if study.holdings_uri}
        <div class="meta-item">
          <strong>{$t('study.source')}</strong>
          <a href={extractUri(study.holdings_uri)} target="_blank" rel="noopener">
            {extractText(study.holdings_description) || extractUri(study.holdings_uri)}
          </a>
        </div>
      {/if}
    </div>

    {#if study.topic_classifications?.length}
      <div class="tags">
        {#each study.topic_classifications as tc}
          <span class="tag">{tc}</span>
        {/each}
      </div>
    {/if}

    {#if study.abstract}
      <div class="abstract">
        <h3>{$t('study.abstract')}</h3>
        <p>{extractText(study.abstract)}</p>
      </div>
    {/if}

    <section class="variables-section">
      <h3>{$t('study.questions')} ({questions.length})</h3>
      {#if questions.length === 0}
        <p>{$t('study.noQuestions')}</p>
      {:else}
        <ul class="variable-list">
          {#each questions as question (question.id)}
            <li id="q-{question.id}">
              <QuestionCard>
                <a href="/questions/{question.id}" class="var-name">{question.concept || question.name}</a>
                {#if question.question_text}
                  <p class="question-text">{question.question_text}</p>
                {/if}
                <AnswerTypeTag type={question.answer_type} />
              </QuestionCard>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

  </article>
{/if}

<style>
  .study-detail {
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

  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  h2 {
    color: var(--color-secondary);
    margin: var(--spacing-sm) 0 var(--spacing-base);
  }

  .export-btn {
    margin-top: var(--spacing-sm);
    padding: var(--spacing-2xs) var(--spacing-sm);
    background: none;
    border: 1.5px solid var(--color-secondary);
    border-radius: var(--radius-sm);
    color: var(--color-secondary);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-caption-min);
    font-family: var(--font-family-body);
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .export-btn:hover:not(:disabled) {
    background-color: var(--color-secondary);
    color: var(--color-white);
  }

  .export-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-base);
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    font-size: var(--font-size-small-min);
  }

  .meta-item strong {
    color: var(--color-text-primary);
    opacity: 0.7;
    font-size: var(--font-size-caption-min);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2xs);
    margin-bottom: var(--spacing-base);
  }

  .tag {
    font-size: var(--font-size-caption-min);
    padding: var(--spacing-2xs) var(--spacing-xs);
    background-color: var(--color-tertiary);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
  }

  .abstract {
    margin-bottom: var(--spacing-lg);
  }

  .abstract h3 {
    margin-bottom: var(--spacing-xs);
    color: var(--color-secondary);
  }

  .abstract p {
    line-height: var(--line-height-relaxed);
  }

  .variables-section h3 {
    color: var(--color-secondary);
    margin-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--color-tertiary);
    padding-bottom: var(--spacing-2xs);
  }

  .variable-list {
    list-style: none;
    padding: 0;
  }

  .variable-list > li {
    margin-bottom: var(--spacing-base);
  }

  .var-name {
    font-weight: var(--font-weight-bold);
    color: var(--color-secondary);
    text-decoration: none;
    display: block;
    margin-bottom: var(--spacing-2xs);
  }

  .var-name:hover {
    text-decoration: underline;
  }

  .question-text {
    font-size: var(--font-size-small-min);
    line-height: var(--line-height-relaxed);
    margin: 0 0 var(--spacing-2xs);
  }

  .error-box {
    padding: var(--spacing-base);
    background-color: #fff1f1;
    border: 1px solid #ffa3a3;
    border-radius: var(--radius-base);
    color: #d32f2f;
  }

</style>
