import type { Page, Response } from '@playwright/test';
import type { PlpSearchResponse } from '../types/api.types';

export const SEARCH_API_PATTERN = /\/api\/plp\/search/;

/**
 * Arms the waitForResponse listener BEFORE invoking `action`. This must be
 * called immediately before each search/filter/sort trigger — arming it
 * afterwards risks matching a stale response from a previous request that
 * resolved while the action was still executing, which would cross-validate
 * the UI against outdated data.
 */
export async function triggerAndWaitForSearchResponse(
  page: Page,
  action: () => Promise<void>
): Promise<PlpSearchResponse> {
  const responsePromise = page.waitForResponse(
    (res: Response) => SEARCH_API_PATTERN.test(res.url()) && res.status() === 200
  );
  await action();
  const response = await responsePromise;
  return (await response.json()) as PlpSearchResponse;
}

// TODO: this list is a best-effort default set, not verified against a live
// capture of liverpool.com.mx's actual outgoing requests (browser access was
// unavailable while authoring this suite). Re-check on first real run and
// extend/trim based on what actually fires.
const TRACKING_URL_PATTERNS = [
  /quantummetric\.com/,
  /googletagmanager\.com/,
  /google-analytics\.com/,
  /doubleclick\.net/,
  /googlesyndication\.com/,
  /googleadservices\.com/,
  /facebook\.net/,
  /connect\.facebook\.net/,
  /hotjar\.com/,
  /adsrvr\.org/,
  /criteo\.com/,
  /bat\.bing\.com/,
];

/**
 * Blocks known analytics/ads/tracking requests to cut CI noise & latency.
 * See TEST_STRATEGY.md -> "Mitigación de inestabilidad".
 */
export async function blockTrackingRequests(page: Page): Promise<void> {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (TRACKING_URL_PATTERNS.some((pattern) => pattern.test(url))) {
      return route.abort();
    }
    return route.continue();
  });
}
