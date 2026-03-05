<script lang="ts">
  let { concept, standard }: { concept: string; standard?: string } = $props();
</script>

<div class="long-list">
  <select disabled>
    <option>{concept || 'Select...'}</option>
  </select>
  {#if standard}
    <p class="hint">Standard: {standard}</p>
  {/if}
</div>

<style>
  .long-list select {
    width: 100%;
    max-width: 400px;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-body-min);
    font-family: var(--font-family-body);
    border: 1.5px solid var(--color-primary-darker);
    border-radius: var(--radius-sm);
    background-color: var(--color-white);
    color: var(--color-text-primary);
    cursor: default;
    appearance: auto;
  }

  .hint {
    font-size: var(--font-size-caption-min);
    color: var(--color-text-primary);
    opacity: 0.5;
    margin-top: var(--spacing-xs);
  }
</style>
