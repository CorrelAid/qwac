import { describe, it, expect } from 'vitest';
import {
	pickLang,
	localizedText,
	questionText,
	localizeVariable,
	localizeGroup
} from './translations';

describe('pickLang', () => {
	it('matches on the primary language subtag', () => {
		expect(pickLang({ 'en-GB': 'Trust' }, 'en')).toBe('Trust');
		expect(pickLang({ EN: 'Trust' }, 'en')).toBe('Trust');
	});

	it('returns undefined for missing maps and languages', () => {
		expect(pickLang(null, 'en')).toBeUndefined();
		expect(pickLang({ fr: 'Confiance' }, 'en')).toBeUndefined();
	});
});

describe('localizedText', () => {
	it('keeps the base text when the study is in the UI language', () => {
		expect(localizedText('Vertrauen?', 'de', { en: 'Trust?' }, 'de')).toBe('Vertrauen?');
	});

	it('uses the translation for another UI language', () => {
		expect(localizedText('Vertrauen?', 'de', { en: 'Trust?' }, 'en')).toBe('Trust?');
	});

	it('falls back to the base text without a translation', () => {
		expect(localizedText('Vertrauen?', 'de', undefined, 'en')).toBe('Vertrauen?');
		expect(localizedText('Vertrauen?', undefined, {}, 'en')).toBe('Vertrauen?');
	});
});

describe('questionText', () => {
	it('reads question_text, language and translations', () => {
		const q = {
			question_text: 'Wie alt sind Sie?',
			language: 'de',
			translations: { en: 'How old are you?' }
		};
		expect(questionText(q, 'en')).toBe('How old are you?');
		expect(questionText(q, 'de')).toBe('Wie alt sind Sie?');
	});

	it('handles questions from a backend without translations', () => {
		expect(questionText({ question_text: 'Wie alt sind Sie?' }, 'en')).toBe('Wie alt sind Sie?');
	});
});

describe('localizeVariable', () => {
	const variable = {
		question: 'Wie zufrieden sind Sie?',
		prequestion_text: '',
		ivu_instructions: 'Vorlesen',
		categories: [
			{ value: '1', label: 'Sehr zufrieden' },
			{ value: '2', label: 'Unzufrieden' }
		],
		translations: {
			en: {
				question: 'How satisfied are you?',
				ivu_instructions: 'Read out',
				categories: { '1': 'Very satisfied' }
			}
		}
	};

	it('translates texts and category labels', () => {
		const v = localizeVariable(variable, 'de', 'en');
		expect(v.question).toBe('How satisfied are you?');
		expect(v.ivu_instructions).toBe('Read out');
		expect(v.categories.map((c) => c.label)).toEqual(['Very satisfied', 'Unzufrieden']);
	});

	it('returns the variable unchanged in the base language', () => {
		expect(localizeVariable(variable, 'de', 'de')).toBe(variable);
	});
});

describe('localizeGroup', () => {
	it('translates the description', () => {
		const g = { description: 'Vertrauen', translations: { en: { description: 'Trust' } } };
		expect(localizeGroup(g, 'de', 'en').description).toBe('Trust');
		expect(localizeGroup(g, 'de', 'de').description).toBe('Vertrauen');
	});
});
