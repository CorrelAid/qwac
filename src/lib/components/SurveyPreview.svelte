<script lang="ts">
  import SelectOneInput from "./question-types/SelectOneInput.svelte";
  import SelectMultipleInput from "./question-types/SelectMultipleInput.svelte";
  import TextInput from "./question-types/TextInput.svelte";
  import IntegerInput from "./question-types/IntegerInput.svelte";
  import DecimalInput from "./question-types/DecimalInput.svelte";
  import DateInput from "./question-types/DateInput.svelte";
  import TimeInput from "./question-types/TimeInput.svelte";
  import DateTimeInput from "./question-types/DateTimeInput.svelte";
  let { variable }: { variable: any } = $props();

  let answerType = $derived(variable?.answer_type || '');
  let categories = $derived(variable?.categories || []);
  let hasCategories = $derived(Array.isArray(categories) && categories.length > 0);
</script>

<div class="survey-preview">
  {#if variable.prequestion_text}
    <div class="pretext">
      <p>{variable.prequestion_text}</p>
    </div>
  {/if}

  {#if variable.question}
    <div class="question-prompt">
      <p>{variable.question}</p>
    </div>
  {/if}

  {#if variable.ivu_instructions}
    <div class="instructions">
      <span class="instructions-label">Interviewer note</span>
      <p>{variable.ivu_instructions}</p>
    </div>
  {/if}

  <div class="response-area">
    {#if answerType === 'select_one' && hasCategories}
      <SelectOneInput {categories} />
    {:else if answerType === 'select_multiple' && hasCategories}
      <SelectMultipleInput {categories} />
    {:else if answerType === 'text'}
      <TextInput />
    {:else if answerType === 'integer'}
      <IntegerInput />
    {:else if answerType === 'decimal'}
      <DecimalInput />
    {:else if answerType === 'date'}
      <DateInput />
    {:else if answerType === 'time'}
      <TimeInput />
    {:else if answerType === 'datetime'}
      <DateTimeInput />
    {/if}
  </div>
</div>

<style>
  .survey-preview {
    padding: var(--spacing-lg);
    max-width: 700px;
  }

  .pretext {
    margin-bottom: var(--spacing-base);
    font-size: var(--font-size-small-min);
    color: var(--color-text-primary);
    opacity: 0.8;
    line-height: var(--line-height-relaxed);
    font-style: italic;
  }

  .pretext p {
    margin: 0;
  }

  .question-prompt {
    margin-bottom: var(--spacing-lg);
  }

  .question-prompt p {
    font-size: var(--font-size-h4-min);
    font-weight: var(--font-weight-semibold);
    line-height: 1.4;
    color: var(--color-text-primary);
    margin: 0;
  }

  .instructions {
    background-color: #fef9e7;
    border-left: 3px solid #f0c040;
    padding: var(--spacing-sm) var(--spacing-base);
    margin-bottom: var(--spacing-lg);
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

  .instructions p {
    font-size: var(--font-size-small-min);
    line-height: var(--line-height-relaxed);
    margin: 0;
    color: var(--color-text-primary);
  }

  .response-area {
    margin-top: var(--spacing-base);
  }
</style>
