import { test, expect } from '@playwright/test';

test.describe('sections', () => {
  test('/make lists tools, talks and shows', async ({ page }) => {
    await page.goto('/make');
    await expect(page.getByRole('heading', { level: 1, name: 'make' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /tools and talks/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /noise/i })).toBeVisible();
    await expect(page.locator('.rows .row').first()).toBeVisible();
    await expect(page.locator('.year-label').first()).toBeVisible();
  });

  test('/think links to each essay', async ({ page }) => {
    await page.goto('/think');
    const first = page.locator('.essays a').first();
    await expect(first).toHaveAttribute('href', /^\/think\//);
  });

  test('/input shows the canon and the log', async ({ page }) => {
    await page.goto('/input');
    await expect(page.locator('ol.canon > li')).toHaveCount(14);
    await expect(page.getByRole('heading', { name: /the log/i })).toBeVisible();
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
    ['/shows', /\/make#noise$/],
  ];
  for (const [from, to] of moved) {
    test(`${from} redirects`, async ({ page }) => {
      await page.goto(from);
      await expect(page).toHaveURL(to);
    });
  }
});
