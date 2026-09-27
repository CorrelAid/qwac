<script lang="ts">
	import { resolve } from '$app/paths';
	import AnswerTypeTag from '$lib/components/AnswerTypeTag.svelte';
	import { t, locale } from '$lib/i18n';
	import { questionText } from '$lib/translations';
	import type { Question } from '$lib/types';

	let {
		question,
		study = null,
		headingLevel = 2
	}: {
		/** An entry of /api/questions or /api/studies/{id}/questions. */
		question: Question;
		/** The question's study, to link to; left out on the study's own page. */
		study?: { id: string; title: string } | null;
		/** Level of the card title, below the page's headings. */
		headingLevel?: 2 | 3 | 4;
	} = $props();

	let text = $derived(questionText(question, $locale));
	let variableCount = $derived(question.variable_ids?.length ?? 0);
</script>

<div class="question-card">
	<svelte:element this={`h${headingLevel}`} class="title">
		<a href={resolve('/questions/[id]', { id: question.id })}>{question.concept || question.name}</a
		>
	</svelte:element>

	{#if text}
		<p class="text">{text}</p>
	{/if}

	<div class="tags">
		{#if question.answer_type}
			<AnswerTypeTag type={question.answer_type} />
		{/if}
		{#if study}
			<a href={resolve('/studies/[id]', { id: study.id })} class="study-tag">{study.title}</a>
		{/if}
		{#if variableCount > 1}
			<span class="variables">{variableCount} {$t('explore.variables')}</span>
		{/if}
	</div>
</div>

<style>
	.question-card {
		background-color: var(--color-white);
		border-radius: var(--radius-md);
		padding: var(--spacing-base);
		overflow: hidden;
		min-width: 0;
	}

	.title {
		/* Card titles all look the same, whatever their level. */
		--min-size: var(--font-size-body-min);
		--max-size: var(--font-size-body-max);
		font-family: var(--font-family-body);
		letter-spacing: normal;
		margin: 0 0 var(--spacing-2xs);
	}

	.title a {
		color: var(--color-secondary);
		text-decoration: none;
	}

	.title a:hover {
		text-decoration: underline;
	}

	.text {
		font-size: var(--font-size-small-min);
		line-height: var(--line-height-relaxed);
		margin: 0 0 var(--spacing-xs);
	}

	.tags {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.study-tag {
		font-size: var(--font-size-caption-min);
		padding: 1px var(--spacing-xs);
		border-radius: var(--radius-sm);
		background-color: var(--color-tag-bg);
		color: var(--color-white);
		text-decoration: none;
		white-space: normal;
		word-break: break-word;
	}

	.study-tag:hover {
		background-color: var(--color-secondary);
	}

	.variables {
		font-size: var(--font-size-caption-min);
		color: var(--color-text-muted);
	}
</style>
