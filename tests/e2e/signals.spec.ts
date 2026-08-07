import { test, expect } from '@playwright/test';

const topLevelSignals = ['about', 'projects', 'listening', 'influences', 'journal'] as const;

for (const id of topLevelSignals) {
  test(`signal "${id}" renders, without WebGL and without horizontal overflow`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    const response = await page.goto(`/signals/${id}`);
    expect(response?.ok(), `expected 2xx for /signals/${id}`).toBeTruthy();
    await expect(page).toHaveTitle(/MARV1NNNNN/i);
    await expect(page.locator('canvas')).toHaveCount(0);

    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
      .toBeLessThanOrEqual(0);
    expect(errors, `pageerror on /signals/${id}:\n${errors.join('\n')}`).toEqual([]);
  });
}

test('About is a first-class front door, not a footnote', async ({ page }) => {
  await page.goto('/signals/about');
  await expect(page.getByRole('heading', { name: 'Marvin' })).toBeVisible();
  await expect(page.getByRole('link', { name: /resume/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /live \/ performances/i })).toBeVisible();
  // the fun facts are the best content on the site; they must be on the page
  await expect(page.getByText(/started college at 14/i)).toBeVisible();
});

test('Listening is one dense log, not a sparse matrix or a duplicated DOM', async ({ page }) => {
  await page.goto('/signals/listening');
  await expect(page.getByRole('heading', { name: 'Listening' })).toBeVisible();
  const rows = page.locator('.log li');
  expect(await rows.count()).toBeGreaterThan(90);

  await page.getByRole('button', { name: /music/i }).click();
  const filtered = await page.locator('.log li').count();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThan(await rows.count() + 1);
});

test('Influences is the bedrock: never decays, only page with colour', async ({ page }) => {
  await page.goto('/signals/influences');
  await expect(page.locator('.canon > li')).toHaveCount(14);
  expect(await page.locator('.canon').evaluate((n) => getComputedStyle(n).getPropertyValue('--age').trim()))
    .toBe('0');
});

test('Projects is ten rows, not fourteen screens', async ({ page }) => {
  await page.goto('/signals/projects');
  await expect(page.locator('.rows > li')).toHaveCount(10);
  const screens = await page.evaluate(() => document.documentElement.scrollHeight / window.innerHeight);
  expect(screens).toBeLessThan(4);
});

test('Journal leads with the latest essay instead of indexing one item', async ({ page }) => {
  await page.goto('/signals/journal');
  await expect(page.locator('.journal__lead h2')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('Shows reads as a closed chapter and stays legible while faded', async ({ page }) => {
  await page.goto('/shows');
  await expect(page.getByRole('heading', { name: 'Shows' })).toBeVisible();
  const age = await page.locator('.shows').evaluate((n) => getComputedStyle(n).getPropertyValue('--age').trim());
  expect(Number(age)).toBeGreaterThan(0.5);
  expect(Number(age)).toBeLessThan(1);
});

test('unknown signal id does not render a normal signal page', async ({ page }) => {
  const response = await page.goto('/signals/does-not-exist', { waitUntil: 'domcontentloaded' });
  const status = response?.status() ?? 0;
  if (status >= 200 && status < 300) {
    await expect(page.locator('body')).toContainText(/404|not\s*found|error/i);
  }
});
