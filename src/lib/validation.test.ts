import { describe, it, expect } from 'vitest';
import { pbIdSchema } from './validation';

describe('pbIdSchema', () => {
	it('accepts 15 alphanumeric characters', () => {
		expect(pbIdSchema.safeParse('z4bm7lrn7mopedd').success).toBe(true);
	});

	it('rejects anything else', () => {
		for (const id of [
			'',
			'short',
			'z4bm7lrn7mopedd1',
			'z4bm7lrn7moped!',
			'../../etc/passw',
			' z4bm7lrn7moped'
		]) {
			expect(pbIdSchema.safeParse(id).success, id).toBe(false);
		}
	});
});
