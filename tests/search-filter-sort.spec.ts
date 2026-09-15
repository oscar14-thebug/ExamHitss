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

  // Prueba basada en datos: mismo flujo, un `test()` por término de
  // `testData.searchTerms`. Playwright no tiene `describe.each()` (eso es
  // de Jest) — el patrón idiomático aquí es un `for` generando un `test()`
  // por caso, que es lo que hace esto.
  for (const searchTerm of testData.searchTerms) {
    test(`"${searchTerm}": filtra por color y ordena por precio, validado contra /api/plp/search`, async ({
      page,
    }) => {
      const home = new HomePage(page);
      const results = new SearchResultsPage(page);

      await test.step(`Buscar "${searchTerm}"`, async () => {
        await home.goto();
        const searchResponse = await home.search(searchTerm);

        expect(searchResponse.products.length).toBeGreaterThan(0);
      });

      await test.step(`Filtrar por color "${testData.colorFilter.label}"`, async () => {
        const filterResponse = await results.filterByColor(testData.colorFilter.label);

        // El reto pide al menos 5 resultados tras búsqueda + filtro de color.
        expect(
          filterResponse.products.length,
          `Se esperaban >= 5 resultados para "${searchTerm}" + color "${testData.colorFilter.label}", hubo ${filterResponse.products.length}`
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

        // Cruce UI vs. API: al menos 3 de los primeros 5 precios (o del
        // total disponible, si hay menos de 5) deben coincidir en el mismo
        // orden. Menos estricto que una igualdad exacta a propósito —
        // tolera el tipo de desfase de paginación/orden parcial que puede
        // aparecer contra el sitio real, aunque en modo mockeado (sin
        // paginación ni condiciones de carrera) siempre debería dar 5/5.
        const sampleSize = Math.min(5, apiPrices.length, uiPrices.length);
        const requiredMatches = Math.min(3, sampleSize);
        const matches = countMatches(
          uiPrices.slice(0, sampleSize),
          apiPrices.slice(0, sampleSize)
        );

        expect(
          matches,
          `Coincidencias UI vs API en los primeros ${sampleSize}: ${matches}/${sampleSize} (se requieren >= ${requiredMatches})`
        ).toBeGreaterThanOrEqual(requiredMatches);
      });
    });
  }
});

function countMatches(a: number[], b: number[]): number {
  let count = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) count++;
  }
  return count;
}
