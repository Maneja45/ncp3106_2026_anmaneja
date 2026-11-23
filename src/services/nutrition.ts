// ==========================================
// SustansyaBox — nutrition references and personal targets
// ==========================================
//
// Sources
// - Calories: FAO/WHO/UNU "Human Energy Requirements" (2004).
//   Energy need = BMR × PAL (physical activity level).
//   BMR uses the FAO/WHO/UNU (Schofield) equations by sex, age and weight.
// - Sugar: WHO Guideline on sugars intake (2015).
//   Free sugars should be less than 10% of total energy intake.
//   1 g sugar = 4 kcal, so the limit in grams = calories × 0.10 ÷ 4.
// - Sodium: WHO Guideline on sodium intake (2012).
//   Adults: less than 2,000 mg per day.
//   Children: 2,000 mg adjusted downward by their energy need
//   relative to adults.
//
// These are general estimates for healthy people, not medical advice.
// Pregnancy, illness, or a doctor's diet plan can change the targets.

export const NUTRITION_REFERENCE = { calories: 2000, sugar: 50, sodium: 2000 } as const

export const NUTRITION_SOURCE = {
  calories: 'FAO/WHO/UNU energy requirements (BMR × activity level)',
  sugar: 'WHO: free sugars under 10% of daily calories',
  sodium: 'WHO limit: under 2,000 mg per day',
} as const

export type Sex = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'moderate' | 'vigorous'

// PAL values from the FAO/WHO/UNU 2004 examples
export const ACTIVITY_LEVELS: Record<ActivityLevel, { pal: number; label: string; hint: string }> = {
  sedentary: { pal: 1.53, label: 'Light', hint: 'Mostly sitting — studying, desk work' },
  moderate: { pal: 1.76, label: 'Moderate', hint: 'On your feet a lot or regular exercise' },
  vigorous: { pal: 2.25, label: 'Very active', hint: 'Heavy physical work or daily intense training' },
}

// FAO/WHO/UNU (Schofield) BMR equations, kcal/day, W = weight in kg
// [minimum age, slope, intercept]
const BMR_EQUATIONS: Record<Sex, [number, number, number][]> = {
  male: [
    [60, 11.711, 587.7],
    [30, 11.472, 873.1],
    [18, 15.057, 692.2],
    [10, 17.686, 658.2],
    [3, 22.706, 504.3],
    [0, 59.512, -30.4],
  ],
  female: [
    [60, 9.082, 658.5],
    [30, 8.126, 845.6],
    [18, 14.818, 486.6],
    [10, 13.384, 692.6],
    [3, 20.315, 485.9],
    [0, 58.317, -31.1],
  ],
}

export type PersonalInput = {
  age: number
  weight: number // kg
  height: number // cm
  sex: Sex
  activity: ActivityLevel
}

export type PersonalTargets = {
  calories: number // kcal per day
  sugar: number // g per day (limit)
  sodium: number // mg per day (limit)
  bmr: number
  bmi: number | null
  bmiLabel: string | null
}

export function basalMetabolicRate(sex: Sex, age: number, weight: number): number {
  const [, slope, intercept] =
    BMR_EQUATIONS[sex].find(([minAge]) => age >= minAge) ?? BMR_EQUATIONS[sex][BMR_EQUATIONS[sex].length - 1]
  return slope * weight + intercept
}

// WHO adult BMI categories (only meaningful for 18+)
export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

export function isValidInput(input: Partial<PersonalInput>): input is PersonalInput {
  const { age, weight, height, sex, activity } = input
  return (
    typeof age === 'number' && age >= 3 && age <= 120 &&
    typeof weight === 'number' && weight >= 10 && weight <= 400 &&
    typeof height === 'number' && height >= 80 && height <= 250 &&
    (sex === 'male' || sex === 'female') &&
    typeof activity === 'string' && activity in ACTIVITY_LEVELS
  )
}

export function personalTargets(input: PersonalInput): PersonalTargets {
  const bmr = basalMetabolicRate(input.sex, input.age, input.weight)
  const calories = Math.round((bmr * ACTIVITY_LEVELS[input.activity].pal) / 10) * 10

  const sugar = Math.round((calories * 0.1) / 4)

  const sodium =
    input.age >= 18
      ? NUTRITION_REFERENCE.sodium
      : Math.min(
          NUTRITION_REFERENCE.sodium,
          Math.round((NUTRITION_REFERENCE.sodium * (calories / NUTRITION_REFERENCE.calories)) / 10) * 10
        )

  const meters = input.height / 100
  const bmi = input.age >= 18 ? Math.round((input.weight / (meters * meters)) * 10) / 10 : null

  return {
    calories,
    sugar,
    sodium,
    bmr: Math.round(bmr),
    bmi,
    bmiLabel: bmi === null ? null : bmiCategory(bmi),
  }
}