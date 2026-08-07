import { test, expect } from '@playwright/test';

const topLevelSignals = [
  'about',
  'projects',
  'listening',
  'influences',
  'journal',
] as const;

for (const id of topLevelSignals) {
  test(`signal "${id}" route renders without crashing`, async ({ page, isMobile }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    const response = await page.goto(`/signals/${id}`);
    expect(response?.ok(), `expected 2xx for /signals/${id}`).toBeTruthy();

    await expect(page).toHaveTitle(/MARV1NNNNN/i);
    // Page should have some visible text content
    const body = await page.locator('body').innerText();
    expect(body.trim().length).toBeGreaterThan(0);

    if (isMobile && ['projects', 'influences', 'journal'].includes(id)) {
      await expect(page.locator('canvas')).toHaveCount(0);
    }

    expect(errors, `pageerror on /signals/${id}:\n${errors.join('\n')}`).toEqual([]);
  });
}

test('About assembles a readable dossier with direct actions', async ({ page, isMobile }) => {
  await page.goto('/signals/about');
  await expect(page.getByRole('heading', { name: 'Marvin' })).toBeVisible();
  await expect(page.getByRole('link', { name: /resume/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /live \/ performances/i })).toBeVisible();
  if (isMobile) await expect(page.locator('canvas')).toHaveCount(0);
});

test('Journal is a stable editorial index without smoke canvas', async ({ page }) => {
  await page.goto('/signals/journal');
  await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Agents Need Shells, Not Selves/i }).first()).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('MEDIA keeps the dense type matrix and mobile feed', async ({ page }) => {
  await page.goto('/signals/listening');
  await expect(page.getByRole('heading', { name: 'Media' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Media types' })).toBeVisible();
  expect(await page.locator('.media-matrix__row').count()).toBeGreaterThan(90);
});

test('projects opens with Acid Music Player and content-based pacing', async ({ page }) => {
  await page.goto('/signals/projects');
  const first = page.locator('.projects-stage__stream > li').first();
  await expect(first.getByRole('heading', { name: 'Acid Music Player' })).toBeVisible();
  expect(Number(await first.getAttribute('data-duration'))).toBeGreaterThan(100);
  await expect(first.getByRole('link', { name: /open project/i })).toBeVisible();
});

test('Canon Field exposes notes and keyboard navigation', async ({ page }) => {
  await page.goto('/signals/influences');
  await expect(page.getByRole('heading', { name: 'Knife Play' })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.canon-field__stream > li').nth(1)).toHaveClass(/is-active/);
});

test('unknown signal id does not render a normal signal page', async ({ page }) => {
  // Under `output: export`, generateStaticParams defines the allowed ids; dev server
  // surfaces a build-time error for unknown ones. Either way: not a 2xx with content.
  const response = await page.goto('/signals/does-not-exist', { waitUntil: 'domcontentloaded' });
  const status = response?.status() ?? 0;
  if (status >= 200 && status < 300) {
    await expect(page.locator('body')).toContainText(/404|not\s*found|error/i);
  }
});
