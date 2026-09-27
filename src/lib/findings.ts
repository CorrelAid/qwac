/** A finding from qwacback's validation worker (/api/validate, /api/import). */
export interface Finding {
	/** "xsd" for DDI-Codebook 2.5 schema failures, "schematron" for CDL rules. */
	rule?: string;
	test?: string;
	location?: string;
	message?: string;
}

export type FindingGroup = 'xsd' | 'schematron' | 'other';

/**
 * Findings grouped by what failed: first the DDI schema, then the CDL
 * conventions, then anything else. Empty groups are left out; plain-string
 * findings go to "other".
 */
export function groupFindings(
	findings: (string | Finding)[]
): { group: FindingGroup; findings: Finding[] }[] {
	const groups: Record<FindingGroup, Finding[]> = { xsd: [], schematron: [], other: [] };
	for (const f of findings) {
		const finding = typeof f === 'string' ? { message: f } : f;
		const rule = finding.rule === 'xsd' || finding.rule === 'schematron' ? finding.rule : 'other';
		groups[rule].push(finding);
	}
	return (['xsd', 'schematron', 'other'] as const)
		.filter((g) => groups[g].length)
		.map((group) => ({ group, findings: groups[group] }));
}
