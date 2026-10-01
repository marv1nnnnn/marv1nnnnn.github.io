import { test, expect } from '@playwright/test';

test.describe('home /', () => {
  test('shows the tape, the intro and the site navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas.tape-canvas')).toBeVisible();
    await expect(page.getByText('Product manager at YouWare.')).toBeVisible();
    for (const name of ['make', 'input', 'log', 'about']) {
      await expect(page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name })).toBeVisible();
    }
    await expect(page.getByRole('group', { name: 'Tapes' }).getByRole('button')).toHaveCount(6);
  });

  test('another tape from the shelf switches the palette and the choice carries to other pages', async ({ page }) => {
    await page.goto('/');
    const accent = () => page.evaluate(() => document.documentElement.style.getPropertyValue('--accent-rgb'));
    await expect.poll(accent).not.toBe('');
    const before = await accent();
    const shelf = page.getByRole('group', { name: 'Tapes' });
    await expect(shelf.getByRole('button', { name: /^haze tape/ })).toHaveAttribute('aria-pressed', 'true');
    await shelf.getByRole('button', { name: /^ritual tape/ }).click();
    await expect(shelf.getByRole('button', { name: /^ritual tape/ })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(accent).not.toBe(before);
    const chosen = await accent();
    await page.goto('/make');
    await expect.poll(accent).toBe(chosen);
  });

  test.describe('a first visit', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test('the music starts at the first touch', async ({ page }) => {
      await page.goto('/');
      const toggle = page.getByRole('button', { name: 'Sound' });
      // Browsers allow no sound before a gesture, so it waits for one.
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await page.mouse.click(12, 320); // the desk, away from the cassette
      await expect(toggle).toHaveAttribute('aria-pressed', 'true', { timeout: 30_000 });
      // Turning it off is remembered.
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await page.reload();
      await page.mouse.click(12, 320); // the desk, away from the cassette
      await page.waitForTimeout(1000);
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });
  });

  test('sound, once turned off, comes on when asked for and plays the Strudel pattern', async ({ page, isMobile }) => {
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
    await expect(count).toHaveText('060', { timeout: 20_000 });
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

  test('turning the tape over shows side B, and playing a work winds out to its subdomain', async ({ page }) => {
    await page.route('https://cyberia.marv1nnnnn.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<title>cyberia</title>' }));
    test.setTimeout(120_000);
    await page.goto('/');
    const flip = page.getByRole('button', { name: 'Side B: the works to play' });
    await expect(flip).toHaveAttribute('aria-pressed', 'false');
    // A hand on the shell, away from the reel, drags it over.
    const canvas = page.locator('.cassette-canvas.is-ready');
    await expect(canvas).toHaveAttribute('data-shell', /\d+,\d+/, { timeout: 90_000 });
    const [sx, sy] = (await canvas.getAttribute('data-shell'))!.split(',').map(Number);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(sx + i * 22, sy);
    await page.mouse.up();
    await expect(flip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Product manager at YouWare.')).toBeHidden();
    // The strip in the top bar is side B's now: its track goes out to the work.
    await expect(page.getByRole('navigation', { name: 'Site' })).toHaveCount(0);
    const play = page.getByRole('navigation', { name: 'Side B' }).getByRole('link', { name: 'cyberia' });
    await expect(play).toHaveAttribute('href', 'https://cyberia.marv1nnnnn.com');
    await expect(page.locator('.deck-count')).toHaveText('B1');
    await play.click();
    await expect(page).toHaveURL('https://cyberia.marv1nnnnn.com/', { timeout: 15_000 });
  });

  test('a work links back to side B with /?side=b, and other pages are side A', async ({ page }) => {
    await page.goto('/?side=b');
    const flip = page.getByRole('button', { name: 'Side B: the works to play' });
    await expect(flip).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('navigation', { name: 'Side B' }).getByRole('link', { name: 'cyberia' })).toBeVisible();
    // turned back over, the strip is the site again
    await flip.press('Enter');
    await expect(flip).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'make' }).click();
    await expect(page).toHaveURL(/\/make$/);
    await page.getByRole('link', { name: 'marv1nnnnn' }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(flip).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByText('Product manager at YouWare.')).toBeVisible();
  });

  test('the home page does not scroll sideways on phones', async ({ page }) => {
    await page.goto('/');
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
});
