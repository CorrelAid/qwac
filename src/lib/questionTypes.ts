/**
 * The question types qwac knows, and how it labels and previews them.
 *
 * Labels, variant bases and aliases come from the CDL survey type registry's
 * catalogue, exported by @correlaid/formtransform. This file adds what's
 * the app's concern: the preview component for each type and how it's
 * presented. PREVIEWS is the only hardcoded list of type names here.
 */
import type { Component } from 'svelte';
import { QUESTION_TYPES as CATALOGUE } from '@correlaid/formtransform';
import GridPreview from './components/GridPreview.svelte';
import DateInput from './components/question-types/DateInput.svelte';
import DateTimeInput from './components/question-types/DateTimeInput.svelte';
import DecimalInput from './components/question-types/DecimalInput.svelte';
import IntegerInput from './components/question-types/IntegerInput.svelte';
import LongListInput from './components/question-types/LongListInput.svelte';
import RangeInput from './components/question-types/RangeInput.svelte';
import SelectMultipleInput from './components/question-types/SelectMultipleInput.svelte';
import SelectOneInput from './components/question-types/SelectOneInput.svelte';
import TextInput from './components/question-types/TextInput.svelte';
import TimeInput from './components/question-types/TimeInput.svelte';

/** How the app previews a type. */
interface Preview {
	/**
	 * Preview component, or null if this type has no interactive preview.
	 * Left out on a variant, which then uses its base type's component.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the components take different props
	component?: Component<any> | null;
	/** For choice types: whether one or several answers can be picked. */
	choice?: 'one' | 'multiple';
	/** The preview needs the answer categories (otherwise it shows nothing). */
	needsCategories?: boolean;
	/** Variant with an open "Other" answer. */
	withOther?: boolean;
	/** Not in the registry, but qwacback data may still contain it: its label. */
	unregisteredLabel?: string;
}

export interface QuestionTypeInfo extends Omit<Preview, 'unregisteredLabel'> {
	/** Human label shown in the UI (the registry's). */
	label: string;
	/** Base type for a variant (e.g. select_one_other → select_one). */
	base?: string;
	/** Not in the registry, but qwacback data may still contain it. */
	unregistered?: boolean;
}

/**
 * The preview of every question type. The coverage test checks that each
 * registry question type is listed.
 */
export const PREVIEWS: Record<string, Preview> = {
	date: { component: DateInput },
	decimal: { component: DecimalInput },
	// The question page renders it with the group's variables (questionView.ts).
	grid: { component: GridPreview, choice: 'one' },
	integer: { component: IntegerInput },
	// Display text: there's nothing to answer.
	note: { component: null },
	range: { component: RangeInput },
	select_multiple: { component: SelectMultipleInput, choice: 'multiple', needsCategories: true },
	select_multiple_from_file: { component: LongListInput, choice: 'multiple' },
	select_multiple_long_list: { component: LongListInput, needsCategories: false },
	select_multiple_other: { withOther: true },
	select_one: { component: SelectOneInput, choice: 'one', needsCategories: true },
	select_one_from_file: { component: LongListInput, choice: 'one' },
	select_one_long_list: { component: LongListInput, needsCategories: false },
	select_one_other: { withOther: true },
	text: { component: TextInput },
	time: { component: TimeInput },
	// The registry has no date-time type; kept for existing data.
	datetime: { component: DateTimeInput, unregisteredLabel: 'Date and Time' }
};

/** Types without a preview on purpose. */
export const PREVIEW_LESS = new Set(['note']);

type CatalogueEntry = { label: string; kind: string; base?: string; aliases?: readonly string[] };
const catalogue = CATALOGUE as unknown as Record<string, CatalogueEntry>;

/** The registry's question types with their previews, plus the unregistered ones. */
export const QUESTION_TYPES: Record<string, QuestionTypeInfo> = Object.fromEntries(
	Object.entries(PREVIEWS).map(([type, { unregisteredLabel, ...preview }]) => {
		const entry = catalogue[type];
		const info: QuestionTypeInfo = entry
			? { ...preview, label: entry.label, ...(entry.base ? { base: entry.base } : {}) }
			: { ...preview, label: unregisteredLabel ?? type, unregistered: true };
		return [type, info];
	})
);

/**
 * qwacback's answer types that differ from the registry's type names, plus
 * the registry's own aliases (int → integer, …). qwacback also appends
 * _other / _long_list, which match the registry's variant names once the
 * base is mapped.
 */
const ALIASES: Record<string, string> = {
	single_choice: 'select_one',
	multiple_choice: 'select_multiple',
	...Object.fromEntries(
		Object.entries(catalogue).flatMap(([type, e]) => (e.aliases ?? []).map((a) => [a, type]))
	)
};

const VARIANT_SUFFIXES = ['_other', '_long_list'];

/** The registry's name for an answer type from qwacback (single_choice_other → select_one_other). */
export function registryType(type: string): string {
	const t = (type || '').trim();
	if (ALIASES[t]) return ALIASES[t];
	for (const suffix of VARIANT_SUFFIXES) {
		if (t.endsWith(suffix)) {
			const base = t.slice(0, -suffix.length);
			if (ALIASES[base]) return ALIASES[base] + suffix;
		}
	}
	return t;
}

/** A known type with the fields it inherits from its base filled in. */
export type ResolvedTypeInfo = Required<Pick<QuestionTypeInfo, 'label'>> &
	QuestionTypeInfo & {
		/** Registry type name. */
		id: string;
	};

/**
 * Everything qwac knows about a type: exact match (after mapping qwacback's
 * names), with a variant falling back to its base for what it doesn't set.
 * null for a type qwac hasn't been taught about.
 */
export function typeInfo(type: string): ResolvedTypeInfo | null {
	const id = registryType(type);
	const info = QUESTION_TYPES[id];
	if (!info) return null;
	const base = info.base ? QUESTION_TYPES[info.base] : undefined;
	return {
		...base,
		...info,
		// A variant doesn't inherit its base's `base`.
		base: info.base,
		component: info.component === undefined ? (base?.component ?? null) : info.component,
		id
	};
}

/** The type without its variant: select_one_other → select_one; unknown types lose _other / _long_list. */
export function baseType(type: string): string {
	const info = typeInfo(type);
	if (info) return info.base ?? info.id;
	let t = registryType(type);
	for (const suffix of VARIANT_SUFFIXES) if (t.endsWith(suffix)) t = t.slice(0, -suffix.length);
	return t;
}

/** Label for a type: the registry's, or one made from the type name for an unknown type. */
export function typeLabel(type: string): string {
	const info = typeInfo(type);
	if (info) return info.label;
	return baseType(type)
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Whether a type is answered by picking from categories (select one / multiple, grid). */
export function isChoiceType(type: string): boolean {
	return !!typeInfo(type)?.choice;
}

/** Whether several answers can be picked. */
export function allowsMultiple(type: string): boolean {
	return typeInfo(type)?.choice === 'multiple';
}

/** Whether a variable of this type holds free text (e.g. the "Other" field of a choice group). */
export function isTextType(type: string): boolean {
	return registryType(type) === 'text';
}

/** qwacback's answer types for questions built from a variable group, by DDI group type. */
export function groupAnswerType(groupType: string): string | null {
	const t = (groupType || '').toLowerCase();
	if (t.includes('grid') || t.includes('matrix')) return 'grid';
	if (t === 'multipleresp') return 'multiple_choice';
	return null;
}

/** Whether a DDI group type is a grid / matrix. */
export function isGridGroup(groupType: string): boolean {
	return groupAnswerType(groupType) === 'grid';
}

/**
 * The full answer type of a variable from /api/questions/{id}, whose
 * answer_type is the base and whose variant is in has_long_list / has_other.
 * A long list wins, since it decides the preview.
 */
export function variableType(variable: {
	answer_type?: string;
	has_long_list?: boolean;
	has_other?: boolean;
}): string {
	const base = baseType(variable?.answer_type ?? '');
	if (variable?.has_long_list) return `${base}_long_list`;
	if (variable?.has_other) return `${base}_other`;
	return registryType(variable?.answer_type ?? '');
}
