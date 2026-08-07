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
    await expect(page.locator('.bruise')).toHaveCount(1);
    // one screen, no scroll sequence
    expect(await page.evaluate(() => document.documentElement.scrollHeight))
      .toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight) + 1);
  });

  test('entering a signal floods, then navigates', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'ABOUT', exact: true }).click();
    await expect(page).toHaveURL(/\/signals\/about\/?$/);
  });

  test('three layers drift at different speeds so the stain keeps changing', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.bruise__layer')).toHaveCount(3);
    const read = () => page.locator('.bruise__layer').first().evaluate((n) => getComputedStyle(n).transform);
    const before = await read();
    await page.waitForTimeout(1200);
    expect(await read()).not.toBe(before);
  });

  test('hovering a word bruises it and dims the rest', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hover is desktop-only');
    await page.goto('/');
    const word = page.getByRole('link', { name: 'JOURNAL', exact: true });
    await word.hover();
    expect(await word.evaluate((n) => getComputedStyle(n).filter)).toContain('bleed');
    const other = page.getByRole('link', { name: 'ABOUT', exact: true });
    expect(Number(await other.evaluate((n) => getComputedStyle(n).opacity))).toBeLessThan(0.5);
  });
});
