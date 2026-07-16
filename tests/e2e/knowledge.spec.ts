import { test, expect } from '@playwright/test';

test('sitemap is served', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toContain('<urlset');
  expect(body).toContain('<loc>');
});
