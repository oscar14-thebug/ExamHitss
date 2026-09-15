export type TestMode = 'mock' | 'live';

/**
 * Defaults to 'mock' because the real site is behind an Akamai WAF that
 * blocks Playwright's browser outright (see TEST_STRATEGY.md ->
 * "BLOQUEADOR ACTUAL"). Set TEST_MODE=live to opt into hitting the real
 * site — only viable from an environment whitelisted by Liverpool (not CI).
 */
export function getTestMode(): TestMode {
  return process.env.TEST_MODE?.toLowerCase() === 'live' ? 'live' : 'mock';
}
