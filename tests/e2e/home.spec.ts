import { test, expect } from '@playwright/test';

test.describe('home /', () => {
  test('shows the tape, the intro and the site navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas.tape-canvas')).toBeVisible();
    await expect(page.getByText('Product manager at YouWare.')).toBeVisible();
    for (const name of ['make', 'think', 'input', 'about']) {
      await expect(page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /new tape/ })).toBeVisible();
  });

  test('switching tape colour updates the page tokens and is remembered', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'lain' }).click();
    await expect(page.getByRole('button', { name: 'lain' })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--accent-rgb'))).toBe('226, 35, 48');
    await page.reload();
    await expect(page.getByRole('button', { name: 'lain' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('the home page does not scroll sideways on phones', async ({ page }) => {
    await page.goto('/');
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
});
