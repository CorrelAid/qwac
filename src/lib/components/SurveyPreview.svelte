<script lang="ts">
	import { typeInfo } from '$lib/questionTypes';
	import { t } from '$lib/i18n';
	import type { PreviewVariable } from '$lib/types';
	let { variable }: { variable: PreviewVariable } = $props();

	let info = $derived(typeInfo(variable?.answer_type ?? ''));
	let Input = $derived(info?.component ?? null);
	let categories = $derived(variable?.categories || []);
	let hasCategories = $derived(Array.isArray(categories) && categories.length > 0);
	let showInput = $derived(!!Input && (!info?.needsCategories || hasCategories));
	let hasOther = $derived(variable?.has_other ?? info?.withOther ?? false);
	let otherLabel = $derived(variable?.other_label || $t('preview.other'));
</script>

<div class="survey-preview">
	{#if variable.prequestion_text}
		<div class="pretext">
			<p>{variable.prequestion_text}</p>
		</div>
	{/if}

	{#if variable.universe}
		<!-- The skip logic, as a sentence; the preview doesn't evaluate it. -->
		<p class="universe">
			<span class="universe-label">{$t('preview.condition')}</span>
			{variable.universe}
		</p>
	{/if}

	{#if variable.question}
		<div class="question-prompt">
			<p>{variable.question}</p>
		</div>
	{/if}

	{#if variable.hint}
		<p class="hint">{variable.hint}</p>
	{/if}

	{#if variable.ivu_instructions}
		<div class="instructions">
			<span class="instructions-label">{$t('preview.interviewerNote')}</span>
			<p>{variable.ivu_instructions}</p>
		</div>
	{/if}

	<div class="response-area">
		{#if showInput && Input}
			<Input {categories} concept={variable.concept || ''} standard={variable.long_list_standard} />
			{#if hasOther && info?.choice && info.needsCategories}
				<div class="other-option">
					<label class="option">
						<input
							type={info.choice === 'multiple' ? 'checkbox' : 'radio'}
							name="preview-radio"
							tabindex="-1"
							aria-disabled="true"
						/>
						<span>{otherLabel}:</span>
					</label>
					<input
						type="text"
						class="other-input"
						placeholder={$t('preview.pleaseSpecify')}
						readonly
						tabindex="-1"
						aria-disabled="true"
					/>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	/* A preview, not a form: inputs look like a real questionnaire (no
	   greyed-out disabled state) but can't be clicked, typed in or focused. */
	.response-area :global(input),
	.response-area :global(select),
	.response-area :global(label) {
		pointer-events: none;
	}

	.survey-preview {
		padding: var(--spacing-lg);
		max-width: 700px;
	}

	.pretext {
		margin-bottom: var(--spacing-base);
		font-size: var(--font-size-small-min);
		line-height: var(--line-height-relaxed);
		font-style: italic;
		color: var(--color-text-muted);
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

	.universe {
		margin: 0 0 var(--spacing-sm);
		font-size: var(--font-size-small-min);
		color: var(--color-text-muted);
	}

	.universe-label {
		font-weight: var(--font-weight-bold);
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-wider);
		font-size: var(--font-size-caption-min);
		margin-right: var(--spacing-2xs);
	}

	.hint {
		margin: calc(-1 * var(--spacing-sm)) 0 var(--spacing-base);
		font-size: var(--font-size-small-min);
		color: var(--color-text-muted);
	}

	.instructions {
		background-color: var(--color-note-bg);
		border-left: 3px solid var(--color-note-border);
		padding: var(--spacing-sm) var(--spacing-base);
		margin-bottom: var(--spacing-lg);
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
	}

	.instructions-label {
		font-size: var(--font-size-caption-min);
		font-weight: var(--font-weight-bold);
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-wider);
		color: var(--color-note);
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

	.other-option {
		margin-top: var(--spacing-xs);
	}

	.other-option .option {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) 0;
		font-size: var(--font-size-body-min);
		color: var(--color-text-primary);
		cursor: default;
	}

	.other-option .option input {
		accent-color: var(--color-secondary);
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.other-input {
		margin-left: 26px;
		margin-top: var(--spacing-2xs);
		padding: var(--spacing-2xs) var(--spacing-xs);
		font-size: var(--font-size-small-min);
		font-family: var(--font-family-body);
		border: 1.5px solid var(--color-primary-darker);
		border-radius: var(--radius-sm);
		width: 200px;
		color: var(--color-text-primary);
	}
</style>
