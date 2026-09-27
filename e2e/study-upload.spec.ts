import { test, expect, type Page } from '@playwright/test';
import { mockBackend, PASSWORD } from './backend';

const STUDY = '/studies/study0000000001/';

test('the study DDI export downloads a file (#18)', async ({ page }) => {
	await mockBackend(page);
	await page.goto(STUDY);
	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'DDI XML exportieren' }).click()
	]);
	expect(download.suggestedFilename()).toBe('Community Survey.xml');
});

test('a failing export shows a message (#18)', async ({ page }) => {
	await mockBackend(page, { fail: { '/api/studies/study0000000001/export': 502 } });
	await page.goto(STUDY);
	await page.getByRole('button', { name: 'DDI XML exportieren' }).click();
	await expect(page.getByRole('alert')).toHaveText(/Export ist fehlgeschlagen/);
});

async function signIn(page: Page) {
	await page.goto('/upload/');
	await page.getByLabel('E-Mail / Benutzername').fill('tester@example.org');
	await page.getByLabel('Passwort').fill(PASSWORD);
	await page.getByRole('button', { name: 'Anmelden' }).last().click();
	await expect(page.getByRole('heading', { name: 'DDI Codebook hochladen' })).toBeVisible();
}

test('signing in with a wrong password fails', async ({ page }) => {
	await mockBackend(page);
	await page.goto('/upload/');
	await page.getByLabel('E-Mail / Benutzername').fill('tester@example.org');
	await page.getByLabel('Passwort').fill('wrong');
	await page.getByRole('button', { name: 'Anmelden' }).last().click();
	await expect(page.getByText(/Ungültige E-Mail oder Passwort/)).toBeVisible();
});

test('uploading a valid and an invalid codebook', async ({ page }) => {
	await mockBackend(page);
	await signIn(page);

	const chooser = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'Datei auswählen' }).click();
	await (
		await chooser
	).setFiles({
		name: 'valid.xml',
		mimeType: 'application/xml',
		buffer: Buffer.from('<codeBook/>')
	});
	await page.getByRole('button', { name: 'Codebook importieren' }).click();
	await expect(page.getByText('Import erfolgreich')).toBeVisible();

	await page.getByRole('button', { name: 'Weitere Datei hochladen' }).click();
	const chooser2 = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'Datei auswählen' }).click();
	await (
		await chooser2
	).setFiles({
		name: 'invalid.xml',
		mimeType: 'application/xml',
		buffer: Buffer.from('<notDdi/>')
	});
	await page.getByRole('button', { name: 'Codebook importieren' }).click();
	await expect(page.getByText('Import fehlgeschlagen')).toBeVisible();
	await expect(page.getByText('Root element must be codeBook')).toBeVisible();
});

test('the file picker can be opened with the keyboard (#20)', async ({ page }) => {
	await mockBackend(page);
	await signIn(page);
	const button = page.getByRole('button', { name: 'Datei auswählen' });
	for (let i = 0; i < 30 && !(await button.evaluate((b) => b === document.activeElement)); i++) {
		await page.keyboard.press('Tab');
	}
	await expect(button).toBeFocused();
	const chooser = page.waitForEvent('filechooser');
	await page.keyboard.press('Enter');
	expect(await chooser).toBeTruthy();
});

test('a stored login survives a backend outage on startup (#17)', async ({ page }) => {
	await mockBackend(page);
	await signIn(page);
	await page.unrouteAll();
	await mockBackend(page, { down: true });
	await page.reload();
	await expect(page.getByText('tester@example.org')).toBeVisible();
});
