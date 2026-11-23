import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import {
  Apple,
  CalendarDays,
  Candy,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Droplets,
  Flame,
  Info,
  Moon,
  Plus,
  Search,
  Sun,
  Sunrise,
  Trash2,
  AlertTriangle,
  Undo2,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react'

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'

export type Food = {
  id: number
  name: string
  emoji: string
  calories: number
  sugar: number
  sodium: number
  serving: string
}

type PlannedMeal = {
  id: number
  date: string
  mealType: MealType
  food: Food
  /** servings: 0.5, 1, 1.5 or 2 */
  portion: number
}


const foods: Food[] = [
  { id: 1, name: 'White Rice', emoji: '🍚', calories: 195, sugar: 0.2, sodium: 2, serving: '150 g' },
  { id: 2, name: 'Brown Rice', emoji: '🍚', calories: 185, sugar: 0.6, sodium: 6, serving: '150 g' },
  { id: 3, name: 'Chicken Adobo', emoji: '🍗', calories: 228, sugar: 1.8, sodium: 720, serving: '120 g' },
  { id: 4, name: 'Chicken Tinola', emoji: '🍲', calories: 153, sugar: 1.4, sodium: 504, serving: '180 g' },
  { id: 5, name: 'Sinigang', emoji: '🥣', calories: 150, sugar: 2.4, sodium: 700, serving: '200 g' },
  { id: 6, name: 'Steamed Broccoli', emoji: '🥦', calories: 28, sugar: 1.1, sodium: 26, serving: '80 g' },
  { id: 7, name: 'Boiled Egg', emoji: '🥚', calories: 85, sugar: 0.6, sodium: 68, serving: '55 g' },
  { id: 8, name: 'Banana', emoji: '🍌', calories: 89, sugar: 12.2, sodium: 1, serving: '100 g' },
  { id: 9, name: 'Oatmeal', emoji: '🥣', calories: 150, sugar: 1, sodium: 5, serving: '1 bowl' },
  { id: 10, name: 'Grilled Fish', emoji: '🐟', calories: 165, sugar: 0, sodium: 90, serving: '120 g' },
  { id: 11, name: 'Fresh Mango', emoji: '🥭', calories: 99, sugar: 22.5, sodium: 2, serving: '165 g' },
  { id: 12, name: 'Vegetable Salad', emoji: '🥗', calories: 75, sugar: 4, sodium: 45, serving: '1 bowl' },
]

const mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

// Icon + colour slot (1–4) for each meal; colours live in the CSS theme below.
const mealMeta: Record<MealType, { icon: LucideIcon; slot: number }> = {
  Breakfast: { icon: Sunrise, slot: 1 },
  Lunch: { icon: Sun, slot: 2 },
  Dinner: { icon: Moon, slot: 3 },
  Snacks: { icon: Apple, slot: 4 },
}

// General daily reference values — used only for the progress visuals.
const DAILY_REFERENCE = {
  calories: 2000,
  sugar: 50,
  sodium: 2000,
}

// A single meal is flagged when it reaches 30% of the daily reference.
const MEAL_WARNING = {
  sugar: 15,
  sodium: 600,
}

const PORTIONS = [0.5, 1, 1.5, 2]

function portionLabel(portion: number) {
  return portion === 0.5 ? '½×' : `${portion}×`
}

const RING_RADIUS = 34
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  result.setDate(result.getDate() - result.getDay())
  return result
}

function formatNumber(value: number, decimals = 0) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  })
}

function percentOf(value: number, max: number): number {
  return Math.min(100, max > 0 ? (value / max) * 100 : 0)
}

// low = under 50% of the reference, mid = 50–79%, high = 80% and up
function levelOf(percent: number): 'low' | 'mid' | 'high' {
  if (percent >= 80) return 'high'
  if (percent >= 50) return 'mid'
  return 'low'
}

// Smoothly counts a number from its previous value to the new one.
function useCountUp(value: number, duration = 650): number {
  const [display, setDisplay] = useState(value)
  const current = useRef(value)

  useEffect(() => {
    const from = current.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce || from === value) {
      current.current = value
      setDisplay(value)
      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number): void => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = from + (value - from) * eased

      current.current = next
      setDisplay(next)

      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return display
}

const today = new Date()
const initialDate = dateKey(today)

// Plans are saved in this browser, separately for each account.
const planKey = (userKey: string) =>
  `sustansyabox_meal_plan_${userKey.trim().toLowerCase() || 'guest'}`

function loadPlan(userKey: string): PlannedMeal[] {
  try {
    const stored = localStorage.getItem(planKey(userKey))
    const parsed: unknown = stored ? JSON.parse(stored) : []
    if (!Array.isArray(parsed)) return []

    // Re-link each saved item to the current food catalog
    return parsed.flatMap((item): PlannedMeal[] => {
      const food = foods.find(entry => entry.id === item?.food?.id)
      return food &&
        typeof item.id === 'number' &&
        typeof item.date === 'string' &&
        mealTypes.includes(item.mealType) &&
        typeof item.portion === 'number'
        ? [{ id: item.id, date: item.date, mealType: item.mealType, food, portion: item.portion }]
        : []
    })
  } catch {
    return []
  }
}

type MealPlannerProps = {
  /** Usually the user's email — keeps each account's plan separate. */
  userKey?: string
  calorieGoal?: number
  sugarGoal?: number
  sodiumGoal?: number
}

export default function MealPlanner({
  userKey = '',
  calorieGoal,
  sugarGoal,
  sodiumGoal,
}: MealPlannerProps) {
  // Personal daily targets (fallback: general reference)
  const reference = {
    calories: calorieGoal || DAILY_REFERENCE.calories,
    sugar: sugarGoal || DAILY_REFERENCE.sugar,
    sodium: sodiumGoal || DAILY_REFERENCE.sodium,
  }

  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>(() => loadPlan(userKey))

  useEffect(() => {
    setPlannedMeals(loadPlan(userKey))
  }, [userKey])

  useEffect(() => {
    try {
      localStorage.setItem(planKey(userKey), JSON.stringify(plannedMeals))
    } catch {
      // Browser storage may be unavailable.
    }
  }, [plannedMeals, userKey])

  const [showFoodModal, setShowFoodModal] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<MealType>('Lunch')

  const [search, setSearch] = useState('')
  const [notification, setNotification] = useState('')
  const [undoMeal, setUndoMeal] = useState<PlannedMeal | null>(null)

  const [recentIds, setRecentIds] = useState<number[]>([])

  const [copyOpen, setCopyOpen] = useState(false)
  const [copyTargets, setCopyTargets] = useState<string[]>([])

  const rootRef = useRef<HTMLDivElement>(null)

  // Green-blob page background (same as Smart Lunchbox and Meal History)
  useEffect(() => {
    const host =
      rootRef.current?.closest('main') ?? rootRef.current?.parentElement

    if (!host) return

    host.classList.add('sb-page-bg')

    return () => host.classList.remove('sb-page-bg')
  }, [])

  // Toast hides by itself
  useEffect(() => {
    if (!notification) return

    // a little longer when the toast offers Undo
    const timer = window.setTimeout(
      () => {
        setNotification('')
        setUndoMeal(null)
      },
      undoMeal ? 6000 : 3500
    )

    return () => window.clearTimeout(timer)
  }, [notification, undoMeal])

  // Close the copy menu when the day changes
  useEffect(() => {
    setCopyOpen(false)
    setCopyTargets([])
  }, [selectedDate])

  // Escape closes the food picker
  useEffect(() => {
    if (!showFoodModal) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowFoodModal(false)
    }

    document.addEventListener('keydown', onKey)

    return () => document.removeEventListener('keydown', onKey)
  }, [showFoodModal])

  const selectedDateObject = new Date(`${selectedDate}T12:00:00`)
  const weekStart = startOfWeek(selectedDateObject)
  const todayKey = dateKey(new Date())

  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index)
  )

  const dailyMeals = plannedMeals.filter(meal => meal.date === selectedDate)

  const totals = dailyMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.food.calories * meal.portion,
      sugar: acc.sugar + meal.food.sugar * meal.portion,
      sodium: acc.sodium + meal.food.sodium * meal.portion,
    }),
    { calories: 0, sugar: 0, sodium: 0 }
  )

  const animatedCalories = useCountUp(totals.calories)
  const animatedSugar = useCountUp(totals.sugar)
  const animatedSodium = useCountUp(totals.sodium)

  const caloriePercent = percentOf(totals.calories, reference.calories)
  const sugarPercent = percentOf(totals.sugar, reference.sugar)
  const sodiumPercent = percentOf(totals.sodium, reference.sodium)

  const mealSplit = mealTypes.map(type => {
    const calories = dailyMeals
      .filter(meal => meal.mealType === type)
      .reduce((sum, meal) => sum + meal.food.calories * meal.portion, 0)

    return {
      type,
      slot: mealMeta[type].slot,
      calories,
      percent: percentOf(calories, totals.calories),
    }
  })

  const filteredFoods = useMemo(
    () =>
      foods.filter(food =>
        food.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  )

  const openAddModal = (type: MealType) => {
    setSelectedMealType(type)
    setSearch('')
    setShowFoodModal(true)
  }

  const addFood = (food: Food) => {
    setPlannedMeals(previous => [
      ...previous,
      {
        id: Date.now() + Math.random(),
        date: selectedDate,
        mealType: selectedMealType,
        food,
        portion: 1,
      },
    ])

    setRecentIds(previous =>
      [food.id, ...previous.filter(id => id !== food.id)].slice(0, 5)
    )

    setShowFoodModal(false)
    setUndoMeal(null)
    setNotification(`${food.name} added to ${selectedMealType}.`)
  }

  const removeFood = (id: number) => {
    const removed = plannedMeals.find(meal => meal.id === id)

    setPlannedMeals(previous => previous.filter(meal => meal.id !== id))
    setUndoMeal(removed ?? null)
    setNotification(`${removed?.food.name ?? 'Food'} removed.`)
  }

  const undoRemove = () => {
    if (!undoMeal) return

    const restored = undoMeal

    setPlannedMeals(previous => [...previous, restored])
    setUndoMeal(null)
    setNotification(`${restored.food.name} restored.`)
  }

  // ½× → 1× → 1.5× → 2× → ½× …
  const cyclePortion = (id: number) => {
    setPlannedMeals(previous =>
      previous.map(meal => {
        if (meal.id !== id) return meal

        const index = PORTIONS.indexOf(meal.portion)

        return {
          ...meal,
          portion: PORTIONS[(index + 1) % PORTIONS.length],
        }
      })
    )
  }

  const toggleCopyTarget = (key: string) => {
    setCopyTargets(previous =>
      previous.includes(key)
        ? previous.filter(item => item !== key)
        : [...previous, key]
    )
  }

  const copyDay = () => {
    if (dailyMeals.length === 0) {
      setUndoMeal(null)
      setNotification('Nothing to copy yet — add a food first.')
      return
    }

    if (copyTargets.length === 0) return

    setPlannedMeals(previous => [
      ...previous,
      ...copyTargets.flatMap((target, dayIndex) =>
        dailyMeals.map((meal, mealIndex) => ({
          ...meal,
          id: Date.now() + dayIndex * 100 + mealIndex + Math.random(),
          date: target,
        }))
      ),
    ])

    setUndoMeal(null)
    setNotification(
      `Copied to ${copyTargets.length} ${copyTargets.length === 1 ? 'day' : 'days'}.`
    )
    setCopyOpen(false)
    setCopyTargets([])
  }

  const recentFoods = recentIds
    .map(id => foods.find(food => food.id === id))
    .filter((food): food is Food => Boolean(food))

  const changeWeek = (direction: number) => {
    const next = addDays(selectedDateObject, direction * 7)
    setSelectedDate(dateKey(next))
  }

  const selectedDateLabel = selectedDateObject.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const weekLabel = `${weekDays[0].toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${weekDays[6].toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        ref={rootRef}
        className="mp-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <style>{`
          /* ================= PAGE BACKGROUND — green blobs ================= */
          .sb-page-bg {
            background:
              radial-gradient(circle at 15% 15%, rgba(190, 222, 160, 0.5) 0, transparent 40%),
              radial-gradient(circle at 85% 30%, rgba(205, 232, 190, 0.45) 0, transparent 40%),
              radial-gradient(circle at 60% 95%, rgba(185, 220, 165, 0.4) 0, transparent 45%),
              #f8faf5 !important;
            background-attachment: fixed !important;
          }
          :is([data-theme="dark"], [data-mode="dark"], .dark, .dark-mode, .theme-dark) .sb-page-bg,
          :is([data-theme="dark"], [data-mode="dark"], .dark, .dark-mode, .theme-dark).sb-page-bg {
            background:
              radial-gradient(circle at 15% 15%, rgba(180, 225, 140, 0.14) 0, transparent 40%),
              radial-gradient(circle at 85% 30%, rgba(200, 235, 170, 0.1) 0, transparent 40%),
              radial-gradient(circle at 60% 95%, rgba(170, 215, 140, 0.12) 0, transparent 45%),
              #0f1612 !important;
            background-attachment: fixed !important;
          }

          /* ================= THEME TOKENS ================= */
          .mp-page {
            /* Space taken by the app's page title + paddings. Raise it if a
               page scrollbar appears, lower it to fill more of the screen. */
            --mp-offset: 96px;

            --mp-text: var(--text, #243e32);
            --mp-muted: var(--muted, #6f8176);
            --mp-border: var(--border, #e2eadc);
            --mp-surface: var(--surface, #ffffff);
            --mp-bg: var(--bg, #f5f7f3);
            --mp-primary: var(--primary, #45634d);

            --mp-ink: #1f3d2c;
            --mp-glass: rgba(255, 255, 255, 0.82);
            --mp-soft: #e8f0e3;
            --mp-track: #e3eadf;
            --mp-accent: #5f8f68;
            --mp-glow: rgba(95, 143, 104, 0.28);
            --mp-ok: #5f9a6c;
            --mp-mid: #c98a2b;
            --mp-high: #c4544c;
            --mp-btn: #45634d;
            --mp-btn-hover: #344f3c;
            --mp-btn-text: #ffffff;
            --mp-active: #45634d;
            --mp-active-text: #ffffff;
            --mp-toast: #45634d;
            --mp-overlay: rgba(20, 32, 25, 0.55);
            --mp-danger-bg: #fde8e7;
            --mp-danger: #c0392b;

            --mp-m1: #d99a2b;
            --mp-m2: #d26a3a;
            --mp-m3: #6a63c4;
            --mp-m4: #2f9a7f;
          }

          :is([data-theme="dark"], [data-mode="dark"], .dark, .dark-mode, .theme-dark) .mp-page {
            --mp-ink: #eef6e6;
            --mp-glass: rgba(22, 36, 29, 0.82);
            --mp-soft: #243b2e;
            --mp-track: #2a3f32;
            --mp-accent: #a9cf92;
            --mp-glow: rgba(169, 207, 146, 0.24);
            --mp-ok: #8cc77a;
            --mp-mid: #e2b15f;
            --mp-high: #ee8b80;
            --mp-btn: #bbd5a3;
            --mp-btn-hover: #cfe3bc;
            --mp-btn-text: #173c2a;
            --mp-active: #bbd5a3;
            --mp-active-text: #173c2a;
            --mp-toast: #3d6b4a;
            --mp-overlay: rgba(5, 12, 8, 0.7);
            --mp-danger-bg: #4c2d30;
            --mp-danger: #ffb4af;

            --mp-m1: #efc068;
            --mp-m2: #ee9a6c;
            --mp-m3: #a7a2f0;
            --mp-m4: #6fd0b3;
          }

          /* ================= SHELL — fits the screen, no page scroll ================= */
          .mp-page {
            width: 100%;
            max-width: 1600px;
            margin: 0 auto;
            height: calc(100dvh - var(--mp-offset));
            min-height: 560px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            overflow: hidden;
            box-sizing: border-box;
            color: var(--mp-text);
            font-family: 'DM Sans', sans-serif;
          }

          .mp-page *,
          .mp-page *::before,
          .mp-page *::after {
            box-sizing: border-box;
          }

          .mp-page button,
          .mp-page input {
            font-family: inherit;
          }

          .mp-page button {
            cursor: pointer;
          }

          .mp-page button:focus-visible,
          .mp-page input:focus-visible {
            outline: 2px solid var(--mp-accent);
            outline-offset: 2px;
          }

          .mp-num {
            font-family: 'Manrope', sans-serif;
            font-variant-numeric: tabular-nums;
          }

          .mp-card {
            min-width: 0;
            border: 1px solid var(--mp-border);
            border-radius: 18px;
            background: var(--mp-glass);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: background-color 0.35s ease, border-color 0.35s ease;
          }

          /* ================= HEADER ================= */
          .mp-top {
            flex: 0 0 auto;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 14px;
            flex-wrap: wrap;
          }

          .mp-eyebrow {
            margin: 0 0 4px;
            font-family: 'Manrope', sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.3px;
            color: var(--mp-primary);
          }

          .mp-title {
            margin: 0;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: clamp(22px, 2vw, 29px);
            font-weight: 700;
            letter-spacing: -0.6px;
            line-height: 1.1;
            color: var(--mp-ink);
          }

          .mp-sub {
            margin: 4px 0 0;
            font-size: 12px;
            color: var(--mp-muted);
          }

          .mp-nav {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .mp-week-label {
            margin-right: 4px;
            font-size: 12px;
            font-weight: 700;
            color: var(--mp-muted);
            white-space: nowrap;
          }

          .mp-btn {
            height: 38px;
            min-width: 38px;
            padding: 0 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border-radius: 11px;
            border: 1px solid var(--mp-border);
            background: var(--mp-surface);
            color: var(--mp-text);
            font-size: 12px;
            font-weight: 700;
            transition: background-color 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
          }

          .mp-btn:hover {
            transform: translateY(-1px);
            border-color: var(--mp-accent);
          }

          /* ================= WEEK STRIP ================= */
          .mp-week {
            flex: 0 0 auto;
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 8px;
          }

          .mp-day {
            position: relative;
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            padding: 9px 6px 10px;
            border-radius: 14px;
            border: 1px solid var(--mp-border);
            background: var(--mp-glass);
            color: var(--mp-text);
            transition: background-color 0.25s ease, border-color 0.25s ease, transform 0.25s ease, color 0.25s ease;
          }

          .mp-day:hover {
            transform: translateY(-2px);
            border-color: var(--mp-accent);
          }

          .mp-day.is-active {
            background: var(--mp-active);
            border-color: var(--mp-active);
            color: var(--mp-active-text);
            box-shadow: 0 8px 20px var(--mp-glow);
          }

          .mp-day-name {
            font-size: 11px;
            font-weight: 700;
            opacity: 0.8;
          }

          .mp-day-date {
            font-size: 20px;
            font-weight: 800;
            line-height: 1.1;
          }

          .mp-day-note {
            font-size: 10px;
            opacity: 0.8;
            white-space: nowrap;
          }

          .mp-day-bar {
            width: 70%;
            height: 4px;
            margin-top: 4px;
            border-radius: 4px;
            background: var(--mp-track);
            overflow: hidden;
          }

          .mp-day.is-active .mp-day-bar {
            background: rgba(255, 255, 255, 0.25);
          }

          .mp-day-bar > span {
            display: block;
            height: 100%;
            border-radius: 4px;
            background: var(--mp-accent);
          }

          .mp-day.is-active .mp-day-bar > span {
            background: var(--mp-active-text);
          }

          .mp-today-dot {
            position: absolute;
            top: 8px;
            right: 9px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--mp-accent);
          }

          .mp-day.is-active .mp-today-dot {
            background: var(--mp-active-text);
          }

          /* ================= BENTO ================= */
          .mp-bento {
            flex: 1 1 auto;
            min-height: 0;
            display: grid;
            grid-template-columns: minmax(0, 1fr) clamp(290px, 24vw, 370px);
            gap: 12px;
          }

          .mp-meals {
            min-height: 0;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-rows: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .mp-meal {
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 14px 16px;
            overflow: hidden;
          }

          .mp-meal-head {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-shrink: 0;
          }

          .mp-meal-icon {
            width: 38px;
            height: 38px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            border-radius: 12px;
            color: var(--mp-m);
            background: color-mix(in srgb, var(--mp-m) 14%, transparent);
          }

          .mp-meal-title {
            flex: 1;
            min-width: 0;
          }

          .mp-meal-title strong {
            display: block;
            font-size: 15px;
          }

          .mp-meal-title span {
            font-size: 11px;
            color: var(--mp-muted);
          }

          .mp-add {
            width: 36px;
            height: 36px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            border-radius: 11px;
            border: 1px solid var(--mp-border);
            background: var(--mp-surface);
            color: var(--mp-m);
            transition: transform 0.25s ease, background-color 0.25s ease, border-color 0.25s ease;
          }

          .mp-add:hover {
            transform: rotate(90deg) scale(1.08);
            border-color: var(--mp-m);
            background: color-mix(in srgb, var(--mp-m) 12%, var(--mp-surface));
          }

          .mp-meal-bar {
            height: 3px;
            flex-shrink: 0;
            border-radius: 3px;
            background: var(--mp-track);
            overflow: hidden;
          }

          .mp-meal-bar > span {
            display: block;
            height: 100%;
            background: var(--mp-m);
          }

          .mp-items {
            flex: 1 1 auto;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 7px;
            overflow-y: auto;
            scrollbar-width: thin;
            padding-right: 2px;
          }

          .mp-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            border-radius: 12px;
            border: 1px solid var(--mp-border);
            background: var(--mp-surface);
            flex-shrink: 0;
          }

          .mp-item-emoji {
            width: 36px;
            height: 36px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            border-radius: 10px;
            font-size: 20px;
            background: color-mix(in srgb, var(--mp-m) 12%, transparent);
          }

          .mp-item-info {
            flex: 1;
            min-width: 0;
          }

          .mp-item-info strong {
            display: block;
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .mp-item-info span {
            font-size: 11px;
            color: var(--mp-muted);
          }

          .mp-delete {
            width: 32px;
            height: 32px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            border-radius: 9px;
            border: 1px solid var(--mp-border);
            background: transparent;
            color: var(--mp-muted);
            transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
          }

          .mp-delete:hover {
            background: var(--mp-danger-bg);
            color: var(--mp-danger);
            border-color: var(--mp-danger);
          }

          .mp-empty {
            flex: 1 1 auto;
            min-height: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border-radius: 14px;
            border: 1.5px dashed var(--mp-border);
            background: transparent;
            color: var(--mp-muted);
            font-size: 12px;
            transition: border-color 0.25s ease, background-color 0.25s ease, color 0.25s ease;
          }

          .mp-empty:hover {
            border-color: var(--mp-m);
            color: var(--mp-m);
            background: color-mix(in srgb, var(--mp-m) 6%, transparent);
          }

          .mp-empty svg {
            animation: mpBob 3.2s ease-in-out infinite;
          }

          @keyframes mpBob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }

          /* ================= SUMMARY ASIDE ================= */
          .mp-aside {
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .mp-summary {
            flex: 1 1 auto;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px 18px;
          }

          .mp-summary-label {
            display: flex;
            align-items: center;
            gap: 7px;
            margin: 0;
            font-size: 12px;
            font-weight: 700;
            color: var(--mp-muted);
          }

          .mp-ring-row {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .mp-ring-wrap {
            position: relative;
            flex-shrink: 0;
            display: grid;
            place-items: center;
          }

          .mp-ring {
            width: clamp(84px, 7vw, 108px);
            height: clamp(84px, 7vw, 108px);
            transform: rotate(-90deg);
          }

          .mp-ring-track {
            stroke: var(--mp-track);
          }

          .mp-ring-bar {
            stroke: var(--mp-accent);
          }

          .mp-ring-glow {
            position: absolute;
            inset: 6px;
            border-radius: 50%;
            pointer-events: none;
            animation: mpGlow 1.3s ease-out 0.5s both;
          }

          @keyframes mpGlow {
            0% { box-shadow: 0 0 0 0 var(--mp-glow); }
            40% { box-shadow: 0 0 0 10px var(--mp-glow); }
            100% { box-shadow: 0 0 0 20px transparent; }
          }

          .mp-kcal {
            font-size: clamp(26px, 2.4vw, 36px);
            font-weight: 800;
            line-height: 1;
            letter-spacing: -1px;
            color: var(--mp-ink);
          }

          .mp-kcal small {
            margin-left: 4px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0;
            color: var(--mp-muted);
          }

          .mp-meta {
            margin: 4px 0 0;
            font-size: 11px;
            color: var(--mp-muted);
          }

          .mp-meter-top {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 8px;
          }

          .mp-meter-top span {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 700;
            color: var(--mp-muted);
          }

          .mp-meter-top span svg {
            color: var(--mp-primary);
          }

          .mp-meter-top b {
            font-size: 17px;
            font-weight: 800;
            color: var(--mp-ink);
            transition: color 0.4s ease;
          }

          .mp-meter-top b small {
            margin-left: 2px;
            font-size: 11px;
            color: var(--mp-muted);
          }

          .mp-meter.mid .mp-meter-top b { color: var(--mp-mid); }
          .mp-meter.high .mp-meter-top b { color: var(--mp-high); }

          .mp-bar {
            position: relative;
            height: 8px;
            margin-top: 6px;
            border-radius: 8px;
            background: var(--mp-track);
            overflow: hidden;
          }

          .mp-bar > span {
            position: relative;
            display: block;
            height: 100%;
            border-radius: 8px;
            background: var(--mp-ok);
            overflow: hidden;
            transition: width 0.6s ease, background-color 0.4s ease;
          }

          .mp-meter.mid .mp-bar > span { background: var(--mp-mid); }
          .mp-meter.high .mp-bar > span { background: var(--mp-high); }

          /* moving shine on the bar */
          .mp-bar > span::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
            animation: mpShine 1.8s linear infinite;
          }

          @keyframes mpShine {
            from { transform: translateX(-100%); }
            to { transform: translateX(100%); }
          }

          .mp-meter p {
            margin: 4px 0 0;
            font-size: 10px;
            color: var(--mp-muted);
          }

          .mp-divider {
            height: 1px;
            background: var(--mp-border);
          }

          .mp-split {
            display: flex;
            height: 10px;
            border-radius: 10px;
            overflow: hidden;
            background: var(--mp-track);
          }

          .mp-split > span {
            display: block;
            height: 100%;
          }

          .mp-legend {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px 12px;
            font-size: 11px;
            color: var(--mp-muted);
          }

          .mp-legend span {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .mp-legend i {
            width: 9px;
            height: 9px;
            border-radius: 3px;
            flex-shrink: 0;
          }

          .mp-legend b {
            margin-left: auto;
            color: var(--mp-text);
          }

          .mp-note {
            flex: 0 0 auto;
            display: flex;
            align-items: flex-start;
            gap: 7px;
            margin: 0;
            padding: 0 4px;
            font-size: 11px;
            line-height: 1.5;
            color: var(--mp-muted);
          }

          .mp-note svg {
            flex-shrink: 0;
            margin-top: 2px;
          }

          /* ================= MODAL + TOAST ================= */
          .mp-overlay {
            position: fixed;
            inset: 0;
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            background: var(--mp-overlay);
            backdrop-filter: blur(3px);
          }

          .mp-modal {
            width: 100%;
            max-width: 540px;
            max-height: 85vh;
            display: flex;
            flex-direction: column;
            padding: 22px;
            border-radius: 22px;
            border: 1px solid var(--mp-border);
            background: var(--mp-surface);
            color: var(--mp-text);
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.22);
          }

          .mp-modal-head {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 14px;
          }

          .mp-modal-head h2 {
            margin: 0 0 4px;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 23px;
            letter-spacing: -0.4px;
            color: var(--mp-ink);
          }

          .mp-search {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0 12px;
            margin-bottom: 12px;
            border-radius: 12px;
            border: 1px solid var(--mp-border);
            background: var(--mp-bg);
          }

          .mp-search:focus-within {
            border-color: var(--mp-accent);
          }

          .mp-search input {
            flex: 1;
            width: 100%;
            border: 0;
            outline: none;
            background: transparent;
            color: var(--mp-text);
            padding: 12px 0;
            font-size: 13px;
          }

          .mp-food-list {
            flex: 1 1 auto;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
            overflow-y: auto;
            padding: 2px;
          }

          .mp-food {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 12px;
            border: 1px solid var(--mp-border);
            background: var(--mp-bg);
            color: var(--mp-text);
            text-align: left;
            transition: border-color 0.2s ease, transform 0.2s ease;
          }

          .mp-food:hover {
            border-color: var(--mp-accent);
            transform: translateX(2px);
          }

          .mp-food strong {
            display: block;
            font-size: 13px;
            margin-bottom: 3px;
          }

          .mp-food span.mp-food-meta {
            font-size: 11px;
            color: var(--mp-muted);
          }

          .mp-toast {
            position: fixed;
            right: 24px;
            bottom: 24px;
            z-index: 110;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 15px;
            border-radius: 12px;
            background: var(--mp-toast);
            color: #ffffff;
            font-size: 12px;
            font-weight: 650;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
          }

          .mp-toast button {
            border: 0;
            background: transparent;
            color: inherit;
            display: inline-flex;
            padding: 2px;
          }

          /* ================= NEW FEATURES ================= */
          .mp-meal-title strong {
            display: flex !important;
            align-items: center;
            gap: 7px;
            flex-wrap: wrap;
          }

          .mp-warning {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border-radius: 99px;
            font-style: normal;
            font-size: 10px;
            font-weight: 800;
            color: var(--mp-high);
            background: color-mix(in srgb, var(--mp-high) 14%, transparent);
            border: 1px solid color-mix(in srgb, var(--mp-high) 35%, transparent);
          }

          .mp-portion {
            min-width: 44px;
            height: 30px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            overflow: hidden;
            border-radius: 9px;
            border: 1px solid var(--mp-border);
            background: var(--mp-bg);
            color: var(--mp-text);
            font-family: 'Manrope', sans-serif;
            font-size: 12px;
            font-weight: 800;
            transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
          }

          .mp-portion:hover {
            border-color: var(--mp-m);
          }

          .mp-portion.changed {
            border-color: var(--mp-m);
            color: var(--mp-m);
            background: color-mix(in srgb, var(--mp-m) 12%, transparent);
          }

          .mp-summary-head {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          .mp-copy-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            border-radius: 99px;
            border: 1px solid var(--mp-border);
            background: var(--mp-surface);
            color: var(--mp-text);
            font-size: 11px;
            font-weight: 700;
            transition: border-color 0.2s ease;
          }

          .mp-copy-btn:hover,
          .mp-copy-btn[aria-expanded="true"] {
            border-color: var(--mp-accent);
          }

          .mp-copy-menu {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            z-index: 20;
            width: min(300px, 80vw);
            padding: 14px;
            border-radius: 16px;
            border: 1px solid var(--mp-border);
            background: var(--mp-surface);
            box-shadow: 0 18px 44px rgba(20, 38, 26, 0.18);
          }

          .mp-copy-days {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
          }

          .mp-copy-days button {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1px;
            padding: 7px 4px;
            border-radius: 10px;
            border: 1px solid var(--mp-border);
            background: var(--mp-bg);
            color: var(--mp-muted);
            font-size: 11px;
            font-weight: 700;
            transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
          }

          .mp-copy-days button b {
            font-size: 15px;
            color: var(--mp-text);
          }

          .mp-copy-days button.on {
            border-color: var(--mp-accent);
            background: var(--mp-soft);
            color: var(--mp-primary);
          }

          .mp-copy-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
          }

          .mp-copy-actions .mp-btn {
            flex: 1;
          }

          .mp-btn-primary {
            border-color: var(--mp-btn) !important;
            background: var(--mp-btn) !important;
            color: var(--mp-btn-text) !important;
          }

          .mp-recent {
            margin-bottom: 12px;
          }

          .mp-recent > span {
            display: block;
            margin-bottom: 6px;
            font-size: 11px;
            font-weight: 700;
            color: var(--mp-muted);
          }

          .mp-recent > div {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .mp-recent button {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 11px;
            border-radius: 99px;
            border: 1px solid var(--mp-border);
            background: var(--mp-bg);
            color: var(--mp-text);
            font-size: 12px;
            font-weight: 600;
            transition: border-color 0.2s ease, transform 0.2s ease;
          }

          .mp-recent button:hover {
            border-color: var(--mp-m, var(--mp-accent));
            transform: translateY(-1px);
          }

          .mp-undo {
            display: inline-flex !important;
            align-items: center;
            gap: 5px;
            margin-left: 4px;
            padding: 4px 10px !important;
            border-radius: 99px;
            background: rgba(255, 255, 255, 0.18) !important;
            font-weight: 800;
            font-size: 12px;
          }

          .mp-undo:hover {
            background: rgba(255, 255, 255, 0.28) !important;
          }

          /* ================= RESPONSIVE ================= */
          @media (max-height: 780px) {
            .mp-sub { display: none; }
            .mp-day { padding: 7px 4px 8px; }
            .mp-day-date { font-size: 17px; }
            .mp-meal { padding: 11px 13px; gap: 8px; }
            .mp-summary { padding: 13px 15px; gap: 10px; }
          }

          @media (max-width: 1080px) {
            .mp-page { height: auto; min-height: 0; overflow: visible; }
            .mp-bento { grid-template-columns: 1fr; }
            .mp-meals { grid-template-rows: auto; }
            .mp-meal { min-height: 220px; }
            .mp-items { overflow: visible; }
          }

          @media (max-width: 640px) {
            .mp-meals { grid-template-columns: 1fr; }
            .mp-week { gap: 4px; }
            .mp-day { padding: 7px 2px; border-radius: 11px; }
            .mp-day-note { display: none; }
            .mp-week-label { display: none; }
          }

          @media (prefers-reduced-motion: reduce) {
            .mp-page *,
            .mp-page *::before,
            .mp-page *::after {
              animation: none !important;
              transition: none !important;
            }
          }
        `}</style>

        {/* ================= HEADER ================= */}
        <motion.header
          className="mp-top"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <p className="mp-eyebrow">PLAN AHEAD, EAT BETTER</p>
            <h2 className="mp-title">A little planning goes a long way.</h2>
            <p className="mp-sub">
              Organize your meals and preview your daily nutrition.
            </p>
          </div>

          <div className="mp-nav">
            <span className="mp-week-label">{weekLabel}</span>

            <button
              type="button"
              className="mp-btn"
              onClick={() => changeWeek(-1)}
              aria-label="Previous week"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              className="mp-btn"
              onClick={() => setSelectedDate(todayKey)}
            >
              <CalendarDays size={14} />
              Today
            </button>

            <button
              type="button"
              className="mp-btn"
              onClick={() => changeWeek(1)}
              aria-label="Next week"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.header>

        {/* ================= WEEK STRIP ================= */}
        <motion.div
          className="mp-week"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
        >
          {weekDays.map(date => {
            const key = dateKey(date)
            const active = key === selectedDate
            const isToday = key === todayKey
            const dayMeals = plannedMeals.filter(meal => meal.date === key)
            const dayCalories = dayMeals.reduce(
              (sum, meal) => sum + meal.food.calories * meal.portion,
              0
            )

            return (
              <button
                key={key}
                type="button"
                className={`mp-day ${active ? 'is-active' : ''}`}
                onClick={() => setSelectedDate(key)}
                aria-pressed={active}
                aria-label={`${date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}: ${dayMeals.length} planned, ${dayCalories} kcal`}
              >
                {isToday && <span className="mp-today-dot" />}

                <span className="mp-day-name">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>

                <strong className="mp-day-date mp-num">{date.getDate()}</strong>

                <span className="mp-day-note mp-num">
                  {dayMeals.length > 0
                    ? `${formatNumber(dayCalories)} kcal`
                    : isToday
                      ? 'Today'
                      : '—'}
                </span>

                <span className="mp-day-bar" aria-hidden="true">
                  <motion.span
                    initial={false}
                    animate={{
                      width: `${percentOf(dayCalories, reference.calories)}%`,
                    }}
                    transition={{ duration: 0.6 }}
                  />
                </span>
              </button>
            )
          })}
        </motion.div>

        {/* ================= BENTO ================= */}
        <div className="mp-bento">
          {/* MEAL TILES */}
          <div className="mp-meals">
            {mealTypes.map((type, index) => {
              const items = dailyMeals.filter(meal => meal.mealType === type)
              const Icon = mealMeta[type].icon
              const mealCalories = items.reduce(
                (sum, meal) => sum + meal.food.calories * meal.portion,
                0
              )
              const mealSugar = items.reduce(
                (sum, meal) => sum + meal.food.sugar * meal.portion,
                0
              )
              const mealSodium = items.reduce(
                (sum, meal) => sum + meal.food.sodium * meal.portion,
                0
              )
              const warning =
                mealSodium >= MEAL_WARNING.sodium
                  ? 'High sodium'
                  : mealSugar >= MEAL_WARNING.sugar
                    ? 'High sugar'
                    : null

              return (
                <motion.section
                  key={type}
                  className="mp-card mp-meal"
                  style={{
                    ['--mp-m' as string]: `var(--mp-m${mealMeta[type].slot})`,
                  }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.12 + index * 0.06 }}
                >
                  <div className="mp-meal-head">
                    <span className="mp-meal-icon">
                      <Icon size={19} />
                    </span>

                    <div className="mp-meal-title">
                      <strong>
                        {type}

                        <AnimatePresence>
                          {warning && (
                            <motion.em
                              key={warning}
                              className="mp-warning"
                              title={`This meal reaches 30% of the daily ${
                                warning === 'High sodium' ? 'sodium' : 'sugar'
                              } reference`}
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.6 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                            >
                              <AlertTriangle size={11} />
                              {warning}
                            </motion.em>
                          )}
                        </AnimatePresence>
                      </strong>
                      <span className="mp-num">
                        {items.length} {items.length === 1 ? 'item' : 'items'} ·{' '}
                        {formatNumber(mealCalories)} kcal
                      </span>
                    </div>

                    <button
                      type="button"
                      className="mp-add"
                      onClick={() => openAddModal(type)}
                      aria-label={`Add food to ${type}`}
                      title={`Add food to ${type}`}
                    >
                      <Plus size={17} />
                    </button>
                  </div>

                  <span className="mp-meal-bar" aria-hidden="true">
                    <motion.span
                      initial={false}
                      animate={{
                        width: `${percentOf(mealCalories, totals.calories)}%`,
                      }}
                      transition={{ duration: 0.6 }}
                    />
                  </span>

                  {items.length === 0 ? (
                    <button
                      type="button"
                      className="mp-empty"
                      onClick={() => openAddModal(type)}
                    >
                      <Utensils size={22} />
                      No foods planned yet
                      <strong style={{ fontSize: 12 }}>+ Add food</strong>
                    </button>
                  ) : (
                    <div className="mp-items">
                      <AnimatePresence initial={false}>
                        {items.map(meal => (
                          <motion.div
                            key={meal.id}
                            layout
                            className="mp-item"
                            initial={{ opacity: 0, y: -24, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 30, scale: 0.9 }}
                            transition={{
                              type: 'spring',
                              stiffness: 320,
                              damping: 20,
                            }}
                          >
                            <span className="mp-item-emoji" aria-hidden="true">
                              {meal.food.emoji}
                            </span>

                            <div className="mp-item-info">
                              <strong>{meal.food.name}</strong>
                              <span className="mp-num">
                                {formatNumber(meal.food.calories * meal.portion)} kcal ·{' '}
                                {meal.portion === 1
                                  ? meal.food.serving
                                  : `${portionLabel(meal.portion)} ${meal.food.serving}`}
                              </span>
                            </div>

                            <button
                              type="button"
                              className={`mp-portion ${meal.portion !== 1 ? 'changed' : ''}`}
                              onClick={() => cyclePortion(meal.id)}
                              title="Change portion (½×, 1×, 1.5×, 2×)"
                              aria-label={`Portion of ${meal.food.name}: ${portionLabel(
                                meal.portion
                              )}. Change portion`}
                            >
                              <AnimatePresence mode="popLayout" initial={false}>
                                <motion.span
                                  key={meal.portion}
                                  initial={{ y: -10, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  exit={{ y: 10, opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                >
                                  {portionLabel(meal.portion)}
                                </motion.span>
                              </AnimatePresence>
                            </button>

                            <button
                              type="button"
                              className="mp-delete"
                              title="Remove food"
                              aria-label={`Remove ${meal.food.name}`}
                              onClick={() => removeFood(meal.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                </motion.section>
              )
            })}
          </div>

          {/* DAY SUMMARY */}
          <motion.aside
            className="mp-aside"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            <section className="mp-card mp-summary">
              <div className="mp-summary-head">
                <p className="mp-summary-label">
                  <CalendarDays size={14} />
                  {selectedDateLabel}
                </p>

                <button
                  type="button"
                  className="mp-copy-btn"
                  aria-expanded={copyOpen}
                  onClick={() => setCopyOpen(open => !open)}
                >
                  <Copy size={13} />
                  Copy day
                </button>

                <AnimatePresence>
                  {copyOpen && (
                    <motion.div
                      className="mp-copy-menu"
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                    >
                      <p className="mp-summary-label" style={{ marginBottom: 8 }}>
                        Copy this day to…
                      </p>

                      <div className="mp-copy-days">
                        {weekDays.map(date => {
                          const key = dateKey(date)
                          if (key === selectedDate) return null

                          return (
                            <button
                              key={key}
                              type="button"
                              className={copyTargets.includes(key) ? 'on' : ''}
                              aria-pressed={copyTargets.includes(key)}
                              onClick={() => toggleCopyTarget(key)}
                            >
                              {date.toLocaleDateString('en-US', { weekday: 'short' })}
                              <b className="mp-num">{date.getDate()}</b>
                            </button>
                          )
                        })}
                      </div>

                      <div className="mp-copy-actions">
                        <button
                          type="button"
                          className="mp-btn"
                          onClick={() =>
                            setCopyTargets(
                              weekDays
                                .map(dateKey)
                                .filter(key => key !== selectedDate)
                            )
                          }
                        >
                          Whole week
                        </button>

                        <button
                          type="button"
                          className="mp-btn mp-btn-primary"
                          onClick={copyDay}
                        >
                          <Copy size={13} />
                          Copy
                          {copyTargets.length > 0 && ` (${copyTargets.length})`}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mp-ring-row">
                <span className="mp-ring-wrap">
                  {totals.calories > 0 && (
                    <span
                      key={Math.round(totals.calories)}
                      className="mp-ring-glow"
                      aria-hidden="true"
                    />
                  )}

                  <svg className="mp-ring" viewBox="0 0 80 80" aria-hidden="true">
                    <circle
                      className="mp-ring-track"
                      cx="40"
                      cy="40"
                      r={RING_RADIUS}
                      fill="none"
                      strokeWidth="8"
                    />
                    <motion.circle
                      className="mp-ring-bar"
                      cx="40"
                      cy="40"
                      r={RING_RADIUS}
                      fill="none"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={RING_LENGTH}
                      initial={{ strokeDashoffset: RING_LENGTH }}
                      animate={{
                        strokeDashoffset: RING_LENGTH * (1 - caloriePercent / 100),
                      }}
                      transition={{ type: 'spring', stiffness: 70, damping: 15 }}
                    />
                  </svg>
                </span>

                <div>
                  <p className="mp-summary-label">
                    <Flame size={14} />
                    Planned calories
                  </p>

                  <strong className="mp-kcal mp-num">
                    {formatNumber(animatedCalories)}
                    <small>kcal</small>
                  </strong>

                  <p className="mp-meta mp-num">
                    {formatNumber(caloriePercent)}% of{' '}
                    {formatNumber(reference.calories)} kcal ·{' '}
                    {dailyMeals.length} {dailyMeals.length === 1 ? 'food' : 'foods'}
                  </p>
                </div>
              </div>

              {[
                {
                  key: 'sugar',
                  label: 'Sugar',
                  icon: <Candy size={14} />,
                  value: formatNumber(animatedSugar, 1),
                  unit: 'g',
                  percent: sugarPercent,
                  reference: `${reference.sugar} g`,
                },
                {
                  key: 'sodium',
                  label: 'Sodium',
                  icon: <Droplets size={14} />,
                  value: formatNumber(animatedSodium),
                  unit: 'mg',
                  percent: sodiumPercent,
                  reference: `${formatNumber(reference.sodium)} mg`,
                },
              ].map(item => (
                <div key={item.key} className={`mp-meter ${levelOf(item.percent)}`}>
                  <div className="mp-meter-top">
                    <span>
                      {item.icon}
                      {item.label}
                    </span>
                    <b className="mp-num">
                      {item.value}
                      <small>{item.unit}</small>
                    </b>
                  </div>

                  <div className="mp-bar" aria-hidden="true">
                    <span style={{ width: `${item.percent}%` }} />
                  </div>

                  <p className="mp-num">
                    {formatNumber(item.percent)}% of {item.reference} daily reference
                  </p>
                </div>
              ))}

              <div className="mp-divider" />

              <p className="mp-summary-label">
                <Utensils size={14} />
                Meal split
              </p>

              <div className="mp-split" aria-hidden="true">
                {mealSplit.map(item => (
                  <motion.span
                    key={item.type}
                    style={{ background: `var(--mp-m${item.slot})` }}
                    initial={false}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 0.6 }}
                  />
                ))}
              </div>

              <div className="mp-legend">
                {mealSplit.map(item => (
                  <span key={item.type}>
                    <i style={{ background: `var(--mp-m${item.slot})` }} />
                    {item.type}
                    <b className="mp-num">{formatNumber(item.percent)}%</b>
                  </span>
                ))}
              </div>
            </section>

            <p className="mp-note">
              <Info size={12} />
              Nutrition values are illustrative estimates per listed serving.
              Planned meals do not count as consumed meals, and plans are not yet
              saved to a database.
            </p>
          </motion.aside>
        </div>

        {/* ================= ADD FOOD MODAL ================= */}
        <AnimatePresence>
          {showFoodModal && (
            <motion.div
              key="food-modal"
              className="mp-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFoodModal(false)}
            >
              <motion.div
                className="mp-modal"
                role="dialog"
                aria-modal="true"
                aria-label={`Add food to ${selectedMealType}`}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                onClick={event => event.stopPropagation()}
                style={{
                  ['--mp-m' as string]: `var(--mp-m${mealMeta[selectedMealType].slot})`,
                }}
              >
                <div className="mp-modal-head">
                  <div>
                    <p className="mp-eyebrow">PLAN YOUR MEAL</p>
                    <h2>Add to {selectedMealType}</h2>
                    <p className="mp-sub" style={{ margin: 0 }}>
                      Select a food for your planned meal.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="mp-btn"
                    aria-label="Close"
                    onClick={() => setShowFoodModal(false)}
                  >
                    <X size={17} />
                  </button>
                </div>

                <label className="mp-search">
                  <Search size={16} color="var(--mp-muted)" />
                  <input
                    type="search"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Search foods..."
                    aria-label="Search foods"
                  />
                </label>

                {!search && recentFoods.length > 0 && (
                  <div className="mp-recent">
                    <span>Recent</span>

                    <div>
                      {recentFoods.map(food => (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => addFood(food)}
                        >
                          <span aria-hidden="true">{food.emoji}</span>
                          {food.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mp-food-list">
                  {filteredFoods.length === 0 && (
                    <p className="mp-sub" style={{ textAlign: 'center', padding: 20 }}>
                      No matching foods found.
                    </p>
                  )}

                  {filteredFoods.map(food => (
                    <button
                      key={food.id}
                      type="button"
                      className="mp-food"
                      onClick={() => addFood(food)}
                    >
                      <span className="mp-item-emoji" aria-hidden="true">
                        {food.emoji}
                      </span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>{food.name}</strong>
                        <span className="mp-food-meta mp-num">
                          {food.serving} · {food.calories} kcal · {food.sugar} g sugar ·{' '}
                          {food.sodium} mg sodium
                        </span>
                      </div>

                      <Plus size={16} />
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= TOAST ================= */}
        <AnimatePresence>
          {notification && (
            <motion.div
              key={notification}
              className="mp-toast"
              role="status"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
            >
              <Check size={16} />
              {notification}

              {undoMeal && (
                <button
                  type="button"
                  className="mp-undo"
                  onClick={undoRemove}
                >
                  <Undo2 size={14} />
                  Undo
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setNotification('')
                  setUndoMeal(null)
                }}
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  )
}