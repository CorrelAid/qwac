/**
 * Helpers for the multilingual fields qwacback returns: a study's base
 * `language` plus `translations` keyed by language code.
 *
 * - question.translations: { "<lang>": "<question text>" }
 * - variable.translations: { "<lang>": { question, prequestion_text, ivu_instructions, categories: { "<value>": "<label>" } } }
 * - group.translations:    { "<lang>": { description } }
 */

type VariableTranslation = {
	question?: string;
	prequestion_text?: string;
	ivu_instructions?: string;
	description?: string;
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

/** A variable with its texts and category labels in the UI locale. */
export function localizeVariable<T extends Record<string, unknown>>(
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
		categories
	};
}

/** A variable group with its description in the UI locale. */
export function localizeGroup<T extends Record<string, unknown>>(
	group: T,
	language: string | undefined,
	locale: string
): T {
	if (!group || (language && primary(language) === primary(locale))) return group;
	const tr = pickLang(
		group.translations as Record<string, VariableTranslation> | undefined,
		locale
	);
	return tr?.description ? { ...group, description: tr.description } : group;
}
