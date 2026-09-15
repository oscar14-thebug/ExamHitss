import type { Page, Locator } from '@playwright/test';
import type { PlpSearchResponse } from '../types/api.types';
import { triggerAndWaitForSearchResponse } from '../utils/network';

export class SearchResultsPage {
  readonly page: Page;
  readonly colorFilterGroup: Locator;
  readonly sortDropdown: Locator;
  readonly productCards: Locator;

  constructor(page: Page) {
    this.page = page;
    // TODO: selectors unverified against live DOM (browser access was
    // unavailable while authoring this suite) — confirm on first real run.
    this.colorFilterGroup = page.getByRole('group', { name: /color/i });
    this.sortDropdown = page.getByRole('combobox', { name: /ordenar/i });
    this.productCards = page.locator(
      '[data-testid="product-card"], .product-card'
    );
  }

  /**
   * Clicks a color swatch/label within the color filter facet and returns
   * the JSON of the /api/plp/search response this click triggers. The
   * waitForResponse listener is armed (inside triggerAndWaitForSearchResponse)
   * before the click, so it can't accidentally resolve against a response
   * from the initial search instead of this filter action.
   */
  async filterByColor(colorLabel: string): Promise<PlpSearchResponse> {
    return triggerAndWaitForSearchResponse(this.page, async () => {
      await this.colorFilterGroup.getByText(colorLabel, { exact: false }).click();
    });
  }

  /**
   * Selects a sort option by its visible label and returns the JSON of the
   * /api/plp/search response this selection triggers. Same chaining rule as
   * filterByColor: the listener is armed before selectOption() runs, so the
   * captured response reflects the already-filtered result set sorted by
   * this option — not a stale pre-sort response.
   */
  async sortBy(optionLabel: string): Promise<PlpSearchResponse> {
    return triggerAndWaitForSearchResponse(this.page, async () => {
      await this.sortDropdown.selectOption({ label: optionLabel });
    });
  }

  /** Visible text of the currently-selected sort option, e.g. "Precio: menor a mayor". */
  async getSelectedSortLabel(): Promise<string> {
    const selectedOption = this.sortDropdown.locator('option:checked');
    return (await selectedOption.innerText()).trim();
  }

  /** Prices as rendered in the UI, in DOM order, parsed to numbers. */
  async getVisiblePrices(): Promise<number[]> {
    const priceTexts = await this.productCards
      .locator('[data-testid="product-price"], .price')
      .allInnerTexts();
    return priceTexts.map(parsePriceText);
  }
}

function parsePriceText(text: string): number {
  const normalized = text.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  return parseFloat(normalized);
}
