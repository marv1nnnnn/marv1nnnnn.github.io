import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const signals = JSON.parse(fs.readFileSync(path.join(__dirname, '../../lib/signals.json'), 'utf8'));
const SECTION: Record<string, string> = { projects: 'make', journal: 'think' };

type CardRef = { section: string; id: string; title: string };

function collectCards(): CardRef[] {
  const out: CardRef[] = [];
  for (const signal of signals.signals ?? []) {
    const section = SECTION[signal.id];
    if (!section) continue;
    for (const c of signal.page?.cards ?? []) {
      if (c?.id) out.push({ section, id: c.id, title: c.title ?? c.id });
    }
  }
  return out;
}

test.describe('detail pages', () => {
  for (const card of collectCards()) {
    test(`/${card.section}/${card.id} renders its title and body`, async ({ page }) => {
      await page.goto(`/${card.section}/${card.id}`);
      await expect(page.locator('h1[data-anchor]')).toBeVisible();
      await expect(page.locator('.prose').filter({ hasText: /\S/ }).first()).not.toBeEmpty();
      await expect(page.getByRole('link', { name: /^←/ })).toHaveAttribute('href', card.section === 'think' ? '/make#writing' : `/${card.section}`);
    });
  }
});
