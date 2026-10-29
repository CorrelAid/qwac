/**
 * Helpers for the multilingual fields qwacback returns: a study's base
 * `language` plus `translations` keyed by language code.
 *
 * - question.translations: { "<lang>": "<question text>" }
 * - variable.translations: { "<lang>": { question, prequestion_text, ivu_instructions, hint, universe, grid_note, categories: { "<value>": "<label>" } } }
 * - group.translations:    { "<lang>": { description, label } }
 * - question.label_translations: { "<lang>": "<group label>" }
 */

type VariableTranslation = {
	question?: string;
	prequestion_text?: string;
	ivu_instructions?: string;
	hint?: string;
	universe?: string;
	grid_note?: string;
	description?: string;
	label?: string;
	categories?: Record<string, string>;
};

/** Primary language subtag, lowercased: "de-DE" → "de". */
function primary(lang: string | undefined | null): string {
	return (lang ?? '').split(/[-_]/)[0].toLowerCase();
}

/** Returns the entry of `map` for `locale`, matching on the primary language subtag. */
export function pickLang<T>(
	map: Record<string, T> | null | undefined,
	locale: string
): T | undefined {
	if (!map || typeof map !== 'object') return undefined;
	const want = primary(locale);
	for (const [lang, value] of Object.entries(map)) {
		if (primary(lang) === want) return value;
	}
	return undefined;
}

/**
 * Text in the UI locale: the base text when the study is in that language
 * (or has no translation for it), otherwise the translation.
 */
export function localizedText(
	base: string,
	language: string | undefined,
	translations: Record<string, string> | null | undefined,
	locale: string
): string {
	if (language && primary(language) === primary(locale)) return base;
	return pickLang(translations, locale) || base;
}

/** A question's text in the UI locale. */
export function questionText(
	question:
		| { question_text?: string; language?: string; translations?: Record<string, string> | null }
		| null
		| undefined,
	locale: string
): string {
	return localizedText(
		question?.question_text ?? '',
		question?.language,
		question?.translations,
		locale
	);
}

/**
 * A question's label in the UI locale: its group's short printed name, e.g.
 * "ATTARI-12" (qwacback#74), or '' when it has none.
 */
export function questionLabel(
	question:
		| { label?: string; language?: string; label_translations?: Record<string, string> | null }
		| null
		| undefined,
	locale: string
): string {
	return localizedText(
		question?.label ?? '',
		question?.language,
		question?.label_translations,
		locale
	);
}

/** What localizeVariable needs of a variable. */
interface LocalizableVariable {
	question?: string;
	prequestion_text?: string;
	ivu_instructions?: string;
	hint?: string;
	universe?: string;
	grid_note?: string;
	categories?: { value?: string; label?: string }[] | null;
	translations?: unknown;
}

/** A variable with its texts and category labels in the UI locale. */
export function localizeVariable<T extends LocalizableVariable>(
	variable: T,
	language: string | undefined,
	locale: string
): T {
	if (!variable || (language && primary(language) === primary(locale))) return variable;
	const tr = pickLang(
		variable.translations as Record<string, VariableTranslation> | undefined,
		locale
	);
	if (!tr) return variable;
	const categories = Array.isArray(variable.categories)
		? variable.categories.map((c: { value?: string; label?: string }) => {
				const label = c?.value !== undefined ? tr.categories?.[c.value] : undefined;
				return label ? { ...c, label } : c;
			})
		: variable.categories;
	return {
		...variable,
		question: tr.question || variable.question,
		prequestion_text: tr.prequestion_text || variable.prequestion_text,
		ivu_instructions: tr.ivu_instructions || variable.ivu_instructions,
		hint: tr.hint || variable.hint,
		universe: tr.universe || variable.universe,
		grid_note: tr.grid_note || variable.grid_note,
		categories
	};
}

/** A variable group with its description and label in the UI locale. */
export function localizeGroup<
	T extends { description?: string; label?: string; translations?: unknown }
>(group: T, language: string | undefined, locale: string): T {
	if (!group || (language && primary(language) === primary(locale))) return group;
	const tr = pickLang(
		group.translations as Record<string, VariableTranslation> | undefined,
		locale
	);
	if (!tr?.description && !tr?.label) return group;
	return {
		...group,
		description: tr.description || group.description,
		label: tr.label || group.label
	};
}
