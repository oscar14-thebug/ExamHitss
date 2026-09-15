import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import type { PlpSearchResponse } from '../../src/types/api.types';
import { SEARCH_API_PATTERN } from '../../src/utils/network';
import { mockProducts } from './products.fixture';

const FIXTURE_HTML = readFileSync(
  path.join(__dirname, 'search-results-page.fixture.html'),
  'utf-8'
);

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining accents (é -> e, etc.)
    .toLowerCase();
}

/**
 * Replaces the entire https://www.liverpool.com.mx origin with a local,
 * self-contained fixture: the document request gets the static HTML below
 * (inline CSS/JS, no external asset requests), and /api/plp/search gets a
 * deterministic JSON response derived from `mockProducts`, filtered/sorted
 * per the query params the fixture's own JS sends (q, color, sort). Nothing
 * ever reaches the real network — this exercises the framework (POM
 * interactions, chained waitForResponse, color/sort cross-validation) in
 * isolation from Akamai's WAF. See TEST_STRATEGY.md -> "Modo mockeado" for
 * exactly what this does and does not verify.
 */
export async function installMockedLiverpoolSite(page: Page): Promise<void> {
  await page.route('https://www.liverpool.com.mx/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (SEARCH_API_PATTERN.test(url.pathname)) {
      const q = url.searchParams.get('q');
      const color = url.searchParams.get('color');
      const sort = url.searchParams.get('sort');

      let products = [...mockProducts];
      if (q) {
        // Every word in the query must appear in the product name — a wrong
        // search term (e.g. a stale placeholder like "play" instead of
        // "playstation 5") returns everything and lets bad test data pass
        // silently, so this is deliberately strict rather than a loose
        // substring/OR match.
        const words = normalize(q).split(/\s+/).filter(Boolean);
        products = products.filter((p) => {
          const name = normalize(p.name);
          return words.every((w) => name.includes(w));
        });
      }
      if (color) {
        products = products.filter((p) =>
          (p.colors ?? []).some((c) => c.toLowerCase() === color.toLowerCase())
        );
      }
      if (sort === 'sortPrice|0') {
        products = [...products].sort((a, b) => a.price.price - b.price.price);
      } else if (sort === 'sortPrice|1') {
        products = [...products].sort((a, b) => b.price.price - a.price.price);
      }

      const body: PlpSearchResponse = {
        products,
        pagination: { totalResults: products.length },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
      return;
    }

    if (request.resourceType() === 'document') {
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: FIXTURE_HTML,
      });
      return;
    }

    // The fixture page is self-contained (inline CSS/JS) — any other request
    // under this origin is unexpected in mocked mode, so fail loudly instead
    // of silently letting it hit the real network.
    await route.abort();
  });
}
