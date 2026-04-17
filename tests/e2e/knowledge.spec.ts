import { test, expect } from '@playwright/test';

test('knowledge graph data is served', async ({ request }) => {
  const res = await request.get('/knowledge/graph.json');
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(Array.isArray(json.nodes)).toBeTruthy();
  expect(Array.isArray(json.edges ?? json.links)).toBeTruthy();
  expect(json.nodes.length).toBeGreaterThan(0);
});

test('sitemap is served', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toContain('<urlset');
  expect(body).toContain('<loc>');
});
