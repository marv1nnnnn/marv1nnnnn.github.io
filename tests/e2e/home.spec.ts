import { test, expect } from '@playwright/test';

test.describe('home /', () => {
  test('shows the tape, the intro and the site navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas.tape-canvas')).toBeVisible();
    await expect(page.getByText('Product manager at YouWare.')).toBeVisible();
    for (const name of ['make', 'input', 'log', 'about']) {
      await expect(page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name })).toBeVisible();
    }
    await expect(page.getByRole('group', { name: 'Tapes' }).getByRole('button')).toHaveCount(5);
  });

  test('another tape from the shelf switches the palette and the choice carries to other pages', async ({ page }) => {
    await page.goto('/');
    const accent = () => page.evaluate(() => document.documentElement.style.getPropertyValue('--accent-rgb'));
    await expect.poll(accent).not.toBe('');
    const before = await accent();
    const shelf = page.getByRole('group', { name: 'Tapes' });
    await expect(shelf.getByRole('button', { name: /^oxide tape/ })).toHaveAttribute('aria-pressed', 'true');
    await shelf.getByRole('button', { name: /^uv tape/ }).click();
    await expect(shelf.getByRole('button', { name: /^uv tape/ })).toHaveAttribute('aria-pressed', 'true');
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

  test('the deck winds between tracks', async ({ page }) => {
    await page.goto('/');
    const count = page.locator('.deck-count');
    await expect(count).toHaveText('000');
    await page.getByRole('button', { name: 'Fast forward' }).click();
    await expect(page).toHaveURL(/\/make$/);
    await expect(count).toHaveText('060');
    await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'log' }).click();
    await expect(page).toHaveURL(/\/log$/);
    await page.getByRole('button', { name: 'Rewind' }).click();
    await expect(page).toHaveURL(/\/input$/);
  });

  test('holding fast-forward winds until it is let go', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mouse hold');
    await page.goto('/');
    const ff = page.getByRole('button', { name: 'Fast forward' });
    await ff.hover();
    await page.mouse.down();
    await expect(page.locator('.deck-cue')).toBeVisible();
    await page.waitForTimeout(1600);
    await page.mouse.up();
    await expect(page).not.toHaveURL(/\/$/);
  });

  test('turning the pencil on the cassette winds to the next track', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    const canvas = page.locator('.cassette-canvas.is-ready');
    await expect(canvas).toHaveAttribute('data-hub', /\d+,\d+/, { timeout: 90_000 });
    const [hx, hy] = (await canvas.getAttribute('data-hub'))!.split(',').map(Number);
    const slider = page.getByRole('slider', { name: /Wind the tape/ });
    // Clockwise around the hub, as the pencil would go, until the head is into track 02.
    let a = Math.PI;
    const r = 50;
    await page.mouse.move(hx + Math.cos(a) * r, hy + Math.sin(a) * r);
    await page.mouse.down();
    for (let i = 0; i < 90; i++) {
      a += Math.PI / 30;
      await page.mouse.move(hx + Math.cos(a) * r, hy + Math.sin(a) * r);
      if (/02 make/.test((await slider.getAttribute('aria-valuetext')) ?? '')) break;
    }
    await expect(slider).toHaveAttribute('aria-valuetext', '02 make');
    await page.waitForTimeout(200);
    await page.mouse.up();
    await expect(page).toHaveURL(/\/make$/, { timeout: 15_000 });
  });

  test('the home page does not scroll sideways on phones', async ({ page }) => {
    await page.goto('/');
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
});
