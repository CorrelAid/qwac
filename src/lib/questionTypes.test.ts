import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { QUESTION_TYPES as CATALOGUE } from '@correlaid/formtransform';
import {
	PREVIEWS,
	PREVIEW_LESS,
	QUESTION_TYPES,
	allowsMultiple,
	baseType,
	isChoiceType,
	registryType,
	typeInfo,
	typeLabel,
	variableType
} from './questionTypes';
import SelectOneInput from './components/question-types/SelectOneInput.svelte';
import SelectMultipleInput from './components/question-types/SelectMultipleInput.svelte';
import LongListInput from './components/question-types/LongListInput.svelte';

const previewModules = import.meta.glob<{ default: unknown }>(
	'./components/question-types/*.svelte',
	{ eager: true }
);

describe('registry coverage', () => {
	const registryQuestionTypes = Object.entries(CATALOGUE)
		.filter(([, e]) => e.kind === 'question')
		.map(([type]) => type);

	it.each(registryQuestionTypes)(
		'%s has a preview component or is preview-less on purpose',
		(type) => {
			expect(PREVIEWS, `add ${type} to PREVIEWS in questionTypes.ts`).toHaveProperty(type);
			if (!PREVIEW_LESS.has(type)) {
				expect(typeInfo(type)?.component, `${type} has no preview component`).toBeTruthy();
			}
		}
	);

	it('takes every registered label from the catalogue', () => {
		for (const [type, info] of Object.entries(QUESTION_TYPES)) {
			const entry = (CATALOGUE as Record<string, { label: string }>)[type];
			if (entry) expect(info.label, type).toBe(entry.label);
			else expect(info.unregistered, type).toBe(true);
		}
	});
});

describe('QUESTION_TYPES', () => {
	it('every component resolves to a real component', () => {
		for (const [type, info] of Object.entries(QUESTION_TYPES)) {
			if (info.component != null) expect(typeof info.component, type).toBe('function');
			const resolved = typeInfo(type);
			if (resolved?.component != null) expect(typeof resolved.component, type).toBe('function');
		}
	});

	it('references every preview component', () => {
		const files = readdirSync(new URL('./components/question-types/', import.meta.url)).filter(
			(f) => f.endsWith('.svelte')
		);
		expect(Object.keys(previewModules)).toHaveLength(files.length);
		const used = new Set(Object.keys(QUESTION_TYPES).map((t) => typeInfo(t)?.component));
		for (const [path, mod] of Object.entries(previewModules)) {
			expect(used.has(mod.default as never), path).toBe(true);
		}
	});

	it('bases exist', () => {
		for (const [type, info] of Object.entries(QUESTION_TYPES)) {
			if (info.base) expect(QUESTION_TYPES[info.base], type).toBeDefined();
		}
	});
});

describe('typeInfo', () => {
	it('falls back to the base for a variant', () => {
		expect(typeInfo('select_one_other')?.component).toBe(SelectOneInput);
		expect(typeInfo('select_multiple_other')?.component).toBe(SelectMultipleInput);
		expect(typeInfo('select_one_other')).toMatchObject({ choice: 'one', withOther: true });
	});

	it('uses the long list component for long list variants', () => {
		expect(typeInfo('select_one_long_list')).toMatchObject({
			component: LongListInput,
			needsCategories: false
		});
	});

	it("maps qwacback's answer types to the registry's", () => {
		expect(registryType('single_choice')).toBe('select_one');
		expect(registryType('multiple_choice_other')).toBe('select_multiple_other');
		expect(registryType('multiple_choice_long_list')).toBe('select_multiple_long_list');
		expect(registryType('int')).toBe('integer');
		expect(registryType('string')).toBe('text');
		expect(typeInfo('single_choice_other')?.label).toBe('Select One with Other');
	});

	it('returns null for an unknown type', () => {
		expect(typeInfo('signature')).toBeNull();
		expect(typeInfo('')).toBeNull();
	});
});

describe('labels', () => {
	it('are the registry labels', () => {
		expect(typeLabel('text')).toBe('Text (Short Free Text)');
		expect(typeLabel('decimal')).toBe('Decimal/Float');
		expect(typeLabel('single_choice')).toBe('Select One');
		expect(typeLabel('grid')).toBe('Grid / Matrix Group');
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

	it('knows choice types', () => {
		expect(isChoiceType('single_choice')).toBe(true);
		expect(isChoiceType('multiple_choice_other')).toBe(true);
		expect(isChoiceType('text')).toBe(false);
		expect(allowsMultiple('multiple_choice')).toBe(true);
		expect(allowsMultiple('single_choice')).toBe(false);
	});

	it('variableType adds the variant from the flags', () => {
		expect(variableType({ answer_type: 'single_choice', has_long_list: true })).toBe(
			'select_one_long_list'
		);
		expect(variableType({ answer_type: 'multiple_choice', has_other: true })).toBe(
			'select_multiple_other'
		);
		expect(variableType({ answer_type: 'integer' })).toBe('integer');
	});
});
