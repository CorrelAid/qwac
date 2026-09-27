import type { XlsForm } from '$lib/types';

/** One sheet as XlsFormDisplay shows it. */
export interface Worksheet {
	title: string;
	headers: string[];
	data: string[][];
}

function sheet(title: string, rows: Record<string, string>[]): Worksheet {
	// Columns in order of first appearance: rows can carry different ones
	// (relevant, hint, label::en, …).
	const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
	return { title, headers, data: rows.map((r) => headers.map((h) => r[h] ?? '')) };
}

/**
 * The sheets of an XLSForm: survey and choices when they have rows, and
 * settings when it has one (e.g. default_language of a multilingual form).
 */
export function xlsformSheets(form: XlsForm): Worksheet[] {
	return (
		[
			['survey', form.survey],
			['choices', form.choices],
			['settings', form.settings]
		] as const
	)
		.filter(([, rows]) => Array.isArray(rows) && rows.length)
		.map(([title, rows]) => sheet(title, rows as Record<string, string>[]));
}
