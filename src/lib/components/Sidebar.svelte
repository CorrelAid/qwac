<script lang="ts">
  let { 
    searchQuery = $bindable(""), 
    filters = $bindable({}),
    filterOptions = [] 
  }: {
    searchQuery: string;
    filters: Record<string, string>;
    filterOptions: { label: string, key: string, values: string[] }[];
  } = $props();
</script>

<aside class="sidebar">
  <section class="search-section">
    <h3>Search</h3>
    <input 
      type="search" 
      bind:value={searchQuery} 
      placeholder="Search through text..." 
      class="search-input"
    />
  </section>

  <section class="filters-section">
    <h3>Filters</h3>
    {#each filterOptions as option}
      <div class="filter-group">
        <label for={option.key}>{option.label}</label>
        <select id={option.key} bind:value={filters[option.key]}>
          <option value="">All</option>
          {#each option.values as val}
            <option value={val}>{val}</option>
          {/each}
        </select>
      </div>
    {/each}
    
    {#if Object.values(filters).some(v => v !== "") || searchQuery !== ""}
      <button class="secondary small" onclick={() => {
        searchQuery = "";
        for (let k in filters) filters[k] = "";
      }}>Clear All</button>
    {/if}
  </section>
</aside>

<style>
  .sidebar {
    width: 250px;
    padding: var(--spacing-base);
    background-color: var(--color-white);
    border-right: var(--dimension-border-width) solid var(--color-primary-darker);
    height: auto;
    flex-shrink: 0;
    border-radius: var(--radius-md);
    position: sticky;
    top: calc(var(--spacing-base) + 60px); /* Adjust based on header height */
  }

  h3 {
    font-size: var(--font-size-label-min);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider);
    margin-bottom: var(--spacing-sm);
    color: var(--color-secondary);
    border-bottom: 1px solid var(--color-tertiary);
    padding-bottom: var(--spacing-2xs);
  }

  .search-section {
    margin-bottom: var(--spacing-xl);
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

  .filter-group {
    margin-bottom: var(--spacing-base);
  }

  .filter-group label {
    display: block;
    font-size: var(--font-size-caption-min);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-2xs);
    color: var(--color-text-primary);
  }

  .filter-group select {
    width: 100%;
    padding: var(--spacing-xs);
    border: var(--dimension-border-width) solid var(--color-primary-darker);
    border-radius: var(--radius-sm);
    background-color: var(--color-white);
    font-family: var(--font-family-body);
    font-size: var(--font-size-small-min);
  }

  button.secondary.small {
    width: 100%;
    padding: var(--spacing-xs);
    background: none;
    border: 1.5px solid var(--color-secondary);
    border-radius: var(--radius-sm);
    color: var(--color-secondary);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-caption-min);
    cursor: pointer;
    transition: all 0.2s;
  }

  button.secondary.small:hover {
    background-color: var(--color-secondary);
    color: var(--color-white);
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 100%;
      border-right: none;
      border-bottom: var(--dimension-border-width) solid var(--color-primary-darker);
      position: static;
      margin-bottom: var(--spacing-base);
    }
  }
</style>
