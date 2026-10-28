<script lang="ts">
	import { resolve } from '$app/paths';
	import AnswerTypeTag from '$lib/components/AnswerTypeTag.svelte';
	import { t, locale } from '$lib/i18n';
	import { questionText } from '$lib/translations';
	import { distinctConcept } from '$lib/text';
	import type { Question } from '$lib/types';

	let {
		question,
		study = null,
		headingLevel = 2
	}: {
		/** An entry of /api/questions or /api/studies/{id}/questions. */
		question: Question;
		/** The question's study, to link to; left out on the study's own page. */
		study?: { id: string; title: string; short_title?: string } | null;
		/** Level of the card title, below the page's headings. */
		headingLevel?: 2 | 3 | 4;
	} = $props();

	let text = $derived(questionText(question, $locale));
	// A concept that only repeats the question is left out (#68); the card is
	// then titled by the question, shown once.
	let concept = $derived(distinctConcept(question.concept, question.question_text, text));
	let title = $derived(concept || text || question.name);
	let variableCount = $derived(question.variable_ids?.length ?? 0);
</script>

<div class="question-card">
	<svelte:element this={`h${headingLevel}`} class="title" class:question-title={!concept}>
		<a href={resolve('/questions/[id]', { id: question.id })}>{title}</a>
	</svelte:element>

	{#if text && text !== title}
		<p class="text">{text}</p>
	{/if}

	<!-- Short tags first, so they stay together; a long study title wraps below (#72). -->
	<div class="tags">
		{#if question.answer_type}
			<AnswerTypeTag type={question.answer_type} />
		{/if}
		{#if variableCount > 1}
			<span class="variables">{variableCount} {$t('explore.variables')}</span>
		{/if}
		{#if study}
			<a href={resolve('/studies/[id]', { id: study.id })} class="study-tag" title={study.title}
				>{study.short_title || study.title}</a
			>
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

	/* A card titled by its question can be a paragraph: two lines, the full
	   text stays in the DOM for screen readers (#72). */
	.title a {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		color: var(--color-secondary);
		text-decoration: none;
	}

	/* A paragraph-long question as title reads better unbolded; the colour
	   still marks it as the link. */
	.question-title {
		font-weight: var(--font-weight-normal);
	}

	.title a:hover {
		text-decoration: underline;
	}

	/* Under a short name, a question or a grid's introduction can still run to
	   a paragraph: three lines, the rest on the question page. */
	.text {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
		font-size: var(--font-size-small-min);
		line-height: var(--line-height-relaxed);
		margin: 0 0 var(--spacing-xs);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-xs) var(--spacing-sm);
	}

	.study-tag {
		font-size: var(--font-size-caption-min);
		padding: 1px var(--spacing-xs);
		border-radius: var(--radius-sm);
		background-color: var(--color-tag-bg);
		color: var(--color-white);
		text-decoration: none;
		/* One line; the full title is in the tooltip and on the study page. */
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.study-tag:hover {
		background-color: var(--color-secondary);
	}

	.variables {
		font-size: var(--font-size-caption-min);
		color: var(--color-text-muted);
	}
</style>
