import { test, expect } from '@playwright/test';

test.describe('home /', () => {
  test('starts name-only, then reveals the minimal shell', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'marv1nnnnn' })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 80));
    await expect(page.getByRole('link', { name: 'MARV1NNNNN' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'INDEX' })).toHaveCount(0);
  });

  test('pointer movement and clicks reshape the title', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop interaction');
    await page.goto('/');
    const glyph = page.locator('.home-machine__hero h1 span').first();
    await page.mouse.move(100, 120);
    await expect.poll(() => glyph.evaluate((node) => getComputedStyle(node).translate)).not.toBe('none');
    await page.mouse.down();
    await expect.poll(() => glyph.evaluate((node) => getComputedStyle(node).animationName)).toContain('ghost-type');
    await page.mouse.up();
  });

  test('mobile nav lists all top-level signals and navigates without WebGL', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only navigation');
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible();
    const navText = (await nav.innerText()).toLowerCase();
    for (const label of ['about', 'projects', 'influences', 'media', 'journal']) {
      expect(navText, `mobile nav missing "${label}"`).toContain(label);
    }
    await expect(page.locator('canvas')).toHaveCount(0);

    await nav.getByRole('link', { name: /About/i }).click();
    await expect(page).toHaveURL(/\/signals\/about\/?$/);
  });

  test('desktop provides an assembly scroll sequence', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only');
    await page.goto('/');
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const innerHeight = await page.evaluate(() => window.innerHeight);
    expect(scrollHeight).toBeGreaterThan(innerHeight * 2);
  });
});
