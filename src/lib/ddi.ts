/**
 * Utilities for parsing Go fmt-serialized DDI XML data stored as strings in PocketBase.
 *
 * Go's fmt.Sprintf("%v", map) produces: map[#text:value -attr:value]
 * These get stored as raw strings in PocketBase fields and need parsing.
 */

const HTML_ELEMENTS = new Set([
	'a', 'b', 'i', 'p', 'q', 's', 'u', 'br', 'dd', 'dl', 'dt', 'em',
	'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'li', 'ol', 'td', 'th',
	'tr', 'ul', 'del', 'div', 'ins', 'pre', 'sub', 'sup', 'abbr', 'cite',
	'code', 'mark', 'samp', 'span', 'small', 'strong', 'table', 'tbody',
	'tfoot', 'thead', 'section', 'article', 'blockquote',
]);

const SKIP_KEYS = new Set(['-xhtml', '-xml:lang', '-xmlns']);

function isLikelyKey(candidate: string, afterColon: string): boolean {
	if (candidate.startsWith('#') || candidate.startsWith('-')) return true;
	if (afterColon.startsWith('map[') || afterColon.startsWith('[')) return true;
	return HTML_ELEMENTS.has(candidate.toLowerCase());
}

function findPlainValueEnd(str: string, pos: number): number {
	let i = pos;
	let depth = 0;
	while (i < str.length) {
		if (str[i] === '[') depth++;
		else if (str[i] === ']') {
			if (depth === 0) return i;
			depth--;
		} else if (depth === 0 && str[i] === ' ') {
			const rest = str.substring(i + 1);
			const m = rest.match(/^([^\s\[\]:]+):([\s\S]*)/);
			if (m && isLikelyKey(m[1], m[2])) return i;
		}
		i++;
	}
	return i;
}

function parseMap(str: string, pos: number): { value: Record<string, unknown>; end: number } {
	pos += 4; // skip 'map['
	const result: Record<string, unknown> = {};
	while (pos < str.length && str[pos] !== ']') {
		while (pos < str.length && str[pos] === ' ') pos++;
		if (pos >= str.length || str[pos] === ']') break;

		let cp = pos;
		while (cp < str.length && str[cp] !== ':') cp++;
		if (cp >= str.length) break;
		const key = str.slice(pos, cp);
		pos = cp + 1;

		if (str.startsWith('map[', pos)) {
			const r = parseMap(str, pos);
			result[key] = r.value;
			pos = r.end;
		} else if (str[pos] === '[') {
			const r = parseArray(str, pos);
			result[key] = r.value;
			pos = r.end;
		} else {
			const end = findPlainValueEnd(str, pos);
			result[key] = str.slice(pos, end);
			pos = end;
		}
		if (pos < str.length && str[pos] === ' ') pos++;
	}
	if (pos < str.length && str[pos] === ']') pos++;
	return { value: result, end: pos };
}

function parseArray(str: string, pos: number): { value: unknown[]; end: number } {
	pos++; // skip '['
	const items: unknown[] = [];
	let text = '';
	while (pos < str.length && str[pos] !== ']') {
		if (str.startsWith('map[', pos)) {
			if (text.trim()) {
				items.push(text.trim());
				text = '';
			}
			const r = parseMap(str, pos);
			items.push(r.value);
			pos = r.end;
		} else {
			text += str[pos];
			pos++;
		}
	}
	if (text.trim()) items.push(text.trim());
	if (pos < str.length && str[pos] === ']') pos++;
	return { value: items, end: pos };
}

/** Parse a Go fmt string representation into a JS value */
export function parseGoValue(input: string): unknown {
	const s = input.trim();
	if (s.startsWith('map[')) return parseMap(s, 0).value;
	if (s.startsWith('[')) return parseArray(s, 0).value;
	return s;
}

/** Strip XHTML/XML tags and return plain text */
function stripXhtml(s: string): string {
	return s
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Check if a string looks like it contains XML/XHTML markup */
function looksLikeXml(s: string): boolean {
	return /<\/?[\w:]+[\s>]/.test(s);
}

/** Recursively extract readable text from a Go map string, XHTML, or parsed object */
export function extractText(val: unknown): string {
	if (val == null) return '';
	if (typeof val === 'number' || typeof val === 'boolean') return String(val);
	if (typeof val === 'string') {
		const s = val.trim();
		if (s.startsWith('map[')) return extractText(parseGoValue(s));
		if (looksLikeXml(s)) return stripXhtml(s);
		return s;
	}
	if (Array.isArray(val)) return val.map(extractText).filter(Boolean).join(' ');
	if (typeof val === 'object') {
		const obj = val as Record<string, unknown>;
		const parts: string[] = [];
		for (const [key, v] of Object.entries(obj)) {
			if (SKIP_KEYS.has(key)) continue;
			if (key === '-URI' || key === '-affiliation') continue;
			parts.push(extractText(v));
		}
		return parts.filter(Boolean).join(' ');
	}
	return '';
}

/** Extract a URI from a Go map string containing a -URI key */
export function extractUri(val: unknown): string {
	if (typeof val === 'string') {
		const s = val.trim();
		if (s.startsWith('map[')) return extractUri(parseGoValue(s));
		return s;
	}
	if (val && typeof val === 'object' && !Array.isArray(val)) {
		const obj = val as Record<string, unknown>;
		if ('-URI' in obj) return String(obj['-URI']);
		if ('URI' in obj) return String(obj['URI']);
	}
	return '';
}
