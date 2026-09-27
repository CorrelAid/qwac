import { test, expect } from '@playwright/test';
import { mockBackend, fixtures } from './backend';

test.beforeEach(async ({ page }) => {
	await mockBackend(page);
});

test('every link on a question page leads to a working page (#14)', async ({ page }) => {
	await page.goto(`/questions/${fixtures.grid.question.id}`);
	await expect(page.getByText('Local groups')).toBeVisible();

	const hrefs = await page
		.locator('main a[href], article a[href]')
		.evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!));
	expect(hrefs.length).toBeGreaterThan(0);
	for (const href of new Set(hrefs)) {
		await page.goto(href);
		await expect(
			page.getByRole('heading', { name: /nicht gefunden|schiefgelaufen/ }),
			href
		).toHaveCount(0);
	}
});

test('grid rows are plain text (#14)', async ({ page }) => {
	await page.goto(`/questions/${fixtures.grid.question.id}`);
	await expect(page.locator('.grid-table a')).toHaveCount(0);
	await expect(page.locator('.grid-table input[type=radio]')).toHaveCount(6);
});

test('moving from one question to another shows no stale data (#15)', async ({ page }) => {
	await page.goto(`/questions/${fixtures.grid.question.id}?tab=xlsform`);
	await expect(page.locator('.view-tab.active')).toHaveText('XLSForm');
	await expect(page.getByText('contact', { exact: true })).toBeVisible();

	// In-app: study page → another question of the same study.
	await page.getByRole('link', { name: 'Community Survey' }).click();
	await page.getByRole('link', { name: 'Age', exact: true }).click();

	await expect(page.getByText('How old are you?')).toBeVisible();
	await expect(page.locator('.view-tab.active')).toHaveText('Vorschau');
	await expect(page.getByText('Local groups')).toHaveCount(0);
	await page.getByRole('tab', { name: 'XLSForm' }).click();
	await expect(page.getByText('age', { exact: true })).toBeVisible();
	await expect(page.getByText('contact', { exact: true })).toHaveCount(0);
});

test('tabs can be linked to (#23)', async ({ page }) => {
	await page.goto(`/questions/${fixtures.age.question.id}`);
	await page.getByRole('tab', { name: 'DDI XML' }).click();
	await expect(page).toHaveURL(/\?tab=ddi$/);
	await page.reload();
	await expect(page.locator('.view-tab.active')).toHaveText('DDI XML');
});

test('a choice group shows its options, "Other" and tags', async ({ page }) => {
	await page.goto(`/questions/${fixtures.gender.question.id}`);
	await expect(page.getByText('Was ist Ihr Geschlecht?')).toBeVisible();
	await expect(page.locator('.tab-content input[type=checkbox]')).toHaveCount(3);
	await expect(page.getByText('eigene Angabe:')).toBeVisible();
	// German label from qwacback's catalogue (#59).
	await expect(page.getByText('Mehrfachauswahl mit „Sonstiges“')).toBeVisible();
	await expect(page.locator('.search-tag')).toHaveText('Gender');
});

test('unknown and invalid IDs show the 404 page (#22)', async ({ page }) => {
	for (const path of [
		'/questions/aaaaaaaaaaaaaaa',
		'/questions/not-an-id/',
		'/studies/aaaaaaaaaaaaaaa'
	]) {
		await page.goto(path);
		await expect(page.getByRole('heading', { name: 'Seite nicht gefunden' }), path).toBeVisible();
		await expect(page.getByRole('button', { name: 'Erneut versuchen' })).toHaveCount(0);
	}
});

test('the DDI XML can be downloaded (#30)', async ({ page }) => {
	await page.goto(`/questions/${fixtures.age.question.id}?tab=ddi`);
	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: '.xml herunterladen' }).click()
	]);
	expect(download.suggestedFilename()).toBe('Age.xml');
});

test('the preview shows the hint and the condition; XLSForm shows settings (#60)', async ({
	page
}) => {
	await page.goto(`/questions/${fixtures.age.question.id}`);
	await expect(page.getByText('In full years.')).toBeVisible();
	await expect(page.getByText('Only if “Do you live here?” is yes')).toBeVisible();
	await page.getByRole('tab', { name: 'XLSForm' }).click();
	await expect(page.getByText('settings', { exact: true })).toBeVisible();
	await expect(page.getByText('English (en)')).toBeVisible();
	await expect(page.getByText('no skip logic')).toHaveCount(0);
});
