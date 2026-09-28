import { test, expect } from '@playwright/test';

test.describe('home /', () => {
  test('shows the tape, the intro and the site navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas.tape-canvas')).toBeVisible();
    await expect(page.getByText('Product manager at YouWare.')).toBeVisible();
    for (const name of ['make', 'input', 'log', 'about']) {
      await expect(page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /new tape/ })).toBeVisible();
  });

  test('new tape switches to a different palette and the choice carries to other pages', async ({ page }) => {
    await page.goto('/');
    const accent = () => page.evaluate(() => document.documentElement.style.getPropertyValue('--accent-rgb'));
    await expect.poll(accent).not.toBe('');
    const before = await accent();
    await page.getByRole('button', { name: /new tape/ }).click();
    await expect.poll(accent).not.toBe(before);
    const chosen = await accent();
    await page.goto('/make');
    await expect.poll(accent).toBe(chosen);
  });

  test('sound stays off until asked for, then plays the Strudel pattern', async ({ page, isMobile }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Sound' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true', { timeout: 30_000 });
    // The pattern view is a desktop extra; phones only get the toggle.
    if (!isMobile) {
      await page.getByRole('button', { name: 'Show the pattern' }).click();
      await expect(page.getByLabel('The Strudel pattern playing now')).toContainText('stack(');
    }
    await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'make' }).click();
    await expect(page).toHaveURL(/\/make$/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('the home page does not scroll sideways on phones', async ({ page }) => {
    await page.goto('/');
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
});
