import { describe, it, expect, vi } from 'vitest';
import { isHttpError } from '@sveltejs/kit';

vi.mock('$lib/pocketbase', () => ({ clearOnAuthError: vi.fn() }));

const { failLoad, recordId } = await import('./load');

function statusOfThrown(fn: () => unknown): number | undefined {
	try {
		fn();
	} catch (e) {
		return isHttpError(e) ? e.status : undefined;
	}
	return undefined;
}

describe('failLoad', () => {
	it('maps a backend 404 or 400 to 404', () => {
		expect(statusOfThrown(() => failLoad({ status: 404, message: 'Question not found' }))).toBe(
			404
		);
		expect(statusOfThrown(() => failLoad({ status: 400, message: 'Invalid ID format' }))).toBe(404);
	});

	it('maps network errors and server errors to 503', () => {
		expect(statusOfThrown(() => failLoad(new TypeError('Failed to fetch')))).toBe(503);
		expect(statusOfThrown(() => failLoad({ status: 500 }))).toBe(503);
		expect(statusOfThrown(() => failLoad({ status: 0 }))).toBe(503);
	});
});

describe('recordId', () => {
	it('accepts a PocketBase ID', () => {
		expect(recordId('z4bm7lrn7mopedd')).toBe('z4bm7lrn7mopedd');
	});

	it('throws a 404 for anything else', () => {
		expect(statusOfThrown(() => recordId('notanid00000000x'))).toBe(404);
		expect(statusOfThrown(() => recordId('../etc/passwd'))).toBe(404);
		expect(statusOfThrown(() => recordId(undefined))).toBe(404);
	});
});
