
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

// Sample meal history
export const sampleMeals: Meal[] = [
  {
    id: 1,
    food: 'White Rice',
    emoji: '🍚',
    date: dateOffset(0),
    time: '12:15 PM',
    compartment: 1,
    weight: 150,
    caloriesPer100g: 130,
    sugarPer100g: 0.1,
    sodiumPer100g: 1,
  },
  {
    id: 2,
    food: 'Chicken Adobo',
    emoji: '🍗',
    date: dateOffset(0),
    time: '12:15 PM',
    compartment: 2,
    weight: 120,
    caloriesPer100g: 190,
    sugarPer100g: 1.5,
    sodiumPer100g: 600,
  },
  {
    id: 3,
    food: 'Steamed Broccoli',
    emoji: '🥦',
    date: dateOffset(0),
    time: '12:15 PM',
    compartment: 3,
    weight: 80,
    caloriesPer100g: 35,
    sugarPer100g: 1.4,
    sodiumPer100g: 33,
  },
  {
    id: 4,
    food: 'Brown Rice',
    emoji: '🍚',
    date: dateOffset(1),
    time: '12:30 PM',
    compartment: 1,
    weight: 160,
    caloriesPer100g: 123,
    sugarPer100g: 0.4,
    sodiumPer100g: 4,
  },
  {
    id: 5,
    food: 'Chicken Tinola',
    emoji: '🍲',
    date: dateOffset(1),
    time: '12:30 PM',
    compartment: 2,
    weight: 180,
    caloriesPer100g: 85,
    sugarPer100g: 0.8,
    sodiumPer100g: 280,
  },
  {
    id: 6,
    food: 'Banana',
    emoji: '🍌',
    date: dateOffset(2),
    time: '10:10 AM',
    compartment: 3,
    weight: 100,
    caloriesPer100g: 89,
    sugarPer100g: 12.2,
    sodiumPer100g: 1,
  },
  {
    id: 7,
    food: 'Sinigang',
    emoji: '🥣',
    date: dateOffset(5),
    time: '1:05 PM',
    compartment: 2,
    weight: 200,
    caloriesPer100g: 75,
    sugarPer100g: 1.2,
    sodiumPer100g: 350,
  },
  {
    id: 8,
    food: 'Boiled Egg',
    emoji: '🥚',
    date: dateOffset(10),
    time: '8:20 AM',
    compartment: 1,
    weight: 55,
    caloriesPer100g: 155,
    sugarPer100g: 1.1,
    sodiumPer100g: 124,
  },
]
