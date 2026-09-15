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
- `src/config/test-mode.ts` — `getTestMode()`, lee `TEST_MODE` (`mock` por
  defecto, `live` opcional). Ver "Modos de ejecución" más abajo.
- `tests/fixtures/` — fixture del modo mockeado: `products.fixture.ts`
  (catálogo), `search-results-page.fixture.html` (página autocontenida) y
  `mock-liverpool-site.ts` (instalador de `page.route`).

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

## BLOQUEADOR: WAF de Akamai rechaza el navegador de Playwright en prod

**El WAF de Akamai bloquea de forma consistente el acceso automatizado a
`https://www.liverpool.com.mx` en producción real:**

- `page.goto('https://www.liverpool.com.mx/')` devuelve `403 Access Denied`
  (página de error de Akamai, referencia tipo
  `errors.edgesuite.net/18.xxxxxxxx.<timestamp>.xxxxxxxx`) en el 100% de los
  intentos verificados (3/3, con pausas de 4s entre cada uno) — no es
  rate-limit ni intermitencia.
- Reproduce igual en headless y en headed (`HEADED=1`), así que no es
  detección de "headless" simple; es fingerprinting del Bot Manager de
  Akamai contra la automatización vía CDP (Chromium de Playwright / señales
  como `navigator.webdriver`).
- `curl` con el mismo User-Agent de navegador **sí** obtiene `200` (tras un
  `301` a `/tienda/home`), lo que descarta bloqueo por IP o por User-Agent
  puro — el bloqueo es específico del navegador automatizado.
- Esto ocurre en el primer `goto()`, antes de tocar ningún selector. Ningún
  selector después del primero (grupo de color, combo de orden, tarjetas de
  precio) puede verificarse contra el DOM real mientras esto no se resuelva.

### Por qué no se intentó evadir la detección

No se probó Chrome real vía `channel: 'chrome'`, flags anti-automatización,
ni ninguna técnica de "stealth" para bajar la señal de automatización.
Mismo criterio que aplica a CAPTCHAs y otros mecanismos de bot-detection:
evadir la protección de un sitio en vivo no es parte de escribir o afinar
selectores de prueba, es sortear un control de seguridad gestionado por el
propio sitio — algo que requiere autorización explícita del equipo dueño de
liverpool.com.mx (whitelist, ambiente de staging, credenciales de QA), no
una decisión unilateral de la suite de automatización. Por eso el camino
elegido es el modo mockeado descrito abajo: permite terminar y verificar
toda la lógica del framework sin necesitar sortear nada.

**Siguiente paso, a decidir por el equipo:** confirmar si existe un ambiente
de pruebas sin este WAF, o una forma autorizada de exceptuarlo para
ejecución de QA automatizado (whitelist de IP de CI, ambiente de staging,
token de bypass). Hasta entonces, la forma real del payload de
`/api/plp/search` y los selectores de `SearchResultsPage` siguen sin
verificar contra el sitio real — sí quedan verificados contra el contrato
que la propia suite define en su fixture (ver siguiente sección).

## Modos de ejecución: mockeado (`mock`, por defecto) vs. real (`live`)

Como consecuencia directa del bloqueo anterior, la suite corre en dos modos,
elegidos por la variable de entorno `TEST_MODE` (`src/config/test-mode.ts`):

### `TEST_MODE=mock` (default — también el default en CI)

`tests/fixtures/mock-liverpool-site.ts` intercepta con `page.route()` **todo**
el origen `https://www.liverpool.com.mx/**`, antes de que cualquier request
salga a la red real:

- La navegación al documento (`resourceType() === 'document'`) se responde
  con `tests/fixtures/search-results-page.fixture.html` — una página estática
  autocontenida (CSS/JS inline, sin requests a assets externos) que expone el
  mismo contrato de selectores que asumen los POM: dos `searchbox` (desktop
  y " - movil", para regresionar el fix de strict-mode), un grupo de color,
  un combo de orden con las opciones `sortPrice|0` / `sortPrice|1`, y
  tarjetas de producto con precio.
- Cualquier llamada a `/api/plp/search` (disparada por el propio JS de la
  fixture al buscar/filtrar/ordenar) se responde con JSON generado a partir
  de `tests/fixtures/products.fixture.ts` (7 productos, precios variados, 4
  con "Blanco" entre sus colores), filtrado/ordenado según los query params
  `color` y `sort` que la fixture construye.
- Cualquier otra request al origen (no debería haber ninguna, al ser la
  fixture autocontenida) se aborta explícitamente en vez de dejarla pasar.

**Qué valida este modo:** toda la lógica propia del framework de forma
determinista y sin red externa — el wait encadenado de
`triggerAndWaitForSearchResponse`, la extracción/parseo de precios, la
derivación de dirección de orden desde la etiqueta visible, y el cruce
UI-vs-API. **Qué NO valida:** que los selectores y la forma del payload
coincidan con el sitio real — eso sigue pendiente del punto anterior, porque
la fixture encarna nuestras propias suposiciones, no el DOM/API reales.

### `TEST_MODE=live`

Corre contra `https://www.liverpool.com.mx` sin ningún mock (solo con
`blockTrackingRequests` activo). Hoy falla por el WAF descrito arriba; solo
sería viable desde un entorno con whitelist/staging del lado de Liverpool —
por eso **no** es el modo por defecto en CI (los runners de GitHub Actions
tampoco estarían whitelisteados y fallarían igual). Ver `README.md` para
cómo invocarlo.
