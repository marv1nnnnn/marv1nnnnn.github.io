import { test, expect } from '@playwright/test';

test.describe('side B: 复读 /repeat/', () => {
  test('sets every player out on the desk without an error', async ({ page }) => {
    test.setTimeout(120_000);
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(e.message));
    page.on('console', (m) => { if (/could not load/.test(m.text())) problems.push(m.text()); });
    await page.goto('/repeat/');
    await expect(page.getByRole('heading', { level: 1, name: '复读' })).toBeVisible();
    await expect(page.locator('.stop')).toHaveCount(9);
    await expect(page.locator('.loading')).toHaveClass(/is-done/, { timeout: 90_000 });
    expect(problems).toEqual([]);
    await expect(page.getByRole('link', { name: '← B 面' })).toHaveAttribute('href', '/?side=b');
  });

  test('the second line of the iPod comes in once its stop is scrolled through', async ({ page }) => {
    await page.goto('/repeat/');
    const later = page.locator('#ipod .later').first();
    await expect(later).not.toHaveClass(/is-on/);
    await page.evaluate(() => {
      const r = document.querySelector('#ipod')!.getBoundingClientRect();
      scrollTo(0, r.top + scrollY + r.height * 0.75 - innerHeight / 2);
    });
    await expect(later).toHaveClass(/is-on/);
  });

  test('is on side B of the home page', async ({ page }) => {
    await page.goto('/?side=b');
    await expect(page.getByRole('navigation', { name: 'Side B' }).getByRole('link', { name: '复读' })).toHaveAttribute('href', '/repeat/');
  });
});
