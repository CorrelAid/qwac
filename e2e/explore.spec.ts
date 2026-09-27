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
	await page.getByRole('combobox', { name: 'Thema' }).selectOption('Impact');
	await expect(page).toHaveURL(/topic=Impact/);
	await expect(page.locator('.count')).toContainText('23 Fragen');

	await page.getByRole('button', { name: 'Nächste Seite' }).click();
	await expect(page).toHaveURL(/page=2/);
	await expect(page.getByText('Seite 2 von 2')).toBeVisible();

	await page.locator('.question-card .title a').first().click();
	await expect(page).toHaveURL(/\/questions\//);
	await page.goBack();

	await expect(page).toHaveURL(/topic=Impact.*page=2|page=2.*topic=Impact/);
	await expect(page.getByRole('combobox', { name: 'Thema' })).toHaveValue('Impact');
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

test('question cards look the same on the explore and study pages (#30)', async ({ page }) => {
	const card = async () => {
		const c = page.locator('.question-card', { hasText: 'How old are you?' });
		return {
			title: await c.locator('.title').innerText(),
			tag: await c.locator('.type-tag').innerText()
		};
	};
	await page.goto('/?q=Age');
	const onExplore = await card();
	await page.goto('/studies/study0000000001/');
	expect(await card()).toEqual(onExplore);
});

test('the paginator shows the range and scrolls to the results (#30)', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('.range')).toHaveText('1–20 von 24');
	await page.mouse.wheel(0, 5000);
	await page.getByRole('button', { name: 'Nächste Seite' }).click();
	await expect(page.locator('.range')).toHaveText('21–24 von 24');
	await expect(page.locator('#results')).toBeInViewport();
});

test('the explore page says QWAC is for online surveys for now (#8)', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText(/vorerst für Online-Umfragen/)).toBeVisible();
});
