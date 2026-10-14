import { test, expect } from '@playwright/test';

test.describe('side B: fidelity /fidelity/', () => {
  test('sets every player out on the desk without an error', async ({ page }) => {
    test.setTimeout(120_000);
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(e.message));
    page.on('console', (m) => { if (/could not load/.test(m.text())) problems.push(m.text()); });
    await page.goto('/fidelity/');
    await expect(page.getByRole('heading', { level: 1, name: 'fidelity' })).toBeVisible();
    await expect(page.locator('.stop')).toHaveCount(19);
    await expect(page.locator('.loading')).toHaveClass(/is-done/, { timeout: 90_000 });
    expect(problems).toEqual([]);
    await expect(page.getByRole('navigation', { name: 'fidelity' }).getByRole('link', { name: '← side B' })).toHaveAttribute('href', '/?side=b');
  });

  test('is on side B of the home page', async ({ page }) => {
    await page.goto('/?side=b');
    await expect(page.getByRole('navigation', { name: 'Side B' }).getByRole('link', { name: 'fidelity' })).toHaveAttribute('href', '/fidelity/');
  });
});
