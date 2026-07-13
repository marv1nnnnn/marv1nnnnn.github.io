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

test('unknown signal id does not render a normal signal page', async ({ page }) => {
  // Under `output: export`, generateStaticParams defines the allowed ids; dev server
  // surfaces a build-time error for unknown ones. Either way: not a 2xx with content.
  const response = await page.goto('/signals/does-not-exist', { waitUntil: 'domcontentloaded' });
  const status = response?.status() ?? 0;
  if (status >= 200 && status < 300) {
    await expect(page.locator('body')).toContainText(/404|not\s*found|error/i);
  }
});
