/**
 * SustansyaBox — daily nutrition references (single source for every page).
 *
 * sodium:   WHO recommends LESS THAN 2,000 mg sodium per day for adults
 *           (about 5 g of salt). Treat it as a limit, not a target.
 *           Source: WHO fact sheet "Sodium reduction".
 * sugar:    50 g is a general reference (WHO advises keeping FREE sugars under
 *           10% of daily energy, about 50 g on a 2,000 kcal diet). Our food data
 *           lists total sugar, so this is shown as a general reference only.
 * calories: 2,000 kcal is a general reference; real needs vary per person.
 */
export const NUTRITION_REFERENCE = {
  calories: 2000,
  sugar: 50,
  sodium: 2000,
} as const

/** Short source labels you can show in the UI. */
export const NUTRITION_SOURCE = {
  calories: 'General reference — needs vary per person',
  sugar: 'General reference (WHO free-sugar guidance)',
  sodium: 'WHO limit: under 2,000 mg per day',
} as const