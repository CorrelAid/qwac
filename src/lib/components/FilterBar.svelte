<script lang="ts">
  type FilterOption = {
    label: string;
    key: string;
    values: string[];
    counts?: Record<string, number>;
    kind?: 'select' | 'chip';
    hidden?: boolean;
  };

  let {
    searchQuery = $bindable(""),
    filters = $bindable({}),
    filterOptions = []
  }: {
    searchQuery: string;
    filters: Record<string, string>;
    filterOptions: FilterOption[];
  } = $props();

  let hasActiveFilters = $derived(
    Object.values(filters).some(v => v !== "") || searchQuery !== ""
  );

  function toggleChip(key: string, val: string) {
    filters[key] = filters[key] === val ? "" : val;
  }
</script>

<div class="filter-bar">
  <input
    type="search"
    bind:value={searchQuery}
    placeholder="Search questions..."
    class="search-input"
  />

  <div class="filters">
    {#each filterOptions as option (option.key)}
      {#if option.hidden}
        {'' /* skip */}
      {:else if option.kind === 'chip'}
        <div class="chip-group">
          <span class="chip-label">{option.label}</span>
          {#each option.values as val}
            {@const count = option.counts?.[val]}
            <button
              class="chip"
              class:active={filters[option.key] === val}
              onclick={() => toggleChip(option.key, val)}
            >
              {val}
              {#if count != null}<span class="count">{count}</span>{/if}
            </button>
          {/each}
        </div>
      {:else}
        <select
          id={option.key}
          bind:value={filters[option.key]}
          aria-label={option.label}
        >
          <option value="">{option.label}</option>
          {#each option.values as val}
            {@const count = option.counts?.[val]}
            <option value={val}>{val}{count != null ? ` (${count})` : ''}</option>
          {/each}
        </select>
      {/if}
    {/each}

    {#if hasActiveFilters}
      <button class="clear-btn" onclick={() => {
        searchQuery = "";
        for (let k in filters) filters[k] = "";
      }}>Clear</button>
    {/if}
  </div>
</div>

<style>
  .filter-bar {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
    background-color: var(--color-white);
    border: var(--dimension-border-width) solid var(--color-primary-darker);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-base);
  }

  .search-input {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-sm);
    border: var(--dimension-border-width) solid var(--color-primary-darker);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-body);
    font-size: var(--font-size-small-min);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-secondary);
    box-shadow: 0 0 0 2px rgba(134, 24, 79, 0.1);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .filters select {
    width: 220px;
    padding: var(--spacing-xs) var(--spacing-sm);
    border: var(--dimension-border-width) solid var(--color-primary-darker);
    border-radius: var(--radius-sm);
    background-color: var(--color-white);
    font-family: var(--font-family-body);
    font-size: var(--font-size-small-min);
  }

  .chip-group {
    display: flex;
    align-items: center;
    gap: var(--spacing-2xs);
  }

  .chip-label {
    font-size: var(--font-size-caption-min);
    color: var(--color-text-primary);
    opacity: 0.5;
    white-space: nowrap;
    margin-right: 2px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: var(--spacing-2xs) var(--spacing-sm);
    border: 1.5px solid var(--color-primary-darker);
    border-radius: 999px;
    background: none;
    font-family: var(--font-family-body);
    font-size: var(--font-size-caption-min);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .chip:hover {
    border-color: var(--color-secondary);
    color: var(--color-secondary);
  }

  .chip.active {
    background-color: var(--color-secondary);
    border-color: var(--color-secondary);
    color: var(--color-white);
  }

  .count {
    font-size: 0.85em;
    opacity: 0.6;
  }

  .clear-btn {
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

  .clear-btn:hover {
    background-color: var(--color-secondary);
    color: var(--color-white);
  }
</style>
