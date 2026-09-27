/**
 * A fake qwacback for the end-to-end tests: page.route() answers every
 * request to BACKEND from the fixtures below, in the shapes the real API
 * returns (see qwacback's internal/routes/routes.go).
 */
import type { Page, Route } from '@playwright/test';

export const BACKEND = 'http://pb.test';

type Json = Record<string, unknown>;

const categories = [
	{ label: 'Yes', value: '1', is_missing: false },
	{ label: 'Not sure', value: '2', is_missing: false },
	{ label: 'No', value: '3', is_missing: false }
];

export const studies: Json[] = [
	{
		id: 'study0000000001',
		collectionName: 'studies',
		title: 'Community Survey',
		abstract: 'Questions about local involvement.',
		topic_classifications: ['Impact'],
		language: 'en'
	},
	{
		id: 'study0000000002',
		collectionName: 'studies',
		title: 'Demografie',
		abstract: 'Demografische Standards.',
		topic_classifications: ['Demographics'],
		language: 'de'
	}
];

const study = (id: string) => {
	const s = studies.find((s) => s.id === id)!;
	return { id: s.id, title: s.title };
};

interface Fixture {
	/** The entry in /api/questions. */
	question: Json;
	/** Extra fields of /api/questions/{id}. */
	detail: Json;
}

const grid: Fixture = {
	question: {
		id: 'grid00000000001',
		study_id: 'study0000000001',
		name: 'contact',
		concept: 'Civic network awareness',
		question_text: 'Do you know whom to contact in these groups?',
		answer_type: 'grid',
		variable_ids: ['gridrow00000001', 'gridrow00000002'],
		group_id: 'grid00000000001',
		order: 0
	},
	detail: {
		group: {
			id: 'grid00000000001',
			type: 'grid',
			concept: 'Civic network awareness',
			description: 'Do you know whom to contact in these groups?'
		},
		variables: [
			{
				id: 'gridrow00000001',
				name: 'contact_groups',
				question: 'Local groups',
				answer_type: 'grid',
				categories
			},
			{
				id: 'gridrow00000002',
				name: 'contact_council',
				question: 'The council',
				answer_type: 'grid',
				categories
			}
		]
	}
};

const age: Fixture = {
	question: {
		id: 'age000000000001',
		study_id: 'study0000000001',
		name: 'age',
		concept: 'Age',
		question_text: 'How old are you?',
		answer_type: 'integer',
		variable_ids: ['age000000000001'],
		order: 1
	},
	detail: {
		group: null,
		variables: [
			{
				id: 'age000000000001',
				name: 'age',
				concept: 'Age',
				question: 'How old are you?',
				answer_type: 'integer',
				categories: []
			}
		]
	}
};

const gender: Fixture = {
	question: {
		id: 'gender000000001',
		study_id: 'study0000000002',
		name: 'geschlecht',
		concept: 'Geschlecht',
		question_text: 'Was ist Ihr Geschlecht?',
		answer_type: 'multiple_choice_other',
		variable_ids: ['genderopt000001', 'genderopt000002', 'genderopt000003'],
		group_id: 'gender000000001',
		order: 0,
		language: 'de',
		translations: { en: 'What is your gender?' }
	},
	detail: {
		group: {
			id: 'gender000000001',
			type: 'multipleResp',
			concept: 'Geschlecht',
			description: 'Was ist Ihr Geschlecht?',
			translations: { en: { description: 'What is your gender?' } }
		},
		variables: [
			{
				id: 'genderopt000001',
				name: 'w',
				question: 'weiblich',
				answer_type: 'multiple_choice',
				translations: { en: { question: 'female' } }
			},
			{
				id: 'genderopt000002',
				name: 'm',
				question: 'männlich',
				answer_type: 'multiple_choice',
				translations: { en: { question: 'male' } }
			},
			{
				id: 'genderopt000003',
				name: 'o',
				question: 'eigene Angabe',
				answer_type: 'text',
				translations: { en: { question: 'self-described' } }
			}
		],
		tags: [{ lang: 'en', text: 'Gender' }]
	}
};

/** Enough integer questions in the first study for a second page of results. */
const fillers: Fixture[] = Array.from({ length: 21 }, (_, i) => {
	const n = String(i + 1).padStart(3, '0');
	const id = `filler000000${n}`;
	return {
		question: {
			id,
			study_id: 'study0000000001',
			name: `filler${n}`,
			concept: `Filler ${n}`,
			question_text: `Filler question ${n}?`,
			answer_type: 'integer',
			variable_ids: [id],
			order: i + 2
		},
		detail: {
			group: null,
			variables: [
				{ id, name: `filler${n}`, concept: `Filler ${n}`, answer_type: 'integer', categories: [] }
			]
		}
	};
});

export const fixtures = { grid, age, gender };
const all: Fixture[] = [grid, age, gender, ...fillers];
export const questions = all.map((f) => f.question);

const xlsform = (f: Fixture) => ({
	survey: [
		{
			type: String(f.question.answer_type),
			name: String(f.question.name),
			label: String(f.question.question_text)
		}
	],
	choices: []
});
const ddi = (f: Fixture) =>
	`<var ID="${f.question.id}" name="${f.question.name}"><labl>${f.question.concept}</labl></var>`;

/** A token PocketBase's SDK considers valid (it only reads `exp`). */
export const TOKEN = `x.${Buffer.from(JSON.stringify({ exp: 4102444800 })).toString('base64')}.y`;
const USER = { id: 'user00000000001', collectionName: 'users', email: 'tester@example.org' };
export const PASSWORD = 'correct horse';

export interface BackendOptions {
	/** Make every API request fail as if the backend were down. */
	down?: boolean;
	/** Paths (e.g. "/api/studies/x/export") that return this status instead. */
	fail?: Record<string, number>;
}

/** Answers every request to the fake backend. Returns the requests seen, for assertions. */
export async function mockBackend(page: Page, options: BackendOptions = {}) {
	const seen: string[] = [];
	await page.route(`${BACKEND}/**`, async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		seen.push(`${request.method()} ${url.pathname}${url.search}`);
		if (request.method() === 'OPTIONS') return send(route, 204, '');
		if (options.down) return route.abort('connectionrefused');
		if (options.fail?.[url.pathname]) {
			return send(route, options.fail[url.pathname], {
				status: options.fail[url.pathname],
				message: 'Failed',
				data: {}
			});
		}
		const [status, body] = answer(request.method(), url, request.postData() ?? '');
		return send(route, status, body);
	});
	return seen;
}

function send(route: Route, status: number, body: unknown) {
	const isText = typeof body === 'string';
	return route.fulfill({
		status,
		headers: {
			'access-control-allow-origin': '*',
			'access-control-allow-headers': '*',
			'access-control-allow-methods': 'GET, POST, OPTIONS',
			'content-type': isText ? 'application/xml' : 'application/json'
		},
		body: isText ? body : JSON.stringify(body)
	});
}

const notFound: [number, Json] = [404, { status: 404, message: 'Not found', data: {} }];

function answer(method: string, url: URL, postData: string): [number, unknown] {
	const path = url.pathname;
	let m: RegExpMatchArray | null;

	if (method === 'POST' && path === '/api/collections/users/auth-with-password') {
		return postData.includes(PASSWORD)
			? [200, { token: TOKEN, record: USER }]
			: [400, { status: 400, message: 'Failed to authenticate.', data: {} }];
	}
	if (method === 'POST' && path === '/api/collections/users/auth-refresh') {
		return [200, { token: TOKEN, record: USER }];
	}
	if (method === 'POST' && path === '/api/validate') {
		return postData.includes('<codeBook')
			? [200, { valid: true, message: 'XML is valid' }]
			: [
					400,
					{
						valid: false,
						errors: [{ message: 'Root element must be codeBook', location: '/*[1]' }]
					}
				];
	}

	if (path === '/api/questions') return [200, questions];
	if ((m = path.match(/^\/api\/questions\/(\w+)(\/xml|\/xlsform)?$/))) {
		const f = all.find((f) => f.question.id === m![1]);
		if (!f) return notFound;
		if (m[2] === '/xml') return [200, ddi(f)];
		if (m[2] === '/xlsform') return [200, xlsform(f)];
		return [200, { ...f.question, ...f.detail, study: study(String(f.question.study_id)) }];
	}
	if (path === '/api/search/questions') {
		const q = (url.searchParams.get('q') ?? '').toLowerCase();
		const items = questions.filter((x) =>
			[x.concept, x.question_text, JSON.stringify(x.translations ?? {})].some((t) =>
				String(t).toLowerCase().includes(q)
			)
		);
		return [
			200,
			{ page: 1, perPage: 100, totalItems: items.length, totalPages: items.length ? 1 : 0, items }
		];
	}

	if (path === '/api/collections/studies/records') {
		return [
			200,
			{ page: 1, perPage: 500, totalItems: studies.length, totalPages: 1, items: studies }
		];
	}
	if ((m = path.match(/^\/api\/collections\/studies\/records\/(\w+)$/))) {
		const s = studies.find((s) => s.id === m![1]);
		return s ? [200, s] : notFound;
	}
	if ((m = path.match(/^\/api\/studies\/(\w+)\/(questions|export)$/))) {
		if (!studies.some((s) => s.id === m![1])) return notFound;
		if (m[2] === 'export') return [200, `<?xml version="1.0"?><codeBook ID="${m[1]}"/>`];
		return [200, questions.filter((q) => q.study_id === m![1])];
	}
	return notFound;
}
