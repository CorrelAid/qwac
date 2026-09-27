import { writable, derived } from 'svelte/store';

export type Locale = 'en' | 'de';

export const locale = writable<Locale>('en');

const translations: Record<Locale, Record<string, string>> = {
	en: {
		// Layout
		'layout.about': 'About',
		'layout.imprint': 'Imprint',
		'layout.upload': 'Upload',
		'layout.subtitle': '- questions worth asking continuously',

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

		// Explore / Home
		'explore.title': 'Explore Questions',
		'explore.loading': 'Loading questions...',
		'explore.noResults': 'No questions found.',
		'explore.question': 'question',
		'explore.questions': 'questions',
		'explore.variables': 'variables',
		'explore.viewDetails': 'View details →',
		'explore.questionLabel': 'Question:',
		'explore.conceptLabel': 'Concept:',
		'explore.filterKind': 'Kind',
		'explore.filterAnswerType': 'Answer Type',
		'explore.loadError': 'Failed to load questions.',
		'explore.searching': 'Searching...',
		'explore.searchError': 'Search failed. Please try again.',

		// Filter bar
		'filter.search': 'Search questions...',
		'filter.clear': 'Clear',

		// Paginator
		'paginator.page': 'page',
		'paginator.of': 'of',

		// Question detail
		'question.loading': 'Loading question...',
		'question.back': 'Back to questions',
		'question.concept': 'Concept:',
		'question.standard': 'Standard:',
		'question.tags': 'Tags:',
		'question.tabPreview': 'Survey Preview',
		'question.tabXlsform': 'XLSForm',
		'question.tabDdi': 'DDI XML',
		'question.loadingXlsform': 'Loading XLSForm data...',
		'question.loadingDdi': 'Loading DDI XML...',
		'question.loadError': 'Failed to load question.',

		// Study detail
		'study.loading': 'Loading study...',
		'study.back': 'Back to questions',
		'study.exportDdi': 'Export DDI XML',
		'study.exporting': 'Exporting...',
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
		'study.loadError': 'Failed to load study.',

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

		// Survey preview
		'preview.interviewerNote': 'Interviewer note',
		'preview.pleaseSpecify': 'Please specify...',
		'preview.other': 'Other',
		'preview.selectAll': 'Select all that apply',

		// Long list
		'longList.select': 'Select...',
		'longList.standard': 'Standard:',

		// About
		'about.title': 'About QWAC',
		'about.back': 'Back to questions',

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

		// Explore / Home
		'explore.title': 'Fragen durchsuchen',
		'explore.loading': 'Fragen werden geladen...',
		'explore.noResults': 'Keine Fragen gefunden.',
		'explore.question': 'Frage',
		'explore.questions': 'Fragen',
		'explore.variables': 'Variablen',
		'explore.viewDetails': 'Details anzeigen →',
		'explore.questionLabel': 'Frage:',
		'explore.conceptLabel': 'Konzept:',
		'explore.filterKind': 'Art',
		'explore.filterAnswerType': 'Antworttyp',
		'explore.loadError': 'Fragen konnten nicht geladen werden.',
		'explore.searching': 'Suche läuft...',
		'explore.searchError': 'Suche fehlgeschlagen. Bitte erneut versuchen.',

		// Filter bar
		'filter.search': 'Fragen suchen...',
		'filter.clear': 'Zurücksetzen',

		// Paginator
		'paginator.page': 'Seite',
		'paginator.of': 'von',

		// Question detail
		'question.loading': 'Frage wird geladen...',
		'question.back': 'Zurück zu Fragen',
		'question.concept': 'Konzept:',
		'question.standard': 'Standard:',
		'question.tags': 'Schlagwörter:',
		'question.tabPreview': 'Vorschau',
		'question.tabXlsform': 'XLSForm',
		'question.tabDdi': 'DDI XML',
		'question.loadingXlsform': 'XLSForm-Daten werden geladen...',
		'question.loadingDdi': 'DDI XML wird geladen...',
		'question.loadError': 'Frage konnte nicht geladen werden.',

		// Study detail
		'study.loading': 'Studie wird geladen...',
		'study.back': 'Zurück zu Fragen',
		'study.exportDdi': 'DDI XML exportieren',
		'study.exporting': 'Wird exportiert...',
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
		'study.loadError': 'Studie konnte nicht geladen werden.',

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

		// Survey preview
		'preview.interviewerNote': 'Interviewerhinweis',
		'preview.pleaseSpecify': 'Bitte angeben...',
		'preview.other': 'Sonstiges',
		'preview.selectAll': 'Alles Zutreffende auswählen',

		// Long list
		'longList.select': 'Auswählen...',
		'longList.standard': 'Standard:',

		// About
		'about.title': 'Über QWAC',
		'about.back': 'Zurück zu Fragen',

		// Imprint
		'imprint.title': 'Impressum',
		'imprint.back': 'Zurück zu Fragen',
		'imprint.text':
			'Dieses Tool wird bereitgestellt von <a href="https://correlaid.org" target="_blank" rel="noopener noreferrer">CorrelAid e.V.</a> im Rahmen des <a href="https://civic-data.de" target="_blank" rel="noopener noreferrer">Civic Data Lab</a>. Das vollständige Impressum finden Sie unter <a href="https://civic-data.de/impressum/" target="_blank" rel="noopener noreferrer">civic-data.de/impressum/</a>.'
	}
};

export const t = derived(locale, ($locale) => {
	return (key: string): string => {
		return translations[$locale][key] ?? key;
	};
});
