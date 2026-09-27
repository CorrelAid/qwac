import { describe, it, expect } from 'vitest';
import { safeFilename } from './download';

describe('safeFilename', () => {
	it('keeps ordinary titles, including umlauts', () => {
		expect(safeFilename('Ausgewählte CDL Instrumente', 'study')).toBe(
			'Ausgewählte CDL Instrumente'
		);
	});

	it('replaces characters that are not allowed in file names', () => {
		expect(safeFilename('Survey 2024/25: "Trust" <draft>?', 'study')).toBe(
			'Survey 2024_25_ _Trust_ _draft__'
		);
		expect(safeFilename('a\\b|c*d\u0007e', 'study')).toBe('a_b_c_d_e');
	});

	it('removes leading dots and collapses whitespace', () => {
		expect(safeFilename('  ..hidden   name\n', 'study')).toBe('hidden name');
	});

	it('shortens long titles', () => {
		expect(safeFilename('x'.repeat(300), 'study')).toHaveLength(120);
	});

	it('falls back when nothing is left', () => {
		expect(safeFilename('', 'study-abc')).toBe('study-abc');
		expect(safeFilename(' ... ', 'study-abc')).toBe('study-abc');
	});
});
