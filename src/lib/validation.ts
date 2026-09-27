import { z } from 'zod';

/** PocketBase record IDs are exactly 15 alphanumeric characters. */
export const pbIdSchema = z.string().regex(/^[a-zA-Z0-9]{15}$/, 'Invalid record ID');
