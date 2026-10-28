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

/**
 * The first sentence of a text: up to the first ".", "!" or "?" that is
 * followed by whitespace and a capital letter or ends the text, and that
 * doesn't end a one-letter abbreviation ("z. B."), e.g. the
 * license's name at the start of a long statement of terms (#72).
 */
export function firstSentence(s: string | null | undefined): string {
	const text = (s ?? '').trim();
	return text.match(/^[\s\S]+?(?<!(?:^|\s)\p{L})[.!?](?=\s+[\p{Lu}„"«(]|$)/u)?.[0] ?? text;
}
