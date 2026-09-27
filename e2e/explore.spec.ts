import { test, expect } from '@playwright/test';
import { mockBackend, fixtures } from './backend';

test.beforeEach(async ({ page }) => {
	await mockBackend(page);
});

test('lists all questions in German by default', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('lang', 'de');
	await expect(page.locator('.count')).toContainText('24 Fragen');
	await expect(page).toHaveTitle('Fragen durchsuchen | QWAC');
});

test('search, filter and page survive opening a question and going back (#23)', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('combobox', { name: 'Art' }).selectOption('Impact');
	await expect(page).toHaveURL(/topic=Impact/);
	await expect(page.locator('.count')).toContainText('23 Fragen');

	await page.getByRole('button', { name: 'Nächste Seite' }).click();
	await expect(page).toHaveURL(/page=2/);
	await expect(page.getByText('Seite 2 von 2')).toBeVisible();

	await page.locator('.detail-link').first().click();
	await expect(page).toHaveURL(/\/questions\//);
	await page.goBack();

	await expect(page).toHaveURL(/topic=Impact.*page=2|page=2.*topic=Impact/);
	await expect(page.getByRole('combobox', { name: 'Art' })).toHaveValue('Impact');
	await expect(page.getByText('Seite 2 von 2')).toBeVisible();
});

test('a shared URL shows the same view', async ({ page }) => {
	await page.goto('/?q=Geschlecht&type=select_multiple');
	await expect(page.getByRole('searchbox')).toHaveValue('Geschlecht');
	await expect(page.getByRole('combobox', { name: 'Antworttyp' })).toHaveValue('select_multiple');
	await expect(page.locator('.count')).toContainText('1 Frage');
	await expect(page.getByText(fixtures.gender.question.question_text as string)).toBeVisible();
});

test('the search box updates the URL', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('searchbox').fill('Age');
	await expect(page).toHaveURL(/q=Age/);
	await expect(page.locator('.count')).toContainText('1 Frage');
	await page.getByRole('button', { name: 'Zurücksetzen' }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.locator('.count')).toContainText('24 Fragen');
});

test('the language switch translates the UI and question texts, and is remembered', async ({
	page
}) => {
	await page.goto('/?q=Geschlecht');
	await expect(page.getByText('Was ist Ihr Geschlecht?')).toBeVisible();

	await page.getByRole('button', { name: 'EN', exact: true }).click();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.getByText('What is your gender?')).toBeVisible();

	await page.reload();
	await expect(page.getByRole('searchbox')).toHaveAttribute('placeholder', 'Search questions...');
});

test('a backend outage shows the error page, and "Try again" recovers', async ({ page }) => {
	await page.unrouteAll();
	await mockBackend(page, { down: true });
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Etwas ist schiefgelaufen' })).toBeVisible();

	await page.unrouteAll();
	await mockBackend(page);
	await page.getByRole('button', { name: 'Erneut versuchen' }).click();
	await expect(page.locator('.count')).toContainText('24 Fragen');
});
