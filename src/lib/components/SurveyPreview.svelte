<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any -- TODO(#25): type the API responses */
	import { typeInfo } from '$lib/questionTypes';
	import { t } from '$lib/i18n';
	let { variable }: { variable: any } = $props();

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

	{#if variable.question}
		<div class="question-prompt">
			<p>{variable.question}</p>
		</div>
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
							disabled
						/>
						<span>{otherLabel}:</span>
					</label>
					<input
						type="text"
						class="other-input"
						placeholder={$t('preview.pleaseSpecify')}
						disabled
					/>
				</div>
			{/if}
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
