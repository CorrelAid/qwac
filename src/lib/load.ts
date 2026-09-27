import { error, isHttpError, isRedirect } from '@sveltejs/kit';
import { clearOnAuthError } from '$lib/pocketbase';
import { pbIdSchema } from '$lib/validation';

function statusOf(e: unknown): number | undefined {
	if (e && typeof e === 'object' && 'status' in e && typeof e.status === 'number') {
		return e.status;
	}
	return undefined;
}

/**
 * Turns a failed backend call inside a load function into SvelteKit's error
 * page: 404 when the backend doesn't know the record (or rejects its ID),
 * 503 for everything else (backend down, network error, server error).
 */
export function failLoad(e: unknown): never {
	if (isHttpError(e) || isRedirect(e)) throw e;
	clearOnAuthError(e);
	const status = statusOf(e);
	if (status === 404 || status === 400) error(404, 'Not found');
	error(503, 'The backend is unavailable');
}

/** Returns the route's record ID, or shows the 404 page for anything that can't be one. */
export function recordId(raw: string | undefined): string {
	const parsed = pbIdSchema.safeParse(raw);
	if (!parsed.success) error(404, 'Not found');
	return parsed.data;
}
