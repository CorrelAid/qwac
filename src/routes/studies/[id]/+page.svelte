<script lang="ts">
  import { page } from "$app/stores";
  import { client, clearOnAuthError, fetchApiBlob } from "$lib/pocketbase";
  import SurveyPreview from "$lib/components/SurveyPreview.svelte";
  import MatrixGroupPreview from "$lib/components/MatrixGroupPreview.svelte";
  import QuestionCard from "$lib/components/QuestionCard.svelte";
  import { metadata } from "$lib/metadata";
  import { extractText, extractUri, parseGoValue } from "$lib/ddi";
  import { validatePbId, safeRelationFilter, safePath, safeErrorMessage } from "$lib/validation";

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
  let variables = $state<any[]>([]);
  let error = $state<string | null>(null);
  let exporting = $state(false);

  $effect(() => {
    const rawId = $page.params.id!;
    const load = async () => {
      try {
        const id = validatePbId(rawId);
        study = await client.collection("studies").getOne(id, { requestKey: null });
        $metadata.title = study.title;
        $metadata.headline = "";
        const result = await client.collection("variables").getFullList({
          filter: safeRelationFilter("study", id),
          expand: "group",
          requestKey: null,
        });
        variables = result;
      } catch (e: any) {
        clearOnAuthError(e);
        error = safeErrorMessage(e, "Failed to load study.");
      }
    };
    load();
  });

  function isGridGroup(group: any): boolean {
    const type = group?.type?.toLowerCase() || '';
    return type.includes('grid') || type.includes('matrix');
  }

  type VariableEntry =
    | { kind: 'single'; variable: any }
    | { kind: 'grid'; group: any; variables: any[] };

  let variableEntries = $derived.by(() => {
    const gridGroups = new Map<string, { group: any; variables: any[] }>();
    const singles: { index: number; variable: any }[] = [];
    let idx = 0;

    for (const v of variables) {
      const g = v.expand?.group;
      if (g && isGridGroup(g)) {
        if (!gridGroups.has(g.id)) {
          gridGroups.set(g.id, { group: g, variables: [] });
          // Reserve a slot at this position for the grid
          singles.push({ index: idx, variable: null as any });
        }
        gridGroups.get(g.id)!.variables.push(v);
      } else {
        singles.push({ index: idx, variable: v });
      }
      idx++;
    }

    // Build final list, inserting grid groups at their first occurrence
    const entries: VariableEntry[] = [];
    const insertedGrids = new Set<string>();

    for (const s of singles) {
      if (s.variable === null) {
        // This was a placeholder for a grid group — find it
        for (const [gid, gdata] of gridGroups) {
          if (!insertedGrids.has(gid)) {
            entries.push({ kind: 'grid', group: gdata.group, variables: gdata.variables });
            insertedGrids.add(gid);
            break;
          }
        }
      } else {
        entries.push({ kind: 'single', variable: s.variable });
      }
    }

    return entries;
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
  <p>Loading study...</p>
{:else}
  <article class="study-detail">
    <a href="/" class="back-link">&larr; Back to questions</a>

    <div class="title-row">
      <h2>{study.title}</h2>
      <button class="export-btn" onclick={exportDdiXml} disabled={exporting}>
        {exporting ? "Exporting..." : "Export DDI XML"}
      </button>
    </div>

    <div class="meta-grid">
      {#if study.author}
        <div class="meta-item">
          <strong>Author</strong>
          <span>{formatAuthor(study.author)}</span>
        </div>
      {/if}
      {#if study.time_period}
        <div class="meta-item"><strong>Time Period</strong><span>{study.time_period}</span></div>
      {/if}
      {#if study.analysis_unit}
        <div class="meta-item"><strong>Analysis Unit</strong><span>{study.analysis_unit}</span></div>
      {/if}
      {#if study.universe}
        <div class="meta-item"><strong>Universe</strong><span>{study.universe}</span></div>
      {/if}
      {#if study.data_kind}
        <div class="meta-item"><strong>Data Kind</strong><span>{study.data_kind}</span></div>
      {/if}
      {#if study.holdings_uri}
        <div class="meta-item">
          <strong>Source</strong>
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
        <h3>Abstract</h3>
        <p>{extractText(study.abstract)}</p>
      </div>
    {/if}

    <section class="variables-section">
      <h3>Variables ({variables.length})</h3>
      {#if variables.length === 0}
        <p>No variables found for this study.</p>
      {:else}
        <ul class="variable-list">
          {#each variableEntries as entry}
            {#if entry.kind === 'grid'}
              <li id="group-{entry.group.id}">
                <QuestionCard>
                  <MatrixGroupPreview group={entry.group} variables={entry.variables} />
                </QuestionCard>
              </li>
            {:else}
              <li id="q-{entry.variable.id}">
                <QuestionCard>
                  <div class="var-header">
                    <a href="/questions/{entry.variable.id}" class="var-name">{entry.variable.concept}</a>
                  </div>
                  <SurveyPreview variable={entry.variable} />
                </QuestionCard>
              </li>
            {/if}
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

  .var-header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-2xs);
  }

  .var-name {
    font-weight: var(--font-weight-bold);
    color: var(--color-secondary);
    text-decoration: none;
  }

  .var-name:hover {
    text-decoration: underline;
  }



  .error-box {
    padding: var(--spacing-base);
    background-color: #fff1f1;
    border: 1px solid #ffa3a3;
    border-radius: var(--radius-base);
    color: #d32f2f;
  }

</style>
