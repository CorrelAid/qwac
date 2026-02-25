<script lang="ts">
  let { xml }: { xml: string } = $props();

  let copied = $state(false);

  async function copyXml() {
    await navigator.clipboard.writeText(xml);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }
</script>

<div class="xml-block">
  <div class="xml-toolbar">
    <span class="xml-label">XML</span>
    <button class="copy-btn" onclick={copyXml}>
      {copied ? "Copied!" : "Copy XML"}
    </button>
  </div>
  <pre class="xml-pre"><code>{xml}</code></pre>
</div>

<style>
  .xml-block {
    border: var(--dimension-border-width) solid var(--color-primary-darker);
    border-radius: var(--radius-md);
    overflow: hidden;
    background-color: #1e1e2e;
  }

  .xml-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-xs) var(--spacing-sm);
    background-color: #2b2b3d;
    border-bottom: 1px solid #3b3b4f;
  }

  .xml-label {
    font-size: var(--font-size-caption-min);
    font-weight: var(--font-weight-bold);
    color: #a0a0b8;
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider);
  }

  .copy-btn {
    padding: var(--spacing-2xs) var(--spacing-sm);
    background: none;
    border: 1.5px solid #a0a0b8;
    border-radius: var(--radius-sm);
    color: #a0a0b8;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-caption-min);
    font-family: var(--font-family-body);
    cursor: pointer;
    transition: all 0.15s;
  }

  .copy-btn:hover {
    border-color: #e0e0f0;
    color: #e0e0f0;
  }

  .xml-pre {
    margin: 0;
    padding: var(--spacing-sm);
    overflow-x: auto;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small-min);
    line-height: 1.6;
    color: #cdd6f4;
    max-height: 500px;
    overflow-y: auto;
  }

  .xml-pre code {
    white-space: pre;
  }
</style>
