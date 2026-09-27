import { describe, it, expect, vi } from 'vitest';
import { afterEach } from 'vitest';
import { CDL_CONTENT_REF, cdlContent, loadCdlContent, sanitizeSnippet } from './cdl-content';

describe('sanitizeSnippet', () => {
	it('drops event handlers, scripts, styles and images', () => {
		const html = sanitizeSnippet(
			'<p onclick="x()">Hi<img src=x onerror=alert(1)><script>alert(2)</script><style>p{}</style></p>'
		);
		expect(html).toBe('<p>Hi</p>');
	});

	it('keeps headings, text and https links', () => {
		expect(
			sanitizeSnippet(
				'<section><h2>Über</h2><p><a href="https://civic-data.de" target="_blank">CDL</a></p></section>'
			)
		).toBe(
			'<section><h2>Über</h2><p><a href="https://civic-data.de" target="_blank" rel="noopener noreferrer">CDL</a></p></section>'
		);
	});

	it('drops javascript: links', () => {
		expect(sanitizeSnippet('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
	});
});

describe('loadCdlContent', () => {
	it('fetches every snippet at the pinned commit and sanitises it', async () => {
		const fetchImpl = vi.fn(async () => new Response('<p>ok<img src=x onerror=alert(1)></p>'));
		const { content, missing } = await loadCdlContent(fetchImpl as unknown as typeof fetch);
		expect(missing).toEqual([]);
		expect(content).toEqual({
			qwac: { en: '<p>ok</p>', de: '<p>ok</p>' },
			liability: { en: '<p>ok</p>', de: '<p>ok</p>' }
		});
		for (const [url] of fetchImpl.mock.calls) expect(url).toContain(`/${CDL_CONTENT_REF}/`);
	});

	it('reports snippets that failed or came back empty', async () => {
		const fetchImpl = vi.fn(async (url: string | URL | Request) =>
			String(url).includes('liability/de') ? new Response('', { status: 404 }) : new Response('  ')
		);
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { missing } = await loadCdlContent(fetchImpl as unknown as typeof fetch);
		expect(missing.sort()).toEqual([
			'liability/de.html',
			'liability/en.html',
			'qwac/de.html',
			'qwac/en.html'
		]);
	});
});

describe('cdlContent plugin', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	async function build() {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('', { status: 503 }))
		);
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const context = { error: vi.fn(), warn: vi.fn() };
		const plugin = cdlContent();
		await (plugin.buildStart as (this: unknown) => Promise<void>).call(context);
		return context;
	}

	it('fails the build in CI when snippets are missing', async () => {
		vi.stubEnv('CI', 'true');
		const { error } = await build();
		expect(error).toHaveBeenCalledWith(expect.stringContaining('liability/de.html'));
	});

	it('only warns outside CI', async () => {
		vi.stubEnv('CI', '');
		const { error, warn } = await build();
		expect(error).not.toHaveBeenCalled();
		expect(warn).toHaveBeenCalledOnce();
	});
});
