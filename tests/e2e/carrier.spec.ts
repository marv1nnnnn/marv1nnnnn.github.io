import { test, expect } from '@playwright/test';

// carrier, side B's second work: a page of its own in public/carrier/, outside the site's deck.
test.describe('carrier /carrier/', () => {
  test('side B winds out to it, and it links back to side B', async ({ page }) => {
    await page.goto('/?side=b');
    const play = page.getByRole('navigation', { name: 'Side B' }).getByRole('link', { name: 'carrier' });
    await expect(play).toHaveAttribute('href', '/carrier/');
    await play.click();
    await expect(page).toHaveURL(/\/carrier\/$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('carrier');
    await page.getByRole('link', { name: '← side B' }).click();
    // the home page takes ?side=b off the address once it has turned the tape over
    await expect(page).toHaveURL(/:\d+\/(\?side=b)?$/);
    await expect(page.getByRole('button', { name: 'Side B: the works to play' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('the line goes through four carriers, each with its own controls', async ({ page }) => {
    await page.goto('/carrier/');
    for (const name of ['tape', 'file', 'a radio that learned me', 'on the air']) {
      await expect(page.getByRole('heading', { level: 2, name: new RegExp(`^${name}`) })).toBeVisible();
    }
    // the tape plays when it comes into view (silently: these tests turned the sound off), and its counter turns
    await page.locator('#tape').scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status', { name: 'Tape counter' })).not.toHaveText('000', { timeout: 10_000 });
    // the player skips to the next file
    await page.locator('#file').scrollIntoViewIfNeeded();
    const name = page.locator('.marquee');
    await expect(name).toHaveText('Track01.mp3');
    await page.getByRole('button', { name: 'Next file' }).click();
    await expect(name).not.toHaveText('Track01.mp3');
    // the app narrows with every heart
    await page.locator('#app').scrollIntoViewIfNeeded();
    await expect(page.locator('.share')).toHaveText('100%');
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Heart this song' }).click();
      await page.getByRole('button', { name: 'Skip' }).click();
    }
    await expect(page.locator('.share')).not.toHaveText('100%');
    // the dial tunes from the keyboard
    const dial = page.getByRole('slider', { name: 'Tuning' });
    await dial.scrollIntoViewIfNeeded();
    await dial.focus();
    await page.keyboard.press('Home');
    await expect(dial).toHaveAttribute('aria-valuetext', 'between stations');
    await page.keyboard.press('PageUp');
    await expect(dial).toHaveAttribute('aria-valuetext', 'dublab, Los Angeles');
  });

  test('does not scroll sideways on phones', async ({ page }) => {
    await page.goto('/carrier/');
    await page.locator('footer').scrollIntoViewIfNeeded();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
});
