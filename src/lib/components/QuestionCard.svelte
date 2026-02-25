<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="question-card">
  {@render children()}
</div>

<style>
  .question-card {
    background-color: var(--color-white);
    border-radius: var(--radius-md);
    padding: var(--spacing-base);
  }
</style>
