import { test, expect } from '@playwright/test';
import { HomePage } from '../src/pages/HomePage';
import { SearchResultsPage } from '../src/pages/SearchResultsPage';
import { blockTrackingRequests } from '../src/utils/network';
import { testData } from '../src/utils/test-data';
import { getTestMode } from '../src/config/test-mode';
import { installMockedLiverpoolSite } from './fixtures/mock-liverpool-site';

test.describe('PLP: búsqueda → filtro por color → orden por precio', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const mode = getTestMode();
    testInfo.annotations.push({ type: 'test-mode', description: mode });

    await blockTrackingRequests(page);
    if (mode === 'mock') {
      // TEST_MODE=mock (default): never touches the real site — see
      // TEST_STRATEGY.md -> "Modo mockeado". Set TEST_MODE=live to run
      // against the real origin instead (requires WAF whitelist).
      await installMockedLiverpoolSite(page);
    }
  });

  test('filtra por color y ordena por precio, validado contra /api/plp/search', async ({
    page,
  }) => {
    const home = new HomePage(page);
    const results = new SearchResultsPage(page);

    await test.step(`Buscar "${testData.baseSearchTerm}"`, async () => {
      await home.goto();
      const searchResponse = await home.search(testData.baseSearchTerm);

      expect(searchResponse.products.length).toBeGreaterThan(0);
    });

    await test.step(`Filtrar por color "${testData.colorFilter.label}"`, async () => {
      const filterResponse = await results.filterByColor(testData.colorFilter.label);

      // El reto pide al menos 5 resultados tras búsqueda + filtro de color.
      expect(
        filterResponse.products.length,
        `Se esperaban >= 5 resultados para "${testData.baseSearchTerm}" + color "${testData.colorFilter.label}", hubo ${filterResponse.products.length}`
      ).toBeGreaterThanOrEqual(5);
      for (const product of filterResponse.products) {
        if (product.colors && product.colors.length > 0) {
          const colorsText = product.colors.join(',').toLowerCase();
          expect(colorsText).toContain(testData.colorFilter.label.toLowerCase());
        }
      }
    });

    await test.step(`Ordenar por "${testData.sortOptions.priceAsc.label}" y validar orden contra la API`, async () => {
      const sortResponse = await results.sortBy(testData.sortOptions.priceAsc.label);

      // La dirección esperada se deriva de la etiqueta visible seleccionada,
      // no del valor del flag (sortPrice|0) — ese valor no fue verificado
      // empíricamente contra el sitio real (ver test-data.ts y TEST_STRATEGY.md).
      const selectedLabel = await results.getSelectedSortLabel();
      const isAscending = /menor a mayor/i.test(selectedLabel);
      const isDescending = /mayor a menor/i.test(selectedLabel);
      expect(
        isAscending || isDescending,
        `Etiqueta de orden inesperada: "${selectedLabel}"`
      ).toBe(true);

      const apiPrices = sortResponse.products.map((p) => p.price.price);
      const expectedOrder = isAscending
        ? [...apiPrices].sort((a, b) => a - b)
        : [...apiPrices].sort((a, b) => b - a);

      expect(
        apiPrices,
        'El orden de precios de la respuesta /api/plp/search no coincide con el criterio seleccionado en la UI'
      ).toEqual(expectedOrder);

      const uiPrices = await results.getVisiblePrices();
      expect(uiPrices.length).toBeGreaterThan(0);
      expect(
        uiPrices,
        'Los precios renderizados en la UI no coinciden con los de la respuesta de la API'
      ).toEqual(apiPrices.slice(0, uiPrices.length));
    });
  });
});
