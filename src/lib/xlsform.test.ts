import { describe, it, expect } from 'vitest';
import { xlsformSheets } from './xlsform';

describe('xlsformSheets', () => {
	it('shows survey, choices and a settings row, with every column', () => {
		const sheets = xlsformSheets({
			survey: [
				{ type: 'integer', name: 'alter', label: 'Wie alt sind Sie?' },
				{
					type: 'text',
					name: 'rente',
					label: 'Seit wann?',
					relevant: '${alter} > 60',
					'label::en': 'Since when?'
				}
			],
			choices: [],
			settings: [{ default_language: 'German (de)' }],
			warnings: [{ code: 'ddi-field-missing', message: 'no skip logic' }]
		});
		expect(sheets.map((s) => s.title)).toEqual(['survey', 'settings']);
		expect(sheets[0].headers).toEqual(['type', 'name', 'label', 'relevant', 'label::en']);
		expect(sheets[0].data[0]).toEqual(['integer', 'alter', 'Wie alt sind Sie?', '', '']);
		expect(sheets[1]).toEqual({
			title: 'settings',
			headers: ['default_language'],
			data: [['German (de)']]
		});
	});

	it('leaves out an empty settings list and a missing one', () => {
		const survey = [{ type: 'text', name: 'x' }];
		expect(xlsformSheets({ survey, choices: [], settings: [] }).map((s) => s.title)).toEqual([
			'survey'
		]);
		expect(xlsformSheets({ survey, choices: [] }).map((s) => s.title)).toEqual(['survey']);
	});
});
