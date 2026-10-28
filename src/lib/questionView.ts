/**
 * What the question page shows, derived from /api/questions/{id}: a question
 * is a grid (matrix group), a choice group (one variable per category, maybe
 * plus a free-text "Other" variable) or a standalone variable.
 */
import {
	baseType,
	groupAnswerType,
	isChoiceType,
	isGridGroup,
	isNumberType,
	isTextType,
	typeInfo
} from '$lib/questionTypes';
import { distinctConcept } from '$lib/text';
import type { GridRow, Group, PreviewVariable, Variable } from '$lib/types';

export type QuestionPreview =
	| { kind: 'grid'; variables: GridRow[]; question: string }
	/** A grid whose rows are number fields (integer, decimal), #70. */
	| { kind: 'numberGrid'; variables: GridRow[]; question: string }
	| { kind: 'survey'; variable: PreviewVariable }
	| null;

export interface QuestionView {
	/** The standalone variable; null for a group. */
	variable: Variable | null;
	/** Answer type for the tag. */
	answerType: string;
	/** The concept, or '' when it is empty or repeats the question (see distinctConcept). */
	concept: string;
	longListStandard: string;
	preview: QuestionPreview;
}

/**
 * @param group the question's variable group, or null for a standalone variable
 * @param variables the group's variables, or the standalone variable
 * @param answerType the answer type the API assembled for the question, if any
 * @param otherLabel label for an "Other" option whose variable has none
 * @param questionText the API's question_text, in the study's language; the
 *   group and variables may be localized, the concept is not
 */
export function questionView(
	group: Group | null,
	variables: Variable[],
	answerType: string | undefined,
	otherLabel: string,
	questionText = ''
): QuestionView {
	const variable = group ? null : (variables[0] ?? null);
	const isMatrix = !!group && isGridGroup(group.type ?? '');
	const isSelectGroup = !!group && !isMatrix;
	// A grid's rows are choice rows (radio columns from shared categories) or,
	// since formtransform 0.8.0, number rows (#70); each row's answer type says which.
	const isNumberGrid =
		isMatrix && variables.length > 0 && variables.every((v) => isNumberType(v.answer_type));

	// In a choice group, a text variable is the "Other" field.
	const isChoiceGroup = isSelectGroup && variables.some((v) => isChoiceType(v.answer_type));
	const otherVariable = isChoiceGroup
		? (variables.find((v) => isTextType(v.answer_type)) ?? null)
		: null;
	const choiceVariables = otherVariable
		? variables.filter((v) => !isTextType(v.answer_type))
		: variables;

	const type =
		answerType ||
		(!group
			? variable?.answer_type || ''
			: groupAnswerType(group.type ?? '') || choiceVariables[0]?.answer_type || group.type || '');

	const firstVariable = variables[0];
	const concept = distinctConcept(
		group ? group.concept || firstVariable?.concept : variable?.concept,
		questionText,
		group?.description,
		firstVariable?.prequestion_text,
		firstVariable?.question
	);

	let preview: QuestionPreview = null;
	if (isMatrix && variables.length > 0) {
		preview = {
			kind: isNumberGrid ? 'numberGrid' : 'grid',
			variables,
			question: variables[0]?.prequestion_text || group?.description || group?.concept || ''
		};
	} else if (isSelectGroup && choiceVariables.length > 0) {
		const first = choiceVariables[0];
		preview = {
			kind: 'survey',
			variable: {
				...first,
				prequestion_text: null,
				question:
					first?.prequestion_text || group?.description || group?.concept || first?.question,
				answer_type: baseType(type),
				has_other: !!otherVariable,
				other_label: otherVariable?.question || otherVariable?.concept || otherLabel,
				// Each variable of a choice group is one category.
				categories: choiceVariables.map((v) => ({
					label: v.question || v.concept,
					value: v.name || v.id
				}))
			}
		};
	} else if (variable) {
		preview = {
			kind: 'survey',
			variable: {
				...variable,
				// qwacback sends the full answer type, variant included.
				answer_type: variable.answer_type,
				has_other: variable.has_other === true || !!typeInfo(variable.answer_type)?.withOther
			}
		};
	}

	return {
		variable,
		answerType: type,
		concept,
		longListStandard: !group ? variable?.long_list_standard || '' : '',
		preview
	};
}
