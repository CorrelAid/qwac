/**
 * The shapes of qwacback's API responses, mirroring its Go structs
 * (internal/routes/routes.go) and PocketBase's `studies` collection.
 */

/** A search tag: a further <concept> of the DDI, usually in the other language. */
export interface QuestionTag {
	lang?: string;
	text: string;
}

/** A question as listed by /api/questions, /api/search/questions and /api/studies/{id}/questions. */
export interface Question {
	id: string;
	study_id: string;
	name: string;
	concept: string;
	question_text: string;
	/** qwacback's answer type, e.g. single_choice_other (see questionTypes.ts). */
	answer_type: string;
	variable_ids: string[];
	group_id?: string;
	order: number;
	tags?: QuestionTag[];
	/** The study's base language, the language of question_text. */
	language?: string;
	/** question_text in the study's other languages: lang → text. */
	translations?: Record<string, string>;
}

export interface Category {
	label: string;
	value: string;
	is_missing?: boolean;
}

/** Texts of a variable in another language. */
export interface VariableTranslation {
	question?: string;
	prequestion_text?: string;
	ivu_instructions?: string;
	/** Category value → label. */
	categories?: Record<string, string>;
}

/** A variable in /api/questions/{id}. */
export interface Variable {
	id: string;
	name: string;
	concept: string;
	question: string;
	prequestion_text: string;
	ivu_instructions: string;
	answer_type: string;
	has_other: boolean;
	has_long_list: boolean;
	long_list_standard: string;
	categories: Category[] | null;
	translations?: Record<string, VariableTranslation> | null;
}

/** What a question preview shows: a variable, or a choice group built into one. */
export interface PreviewVariable {
	answer_type: string;
	concept?: string;
	question?: string;
	prequestion_text?: string | null;
	ivu_instructions?: string;
	categories?: Pick<Category, 'label' | 'value'>[] | null;
	has_other?: boolean;
	other_label?: string;
	has_long_list?: boolean;
	long_list_standard?: string;
}

/** A row of a grid preview. */
export type GridRow = Pick<Variable, 'id' | 'answer_type'> &
	Partial<Pick<Variable, 'question' | 'concept' | 'categories'>>;

/** A variable group in /api/questions/{id}; `type` is the DDI varGrp type. */
export interface Group {
	id: string;
	type: string;
	concept: string;
	description: string;
	translations?: Record<string, { description?: string }> | null;
}

/** /api/questions/{id}: the question with its study, group and variables. */
export interface QuestionDetail extends Omit<Question, 'study_id' | 'variable_ids'> {
	study: { id: string; title: string; language?: string } | null;
	group: Group | null;
	variables: Variable[];
}

/** A record of PocketBase's `studies` collection. */
export interface Study {
	id: string;
	collectionName?: string;
	title: string;
	id_no?: string;
	abstract?: string;
	/** Plain text, or a Go map rendering from old imports (see ddi.ts). */
	author?: unknown;
	author_affiliation?: string;
	producer?: string;
	producer_affiliation?: string;
	time_period?: string;
	nation?: string;
	universe?: string;
	analysis_unit?: string;
	data_kind?: string;
	holdings_uri?: unknown;
	holdings_description?: unknown;
	keywords?: string[];
	topic_classifications?: string[];
	language?: string;
}

/** A page of /api/search/questions. */
export interface SearchPage {
	page: number;
	perPage: number;
	totalItems: number;
	totalPages: number;
	items: Question[] | null;
}

/** A 200 from /api/import (qwacback#38 added `imported` and `study_id`). */
export interface ImportResponse {
	valid: true;
	imported?: boolean;
	study_id?: string;
	message?: string;
}

/** The body of a 400 from /api/import or /api/validate. */
export interface ValidationRejection {
	valid: false;
	errors: (string | import('./findings').Finding)[];
}

/** The XLSForm JSON of /api/questions/{id}/xlsform. */
export interface XlsForm {
	survey: Record<string, string>[];
	choices: Record<string, string>[];
	settings?: Record<string, string>;
}
