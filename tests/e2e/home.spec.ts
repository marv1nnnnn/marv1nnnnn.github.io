import { test, expect } from '@playwright/test';

test.describe('home /', () => {
  test('renders kinetic header and index label', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'marv1nnnnn' })).toBeVisible();
    await expect(page.getByText('INDEX')).toBeVisible();
  });

  test('mobile nav lists all top-level signals and navigates', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only overlay');
    await page.goto('/');

    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
    // At least the known top-level signals should appear in the mobile nav text.
    const navText = (await nav.innerText()).toLowerCase();
    for (const label of ['about', 'projects', 'influences', 'journal', 'knowledge']) {
      expect(navText, `mobile nav missing "${label}"`).toContain(label);
    }

    await nav.getByRole('button', { name: /About/i }).click();
    await expect(page).toHaveURL(/\/signals\/about\/?$/);
  });

  test('desktop provides scroll spacer for staircase', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only');
    await page.goto('/');
    // Scrollable document (spacer is 300vh on md+)
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const innerHeight = await page.evaluate(() => window.innerHeight);
    expect(scrollHeight).toBeGreaterThan(innerHeight * 2);
  });
});
