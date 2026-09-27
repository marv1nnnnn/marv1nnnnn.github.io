import { test, expect } from '@playwright/test';

test.describe('sections', () => {
  test('/make lists writing, tools, talks and shows', async ({ page }) => {
    await page.goto('/make');
    await expect(page.getByRole('heading', { level: 1, name: 'make' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /writing/i })).toBeVisible();
    await expect(page.locator('.essays a').first()).toHaveAttribute('href', /^\/think\//);
    await expect(page.getByRole('heading', { name: /tools and talks/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /noise/i })).toBeVisible();
    await expect(page.locator('.rows .row').first()).toBeVisible();
    await expect(page.locator('.year-label').first()).toBeVisible();
  });

  test('essay pages count as make in the navigation', async ({ page }) => {
    await page.goto('/think/harness-engineering');
    await expect(page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'make' })).toHaveAttribute('aria-current', 'page');
  });

  test('/input shows the canon and points to the log', async ({ page }) => {
    await page.goto('/input');
    await expect(page.locator('ol.canon > li')).toHaveCount(14);
    await expect(page.locator('.reel-item')).toHaveCount(14);
    await expect(page.locator('.reel-head .reel-count')).toHaveText('01 / 14');
    await expect(page.locator('a.to-log')).toHaveAttribute('href', '/log');
  });

  test('/log filters entries by kind', async ({ page }) => {
    await page.goto('/log');
    await expect(page.getByRole('heading', { level: 1, name: 'log' })).toBeVisible();
    const rows = page.locator('.rows .row');
    const all = await rows.count();
    expect(all).toBeGreaterThan(50);
    await page.getByRole('button', { name: /^heard/ }).click();
    await expect(page.getByRole('button', { name: /^heard/ })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => rows.count()).toBeLessThan(all);
    await expect(page.locator('.rows .row .kind').filter({ hasNotText: 'heard' })).toHaveCount(0);
  });

  test('/about shows the current role and contact details', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText(/product manager/i).first()).toBeVisible();
    await expect(page.getByText('marvin1996325@gmail.com')).toBeVisible();
  });

  test('navigating between sections keeps the same canvas', async ({ page }) => {
    await page.goto('/');
    await page.locator('canvas.tape-canvas').evaluate((c) => c.setAttribute('data-probe', 'kept'));
    await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'make' }).click();
    await expect(page).toHaveURL(/\/make$/);
    await expect(page.locator('canvas.tape-canvas')).toHaveAttribute('data-probe', 'kept');
  });
});

test.describe('old URLs', () => {
  const moved: Array<[string, RegExp]> = [
    ['/signals/projects', /\/make$/],
    ['/signals/journal/harness-engineering', /\/think\/harness-engineering$/],
    ['/signals/influences', /\/input$/],
    ['/signals/listening', /\/log$/],
    ['/think', /\/make#writing$/],
    ['/shows', /\/make#noise$/],
  ];
  for (const [from, to] of moved) {
    test(`${from} redirects`, async ({ page }) => {
      await page.goto(from);
      await expect(page).toHaveURL(to);
    });
  }
});
