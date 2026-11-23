import { API_BASE_URL } from './api'
import type { Meal } from '../types/meals'

// ============================================
// SustansyaBox — meals saved in MySQL (meals.php)
// ============================================

type MealRow = {
  id: number
  food: string
  emoji: string
  compartment: number
  weight: number
  caloriesPer100g: number
  sugarPer100g: number
  sodiumPer100g: number
  eatenAt: string // "YYYY-MM-DD HH:MM:SS"
}

export type NewMeal = Omit<Meal, 'id' | 'date' | 'time'>

type ApiResult = {
  success: boolean
  message?: string
  meals?: MealRow[]
  meal?: MealRow
}

/** Thrown when the PHP session has expired. */
export class SessionExpiredError extends Error {}

const pad = (value: number) => String(value).padStart(2, '0')

// "2026-11-23 13:05:00" → { date: "2026-11-23", time: "1:05 PM" }
function splitDateTime(eatenAt: string): { date: string; time: string } {
  const [date, clock = '00:00:00'] = eatenAt.split(' ')
  const [hour, minute] = clock.split(':').map(Number)
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12

  return { date, time: `${hour12}:${pad(minute || 0)} ${period}` }
}

function toMeal(row: MealRow): Meal {
  return {
    id: row.id,
    food: row.food,
    emoji: row.emoji,
    compartment: row.compartment,
    weight: row.weight,
    caloriesPer100g: row.caloriesPer100g,
    sugarPer100g: row.sugarPer100g,
    sodiumPer100g: row.sodiumPer100g,
    ...splitDateTime(row.eatenAt),
  }
}

// Local time as "YYYY-MM-DD HH:MM:SS"
function localDateTime(date = new Date()): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

async function request(path: string, init: RequestInit = {}): Promise<ApiResult> {
  const response = await fetch(`${API_BASE_URL}/${path}`, {
    ...init,
    credentials: 'include',
    headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
  })

  if (!(response.headers.get('content-type') ?? '').includes('application/json')) {
    throw new Error('The meals server did not return JSON. Check meals.php in XAMPP.')
  }

  const result = (await response.json()) as ApiResult

  if (response.status === 401) {
    throw new SessionExpiredError(result.message || 'Please sign in again.')
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Meal request failed.')
  }

  return result
}

export async function fetchMeals(): Promise<Meal[]> {
  const result = await request('meals.php')
  return (result.meals ?? []).map(toMeal)
}

export async function saveMeals(items: NewMeal[]): Promise<Meal[]> {
  const eatenAt = localDateTime()
  const result = await request('meals.php', {
    method: 'POST',
    body: JSON.stringify({
      meals: items.map(item => ({ ...item, eatenAt })),
    }),
  })
  return (result.meals ?? []).map(toMeal)
}

export async function updateMeal(
  id: number,
  changes: { food: string; date: string; compartment: number }
): Promise<Meal> {
  const result = await request('meals.php', {
    method: 'PATCH',
    body: JSON.stringify({ id, ...changes }),
  })
  if (!result.meal) throw new Error('Meal update failed.')
  return toMeal(result.meal)
}

export async function deleteMeal(id: number): Promise<void> {
  await request(`meals.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}