import { test, expect } from '@playwright/test';

test.describe('home /', () => {
  test('is a five-entry directory over the bruise field, with no personal copy', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Directory' });
    for (const label of ['ABOUT', 'PROJECTS', 'JOURNAL', 'LISTENING', 'INFLUENCES']) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    // pure visual entry: the bruise is decorative, never a WebGL canvas
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('svg.bruise')).toHaveCount(1);
    // one screen, no scroll sequence
    expect(await page.evaluate(() => document.documentElement.scrollHeight))
      .toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight) + 1);
  });

  test('entering a signal floods, then navigates', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'ABOUT', exact: true }).click();
    await expect(page).toHaveURL(/\/signals\/about\/?$/);
  });

  test('the stain never animates on idle', async ({ page, isMobile }) => {
    test.skip(isMobile, 'pointer soak is desktop-only');
    await page.goto('/');
    const blot = page.locator('.bruise__blot');
    const before = await blot.evaluate((n) => getComputedStyle(n).transform);
    await page.waitForTimeout(900);
    expect(await blot.evaluate((n) => getComputedStyle(n).transform)).toBe(before);
  });
});
