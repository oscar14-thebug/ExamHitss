import type { Page, Locator } from '@playwright/test';
import type { PlpSearchResponse } from '../types/api.types';
import { triggerAndWaitForSearchResponse } from '../utils/network';

export class HomePage {
  readonly page: Page;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    // TODO: selector unverified against live DOM (browser access was
    // unavailable while authoring this suite) — confirm on first real run.
    this.searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/buscar/i));
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
