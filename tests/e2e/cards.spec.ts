import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const signals = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../lib/signals.json'), 'utf8')
);

type CardRef = { signalId: string; cardId: string; title: string };

function collectCards(): CardRef[] {
  const out: CardRef[] = [];
  for (const signal of signals.signals ?? []) {
    const page = signal.page;
    if (!page) continue;
    const cards = page.cards ?? [];
    for (const c of cards) {
      if (c?.id) out.push({ signalId: signal.id, cardId: c.id, title: c.title ?? c.id });
    }
  }
  return out;
}

const sampleCards = collectCards().slice(0, 3);

test.describe('signal card routes', () => {
  test('at least one card exists to smoke-test', () => {
    expect(sampleCards.length).toBeGreaterThan(0);
  });

  for (const card of sampleCards) {
    test(`card ${card.signalId}/${card.cardId} renders`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(String(e)));

      const response = await page.goto(`/signals/${card.signalId}/${card.cardId}`);
      expect(response?.ok()).toBeTruthy();

      // OG/JSON-LD script should be present for card pages
      await expect(page.locator('script[type="application/ld+json"]').first()).toHaveCount(1);
      await expect(page.getByRole('button', { name: 'CHANGE' })).toBeVisible();

      const body = await page.locator('body').innerText();
      expect(body.trim().length).toBeGreaterThan(0);

      expect(errors, errors.join('\n')).toEqual([]);
    });
  }
});
