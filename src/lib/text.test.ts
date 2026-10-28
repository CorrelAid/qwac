import { describe, it, expect } from 'vitest';
import { distinctConcept, firstSentence, stripMarkup } from './text';

describe('stripMarkup', () => {
	it('removes XHTML tags and collapses whitespace', () => {
		expect(
			stripMarkup(
				'<xhtml:p xmlns:xhtml="http://www.w3.org/1999/xhtml">\n  To make the survey\n  <xhtml:b>short</xhtml:b></xhtml:p>'
			)
		).toBe('To make the survey short');
	});

	it('keeps plain text and handles missing values', () => {
		expect(stripMarkup(' Eine Sammlung. ')).toBe('Eine Sammlung.');
		expect(stripMarkup(undefined)).toBe('');
	});
});

describe('distinctConcept', () => {
	it('keeps a concept that differs from the question', () => {
		expect(distinctConcept('Perceived community safety (day)', 'How safe do you feel…?')).toBe(
			'Perceived community safety (day)'
		);
	});

	it('hides an empty concept', () => {
		expect(distinctConcept('', 'How old are you?')).toBe('');
		expect(distinctConcept('  ', 'How old are you?')).toBe('');
		expect(distinctConcept(undefined)).toBe('');
	});

	it('hides a concept that repeats one of the texts, ignoring surrounding whitespace', () => {
		expect(distinctConcept('Themen der Weiterbildung ', 'Themen der Weiterbildung')).toBe('');
		expect(distinctConcept('How old are you?', '', null, ' How old are you?\n')).toBe('');
	});
});

describe('firstSentence', () => {
	it('cuts a long statement after its first sentence', () => {
		expect(
			firstSentence(
				'Creative Commons Attribution 4.0 International (CC BY 4.0). Reuse is authorised, provided the source is acknowledged. Changes: none.'
			)
		).toBe('Creative Commons Attribution 4.0 International (CC BY 4.0).');
	});

	it('does not cut at a dot inside a URL or before a lowercase word', () => {
		expect(firstSentence('CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).')).toBe(
			'CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).'
		);
		expect(firstSentence('Weitergabe z. B. mit Quellenangabe. Sonst nicht.')).toBe(
			'Weitergabe z. B. mit Quellenangabe.'
		);
	});

	it('keeps a text without a sentence end, and handles missing values', () => {
		expect(firstSentence(' Free to use ')).toBe('Free to use');
		expect(firstSentence(undefined)).toBe('');
	});
});
