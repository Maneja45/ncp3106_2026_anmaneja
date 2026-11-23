export type Meal = {
  id: number
  food: string
  emoji: string
  date: string
  time: string
  compartment: number
  weight: number
  caloriesPer100g: number
  sugarPer100g: number
  sodiumPer100g: number
}

// Calculate nutrition based on meal weight
export function nutrition(meal: Meal) {
  const factor = meal.weight / 100

  return {
    calories: meal.caloriesPer100g * factor,
    sugar: meal.sugarPer100g * factor,
    sodium: meal.sodiumPer100g * factor,
  }
}

// Generate a date relative to today
export function dateOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}