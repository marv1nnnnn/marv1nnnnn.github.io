import { test, expect } from '@playwright/test';

test.describe('sections', () => {
  test('every section is a booklet, opening on its track\'s title page', async ({ page }) => {
    for (const [path, n] of [['/make', '02'], ['/input', '03'], ['/log', '04'], ['/about', '05']]) {
      await page.goto(path);
      await expect(page.locator('.title-no')).toHaveText(n);
    }
  });


  test('/make lists writing, tools, talks and shows', async ({ page }) => {
    await page.goto('/make');
    await expect(page.getByRole('heading', { level: 1, name: 'make' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /writing/i })).toBeVisible();
    await expect(page.locator('.song a').first()).toHaveAttribute('href', /^\/think\//);
    await expect(page.getByRole('heading', { name: /tools and talks/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /noise/i })).toBeVisible();
    await expect(page.locator('.row').first()).toBeVisible();
    await expect(page.locator('.year-label').first()).toBeVisible();
  });

  test('essay pages count as make in the navigation', async ({ page }) => {
    await page.goto('/think/harness-engineering');
    await expect(page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'make' })).toHaveAttribute('aria-current', 'page');
  });

  test('/input shows the canon and points to the log', async ({ page }) => {
    await page.goto('/input');
    await expect(page.locator('.canon-item')).toHaveCount(14);
    await expect(page.locator('.print')).toHaveCount(14);
    await expect(page.locator('.canon-no').first()).toHaveText('01');
    await expect(page.locator('a.to-log')).toHaveAttribute('href', '/log');
  });

  test('/log filters entries by kind', async ({ page }) => {
    await page.goto('/log');
    await expect(page.getByRole('heading', { level: 1, name: 'log' })).toBeVisible();
    await expect(page.locator('.booklet-book[data-ready]')).toBeVisible();
    // The filters are on the page after the title page.
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.booklet-book')).toHaveAttribute('data-at', '1', { timeout: 15_000 });
    await page.waitForTimeout(300);
    const rows = page.locator('.row');
    const all = await rows.count();
    expect(all).toBeGreaterThan(50);
    await page.getByRole('button', { name: /^heard/ }).click();
    await expect(page.getByRole('button', { name: /^heard/ })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => rows.count()).toBeLessThan(all);
    await expect(page.locator('.row .kind').filter({ hasNotText: 'heard' })).toHaveCount(0);
  });

  test('/log plays back the entry under the read head', async ({ page }) => {
    await page.goto('/log');
    await expect(page.locator('.booklet-book[data-ready]')).toBeVisible();
    const strip = page.getByRole('slider', { name: 'Read head' });
    const newest = await page.locator('.deck-title').textContent();
    await strip.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.deck-title')).not.toHaveText(newest ?? '');
    await page.keyboard.press('End');
    await expect(page.locator('.deck-title')).toHaveText(newest ?? '');
  });

  test('/about shows the current role and contact details', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('.cover')).toBeVisible();
    await expect(page.locator('.cover-name')).toHaveText('marv1nnnnn');
    await expect(page.getByText(/AI Engineer/i).first()).toBeVisible();
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

test('the booklet turns its pages with the arrow keys, then winds on to the next track', async ({ page, isMobile }) => {
  await page.goto('/about');
  await expect(page.locator('.booklet-book[data-ready]')).toBeVisible();
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  await page.waitForTimeout(300);
  const leaves = await page.locator('.leaf').count();
  const steps = isMobile ? leaves - 1 : Math.ceil((await page.locator('.pg[data-page]').count() - 1) / 2);
  for (let k = 0; k < steps; k++) {
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.booklet-book')).toHaveAttribute('data-at', String(k + 1));
  }
  await expect(page).toHaveURL(/\/about$/);
  // about is the last track: going back past the first page winds to log.
  for (let k = 0; k <= steps; k++) await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(/\/log$/, { timeout: 15_000 });
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
