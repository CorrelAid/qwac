import { describe, it, expect } from 'vitest';
import { stripMarkup } from './text';

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
