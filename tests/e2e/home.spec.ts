import { test, expect } from '@playwright/test';

test.describe('home /', () => {
  test('starts with the randomizer, then reveals the minimal shell', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'marv1nnnnn' })).toBeVisible();
    const change = page.getByRole('button', { name: 'CHANGE' });
    await expect(change).toBeVisible();
    const beforeScroll = await change.boundingBox();
    await page.evaluate(() => window.scrollTo(0, 80));
    await expect(page.getByRole('link', { name: 'MARV1NNNNN' })).toBeVisible();
    expect(await change.boundingBox()).toEqual(beforeScroll);
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

  test('mobile nav stays usable with an optional low-power WebGPU field', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only navigation');
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible();
    const navText = (await nav.innerText()).toLowerCase();
    for (const label of ['about', 'projects', 'influences', 'media', 'journal']) {
      expect(navText, `mobile nav missing "${label}"`).toContain(label);
    }
    const canvas = page.locator('.machine-ghost canvas');
    expect(await canvas.count()).toBeLessThanOrEqual(1);
    if (await canvas.count()) {
      await expect(page.locator('.machine-ghost')).toHaveAttribute('data-renderer', 'webgpu');
      expect(await canvas.evaluate((node) => node.width)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth + 1));
    }

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
