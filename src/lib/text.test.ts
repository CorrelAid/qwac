import { describe, it, expect } from 'vitest';
import { distinctConcept, stripMarkup } from './text';

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
