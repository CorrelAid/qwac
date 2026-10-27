import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { locale } from '$lib/i18n';
import LicenseNotice from './LicenseNotice.svelte';

const tei = {
	license: 'CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).',
	license_id: 'CC-BY-SA-4.0',
	copyright: '© Ritzmann, Hagemann & Kluge (2020)',
	citation: 'Ritzmann, S., Hagemann, V. & Kluge, A. (2020). TEI.',
	source_uri: 'https://www.testarchiv.eu/de/test/9007914'
};

describe('LicenseNotice', () => {
	it('shows the official button linked to the deed, the terms and the citation', async () => {
		locale.set('de');
		await render(LicenseNotice, { attribution: tei });
		const button = page.getByRole('link', { name: 'CC BY-SA 4.0' });
		await expect
			.element(button)
			.toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/');
		await expect
			.element(page.getByRole('img', { name: 'CC BY-SA 4.0' }))
			.toHaveAttribute('src', expect.stringMatching(/\/licenses\/by-sa\.svg$/));
		await expect.element(page.getByText(tei.citation)).toBeInTheDocument();
		await expect.element(page.getByText(tei.copyright)).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: tei.source_uri })).toBeInTheDocument();
		await expect
			.element(page.getByText('unter derselben Lizenz weitergegeben'))
			.toBeInTheDocument();
	});

	it('says a missing license is not stated, with no button', async () => {
		locale.set('de');
		const { container } = await render(LicenseNotice, { attribution: { citation: 'Doe (2024)' } });
		await expect.element(page.getByText('Lizenz nicht angegeben')).toBeInTheDocument();
		expect(container.querySelector('img')).toBeNull();
	});

	it('shows other terms as written, with no button', async () => {
		const { container } = await render(LicenseNotice, {
			attribution: { license: '© Statistikamt Nord: Weitergabe mit Quellenangabe.' }
		});
		await expect
			.element(page.getByText('© Statistikamt Nord: Weitergabe mit Quellenangabe.'))
			.toBeInTheDocument();
		expect(container.querySelector('img')).toBeNull();
	});

	it('leaves out the source when asked', async () => {
		await render(LicenseNotice, { attribution: tei, source: false });
		await expect.element(page.getByRole('link', { name: tei.source_uri })).not.toBeInTheDocument();
	});

	it('gives a one-line credit for exports, without a button', async () => {
		locale.set('en');
		const { container } = await render(LicenseNotice, { attribution: tei, variant: 'credit' });
		await expect.element(page.getByText('When reusing, credit:')).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'CC BY-SA 4.0' })).toBeInTheDocument();
		await expect
			.element(page.getByText('Adapted versions must be shared under the same license.'))
			.toBeInTheDocument();
		expect(container.querySelector('img')).toBeNull();
		locale.set('de');
	});
});
