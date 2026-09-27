import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockBackend, fixtures, PASSWORD } from './backend';

const pages: Record<string, string> = {
	explore: '/',
	grid: `/questions/${fixtures.grid.question.id}/`,
	choice: `/questions/${fixtures.gender.question.id}/`,
	study: '/studies/study0000000001/',
	upload: '/upload/',
	about: '/about/',
	login: '/login/',
	imprint: '/imprint/',
	'not found': '/questions/aaaaaaaaaaaaaaa/'
};

for (const [name, path] of Object.entries(pages)) {
	test(`${name} page has no new axe violations`, async ({ page }) => {
		await mockBackend(page);
		await page.goto(path);
		await page.waitForLoadState('networkidle');
		const { violations } = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();
		expect(
			violations.map((v) => ({ rule: v.id, impact: v.impact, first: v.nodes[0]?.target }))
		).toEqual([]);
	});
}

test('upload page, signed in, has no axe violations', async ({ page }) => {
	await mockBackend(page);
	await page.goto('/upload/');
	await page.getByLabel('E-Mail / Benutzername').fill('tester@example.org');
	await page.getByLabel('Passwort').fill(PASSWORD);
	await page.getByRole('button', { name: 'Anmelden' }).last().click();
	await expect(page.getByRole('heading', { name: 'DDI Codebook hochladen' })).toBeVisible();
	const { violations } = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.analyze();
	expect(violations.map((v) => v.id)).toEqual([]);
});
