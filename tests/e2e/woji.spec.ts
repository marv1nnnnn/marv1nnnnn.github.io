import { test, expect } from '@playwright/test';

test.describe('side B: woji /woji/', () => {
  test('puts a new product on the shelf, and the same link draws the same one', async ({ page }) => {
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(e.message));
    await page.goto('/woji/#k3x9q2');
    const name = page.locator('#name');
    await expect(name).not.toBeEmpty();
    const first = await name.textContent();
    await expect(page.locator('#price')).toHaveText(/^\d+\.\d$/);
    await expect(page.locator('#digits')).toHaveText(/^69\d{11}$/);

    await page.getByRole('button', { name: '研发部，再来一个' }).click();
    await expect(page).not.toHaveURL(/#k3x9q2$/);
    await expect(page.locator('#history')).toBeVisible();

    await page.goto('/woji/#k3x9q2');
    await page.reload();
    await expect(name).toHaveText(first!);
    expect(problems).toEqual([]);
    await expect(page.getByRole('navigation', { name: 'woji' }).getByRole('link', { name: '← side B' })).toHaveAttribute('href', '/?side=b');
  });

  test('is on side B of the home page', async ({ page }) => {
    await page.goto('/?side=b');
    await expect(page.getByRole('navigation', { name: 'Side B' }).getByRole('link', { name: 'woji' })).toHaveAttribute('href', '/woji/');
  });
});
