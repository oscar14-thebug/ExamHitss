# liverpool-search-automation
![Tests](https://github.com/oscar14-thebug/ExamHitss/actions/workflows/playwright.yml/badge.svg)

E2E de Playwright + TypeScript para el flujo de liverpool.com.mx: buscar →
filtrar por color → ordenar por precio, validando la UI contra la respuesta
real de `/api/plp/search`.

Bonus de pruebas basadas en datos implementado: el mismo flujo corre
parametrizado para 3 términos (`"playstation 5"`, `"xbox series x"`,
`"nintendo switch"`) — ver `testData.searchTerms` en
[`src/utils/test-data.ts`](./src/utils/test-data.ts).

## Instalación

```
npm install
npx playwright install --with-deps chromium
```

## Correr la suite

**Por defecto corre en modo mockeado** (`TEST_MODE=mock`): intercepta todo el
origen `https://www.liverpool.com.mx` con `page.route()` y responde con un
fixture local autocontenido — nunca toca la red real. Esto es así porque el
sitio real está detrás de un WAF (Akamai Bot Manager) que bloquea el
navegador de Playwright de forma consistente; ver
[`TEST_STRATEGY.md`](./TEST_STRATEGY.md) para el detalle y la evidencia.

```
npm test                 # headless, modo mock (default)
npm run test:headed      # con navegador visible
npm run test:ui          # Playwright UI mode
npm run test:debug       # modo debug paso a paso
```

CI (`.github/workflows/playwright.yml`) corre siempre en modo mock, por la
misma razón: los runners de GitHub Actions tampoco están whitelisteados
contra el WAF.

## Correr contra el sitio real (`TEST_MODE=live`)

Solo tiene sentido si tu IP/entorno está **whitelisteado del lado de
Liverpool** (o corres desde un ambiente de staging sin el WAF delante). Sin
eso, falla con `403 Access Denied` de Akamai en el primer `goto()`.

```
TEST_MODE=live npm test
```

En PowerShell:

```
$env:TEST_MODE = "live"; npm test
```

No se implementó ninguna técnica para evadir la detección del WAF (stealth,
flags anti-automatización, Chrome real vía `channel`) — ver la sección "Por
qué no se intentó evadir la detección" en [`TEST_STRATEGY.md`](./TEST_STRATEGY.md).
Si necesitas correr esto contra producción real, el paso previo es conseguir
el whitelist con el equipo dueño del sitio, no ajustar la suite.

## Estructura

```
src/
  config/     — configuración (test-mode.ts: switch mock/live)
  pages/      — Page Object Model (HomePage, SearchResultsPage)
  types/      — tipos de la respuesta de /api/plp/search
  utils/      — helpers de red (wait encadenado, bloqueo de tracking) y datos de prueba
tests/
  fixtures/   — fixture del modo mockeado (catálogo, HTML autocontenido, instalador de mocks)
  search-filter-sort.spec.ts
TEST_STRATEGY.md — estrategia completa: arquitectura, mitigación de
                    inestabilidad, el bloqueo de Akamai y los dos modos de
                    ejecución en detalle.
```

## Otros scripts

```
npm run typecheck        # tsc --noEmit
npm run report            # abre el último reporte HTML
```
