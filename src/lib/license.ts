/**
 * The Creative Commons licenses qwacback names by SPDX ID (study.license_id),
 * with their deeds and Creative Commons' official 88×31 buttons, served as
 * published from static/licenses/ (Creative Commons' trademark policy: no
 * redrawn or recoloured logos).
 */
export interface CcLicense {
	/** E.g. "CC BY-SA 4.0". */
	name: string;
	deed: string;
	/** Path of the official button under static/. */
	button: string;
	/** Adapted versions must be shared under the same license (BY-SA). */
	shareAlike: boolean;
}

// The parts after "CC-" and before "-4.0" that have a button.
const CODES = ['BY', 'BY-SA', 'BY-NC', 'BY-NC-SA', 'BY-NC-ND'];

/** The CC license with this SPDX ID, e.g. "CC-BY-4.0"; null for any other. */
export function ccLicense(id: string | undefined): CcLicense | null {
	const code = id?.match(/^CC-(.+)-4\.0$/)?.[1];
	if (!code || !CODES.includes(code)) return null;
	const slug = code.toLowerCase();
	return {
		name: `CC ${code} 4.0`,
		deed: `https://creativecommons.org/licenses/${slug}/4.0/`,
		button: `/licenses/${slug}.svg`,
		shareAlike: code.endsWith('-SA')
	};
}
