import type { Page, Locator } from '@playwright/test';
import type { PlpSearchResponse } from '../types/api.types';
import { triggerAndWaitForSearchResponse } from '../utils/network';

export class HomePage {
  readonly page: Page;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    // Desktop and mobile search inputs are both present in the DOM
    // simultaneously and share the same placeholder — a bare role/placeholder
    // locator matches both and trips Playwright's strict-mode check. They're
    // distinguished by aria-label: desktop has the exact label below, mobile
    // has the same label with a " - movil" suffix. `exact: true` pins this to
    // the desktop input only.
    this.searchInput = page.getByRole('searchbox', {
      name: 'Buscar por producto, categoría y más...',
      exact: true,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * Submits the search and returns the JSON of the /api/plp/search response
   * that this specific submission triggers (listener armed before typing +
   * Enter, per the chaining rule in TEST_STRATEGY.md).
   */
  async search(term: string): Promise<PlpSearchResponse> {
    return triggerAndWaitForSearchResponse(this.page, async () => {
      await this.searchInput.click();
      await this.searchInput.fill(term);
      await this.searchInput.press('Enter');
    });
  }
}
