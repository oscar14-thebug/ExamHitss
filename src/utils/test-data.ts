// TODO: `colorFilter.label` and `sortOptions.*.value` are unverified against
// the live site (browser access was unavailable while authoring this suite —
// see TEST_STRATEGY.md). In particular, do NOT trust `priceAsc.value` /
// `priceDesc.value` as proof of direction: the spec intentionally derives the
// expected sort direction from the *visible* selected-option label at
// runtime (see SearchResultsPage.getSelectedSortLabel), not from these flag
// values, so a wrong guess here breaks locating the option — not the
// correctness of the assertion.

export const testData = {
  baseSearchTerm: 'playera',

  colorFilter: {
    label: 'Negro',
  },

  sortOptions: {
    priceAsc: {
      value: 'sortPrice|0',
      label: 'Precio: menor a mayor',
    },
    priceDesc: {
      value: 'sortPrice|1',
      label: 'Precio: mayor a menor',
    },
  },
} as const;
