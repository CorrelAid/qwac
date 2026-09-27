import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockBackend, fixtures } from './backend';

const pages: Record<string, string> = {
	explore: '/',
	grid: `/questions/${fixtures.grid.question.id}/`,
	choice: `/questions/${fixtures.gender.question.id}/`,
	study: '/studies/study0000000001/',
	upload: '/upload/',
	about: '/about/',
	'not found': '/questions/aaaaaaaaaaaaaaa/'
};

/**
 * Violations that exist today, per page. #29 fixes them and empties this
 * list; anything not listed fails the test.
 */
const KNOWN: Record<string, string[]> = {
	explore: ['color-contrast'],
	grid: ['color-contrast', 'label'],
	choice: ['color-contrast'],
	study: ['color-contrast']
};

for (const [name, path] of Object.entries(pages)) {
	test(`${name} page has no new axe violations`, async ({ page }) => {
		await mockBackend(page);
		await page.goto(path);
		await page.waitForLoadState('networkidle');
		const { violations } = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.disableRules(KNOWN[name] ?? [])
			.analyze();
		expect(
			violations.map((v) => ({ rule: v.id, impact: v.impact, first: v.nodes[0]?.target }))
		).toEqual([]);
	});
}
