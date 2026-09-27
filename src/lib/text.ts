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
