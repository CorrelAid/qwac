import { describe, it, expect } from 'vitest';
import { groupFindings } from './findings';

describe('groupFindings', () => {
	it('groups schema failures before CDL rule failures before the rest', () => {
		const groups = groupFindings([
			{ rule: 'schematron', message: 'Or-Other group lacks a text variable' },
			'Something odd',
			{ rule: 'xsd', message: 'Unexpected element labl', location: '/codeBook/dataDscr/var[1]' },
			{ rule: 'schematron', message: 'varGrp type must be grid' }
		]);
		expect(groups.map((g) => [g.group, g.findings.length])).toEqual([
			['xsd', 1],
			['schematron', 2],
			['other', 1]
		]);
		expect(groups[2].findings[0]).toEqual({ message: 'Something odd' });
	});

	it('leaves out empty groups', () => {
		expect(groupFindings([{ rule: 'xsd', message: 'x' }]).map((g) => g.group)).toEqual(['xsd']);
		expect(groupFindings([])).toEqual([]);
	});
});
