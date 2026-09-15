# Estrategia de pruebas — liverpool.com.mx (búsqueda / filtro / orden)

## Alcance

Un único spec (`tests/search-filter-sort.spec.ts`), estructurado en
`test.step()`, que cubre el flujo:

1. Buscar un término en el home.
2. Filtrar los resultados por color.
3. Ordenar por precio.

Cada paso se valida cruzando lo que muestra la UI contra la respuesta JSON
real de `/api/plp/search`, en vez de confiar solo en el DOM.

## Arquitectura

- `src/pages/HomePage.ts` y `src/pages/SearchResultsPage.ts` — Page Object
  Model. `SearchResultsPage` expone `filterByColor()`, `sortBy()`,
  `getSelectedSortLabel()` y `getVisiblePrices()`.
- `src/utils/network.ts` — helpers compartidos: `triggerAndWaitForSearchResponse`
  (wait de red encadenado) y `blockTrackingRequests` (bloqueo de tracking).
- `src/types/api.types.ts` — tipado de la respuesta de `/api/plp/search`.
- `src/utils/test-data.ts` — datos de prueba (término de búsqueda, color,
  opciones de orden).

## Estrategia de espera de red (wait encadenado)

`page.waitForResponse(...)` para `/api/plp/search` se arma **antes** de
disparar cada acción (buscar, filtrar, ordenar), nunca después. Si se
armara después de la acción, o se reutilizara un único listener para las
tres acciones, se corre el riesgo de capturar una respuesta obsoleta —
por ejemplo, cruzar la UI ya filtrada/ordenada contra la respuesta de la
búsqueda inicial, que puede resolver tarde y "pisar" la promesa esperada.

Por eso toda la lógica vive en `triggerAndWaitForSearchResponse(page, action)`
(`src/utils/network.ts`): arma el listener, ejecuta `action`, y solo entonces
espera la respuesta. `HomePage.search()`, `SearchResultsPage.filterByColor()`
y `SearchResultsPage.sortBy()` la usan cada uno de forma independiente, así
que cada paso queda cruzado contra la respuesta que él mismo disparó.

## Mitigación de inestabilidad

- **Bloqueo de requests de tracking**: Quantum Metric, GTM, Google Analytics,
  DoubleClick, Facebook Pixel, Hotjar, Criteo, Bing Ads, etc. se bloquean vía
  `page.route()` (`blockTrackingRequests`, aplicado en `test.beforeEach`) para
  reducir ruido y latencia de red en CI. Ver `src/utils/network.ts` para la
  lista completa de patrones.
- Esperas basadas en eventos de red (`waitForResponse`) en vez de timeouts
  arbitrarios (`waitForTimeout`).
- `retries: 1` en CI (configurado en `playwright.config.ts`).
- La dirección de orden esperada (ascendente/descendente) se deriva en
  runtime de la etiqueta visible del `<option>` seleccionado, no de un valor
  hardcodeado — ver siguiente sección.

## Supuestos pendientes de verificación empírica

Esta suite se escribió sin acceso al navegador en la sesión de autoría (la
extensión de Chrome no estaba disponible), así que varios valores son
supuestos razonables, no confirmados contra el sitio real:

- **Selectores** en `HomePage` y `SearchResultsPage` (input de búsqueda,
  grupo de filtro de color, combo de orden, tarjetas/precio de producto).
  Marcados con `TODO` inline.
- **Forma de la respuesta** de `/api/plp/search` en `src/types/api.types.ts`
  (nombres de campos `products`, `price.price`, `colors`, `pagination`, etc.).
- **`sortOptions.priceAsc.value: 'sortPrice|0'`** en `test-data.ts`: no se
  verificó que ese flag efectivamente ordene de menor a mayor. Para que esto
  no invalide la prueba si la suposición es incorrecta, el spec **no** asume
  la dirección a partir del nombre del flag: lee la etiqueta visible del
  `<option>` seleccionado (`getSelectedSortLabel()`) y deriva "ascendente" /
  "descendente" de ese texto antes de comparar contra el orden de precios de
  la respuesta de la API. Un valor de flag equivocado rompería la
  localización de la opción en el combo (fallo claro y temprano), no la
  lógica de validación de orden.

**Antes de correr esta suite contra el sitio real por primera vez**, hay que
confirmar/ajustar estos tres puntos con DevTools o con el navegador
conectado, y quitar los comentarios `TODO` una vez verificados.

## CI

- Headless por defecto (`HEADED=1` u opción `--headed` para depurar en local).
- `forbidOnly` en CI evita que un `.only` quede mergeado por accidente.
- Trace/video/screenshot solo en fallo o primer reintento, para no inflar los
  artefactos de builds verdes.
