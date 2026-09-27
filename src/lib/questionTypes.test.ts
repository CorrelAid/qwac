import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import catalogue from './question-types.fixture.json';
import {
	PREVIEWS,
	allowsMultiple,
	baseType,
	isChoiceType,
	isTextType,
	typeInfo,
	typeLabel,
	type Catalogue
} from './questionTypes';
import SelectOneInput from './components/question-types/SelectOneInput.svelte';
import SelectMultipleInput from './components/question-types/SelectMultipleInput.svelte';
import LongListInput from './components/question-types/LongListInput.svelte';

// src/test-setup.ts loads this fixture of GET /api/question-types.
const fixture = catalogue as Catalogue;

const previewModules = import.meta.glob<{ default: unknown }>(
	'./components/question-types/*.svelte',
	{ eager: true }
);

describe("coverage of qwacback's catalogue", () => {
	it.each(Object.keys(fixture))('%s has a preview component', (answerType) => {
		expect(
			typeInfo(answerType)?.component,
			`add ${fixture[answerType].registryType} to PREVIEWS`
		).toBeTruthy();
	});

	it('references every preview component', () => {
		const files = readdirSync(new URL('./components/question-types/', import.meta.url)).filter(
			(f) => f.endsWith('.svelte')
		);
		expect(Object.keys(previewModules)).toHaveLength(files.length);
		const used = new Set(Object.values(PREVIEWS));
		for (const [path, mod] of Object.entries(previewModules)) {
			expect(used.has(mod.default as never), path).toBe(true);
		}
	});

	it("takes labels from qwacback's catalogue", () => {
		for (const [answerType, entry] of Object.entries(fixture)) {
			expect(typeLabel(answerType, 'de'), answerType).toBe(entry.label.de);
			expect(typeLabel(answerType, 'en'), answerType).toBe(entry.label.en);
		}
	});
});

describe('typeInfo', () => {
	it("finds a type by qwacback's name, the registry's name and aliases", () => {
		expect(typeInfo('single_choice_other')?.id).toBe('select_one_other');
		expect(typeInfo('select_one_other')?.id).toBe('select_one_other');
		expect(typeInfo('int')?.id).toBe('integer');
	});

	it('uses the base component for a variant', () => {
		expect(typeInfo('single_choice_other')).toMatchObject({
			component: SelectOneInput,
			choice: 'one',
			withOther: true,
			needsCategories: true
		});
		expect(typeInfo('multiple_choice_other')?.component).toBe(SelectMultipleInput);
	});

	it('uses the long list component for long lists, without categories', () => {
		expect(typeInfo('single_choice_long_list')).toMatchObject({
			component: LongListInput,
			longList: true,
			needsCategories: false
		});
	});

	it('knows the unregistered datetime type', () => {
		expect(typeInfo('datetime')).toMatchObject({ unregistered: true });
		expect(typeLabel('datetime', 'de')).toBe('Datum und Uhrzeit');
	});

	it('returns null for an unknown type', () => {
		expect(typeInfo('signature')).toBeNull();
		expect(typeInfo('')).toBeNull();
	});
});

describe('the answer types qwacback added (#61)', () => {
	it.each([
		['decimal', 'decimal', 'Dezimalzahl'],
		['range', 'range', 'Schieberegler'],
		['date', 'date', 'Datum'],
		['time', 'time', 'Uhrzeit']
	])('%s maps to %s with a preview and a German label', (answerType, registry, de) => {
		expect(typeInfo(answerType)?.id).toBe(registry);
		expect(typeInfo(answerType)?.component).toBeTruthy();
		expect(typeLabel(answerType, 'de')).toBe(de);
		expect(baseType(answerType)).toBe(registry);
	});
});

describe('labels', () => {
	it('are German or English', () => {
		expect(typeLabel('single_choice', 'de')).toBe('Einfachauswahl');
		expect(typeLabel('single_choice', 'en')).toBe('Select One');
		expect(typeLabel('grid', 'en')).toBe('Grid / Matrix Group');
	});

	it('fall back to English for another language', () => {
		expect(typeLabel('text', 'fr')).toBe('Text (Short Free Text)');
	});

	it('are made from the name for an unknown type, without throwing', () => {
		expect(typeLabel('geo_point')).toBe('Geo Point');
		expect(typeLabel('geo_point_other')).toBe('Geo Point');
		expect(typeLabel('')).toBe('');
	});
});

describe('helpers', () => {
	it('baseType drops the variant', () => {
		expect(baseType('single_choice_other')).toBe('select_one');
		expect(baseType('multiple_choice_long_list')).toBe('select_multiple');
		expect(baseType('integer')).toBe('integer');
		expect(baseType('geo_point_long_list')).toBe('geo_point');
	});

	it('knows choice and text types', () => {
		expect(isChoiceType('single_choice')).toBe(true);
		expect(isChoiceType('multiple_choice_other')).toBe(true);
		expect(isChoiceType('text')).toBe(false);
		expect(allowsMultiple('multiple_choice')).toBe(true);
		expect(allowsMultiple('single_choice')).toBe(false);
		expect(isTextType('text')).toBe(true);
	});
});
