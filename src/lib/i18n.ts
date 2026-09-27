import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

/** Supported locales, in the order the language switcher lists them. */
export const LOCALES = ['de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** German is the default; an explicit choice in the switcher wins (#33). */
export const DEFAULT_LOCALE: Locale = 'de';

const STORAGE_KEY = 'qwac.locale';

function isLocale(value: unknown): value is Locale {
	return LOCALES.includes(value as Locale);
}

/** The locale the user picked earlier, if any. Storage can be unavailable. */
function storedLocale(): Locale | undefined {
	if (!browser) return undefined;
	try {
		const value = localStorage.getItem(STORAGE_KEY);
		return isLocale(value) ? value : undefined;
	} catch {
		return undefined;
	}
}

export const locale = writable<Locale>(storedLocale() ?? DEFAULT_LOCALE);

if (browser) {
	// Screen readers and hyphenation read the page language from <html lang>.
	locale.subscribe((l) => (document.documentElement.lang = l));
}

/** Switches the UI language and remembers the choice for the next visit. */
export function setLocale(l: Locale): void {
	locale.set(l);
	try {
		localStorage.setItem(STORAGE_KEY, l);
	} catch {
		// Private mode or blocked storage: the choice lasts for this visit only.
	}
}

export const translations: Record<Locale, Record<string, string>> = {
	en: {
		// Layout
		'layout.about': 'About',
		'layout.imprint': 'Imprint',
		'layout.upload': 'Upload',
		'layout.subtitle': '- questions worth asking continuously',
		'layout.description':
			'A question bank for civil society surveys: search tested questions and reuse them as XLSForm or DDI.',

		// Auth
		'auth.signIn': 'Sign In',
		'auth.signOut': 'Sign Out',
		'auth.signingIn': 'Signing in...',
		'auth.emailLabel': 'Email / Username',
		'auth.emailPlaceholder': 'Email or Username',
		'auth.passwordLabel': 'Password',
		'auth.passwordPlaceholder': 'Password',
		'auth.emptyFields': 'Please enter your email and password.',
		'auth.invalidCredentials': 'Invalid email or password. Please try again.',
		'auth.signInRequired': 'Please sign in to upload codebooks.',
		'auth.profilePicture': 'Profile picture',

		// Explore / Home
		'explore.title': 'Explore Questions',
		'explore.noResults': 'No questions found.',
		'explore.question': 'question',
		'explore.questions': 'questions',
		'explore.variables': 'variables',
		'explore.filterTopic': 'Topic',
		'explore.filterAnswerType': 'Answer Type',
		'explore.searching': 'Searching...',
		'explore.searchError': 'Search failed. Please try again.',

		// Filter bar
		'filter.search': 'Search questions...',
		'filter.clear': 'Clear',

		// Paginator
		'paginator.page': 'page',
		'paginator.of': 'of',
		'paginator.label': 'Result pages',
		'paginator.previous': 'Previous page',
		'paginator.next': 'Next page',

		// Question detail
		'question.back': 'Back to questions',
		'question.concept': 'Concept:',
		'question.standard': 'Standard:',
		'question.tags': 'Tags:',
		'question.tabsLabel': 'Views of the question',
		'question.tabPreview': 'Survey Preview',
		'question.tabXlsform': 'XLSForm',
		'question.tabDdi': 'DDI XML',
		'question.loadingXlsform': 'Loading XLSForm data...',
		'question.loadingDdi': 'Loading DDI XML...',
		'question.downloadXml': 'Download .xml',
		'question.copy': 'Copy',
		'question.copied': 'Copied!',
		'question.xlsformUnavailable': 'The XLSForm for this question is not available.',
		'question.ddiUnavailable': 'The DDI XML for this question is not available.',

		// Study detail
		'study.back': 'Back to questions',
		'study.exportDdi': 'Export DDI XML',
		'study.exporting': 'Exporting...',
		'study.exportFailed': 'The export failed. Please try again later.',
		'study.author': 'Author',
		'study.timePeriod': 'Time Period',
		'study.analysisUnit': 'Analysis Unit',
		'study.universe': 'Universe',
		'study.dataKind': 'Data Kind',
		'study.language': 'Language',
		'study.source': 'Source',
		'study.abstract': 'Abstract',
		'study.questions': 'Questions',
		'study.noQuestions': 'No questions found for this study.',

		// Upload
		'upload.title': 'Upload DDI Codebook',
		'upload.description':
			'Upload a DDI Codebook XML file to import a study with its variables and groups.',
		'upload.back': 'Back to questions',
		'upload.importSuccess': 'Import successful',
		'upload.importFailed': 'Import failed',
		'upload.uploadAnother': 'Upload another file',
		'upload.dropHint': 'Drag & drop an XML file here, or',
		'upload.chooseFile': 'Choose file',
		'upload.chooseDifferent': 'Choose different file',
		'upload.uploading': 'Uploading...',
		'upload.importCodebook': 'Import Codebook',
		'upload.uploadFailed': 'Upload failed. Please try again.',
		'upload.xmlOnly': 'File must be an XML file.',
		'upload.tooLarge': 'File must be smaller than 10 MB.',
		'upload.unknownError': 'Unknown error',

		// Survey preview
		'preview.interviewerNote': 'Interviewer note',
		'preview.pleaseSpecify': 'Please specify...',
		'preview.other': 'Other',
		'preview.selectAll': 'Select all that apply',
		'preview.selectOne': 'Select one',
		'preview.textResponse': 'Text response...',

		// Long list
		'longList.select': 'Select...',
		'longList.standard': 'Standard:',

		// About
		'about.title': 'About QWAC',
		'about.back': 'Back to questions',

		// Error page
		'error.title': 'Something went wrong',
		'error.text': "The question bank can't be reached right now. Please try again in a moment.",
		'error.notFoundTitle': 'Page not found',
		'error.notFoundText': "This page, question or study doesn't exist.",
		'error.retry': 'Try again',
		'error.retrying': 'Trying again...',
		'error.back': 'Back to questions',

		// Imprint
		'imprint.title': 'Imprint',
		'imprint.back': 'Back to questions',
		'imprint.text':
			'This tool is hosted by <a href="https://correlaid.org" target="_blank" rel="noopener noreferrer">CorrelAid e.V.</a> as part of the <a href="https://civic-data.de" target="_blank" rel="noopener noreferrer">Civic Data Lab</a>. For legal details, please refer to <a href="https://civic-data.de/impressum/" target="_blank" rel="noopener noreferrer">civic-data.de/impressum/</a>.'
	},
	de: {
		// Layout
		'layout.about': 'Über',
		'layout.imprint': 'Impressum',
		'layout.upload': 'Hochladen',
		'layout.subtitle': '- Fragen, die es sich zu stellen lohnt',
		'layout.description':
			'Eine Fragendatenbank für zivilgesellschaftliche Umfragen: erprobte Fragen finden und als XLSForm oder DDI wiederverwenden.',

		// Auth
		'auth.signIn': 'Anmelden',
		'auth.signOut': 'Abmelden',
		'auth.signingIn': 'Anmelden...',
		'auth.emailLabel': 'E-Mail / Benutzername',
		'auth.emailPlaceholder': 'E-Mail oder Benutzername',
		'auth.passwordLabel': 'Passwort',
		'auth.passwordPlaceholder': 'Passwort',
		'auth.emptyFields': 'Bitte E-Mail und Passwort eingeben.',
		'auth.invalidCredentials': 'Ungültige E-Mail oder Passwort. Bitte erneut versuchen.',
		'auth.signInRequired': 'Bitte anmelden, um Codebooks hochzuladen.',
		'auth.profilePicture': 'Profilbild',

		// Explore / Home
		'explore.title': 'Fragen durchsuchen',
		'explore.noResults': 'Keine Fragen gefunden.',
		'explore.question': 'Frage',
		'explore.questions': 'Fragen',
		'explore.variables': 'Variablen',
		'explore.filterTopic': 'Thema',
		'explore.filterAnswerType': 'Antworttyp',
		'explore.searching': 'Suche läuft...',
		'explore.searchError': 'Suche fehlgeschlagen. Bitte erneut versuchen.',

		// Filter bar
		'filter.search': 'Fragen suchen...',
		'filter.clear': 'Zurücksetzen',

		// Paginator
		'paginator.page': 'Seite',
		'paginator.of': 'von',
		'paginator.label': 'Ergebnisseiten',
		'paginator.previous': 'Vorherige Seite',
		'paginator.next': 'Nächste Seite',

		// Question detail
		'question.back': 'Zurück zu Fragen',
		'question.concept': 'Konzept:',
		'question.standard': 'Standard:',
		'question.tags': 'Schlagwörter:',
		'question.tabsLabel': 'Ansichten der Frage',
		'question.tabPreview': 'Vorschau',
		'question.tabXlsform': 'XLSForm',
		'question.tabDdi': 'DDI XML',
		'question.loadingXlsform': 'XLSForm-Daten werden geladen...',
		'question.loadingDdi': 'DDI XML wird geladen...',
		'question.downloadXml': '.xml herunterladen',
		'question.copy': 'Kopieren',
		'question.copied': 'Kopiert!',
		'question.xlsformUnavailable': 'Das XLSForm für diese Frage ist nicht verfügbar.',
		'question.ddiUnavailable': 'Das DDI XML für diese Frage ist nicht verfügbar.',

		// Study detail
		'study.back': 'Zurück zu Fragen',
		'study.exportDdi': 'DDI XML exportieren',
		'study.exporting': 'Wird exportiert...',
		'study.exportFailed': 'Der Export ist fehlgeschlagen. Bitte später erneut versuchen.',
		'study.author': 'Autor',
		'study.timePeriod': 'Zeitraum',
		'study.analysisUnit': 'Analyseeinheit',
		'study.universe': 'Grundgesamtheit',
		'study.dataKind': 'Datenart',
		'study.language': 'Sprache',
		'study.source': 'Quelle',
		'study.abstract': 'Zusammenfassung',
		'study.questions': 'Fragen',
		'study.noQuestions': 'Keine Fragen für diese Studie gefunden.',

		// Upload
		'upload.title': 'DDI Codebook hochladen',
		'upload.description':
			'Laden Sie eine DDI-Codebook-XML-Datei hoch, um eine Studie mit ihren Variablen und Gruppen zu importieren.',
		'upload.back': 'Zurück zu Fragen',
		'upload.importSuccess': 'Import erfolgreich',
		'upload.importFailed': 'Import fehlgeschlagen',
		'upload.uploadAnother': 'Weitere Datei hochladen',
		'upload.dropHint': 'XML-Datei hierher ziehen oder',
		'upload.chooseFile': 'Datei auswählen',
		'upload.chooseDifferent': 'Andere Datei wählen',
		'upload.uploading': 'Wird hochgeladen...',
		'upload.importCodebook': 'Codebook importieren',
		'upload.uploadFailed': 'Hochladen fehlgeschlagen. Bitte erneut versuchen.',
		'upload.xmlOnly': 'Die Datei muss eine XML-Datei sein.',
		'upload.tooLarge': 'Die Datei darf maximal 10 MB groß sein.',
		'upload.unknownError': 'Unbekannter Fehler',

		// Survey preview
		'preview.interviewerNote': 'Interviewerhinweis',
		'preview.pleaseSpecify': 'Bitte angeben...',
		'preview.other': 'Sonstiges',
		'preview.selectAll': 'Alles Zutreffende auswählen',
		'preview.selectOne': 'Eine Antwort auswählen',
		'preview.textResponse': 'Textantwort...',

		// Long list
		'longList.select': 'Auswählen...',
		'longList.standard': 'Standard:',

		// About
		'about.title': 'Über QWAC',
		'about.back': 'Zurück zu Fragen',

		// Error page
		'error.title': 'Etwas ist schiefgelaufen',
		'error.text':
			'Die Fragendatenbank ist gerade nicht erreichbar. Bitte versuchen Sie es gleich noch einmal.',
		'error.notFoundTitle': 'Seite nicht gefunden',
		'error.notFoundText': 'Diese Seite, Frage oder Studie gibt es nicht.',
		'error.retry': 'Erneut versuchen',
		'error.retrying': 'Wird erneut versucht...',
		'error.back': 'Zurück zu Fragen',

		// Imprint
		'imprint.title': 'Impressum',
		'imprint.back': 'Zurück zu Fragen',
		'imprint.text':
			'Dieses Tool wird bereitgestellt von <a href="https://correlaid.org" target="_blank" rel="noopener noreferrer">CorrelAid e.V.</a> im Rahmen des <a href="https://civic-data.de" target="_blank" rel="noopener noreferrer">Civic Data Lab</a>. Das vollständige Impressum finden Sie unter <a href="https://civic-data.de/impressum/" target="_blank" rel="noopener noreferrer">civic-data.de/impressum/</a>.'
	}
};

/** The text for `key` in `l`, falling back to German, then to the key itself. */
export function translate(l: Locale, key: string): string {
	return translations[l]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
}

export const t = derived(
	locale,
	($locale) =>
		(key: string): string =>
			translate($locale, key)
);
