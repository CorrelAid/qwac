<script lang="ts">
  type Sheet = {
    name: string;
    headers: string[];
    rows: string[][];
  };

  let { sheets }: { sheets: Sheet[] } = $props();

  let activeSheet = $state(0);
  let copied = $state(false);

  function sheetToTsv(sheet: Sheet): string {
    return sheet.rows.map(row => row.join("\t")).join("\n");
  }

  async function copySheet() {
    const sheet = sheets[activeSheet];
    const tsv = sheetToTsv(sheet);
    await navigator.clipboard.writeText(tsv);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }

  async function copyAll() {
    const parts = sheets.map(s => `${s.name}\n${sheetToTsv(s)}`);
    await navigator.clipboard.writeText(parts.join("\n\n"));
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }
</script>

<div class="spreadsheet">
  <div class="toolbar">
    <div class="tabs">
      {#each sheets as sheet, i (sheet.name)}
        <button
          class="tab"
          class:active={activeSheet === i}
          onclick={() => activeSheet = i}
        >{sheet.name}</button>
      {/each}
    </div>
    <div class="actions">
      <button class="copy-btn" onclick={copySheet}>
        {copied ? "Copied!" : `Copy "${sheets[activeSheet].name}"`}
      </button>
      {#if sheets.length > 1}
        <button class="copy-btn" onclick={copyAll}>Copy All</button>
      {/if}
    </div>
  </div>

  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          {#each sheets[activeSheet].headers as header, hi (hi)}
            <th>{header}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each sheets[activeSheet].rows as row, ri (ri)}
          <tr>
            {#each row as cell, ci (ci)}
              <td>{cell}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .spreadsheet {
    border: var(--dimension-border-width) solid var(--color-primary-darker);
    border-radius: var(--radius-md);
    overflow: hidden;
    background-color: var(--color-white);
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    background-color: #f0f0f0;
    border-bottom: var(--dimension-border-width) solid var(--color-primary-darker);
    padding: 0 var(--spacing-xs);
  }

  .tabs {
    display: flex;
    gap: 0;
  }

  .tab {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: none;
    background: none;
    font-size: var(--font-size-small-min);
    font-family: var(--font-family-body);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    color: var(--color-text-primary);
    opacity: 0.6;
    transition: all 0.15s;
  }

  .tab:hover {
    opacity: 1;
  }

  .tab.active {
    opacity: 1;
    border-bottom-color: var(--color-secondary);
    font-weight: var(--font-weight-bold);
  }

  .actions {
    display: flex;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) 0;
  }

  .copy-btn {
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

  .copy-btn:hover {
    background-color: var(--color-secondary);
    color: var(--color-white);
  }

  .table-wrapper {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-small-min);
    font-family: var(--font-family-mono);
  }

  th, td {
    padding: var(--spacing-xs) var(--spacing-sm);
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
    border-right: 1px solid #e0e0e0;
    white-space: nowrap;
  }

  th:last-child, td:last-child {
    border-right: none;
  }

  th {
    background-color: #f8f8f8;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    position: sticky;
    top: 0;
  }

  tbody tr:hover {
    background-color: #fafafa;
  }

  td {
    color: var(--color-text-primary);
  }
</style>
