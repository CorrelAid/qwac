import { describe, it, expect } from 'vitest';
import { extractText, extractUri, parseGoValue } from './ddi';

describe('parseGoValue', () => {
	it('parses a simple Go map with #text and -affiliation', () => {
		const result = parseGoValue(
			'map[#text:New Economics Foundation -affiliation:New Economics Foundation (NEF)]'
		);
		expect(result).toEqual({
			'#text': 'New Economics Foundation',
			'-affiliation': 'New Economics Foundation (NEF)',
		});
	});

	it('parses a map with -URI containing a URL', () => {
		const result = parseGoValue(
			'map[#text:Source questionnaire available from NEF Consulting downloads page. -URI:https://www.nefconsulting.com/what-we-do/evaluation-impact-assessment/prove-it/downloads/]'
		);
		expect(result).toEqual({
			'#text': 'Source questionnaire available from NEF Consulting downloads page.',
			'-URI': 'https://www.nefconsulting.com/what-we-do/evaluation-impact-assessment/prove-it/downloads/',
		});
	});

	it('parses nested maps', () => {
		const result = parseGoValue('map[ul:map[li:[item content]]]');
		expect(result).toEqual({ ul: { li: ['item content'] } });
	});

	it('parses arrays with mixed text and maps', () => {
		const result = parseGoValue(
			'map[p:[map[#text:First paragraph.] map[#text:Second paragraph.]]]'
		);
		expect(result).toEqual({
			p: [{ '#text': 'First paragraph.' }, { '#text': 'Second paragraph.' }],
		});
	});

	it('handles text values containing colons', () => {
		const result = parseGoValue(
			"map[#text:People's networks and contacts: ul:map[li:[for achieving change]]]"
		);
		expect(result).toEqual({
			'#text': "People's networks and contacts:",
			ul: { li: ['for achieving change'] },
		});
	});

	it('returns plain strings as-is', () => {
		expect(parseGoValue('hello world')).toBe('hello world');
	});
});

describe('extractText', () => {
	it('returns plain strings as-is', () => {
		expect(extractText('hello world')).toBe('hello world');
	});

	it('returns empty for null/undefined', () => {
		expect(extractText(null)).toBe('');
		expect(extractText(undefined)).toBe('');
	});

	it('extracts #text from author Go map, skipping -affiliation', () => {
		const input =
			'map[#text:New Economics Foundation -affiliation:New Economics Foundation (NEF)]';
		expect(extractText(input)).toBe('New Economics Foundation');
	});

	it('extracts text from holdings map, skipping -URI', () => {
		const input =
			'map[#text:Source questionnaire available from NEF Consulting downloads page. -URI:https://www.nefconsulting.com/what-we-do/evaluation-impact-assessment/prove-it/downloads/]';
		expect(extractText(input)).toBe(
			'Source questionnaire available from NEF Consulting downloads page.'
		);
	});

	it('strips -xhtml namespace declarations from output', () => {
		const input = 'map[#text:Some text -xhtml:http://www.w3.org/1999/xhtml]';
		expect(extractText(input)).toBe('Some text');
	});

	it('extracts text from nested abstract structure', () => {
		const input =
			'map[ol:map[-xhtml:http://www.w3.org/1999/xhtml li:[Frequency of use of the new space]] p:[map[#text:Toolkit description. -xhtml:http://www.w3.org/1999/xhtml em:Prove It!]]]';
		const result = extractText(input);
		expect(result).toContain('Frequency of use of the new space');
		expect(result).toContain('Toolkit description.');
		expect(result).toContain('Prove It!');
		expect(result).not.toContain('-xhtml');
		expect(result).not.toContain('http://www.w3.org');
	});

	it('handles the full abstract from the real dataset', () => {
		const input =
			"map[ol:map[-xhtml:http://www.w3.org/1999/xhtml li:[Frequency of use of the new space or facility Attractiveness of the neighbourhood Levels of community safety People's inclusion, involvement and trust in local decision-making processes map[#text:People's networks and contacts: ul:map[li:[for achieving change for feeling connected to a community in case of a need for help]]]]] p:[map[#text:Toolkit as simple to administer as possible we have chosen a Core List of the most powerful indicators of a project's impact on social capital and quality of life. For each indicator there are between one and three simple questions to be asked of project participants and members of non-project-participating members of the wider community. -xhtml:http://www.w3.org/1999/xhtml em:Prove It!] map[#text:This core list of suggested indicators relates to the potential effects of a project on: -xhtml:http://www.w3.org/1999/xhtml] map[#text:To these, you, as project manager, may add further indicators that will be specific to your project. -xhtml:http://www.w3.org/1999/xhtml] map[#text:The current wording and layout of the questions represents how a simple social capital survey could be conducted. -xhtml:http://www.w3.org/1999/xhtml]]]";
		const result = extractText(input);
		expect(result).toContain('Frequency of use of the new space or facility');
		expect(result).toContain("People's networks and contacts:");
		expect(result).toContain('for achieving change');
		expect(result).toContain('Prove It!');
		expect(result).toContain('This core list of suggested indicators');
		expect(result).not.toContain('map[');
		expect(result).not.toContain('-xhtml');
		expect(result).not.toContain('http://www.w3.org');
	});

	it('handles JS objects (not just strings)', () => {
		expect(extractText({ '#text': 'hello' })).toBe('hello');
		expect(extractText([1, 'two', 3])).toBe('1 two 3');
	});

	it('strips XHTML tags from namespaced markup', () => {
		const input = '<xhtml:p xmlns:xhtml="http://www.w3.org/1999/xhtml">Hello world</xhtml:p>';
		expect(extractText(input)).toBe('Hello world');
	});

	it('strips XHTML with emphasis and nested lists', () => {
		const input =
			'<xhtml:p xmlns:xhtml="http://www.w3.org/1999/xhtml"> To make the survey in the <xhtml:em>Prove It!</xhtml:em> Toolkit as simple to administer as possible.</xhtml:p>';
		const result = extractText(input);
		expect(result).toContain('Prove It!');
		expect(result).toContain('Toolkit as simple');
		expect(result).not.toContain('<xhtml:');
		expect(result).not.toContain('xmlns');
	});

	it('strips complex XHTML with ordered lists', () => {
		const input =
			'<xhtml:ol xmlns:xhtml="http://www.w3.org/1999/xhtml"><xhtml:li>First item</xhtml:li><xhtml:li>Second item</xhtml:li></xhtml:ol>';
		const result = extractText(input);
		expect(result).toContain('First item');
		expect(result).toContain('Second item');
		expect(result).not.toContain('<');
	});

	it('strips plain HTML tags too', () => {
		const input = '<p>Simple <em>paragraph</em> with <strong>formatting</strong>.</p>';
		expect(extractText(input)).toBe('Simple paragraph with formatting .');
	});
});

describe('extractUri', () => {
	it('extracts -URI from Go map string', () => {
		const input =
			'map[#text:Source questionnaire. -URI:https://www.nefconsulting.com/downloads/]';
		expect(extractUri(input)).toBe('https://www.nefconsulting.com/downloads/');
	});

	it('returns plain URL strings as-is', () => {
		expect(extractUri('https://example.com')).toBe('https://example.com');
	});

	it('returns empty string when no -URI key exists', () => {
		expect(extractUri('map[#text:no uri here]')).toBe('');
	});

	it('returns empty for null/undefined', () => {
		expect(extractUri(null)).toBe('');
		expect(extractUri(undefined)).toBe('');
	});

	it('extracts URI from a parsed JS object', () => {
		expect(extractUri({ '#text': 'desc', '-URI': 'https://example.com' })).toBe(
			'https://example.com'
		);
	});
});
