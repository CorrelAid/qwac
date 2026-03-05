<script lang="ts">
  import GridPreview from "$lib/components/GridPreview.svelte";

  let { group, variables, activeId = null, showConcept = true }: {
    group: any;
    variables: any[];
    activeId?: string | null;
    showConcept?: boolean;
  } = $props();
</script>

{#if showConcept && group.label}
  <p class="concept-text"><span class="field-label">concept:</span> {group.label}</p>
{/if}
{#if variables[0]?.prequestion_text}
  <p class="grid-question">{variables[0].prequestion_text}</p>
{/if}
{#if variables[0]?.ivu_instructions}
  <div class="grid-instructions">
    <span class="instructions-label">Interviewer note</span>
    <p>{variables[0].ivu_instructions}</p>
  </div>
{/if}
<GridPreview {variables} {activeId} />

<style>
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

  .grid-question {
    font-size: var(--font-size-h4-min);
    font-weight: var(--font-weight-semibold);
    line-height: 1.4;
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-base);
  }

  .grid-instructions {
    background-color: #fef9e7;
    border-left: 3px solid #f0c040;
    padding: var(--spacing-sm) var(--spacing-base);
    margin-bottom: var(--spacing-base);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }

  .instructions-label {
    font-size: var(--font-size-caption-min);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider);
    color: #b8860b;
    display: block;
    margin-bottom: var(--spacing-2xs);
  }

  .grid-instructions p {
    font-size: var(--font-size-small-min);
    line-height: var(--line-height-relaxed);
    margin: 0;
    color: var(--color-text-primary);
  }
</style>
