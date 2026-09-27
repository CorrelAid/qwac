import { describe, it, expect, vi, afterEach } from 'vitest';
import { ClientResponseError } from 'pocketbase';
import { AUTH_COLLECTION, client, verifyStoredAuth } from './index';

// A syntactically valid JWT that expires far in the future, so isValid is true.
const TOKEN = `x.${btoa(JSON.stringify({ exp: 4102444800 }))}.y`;

function refreshFailsWith(status: number) {
	const users = client.collection(AUTH_COLLECTION);
	vi.spyOn(users, 'authRefresh').mockRejectedValue(
		new ClientResponseError({ status, response: {} })
	);
}

afterEach(() => {
	vi.restoreAllMocks();
	client.authStore.clear();
});

describe('verifyStoredAuth', () => {
	it.each([0, 500, 502, 503])(
		'keeps the user logged in when the refresh fails with %i',
		async (status) => {
			client.authStore.save(TOKEN, null);
			refreshFailsWith(status);
			await verifyStoredAuth();
			expect(client.authStore.isValid).toBe(true);
		}
	);

	it.each([401, 403, 404])(
		'logs out when the backend rejects the token with %i',
		async (status) => {
			client.authStore.save(TOKEN, null);
			refreshFailsWith(status);
			await verifyStoredAuth();
			expect(client.authStore.isValid).toBe(false);
		}
	);
});
