import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { DEFAULT_LOCALE, LOCALES, locale, translate, translations } from './i18n';

describe('locale', () => {
	it('defaults to German', () => {
		expect(DEFAULT_LOCALE).toBe('de');
		expect(get(locale)).toBe('de');
	});

	it('lists German first in the switcher', () => {
		expect(LOCALES).toEqual(['de', 'en']);
	});
});

describe('translations', () => {
	it('have the same keys in every locale', () => {
		const keys = (l: (typeof LOCALES)[number]) => Object.keys(translations[l]).sort();
		for (const l of LOCALES) expect(keys(l)).toEqual(keys(DEFAULT_LOCALE));
	});

	it('have no empty texts', () => {
		for (const l of LOCALES) {
			for (const [key, text] of Object.entries(translations[l])) {
				expect(text.trim(), `${l}.${key}`).not.toBe('');
			}
		}
	});
});

describe('translate', () => {
	it('returns the text in the requested locale', () => {
		expect(translate('en', 'layout.about')).toBe('About');
		expect(translate('de', 'layout.about')).toBe('Über');
	});

	it('falls back to German, then to the key', () => {
		translations.de['test.onlyGerman'] = 'Nur Deutsch';
		try {
			expect(translate('en', 'test.onlyGerman')).toBe('Nur Deutsch');
			expect(translate('en', 'test.missing')).toBe('test.missing');
		} finally {
			delete translations.de['test.onlyGerman'];
		}
	});
});
