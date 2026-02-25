<script lang="ts">
  import { metadata } from "$lib/metadata";

  $metadata.title = "About";
</script>

<article class="about">
  <a href="/" class="back-link">&larr; Back to questions</a>

  <h2>About QWAC</h2>

  <section>
    <p>
      QWAC — <strong>Questions Worth Asking Continuously</strong> — is a project by
      <a href="https://correlaid.org" target="_blank" rel="noopener noreferrer">CorrelAid e.V.</a>
    </p>
  </section>
</article>

<style>
  .back-link {
    font-size: var(--font-size-small-min);
    color: var(--color-secondary);
    text-decoration: none;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  .about {
    max-width: 700px;
    margin: var(--spacing-base) auto;
  }

  h2 {
    color: var(--color-secondary);
    margin-bottom: var(--spacing-lg);
  }

  section {
    margin-bottom: var(--spacing-lg);
  }

  p {
    line-height: var(--line-height-relaxed);
  }

  a {
    color: var(--color-secondary);
  }
</style>
