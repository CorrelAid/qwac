/**
 * Plain text from a study field that may hold XHTML: qwacback stores the DDI
 * abstract as it appears in the codebook, e.g. `<xhtml:p>…</xhtml:p>`.
 */
export function stripMarkup(s: string | null | undefined): string {
	return (s ?? '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * The concept to show next to a question, or '' when there is none worth
 * showing: empty, or the same as one of the question's texts. formtransform
 * copied the question label into the concept when an XLSForm had none (#68).
 */
export function distinctConcept(
	concept: string | null | undefined,
	...texts: (string | null | undefined)[]
): string {
	const c = (concept ?? '').trim();
	return c && !texts.some((text) => (text ?? '').trim() === c) ? c : '';
}
