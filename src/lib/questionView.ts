/* eslint-disable @typescript-eslint/no-explicit-any -- TODO(#25): type the API responses */
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
	isTextType,
	typeInfo,
	variableType
} from '$lib/questionTypes';

export type QuestionPreview =
	| { kind: 'grid'; variables: any[]; question: string }
	| { kind: 'survey'; variable: any }
	| null;

export interface QuestionView {
	/** The standalone variable; null for a group. */
	variable: any | null;
	/** Answer type for the tag. */
	answerType: string;
	concept: string;
	longListStandard: string;
	preview: QuestionPreview;
}

/**
 * @param group the question's variable group, or null for a standalone variable
 * @param variables the group's variables, or the standalone variable
 * @param answerType the answer type the API assembled for the question, if any
 * @param otherLabel label for an "Other" option whose variable has none
 */
export function questionView(
	group: any | null,
	variables: any[],
	answerType: string | undefined,
	otherLabel: string
): QuestionView {
	const variable = group ? null : (variables[0] ?? null);
	const isMatrix = !!group && isGridGroup(group.type ?? '');
	const isSelectGroup = !!group && !isMatrix;

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

	const concept = group ? group.concept || variables[0]?.concept || '' : variable?.concept || '';

	let preview: QuestionPreview = null;
	if (isMatrix && variables.length > 0) {
		preview = {
			kind: 'grid',
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
				other_label:
					otherVariable?.question || otherVariable?.label || otherVariable?.concept || otherLabel,
				// Each variable of a choice group is one category.
				categories: choiceVariables.map((v) => ({
					label: v.question || v.label || v.concept,
					value: v.name || v.id
				}))
			}
		};
	} else if (variable) {
		preview = {
			kind: 'survey',
			variable: {
				...variable,
				answer_type: variableType(variable),
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
