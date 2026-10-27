import { describe, it, expect } from 'vitest';
import { ccLicense } from './license';

describe('ccLicense', () => {
	it('maps the SPDX IDs of the bank to name, deed and official button', () => {
		expect(ccLicense('CC-BY-NC-ND-4.0')).toEqual({
			name: 'CC BY-NC-ND 4.0',
			deed: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
			button: '/licenses/by-nc-nd.svg',
			shareAlike: false
		});
		for (const id of ['CC-BY-4.0', 'CC-BY-SA-4.0', 'CC-BY-NC-4.0', 'CC-BY-NC-SA-4.0']) {
			expect(ccLicense(id)?.name).toBe(id.replace(/^CC-(.+)-4\.0$/, 'CC $1 4.0'));
		}
	});

	it('marks share-alike licenses', () => {
		expect(ccLicense('CC-BY-SA-4.0')?.shareAlike).toBe(true);
		expect(ccLicense('CC-BY-NC-SA-4.0')?.shareAlike).toBe(true);
		expect(ccLicense('CC-BY-4.0')?.shareAlike).toBe(false);
	});

	it('has no button for other or missing licenses', () => {
		for (const id of [undefined, '', 'CC-BY-3.0', 'CC0-1.0', 'MIT', 'CC-BY-ND-4.0x']) {
			expect(ccLicense(id), String(id)).toBeNull();
		}
	});
});
