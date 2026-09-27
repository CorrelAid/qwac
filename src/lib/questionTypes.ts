/**
 * The question types qwac knows, and how it labels and previews them.
 *
 * The list mirrors the CDL survey type registry in CorrelAid/formtransform
 * (registry/). Labels are copied verbatim from the registry's skos:prefLabel,
 * as listed in
 * https://github.com/CorrelAid/formtransform/blob/main/skills/cdl-survey-types/references/question-types.md
 * (grid, which that page doesn't list, from registry/entities/grid).
 * #10 replaces these literals with the catalogue exported by
 * @correlaid/formtransform.
 *
 * This is the only place a type name should appear as a literal.
 */
import type { Component } from 'svelte';
import DateInput from './components/question-types/DateInput.svelte';
import DateTimeInput from './components/question-types/DateTimeInput.svelte';
import DecimalInput from './components/question-types/DecimalInput.svelte';
import IntegerInput from './components/question-types/IntegerInput.svelte';
import LongListInput from './components/question-types/LongListInput.svelte';
import SelectMultipleInput from './components/question-types/SelectMultipleInput.svelte';
import SelectOneInput from './components/question-types/SelectOneInput.svelte';
import TextInput from './components/question-types/TextInput.svelte';
import TimeInput from './components/question-types/TimeInput.svelte';

export interface QuestionTypeInfo {
	/** Human label shown in the UI. */
	label: string;
	/**
	 * Preview component, or null if this type has no interactive preview.
	 * Left out on a variant, which then uses its base type's component.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the components take different props
	component?: Component<any> | null;
	/** Base type for a variant (e.g. select_one_other → select_one). */
	base?: string;
	/** For choice types: whether one or several answers can be picked. */
	choice?: 'one' | 'multiple';
	/** The preview needs the answer categories (otherwise it shows nothing). */
	needsCategories?: boolean;
	/** Variant with an open "Other" answer. */
	withOther?: boolean;
	/** Not in the registry, but qwacback data may still contain it. */
	unregistered?: boolean;
}

export const QUESTION_TYPES: Record<string, QuestionTypeInfo> = {
	date: { label: 'Date', component: DateInput },
	decimal: { label: 'Decimal/Float', component: DecimalInput },
	grid: { label: 'Grid / Matrix Group', component: null, choice: 'one' },
	integer: { label: 'Integer', component: IntegerInput },
	note: { label: 'Note (Display Text)', component: null },
	// No preview component yet.
	range: { label: 'Range', component: null },
	select_multiple: {
		label: 'Select Multiple',
		component: SelectMultipleInput,
		choice: 'multiple',
		needsCategories: true
	},
	select_multiple_from_file: {
		label: 'Select Multiple (from file)',
		component: LongListInput,
		choice: 'multiple'
	},
	select_multiple_long_list: {
		label: 'Select Multiple (Long List)',
		base: 'select_multiple',
		component: LongListInput,
		needsCategories: false
	},
	select_multiple_other: {
		label: 'Select Multiple with Other',
		base: 'select_multiple',
		withOther: true
	},
	select_one: {
		label: 'Select One',
		component: SelectOneInput,
		choice: 'one',
		needsCategories: true
	},
	select_one_from_file: {
		label: 'Select One (from file)',
		component: LongListInput,
		choice: 'one'
	},
	select_one_long_list: {
		label: 'Select One (Long List)',
		base: 'select_one',
		component: LongListInput,
		needsCategories: false
	},
	select_one_other: { label: 'Select One with Other', base: 'select_one', withOther: true },
	text: { label: 'Text (Short Free Text)', component: TextInput },
	time: { label: 'Time', component: TimeInput },
	// Not registered (the registry has no date-time type); kept for existing data.
	datetime: { label: 'Date and Time', component: DateTimeInput, unregistered: true }
};

/**
 * qwacback's answer types that differ from the registry's type names, plus
 * the registry's accepted aliases. qwacback also appends _other / _long_list,
 * which match the registry's variant names once the base is mapped.
 */
const ALIASES: Record<string, string> = {
	single_choice: 'select_one',
	multiple_choice: 'select_multiple',
	int: 'integer',
	string: 'text'
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
