/**
 * The question types qwac knows, and how it labels and previews them.
 *
 * Labels (German and English), variant bases, presentation and the registry
 * name of each of qwacback's answer types come from qwacback's catalogue,
 * GET /api/question-types, which the root layout loads (setCatalogue). This
 * file adds only what's the app's concern: the preview component for each
 * registry type (PREVIEWS).
 */
import type { Component } from 'svelte';
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

/** An entry of /api/question-types, keyed by qwacback's answer type. */
export interface CatalogueEntry {
	/** The registry's type name, e.g. select_one_other for single_choice_other. */
	registryType: string;
	/** Label per language. */
	label: Record<string, string>;
	kind: string;
	/** A variant's registry base type. */
	base?: string;
	aliases?: string[];
	presentation: {
		choice?: 'one' | 'multiple';
		withOther: boolean;
		longList: boolean;
		grid: boolean;
		appearance?: string;
	};
}

export type Catalogue = Record<string, CatalogueEntry>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the components take different props
type PreviewComponent = Component<any>;

/**
 * The preview component of each registry type. A variant (e.g.
 * select_one_other) without its own entry uses its base type's. The coverage
 * test checks this against qwacback's catalogue.
 */
export const PREVIEWS: Record<string, PreviewComponent> = {
	date: DateInput,
	decimal: DecimalInput,
	// The question page renders it with the group's variables (questionView.ts).
	grid: GridPreview,
	integer: IntegerInput,
	range: RangeInput,
	select_multiple: SelectMultipleInput,
	select_multiple_long_list: LongListInput,
	select_one: SelectOneInput,
	select_one_long_list: LongListInput,
	text: TextInput,
	time: TimeInput,
	datetime: DateTimeInput
};

/** Types qwacback's data may hold but the registry doesn't know. */
const UNREGISTERED: Catalogue = {
	datetime: {
		registryType: 'datetime',
		label: { de: 'Datum und Uhrzeit', en: 'Date and Time' },
		kind: 'question',
		presentation: { withOther: false, longList: false, grid: false }
	}
};

/** Every name a type can be looked up by: qwacback's, the registry's, aliases. */
let byName: Record<string, CatalogueEntry> = {};

/** Sets the catalogue from GET /api/question-types (done by the root layout). */
export function setCatalogue(catalogue: Catalogue): void {
	byName = {};
	for (const entries of [UNREGISTERED, catalogue]) {
		for (const [answerType, entry] of Object.entries(entries)) {
			for (const name of [entry.registryType, ...(entry.aliases ?? []), answerType]) {
				byName[name] = entry;
			}
		}
	}
}

/** What qwac knows about a type. */
export interface TypeInfo {
	/** Registry type name. */
	id: string;
	label: Record<string, string>;
	/** A variant's registry base type. */
	base?: string;
	/** Preview component, or null if the type has none. */
	component: PreviewComponent | null;
	/** For choice types: whether one or several answers can be picked. */
	choice?: 'one' | 'multiple';
	/** Variant with an open "Other" answer. */
	withOther: boolean;
	longList: boolean;
	grid: boolean;
	/** The preview needs the answer categories (otherwise it shows nothing). */
	needsCategories: boolean;
	/** Not in the registry, but qwacback data may still contain it. */
	unregistered: boolean;
}

/**
 * Everything qwac knows about a type, by qwacback's answer type or the
 * registry's name. null for a type the catalogue doesn't list.
 */
export function typeInfo(type: string): TypeInfo | null {
	const entry = byName[(type || '').trim()];
	if (!entry) return null;
	const { choice, withOther, longList, grid } = entry.presentation;
	return {
		id: entry.registryType,
		label: entry.label,
		base: entry.base,
		component:
			PREVIEWS[entry.registryType] ?? (entry.base ? PREVIEWS[entry.base] : undefined) ?? null,
		choice,
		withOther,
		longList,
		grid,
		needsCategories: !!choice && !longList && !grid,
		unregistered: entry.registryType in UNREGISTERED
	};
}

/** The registry type without its variant: single_choice_other → select_one. */
export function baseType(type: string): string {
	const info = typeInfo(type);
	// A type the catalogue doesn't know loses qwacback's variant suffix.
	return info ? (info.base ?? info.id) : (type || '').trim().replace(/_(other|long_list)$/, '');
}

/**
 * Label for a type in `locale` (falling back to English): the registry's, or
 * one made from the type name for a type the catalogue doesn't know.
 */
export function typeLabel(type: string, locale = 'en'): string {
	const label = typeInfo(type)?.label;
	if (label) return label[locale] ?? label.en ?? Object.values(label)[0] ?? type;
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
	return typeInfo(type)?.id === 'text';
}

/** qwacback's answer type for a question built from a variable group, by DDI group type. */
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

setCatalogue({});
