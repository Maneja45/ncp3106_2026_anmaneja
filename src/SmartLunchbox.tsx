import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import {
  Check,
  CheckCircle2,
  Droplets,
  Flame,
  Info,
  Plus,
  RefreshCcw,
  Save,
  Scale,
  Search,
  UtensilsCrossed,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

type Food = {
  id: string
  name: string
  category: string
  calories: number
  sugar: number
  sodium: number
  emoji: string
}

type Compartment = {
  id: number
  food: Food | null
  weight: number
}

type Nutrition = {
  calories: number
  sugar: number
  sodium: number
}

type NutritionTotals = Nutrition & {
  weight: number
}

// A meal ready to be saved to Meal History (matches Meal without id/date/time)
export type LunchboxMeal = {
  food: string
  emoji: string
  compartment: number
  weight: number
  caloriesPer100g: number
  sugarPer100g: number
  sodiumPer100g: number
}

type SmartLunchboxProps = {
  deviceOnline: boolean
  liveWeight: number | null
  sensorReady: boolean
  /** Saves the filled compartments to Meal History (database). */
  onSaveMeals?: (items: LunchboxMeal[]) => Promise<void>
  calorieGoal?: number
  sugarGoal?: number
  sodiumGoal?: number
}

// ============================================
// FOOD CATALOG
// Estimated nutrition per 100 grams
// ============================================

const foods: Food[] = [
  {
    id: 'rice',
    name: 'White Rice',
    category: 'Rice & Grains',
    calories: 130,
    sugar: 0.1,
    sodium: 1,
    emoji: '🍚',
  },
  {
    id: 'brown-rice',
    name: 'Brown Rice',
    category: 'Rice & Grains',
    calories: 123,
    sugar: 0.4,
    sodium: 4,
    emoji: '🍚',
  },
  {
    id: 'adobo',
    name: 'Chicken Adobo',
    category: 'Filipino Dishes',
    calories: 190,
    sugar: 1.5,
    sodium: 600,
    emoji: '🍗',
  },
  {
    id: 'tinola',
    name: 'Chicken Tinola',
    category: 'Filipino Dishes',
    calories: 85,
    sugar: 0.8,
    sodium: 280,
    emoji: '🍲',
  },
  {
    id: 'sinigang',
    name: 'Sinigang',
    category: 'Filipino Dishes',
    calories: 75,
    sugar: 1.2,
    sodium: 350,
    emoji: '🥣',
  },
  {
    id: 'egg',
    name: 'Boiled Egg',
    category: 'Protein',
    calories: 155,
    sugar: 1.1,
    sodium: 124,
    emoji: '🥚',
  },
  {
    id: 'broccoli',
    name: 'Steamed Broccoli',
    category: 'Vegetables',
    calories: 35,
    sugar: 1.4,
    sodium: 33,
    emoji: '🥦',
  },
  {
    id: 'carrots',
    name: 'Steamed Carrots',
    category: 'Vegetables',
    calories: 35,
    sugar: 3.5,
    sodium: 58,
    emoji: '🥕',
  },
  {
    id: 'banana',
    name: 'Banana',
    category: 'Fruits',
    calories: 89,
    sugar: 12.2,
    sodium: 1,
    emoji: '🍌',
  },
  {
    id: 'apple',
    name: 'Apple',
    category: 'Fruits',
    calories: 52,
    sugar: 10.4,
    sodium: 1,
    emoji: '🍎',
  },
]

// ============================================
// HELPERS
// ============================================

const emptyCompartments = (): Compartment[] => [
  { id: 1, food: null, weight: 0 },
  { id: 2, food: null, weight: 0 },
  { id: 3, food: null, weight: 0 },
]

function calculateNutrition(
  food: Food,
  weight: number
): Nutrition {
  const multiplier = weight / 100

  return {
    calories: food.calories * multiplier,
    sugar: food.sugar * multiplier,
    sodium: food.sodium * multiplier,
  }
}

function formatNumber(
  value: number,
  decimals = 0
): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  })
}

// General daily reference values — used only for the progress visuals.
const DAILY_REFERENCE = {
  calories: 2000,
  sugar: 50,
  sodium: 2000,
}

// Rough food capacity of each compartment (grams) — only used for the liquid fill level.
// Adjust to the real size of your lunchbox.
const COMPARTMENT_CAPACITY: Record<number, number> = {
  1: 300,
  2: 200,
  3: 200,
}

// Sparkle directions for the food-drop effect (x, y in px)
const SPARKLES: Array<[number, number]> = [
  [-38, -30],
  [36, -28],
  [-44, 8],
  [42, 10],
  [-24, 34],
  [26, 32],
]

const RING_RADIUS = 34
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

function percentOf(value: number, max: number): number {
  return Math.min(100, max > 0 ? (value / max) * 100 : 0)
}

// low  = under 50% of the reference, mid = 50–79%, high = 80% and up
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
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

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

// Weight chip that counts up from 0 g when food is added.
function CompartmentWeight({ weight }: { weight: number }) {
  const [target, setTarget] = useState(0)

  useEffect(() => {
    setTarget(weight)
  }, [weight])

  const value = useCountUp(target, 900)

  return (
    <span className="smart-compartment-weight smart-weight-chip">
      {formatNumber(value, 1)} g
    </span>
  )
}

// Small lunchbox drawing for the empty state (replaces the 🍱 emoji).
function EmptyLunchboxIcon() {
  return (
    <svg
      className="smart-empty-icon"
      viewBox="0 0 48 40"
      width="44"
      height="36"
      aria-hidden="true"
    >
      <rect x="3" y="8" width="42" height="28" rx="8" fill="var(--sb-shell)" />
      <rect x="7" y="12" width="34" height="20" rx="5" fill="var(--sb-tray-wall)" />
      <rect x="9" y="14" width="15" height="16" rx="3" fill="var(--sb-tray)" />
      <rect x="26" y="14" width="13" height="7" rx="2.5" fill="var(--sb-tray)" />
      <rect x="26" y="23" width="13" height="7" rx="2.5" fill="var(--sb-tray)" />
      <rect x="16" y="3" width="16" height="6" rx="3" fill="var(--sb-shell-edge)" />
    </svg>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SmartLunchbox({
  deviceOnline,
  liveWeight,
  sensorReady,
  onSaveMeals,
  calorieGoal,
  sugarGoal,
  sodiumGoal,
}: SmartLunchboxProps) {
  // Personal daily targets (fallback: general reference)
  const reference = {
    calories: calorieGoal || DAILY_REFERENCE.calories,
    sugar: sugarGoal || DAILY_REFERENCE.sugar,
    sodium: sodiumGoal || DAILY_REFERENCE.sodium,
  }

  const [savingMeal, setSavingMeal] = useState(false)

  // ==========================================
  // STATE
  // ==========================================

  const [compartments, setCompartments] =
    useState<Compartment[]>(emptyCompartments)

  const [activeCompartment, setActiveCompartment] =
    useState<number | null>(null)

  const [selectedFood, setSelectedFood] =
    useState<Food | null>(null)

  const [portionWeight, setPortionWeight] =
    useState<number>(150)

  const [search, setSearch] =
    useState<string>('')

  const [notification, setNotification] =
    useState<string>('')

  const rootRef = useRef<HTMLDivElement>(null)

  // Put the green-blob background on the page area around this component.
  useEffect(() => {
    const host =
      rootRef.current?.closest('main:not(.smart-layout)') ??
      rootRef.current?.parentElement

    if (!host) return

    host.classList.add('sb-page-bg')

    return () => host.classList.remove('sb-page-bg')
  }, [])

  // Compartment shown in the "Selected compartment" tile
  const [selectedCompartment, setSelectedCompartment] =
    useState<number>(1)

  // ==========================================
  // REAL ESP32 SENSOR
  // ==========================================

  const hasValidWeight =
    deviceOnline &&
    sensorReady &&
    typeof liveWeight === 'number' &&
    Number.isFinite(liveWeight)

  const displayedWeight =
    hasValidWeight && liveWeight !== null
      ? `${liveWeight.toFixed(1)} g`
      : '-- g'

  const sensorStatus = !deviceOnline
    ? 'Sensor disconnected'
    : !hasValidWeight
      ? 'Sensor not ready'
      : 'Sensor connected'

  // ==========================================
  // CALCULATIONS
  // ==========================================

  const filledCount = compartments.filter(
    (item) => item.food !== null
  ).length

  const totals: NutritionTotals =
    compartments.reduce<NutritionTotals>(
      (total, compartment) => {
        if (!compartment.food) return total

        const nutrition = calculateNutrition(
          compartment.food,
          compartment.weight
        )

        return {
          calories:
            total.calories + nutrition.calories,

          sugar:
            total.sugar + nutrition.sugar,

          sodium:
            total.sodium + nutrition.sodium,

          weight:
            total.weight + compartment.weight,
        }
      },
      {
        calories: 0,
        sugar: 0,
        sodium: 0,
        weight: 0,
      }
    )

  // Animated numbers and progress for the nutrition panel
  const animatedCalories = useCountUp(totals.calories)
  const animatedSugar = useCountUp(totals.sugar)
  const animatedSodium = useCountUp(totals.sodium)
  const animatedWeight = useCountUp(totals.weight)

  const caloriePercent = percentOf(
    totals.calories,
    reference.calories
  )
  const sugarPercent = percentOf(
    totals.sugar,
    reference.sugar
  )
  const sodiumPercent = percentOf(
    totals.sodium,
    reference.sodium
  )

  const selected =
    compartments.find(
      (item) => item.id === selectedCompartment
    ) ?? compartments[0]

  const selectedTileNutrition = selected.food
    ? calculateNutrition(selected.food, selected.weight)
    : null

  const filteredFoods = foods.filter((food) =>
    `${food.name} ${food.category}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  )

  const selectedNutrition = selectedFood
    ? calculateNutrition(
        selectedFood,
        portionWeight
      )
    : null

  // ==========================================
  // EFFECTS
  // ==========================================

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent
    ): void => {
      if (event.key === 'Escape') {
        setActiveCompartment(null)
        setSelectedFood(null)
      }
    }

    document.addEventListener(
      'keydown',
      handleEscape
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape
      )
    }
  }, [])

  useEffect(() => {
    if (!notification) return

    const timer = window.setTimeout(() => {
      setNotification('')
    }, 3500)

    return () => {
      window.clearTimeout(timer)
    }
  }, [notification])

  // ==========================================
  // ACTIONS
  // ==========================================

  const openPicker = (id: number): void => {
    const compartment = compartments.find(
      (item) => item.id === id
    )

    setActiveCompartment(id)
    setSelectedFood(compartment?.food ?? null)
    setPortionWeight(compartment?.weight || 150)
    setSearch('')
  }

  // Tap a compartment: show it in the Selected tile; empty ones open the picker right away.
  const selectCompartment = (id: number): void => {
    setSelectedCompartment(id)

    const compartment = compartments.find(
      (item) => item.id === id
    )

    if (!compartment?.food) openPicker(id)
  }

  const closePicker = (): void => {
    setActiveCompartment(null)
    setSelectedFood(null)
    setSearch('')
  }

  const saveFood = (): void => {
    if (
      activeCompartment === null ||
      !selectedFood ||
      !Number.isFinite(portionWeight) ||
      portionWeight <= 0
    ) {
      return
    }

    const id = activeCompartment
    const food = selectedFood
    const weight = portionWeight

    setCompartments((previous) =>
      previous.map((compartment) =>
        compartment.id === id
          ? {
              ...compartment,
              food,
              weight,
            }
          : compartment
      )
    )

    closePicker()
    setSelectedCompartment(id)

    setNotification(
      `Food saved to Compartment ${id}.`
    )
  }

  const clearCompartment = (
    id: number
  ): void => {
    setCompartments((previous) =>
      previous.map((compartment) =>
        compartment.id === id
          ? {
              ...compartment,
              food: null,
              weight: 0,
            }
          : compartment
      )
    )

    setNotification(
      `Compartment ${id} cleared.`
    )
  }

  const clearAll = (): void => {
    setCompartments(emptyCompartments())
    setNotification('Lunchbox cleared.')
  }

  // Records everything in the lunchbox as one meal, then empties it.
  const saveToHistory = async (): Promise<void> => {
    if (!onSaveMeals || savingMeal) return

    const items: LunchboxMeal[] = compartments
      .filter((item) => item.food !== null && item.weight > 0)
      .map((item) => ({
        food: item.food!.name,
        emoji: item.food!.emoji,
        compartment: item.id,
        weight: item.weight,
        caloriesPer100g: item.food!.calories,
        sugarPer100g: item.food!.sugar,
        sodiumPer100g: item.food!.sodium,
      }))

    if (items.length === 0) return

    setSavingMeal(true)

    try {
      await onSaveMeals(items)
      setCompartments(emptyCompartments())
      setNotification(
        `Saved ${items.length} ${items.length === 1 ? 'food' : 'foods'} to Meal History.`
      )
    } catch (error) {
      setNotification(
        error instanceof Error
          ? error.message
          : 'Unable to save this meal. Check XAMPP.'
      )
    } finally {
      setSavingMeal(false)
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <MotionConfig reducedMotion="user">
    <motion.div
      ref={rootRef}
      className="smart-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <style>{`

        /* ====================================
           BASE
        ==================================== */

        .smart-page,
        .smart-page * {
          box-sizing: border-box;
        }

        .smart-page {
          --sb-green: #45634d;
          --sb-dark-green: #344f3c;
          --sb-border: var(--border, #e4eae2);
          --sb-surface: var(--surface, #ffffff);
          --sb-background: var(--bg, #f5f7f3);
          --sb-text: var(--text, #243e32);
          --sb-muted: var(--muted, #819086);

          /* Lunchbox + effect colours (light) */
          --sb-stage: #e7ecdf;
          --sb-shell: #a9bfa2;
          --sb-shell-light: #c3d5bc;
          --sb-shell-edge: #7f9679;
          --sb-tray-wall: #d9e2d2;
          --sb-tray: #faf8f0;
          --sb-tray-hover: #fffdf7;
          --sb-tray-border: #d5dfcf;
          --sb-tray-text: #344e41;
          --sb-tray-muted: #7a8d7f;
          --sb-accent: #5f8f68;
          --sb-glow: rgba(95, 143, 104, 0.28);
          --sb-soft: #e2eee3;
          --sb-track: #e3eadf;
          --sb-ok: #5f9a6c;
          --sb-mid: #c98a2b;
          --sb-high: #c4544c;
          --sb-ring: #45634d;
          --sb-toast: #45634d;
          --sb-blob: rgba(255, 255, 255, 0.45);
          --sb-btn: #45634d;
          --sb-btn-hover: #344f3c;
          --sb-btn-text: #ffffff;
          --sb-glass: rgba(255, 255, 255, 0.72);
          --sb-glass-card: rgba(255, 255, 255, 0.86);
          --sb-c1: #d4b878;
          --sb-c2: #c0843e;
          --sb-c3: #5f9c45;
          --sb-hero: var(--sb-glass-card);
          --sb-hero-text: var(--sb-text);
          --sb-hero-muted: var(--sb-muted);
          --sb-hero-track: var(--sb-track);
          --sb-hero-ring: var(--sb-accent);

          width: 100%;
          height: 100%;

          min-width: 0;
          min-height: 0;

          flex: 1 1 0;

          display: flex;
          flex-direction: column;

          gap: 12px;
          padding: 0;

          overflow: hidden;

          color: var(--sb-text);
          font-family: "DM Sans", sans-serif;
        }

        :is([data-theme="dark"], [data-mode="dark"], .dark, .dark-mode, .theme-dark) .smart-page {
          --sb-green: #a9cf92;
          --sb-dark-green: #c4e0b0;
          --sb-btn: #bbd5a3;
          --sb-btn-hover: #cfe3bc;
          --sb-btn-text: #173c2a;
          --sb-glass: rgba(20, 33, 26, 0.66);
          --sb-glass-card: rgba(26, 42, 33, 0.82);
          --sb-c1: #e8d7a4;
          --sb-c2: #e0a35c;
          --sb-c3: #8cc76f;
          --sb-hero: var(--sb-glass-card);
          --sb-hero-text: var(--sb-text);
          --sb-hero-muted: var(--sb-muted);
          --sb-hero-track: var(--sb-track);
          --sb-hero-ring: var(--sb-accent);
          --sb-stage: #16241c;
          --sb-shell: #3f5f47;
          --sb-shell-light: #557a5d;
          --sb-shell-edge: #2c4733;
          --sb-tray-wall: #1d2b22;
          --sb-tray: #24352a;
          --sb-tray-hover: #2b3f32;
          --sb-tray-border: #34503f;
          --sb-tray-text: #e6efe0;
          --sb-tray-muted: #a3b8a8;
          --sb-accent: #a9cf92;
          --sb-glow: rgba(169, 207, 146, 0.24);
          --sb-soft: #27412f;
          --sb-track: #2a3f32;
          --sb-ok: #8cc77a;
          --sb-mid: #e2b15f;
          --sb-high: #ee8b80;
          --sb-ring: #bbd5a3;
          --sb-toast: #3d6b4a;
          --sb-blob: rgba(187, 213, 163, 0.08);
        }

        .smart-page button,
        .smart-page input {
          font-family: inherit;
        }

        /* Smooth light/dark switch */
        .smart-page .smart-card,
        .smart-page .smart-lunchbox-stage,
        .smart-page .smart-lunchbox-shell,
        .smart-page .smart-compartment-button,
        .smart-page .smart-detail-card,
        .smart-page .smart-detail-food,
        .smart-page .smart-calorie-box,
        .smart-page .smart-nutrition-stat,
        .smart-page .smart-layout,
        .smart-page .smart-button,
        .smart-page .smart-device-trigger {
          transition:
            background-color 0.35s ease,
            border-color 0.35s ease,
            color 0.35s ease,
            box-shadow 0.25s ease,
            transform 0.25s ease;
        }

        .smart-page button {
          cursor: pointer;
        }

        .smart-page button:focus-visible {
          outline: 3px solid var(--sb-accent);
          outline-offset: 2px;
        }

        .smart-muted {
          margin: 0;
          font-size: 11px;
          line-height: 1.4;
          color: var(--sb-muted);
        }

        .smart-title,
        .smart-panel-title,
        .smart-modal-title {
          font-family:
            Georgia,
            "Times New Roman",
            serif;

          letter-spacing: -0.6px;
        }

        .smart-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 6px;
          padding: 8px 11px;

          border: 1px solid var(--sb-border);
          border-radius: 9px;

          background: var(--sb-surface);
          color: var(--sb-text);

          font-size: 11px;
          font-weight: 750;

          transition:
            background 0.2s,
            transform 0.2s;
        }

        .smart-button:hover {
          transform: translateY(-1px);
        }

        .smart-button-primary {
          color: var(--sb-btn-text);
          background: var(--sb-btn);
          border-color: var(--sb-btn);
        }

        .smart-button-primary:hover {
          background: var(--sb-btn-hover);
        }

        .smart-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* ====================================
           PAGE HEADER
        ==================================== */

        .smart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          flex: 0 0 auto;

          gap: 14px;
          padding: 0 3px;

          position: relative;
          z-index: 20;
        }

        .smart-eyebrow {
          margin: 0 0 4px;

          color: var(--sb-green);

          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.2px;
        }

        .smart-title {
          margin: 0 0 4px;

          font-size: clamp(20px, 2vw, 29px);
          line-height: 1.1;
        }

        /* ====================================
           REAL DEVICE CONNECTION
        ==================================== */

        .smart-device-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .smart-device-trigger {
          display: flex;
          align-items: center;

          gap: 8px;
          padding: 10px 12px;

          border: 1px solid var(--sb-border);
          border-radius: 12px;

          background: var(--sb-surface);
          color: var(--sb-text);

          font-size: 11px;
          font-weight: 750;
          white-space: nowrap;
        }

        .smart-device-dropdown {
          position: absolute;
          top: calc(100% + 9px);
          right: 0;

          width: 420px;
          max-width: calc(100vw - 32px);

          padding: 17px;

          border: 1px solid var(--sb-border);
          border-radius: 18px;

          background: var(--sb-surface);

          box-shadow:
            0 20px 55px rgba(20, 38, 26, 0.16);

          z-index: 100;
        }

        .smart-device-dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 12px;
          margin-bottom: 14px;
        }

        .smart-device-status {
          display: inline-flex;
          align-items: center;

          gap: 7px;
          padding: 7px 10px;

          border-radius: 99px;
          background: var(--sb-background);

          color: var(--sb-muted);
          font-size: 10px;
          font-weight: 750;
        }

        .smart-status-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;
          background: #bd5252;
        }

        .smart-status-dot.online {
          background: #5b9b6b;
        }

        /* Pulsing connection dot — slow grey when offline, livelier green when online */
        .smart-pulse-dot {
          position: relative;
          width: 8px;
          height: 8px;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--sb-muted);
        }

        .smart-pulse-dot::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: inherit;
          animation: smartPulse 2.6s ease-out infinite;
        }

        .smart-pulse-dot.online {
          background: var(--sb-ok);
        }

        .smart-pulse-dot.online::after {
          animation-duration: 1.4s;
        }

        @keyframes smartPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.8); opacity: 0; }
        }

        .smart-device-grid {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 11px;
        }

        .smart-device-tile {
          min-width: 0;
          min-height: 140px;

          display: flex;
          flex-direction: column;

          gap: 8px;
          padding: 13px;

          border: 1px solid var(--sb-border);
          border-radius: 13px;

          background: var(--sb-background);
        }

        .smart-device-tile-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;

          color: var(--sb-green);
        }

        .smart-device-value {
          font-size: 25px;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
        }

        .smart-device-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;
          margin-top: 14px;
        }

        /* ====================================
           SINGLE MAIN CONTAINER
        ==================================== */

        .smart-page .smart-layout {
          width: 100%;

          flex: 1 1 0;

          min-width: 0;
          min-height: 0;

          display: grid;

          grid-template-columns:
            minmax(0, 55fr)
            minmax(0, 45fr);

          grid-template-rows:
            minmax(0, 1fr);

          gap: 12px;
          padding: 12px;

          border: 1px solid var(--sb-border);
          border-radius: 22px;

          background: var(--sb-surface);

          overflow: hidden;
        }

        /* ====================================
           LEFT LUNCHBOX PANEL

           NO EXTRA WHITE CONTAINER
           TITLE OUTSIDE GREEN BACKGROUND
        ==================================== */

        .smart-page .smart-lunchbox-panel {
          grid-column: 1;
          grid-row: 1;

          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;

          gap: 11px;

          padding: 0;

          border: none;
          border-radius: 0;

          background: transparent;

          box-shadow: none;

          overflow: hidden;
        }

        /* ====================================
           LUNCHBOX TITLE AND DESCRIPTION

           OUTSIDE THE GREEN BACKGROUND
        ==================================== */

        .smart-page .smart-lunchbox-panel
        .smart-panel-heading {
          flex: 0 0 auto;

          padding: 8px 5px 1px;
          margin: 0;

          border: none;
          background: transparent;
        }

        /* ====================================
           RIGHT COLUMN
        ==================================== */

        .smart-right-column {
          min-width: 0;
          min-height: 0;

          display: grid;

          /* bento: hero / sugar + sodium / selected / device */
          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          grid-template-rows:
            auto
            auto
            minmax(0, 1fr)
            auto;

          gap: 12px;
        }

        .smart-card {
          min-width: 0;
          min-height: 0;

          background: var(--sb-surface);

          border: 1px solid var(--sb-border);
          border-radius: 17px;
        }

        .smart-panel {
          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;

          gap: 9px;
          padding: 13px;

          overflow: hidden;
        }

        .smart-panel-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;

          flex-shrink: 0;

          gap: 8px;
        }

        .smart-panel-title {
          margin: 0 0 3px;

          font-size:
            clamp(17px, 1.45vw, 23px);

          line-height: 1.1;
        }

        .smart-panel-subtitle {
          margin: 0;

          color: var(--sb-muted);

          font-size: 10px;
          line-height: 1.4;
        }

        .smart-panel-icon {
          width: 30px;
          height: 30px;

          flex-shrink: 0;

          display: grid;
          place-items: center;

          border-radius: 9px;

          background: var(--sb-background);
          color: var(--sb-green);
        }

        /* ====================================
           GREEN LUNCHBOX BACKGROUND

           ONLY THE ACTUAL LUNCHBOX IS INSIDE
        ==================================== */

        .smart-page .smart-lunchbox-stage {
          flex: 1 1 0;

          width: 100%;

          min-width: 0;
          min-height: 0;

          display: flex;
          align-items: stretch;
          justify-content: center;

          padding: clamp(14px, 1.8vw, 28px);

          position: relative;
          isolation: isolate;

          background: var(--sb-stage);

          border: none;
          border-radius: 17px;

          overflow: hidden;
        }

        /* Slow floating light blobs behind the lunchbox */
        .smart-page .smart-lunchbox-stage::before,
        .smart-page .smart-lunchbox-stage::after {
          content: '';
          position: absolute;
          z-index: -1;
          border-radius: 50%;
          background: var(--sb-blob);
          filter: blur(28px);
          pointer-events: none;
          animation: smartFloat 14s ease-in-out infinite alternate;
        }

        .smart-page .smart-lunchbox-stage::before {
          width: 45%;
          height: 55%;
          top: -12%;
          left: -8%;
        }

        .smart-page .smart-lunchbox-stage::after {
          width: 40%;
          height: 50%;
          right: -10%;
          bottom: -14%;
          animation-delay: -7s;
        }

        @keyframes smartFloat {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(8%, 10%) scale(1.12); }
        }

        /* ====================================
           LARGE GREEN LUNCHBOX FRAME
        ==================================== */

        .smart-lunchbox-shell {
          width: 100%;
          height: 100%;

          min-width: 0;
          min-height: 0;

          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          grid-template-rows:
            repeat(2, minmax(0, 1fr));

          gap: 11px;
          padding: 11px;

          position: relative;

          border: 7px solid var(--sb-shell);
          border-radius: 27px;

          /* plastic case: lighter top edge, darker bottom edge */
          background: var(--sb-tray-wall);

          box-shadow:
            inset 0 4px 10px rgba(0, 0, 0, 0.16),
            inset 0 -2px 0 rgba(255, 255, 255, 0.25),
            0 0 0 1px var(--sb-shell-edge),
            0 3px 0 var(--sb-shell-light) inset,
            0 18px 34px rgba(40, 62, 42, 0.2),
            0 4px 10px rgba(40, 62, 42, 0.12);
        }

        /* Side clasps */
        .smart-lunchbox-shell::before,
        .smart-lunchbox-shell::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 12px;
          height: 64px;
          margin-top: -32px;
          border-radius: 6px;
          background: var(--sb-shell-edge);
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.18);
        }

        .smart-lunchbox-shell::before {
          left: -17px;
        }

        .smart-lunchbox-shell::after {
          right: -17px;
        }

        /* ====================================
           THREE LUNCHBOX COMPARTMENTS
        ==================================== */

        .smart-compartment-button {
          position: relative;

          min-width: 0;
          min-height: 0;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          gap: 9px;
          padding: 14px;

          border: 2px solid var(--sb-tray-border);
          border-radius: 18px;

          background: var(--sb-tray);
          color: var(--sb-tray-text);

          /* sunken compartment */
          box-shadow:
            inset 0 5px 12px rgba(60, 50, 30, 0.12),
            inset 0 -2px 0 rgba(255, 255, 255, 0.4);

          overflow: hidden;
        }

        .smart-compartment-button:first-child {
          grid-row: 1 / 3;
          grid-column: 1;
        }

        .smart-compartment-button:nth-child(2) {
          grid-row: 1;
          grid-column: 2;
        }

        .smart-compartment-button:nth-child(3) {
          grid-row: 2;
          grid-column: 2;
        }

        .smart-compartment-button:hover,
        .smart-compartment-button.is-linked {
          background: var(--sb-tray-hover);
          border-color: var(--sb-accent);

          box-shadow:
            inset 0 5px 12px rgba(60, 50, 30, 0.08),
            0 8px 18px rgba(40, 62, 42, 0.14);
        }

        /* Compartment being edited glows */
        .smart-compartment-button.is-active {
          border-color: var(--sb-accent);
          box-shadow:
            0 0 0 4px var(--sb-glow),
            0 10px 22px rgba(40, 62, 42, 0.18);
        }

        .smart-compartment-content {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 9px;
          max-width: 100%;
        }

        .smart-compartment-plus-wrap {
          display: grid;
          place-items: center;
          border-radius: 50%;
          padding: 8px;
          transition: transform 0.3s ease, background-color 0.3s ease;
        }

        .smart-compartment-button:hover .smart-compartment-plus-wrap,
        .smart-compartment-button.is-linked .smart-compartment-plus-wrap {
          transform: rotate(90deg) scale(1.15);
          background: var(--sb-soft);
        }

        .smart-compartment-emoji {
          filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.18));
        }

        .smart-weight-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 99px;
          background: var(--sb-surface);
          border: 1px solid var(--sb-tray-border);
          font-variant-numeric: tabular-nums;
          font-weight: 800;
        }

        .smart-weight-chip::before {
          content: '';
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--sb-ok);
        }

        .smart-compartment-fill {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 12px;
          height: 5px;
          border-radius: 5px;
          background: var(--sb-track);
          overflow: hidden;
        }

        .smart-compartment-fill > span {
          display: block;
          height: 100%;
          border-radius: 5px;
          background: var(--sb-accent);
        }

        .smart-compartment-number {
          position: absolute;

          top: 12px;
          left: 13px;

          color: var(--sb-tray-muted);

          font-size: 12px;
          font-weight: 850;
        }

        .smart-compartment-plus {
          width: clamp(26px, 2.8vw, 44px);
          height: clamp(26px, 2.8vw, 44px);

          color: var(--sb-accent);
          stroke-width: 1.7;
        }

        .smart-compartment-emoji {
          font-size:
            clamp(25px, 3.6vw, 58px);

          line-height: 1;
        }

        .smart-compartment-name {
          max-width: 100%;

          font-size:
            clamp(12px, 1.4vw, 21px);

          font-weight: 800;
          line-height: 1.2;

          text-align: center;
          overflow-wrap: anywhere;
        }

        .smart-compartment-weight {
          font-size:
            clamp(10px, 1vw, 14px);

          color: var(--sb-tray-muted);
          text-align: center;
        }

        /* ====================================
           BOTTOM LUNCHBOX DESCRIPTION

           OUTSIDE THE GREEN BACKGROUND
        ==================================== */

        .smart-info-line {
          display: flex;
          align-items: center;

          flex-shrink: 0;

          gap: 6px;
          padding: 0 5px 5px;

          color: var(--sb-muted);

          font-size: 10px;
          line-height: 1.4;

          background: transparent;
        }

        .smart-info-line svg {
          flex-shrink: 0;
        }

        /* ====================================
           NUTRITION PANEL
        ==================================== */

        .smart-nutrition-content {
          flex: 1 1 0;
          min-height: 0;

          display: flex;
          flex-direction: column;

          gap: 7px;
        }

        .smart-calorie-box {
          flex: 1 1 0;
          min-height: 55px;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          gap: 4px;
          padding: 8px;

          border-radius: 12px;
          background: var(--sb-background);

          text-align: center;
        }

        .smart-calorie-label {
          margin: 0;
          color: var(--sb-muted);

          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.7px;
        }

        .smart-calorie-value {
          color: var(--sb-green);

          font-size:
            clamp(27px, 2.6vw, 39px);

          font-weight: 850;
          line-height: 1.1;

          font-variant-numeric: tabular-nums;
        }

        .smart-calorie-unit {
          margin-left: 4px;
          font-size: 11px;
        }

        .smart-nutrition-stats {
          flex-shrink: 0;

          display: grid;

          grid-template-columns:
            repeat(3, minmax(0, 1fr));

          gap: 6px;
        }

        .smart-nutrition-stat {
          min-width: 0;

          display: flex;
          flex-direction: column;

          gap: 4px;
          padding: 8px;

          border: 1px solid var(--sb-border);
          border-radius: 10px;
        }

        .smart-nutrition-stat-label {
          display: flex;
          align-items: center;

          gap: 4px;

          color: var(--sb-muted);
          font-size: 9px;
        }

        .smart-nutrition-stat-value {
          font-weight: 800;

          font-size:
            clamp(12px, 1.1vw, 17px);
        }

        .smart-nutrition-footer {
          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;
        }

        .smart-nutrition-footer .smart-muted {
          max-width: 62%;
          font-size: 9px;
          text-align: right;
        }

        /* ====================================
           COMPARTMENT DETAILS
        ==================================== */

        .smart-details-grid {
          flex: 1 1 0;

          min-height: 0;

          display: grid;

          grid-template-columns:
            repeat(3, minmax(0, 1fr));

          gap: 7px;
        }

        .smart-detail-card {
          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;

          gap: 6px;
          padding: 8px;

          border: 1px solid var(--sb-border);
          border-radius: 12px;

          background: var(--sb-background);
        }

        .smart-detail-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;

          gap: 4px;
          flex-shrink: 0;
        }

        .smart-detail-name {
          font-size: 10px;
          font-weight: 800;
        }

        .smart-detail-badge {
          padding: 3px 7px;

          border-radius: 99px;

          background: var(--sb-surface);
          color: var(--sb-muted);

          font-size: 9px;
          font-weight: 750;
        }

        .smart-detail-badge.filled {
          color: var(--sb-green);
          background: var(--sb-soft);
        }

        .smart-detail-card.is-linked {
          border-color: var(--sb-accent);
          box-shadow: 0 0 0 3px var(--sb-glow);
        }

        .smart-detail-food {
          flex: 1 1 0;

          min-height: 0;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          gap: 5px;
          padding: 6px;

          border-radius: 9px;
          background: var(--sb-surface);

          text-align: center;
        }

        .smart-detail-emoji {
          font-size:
            clamp(20px, 2vw, 32px);

          line-height: 1;
        }

        .smart-detail-food-name {
          font-size: 11px;
          font-weight: 800;
          line-height: 1.2;

          overflow-wrap: anywhere;
        }

        .smart-detail-food-meta {
          font-size: 10px;
          line-height: 1.25;

          color: var(--sb-muted);
        }

        .smart-detail-actions {
          display: flex;
          align-items: center;

          flex-shrink: 0;
          gap: 4px;
        }

        .smart-detail-actions .smart-button {
          min-width: 0;
          flex: 1;

          padding: 7px 4px;

          font-size: 10px;
          white-space: nowrap;
        }

        .smart-detail-actions
        .smart-remove-button {
          flex: 0 0 auto;

          color: #b96060;
          padding: 7px;
        }

        /* ====================================
           FOOD PICKER MODAL
        ==================================== */

        .smart-modal-backdrop {
          position: fixed;
          inset: 0;

          z-index: 1000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 16px;

          background: rgba(20, 32, 25, 0.56);
        }

        .smart-modal {
          width: 100%;
          max-width: 560px;
          max-height: 90dvh;

          overflow-y: auto;

          padding: 22px;

          border: 1px solid var(--sb-border);
          border-radius: 22px;

          background: var(--sb-surface);
          color: var(--sb-text);

          box-shadow:
            0 25px 80px rgba(0, 0, 0, 0.2);
        }

        .smart-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 12px;
          margin-bottom: 15px;
        }

        .smart-modal-label {
          margin: 0 0 6px;

          color: var(--sb-green);

          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1px;
        }

        .smart-modal-title {
          margin: 0 0 5px;
          font-size: 24px;
        }

        .smart-sensor-preview {
          display: flex;
          align-items: center;

          gap: 12px;
          padding: 13px;

          margin-bottom: 12px;

          border-radius: 12px;
          background: var(--sb-background);
        }

        .smart-sensor-icon {
          width: 40px;
          height: 40px;

          flex-shrink: 0;

          display: grid;
          place-items: center;

          border-radius: 10px;

          background: var(--sb-soft);
          color: var(--sb-green);
        }

        .smart-portion-input {
          margin-bottom: 13px;
          padding: 12px;

          border: 1px solid var(--sb-border);
          border-radius: 12px;
        }

        .smart-portion-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;
          margin-bottom: 10px;
        }

        .smart-weight-input {
          width: 100px;
          padding: 8px;

          border: 1px solid var(--sb-border);
          border-radius: 8px;

          background: var(--sb-surface);
          color: var(--sb-text);

          font-size: 13px;
          font-weight: 700;
        }

        .smart-search-box {
          display: flex;
          align-items: center;

          gap: 8px;
          padding: 10px;

          border: 1px solid var(--sb-border);
          border-radius: 10px;

          margin-bottom: 10px;
        }

        .smart-search-input {
          flex: 1;
          min-width: 0;

          border: 0;
          outline: none;

          color: var(--sb-text);
          background: transparent;

          font-size: 12px;
        }

        .smart-food-list {
          display: flex;
          flex-direction: column;

          gap: 6px;

          max-height: 240px;
          overflow-y: auto;

          padding: 2px;
        }

        .smart-food-option {
          width: 100%;

          display: flex;
          align-items: center;

          gap: 10px;
          padding: 10px;

          border: 1px solid var(--sb-border);
          border-radius: 11px;

          background: var(--sb-surface);
          color: var(--sb-text);

          text-align: left;
        }

        .smart-food-option:hover,
        .smart-food-option.selected {
          border-color: var(--sb-accent);
          background: var(--sb-background);
        }

        .smart-selected-summary {
          padding: 12px;
          margin-top: 12px;

          border-radius: 11px;
          background: var(--sb-background);
        }

        .smart-selected-stats {
          display: grid;

          grid-template-columns:
            repeat(3, minmax(0, 1fr));

          gap: 10px;
          margin-top: 9px;
        }

        .smart-modal-footer {
          display: flex;
          justify-content: flex-end;

          gap: 8px;
          margin-top: 15px;
        }

        /* ====================================
           NUTRITION EFFECTS
        ==================================== */

        .smart-calorie-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(12px, 1.6vw, 22px);
        }

        .smart-calorie-ring {
          width: clamp(64px, 6vw, 88px);
          height: clamp(64px, 6vw, 88px);
          flex-shrink: 0;
          transform: rotate(-90deg);
        }

        .smart-calorie-ring-track {
          stroke: var(--sb-track);
        }

        .smart-calorie-ring-bar {
          stroke: var(--sb-ring);
        }

        .smart-calorie-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          text-align: left;
        }

        .smart-stat-bar {
          height: 5px;
          border-radius: 5px;
          background: var(--sb-track);
          overflow: hidden;
        }

        .smart-stat-bar > span {
          display: block;
          height: 100%;
          border-radius: 5px;
          background: var(--sb-ok);
          transition: width 0.6s ease, background-color 0.4s ease;
        }

        .smart-stat-bar.mid > span { background: var(--sb-mid); }
        .smart-stat-bar.high > span { background: var(--sb-high); }

        .smart-nutrition-stat.mid .smart-nutrition-stat-value { color: var(--sb-mid); }
        .smart-nutrition-stat.high .smart-nutrition-stat-value { color: var(--sb-high); }

        .smart-nutrition-stat-value {
          font-variant-numeric: tabular-nums;
          transition: color 0.4s ease;
        }

        .smart-fill-dots {
          display: flex;
          gap: 4px;
        }

        .smart-fill-dots > span {
          flex: 1;
          height: 5px;
          border-radius: 5px;
          background: var(--sb-track);
          transition: background-color 0.4s ease, transform 0.4s ease;
        }

        .smart-fill-dots > span.on {
          background: var(--sb-accent);
          transform: scaleY(1.3);
        }

        /* Empty state lunchbox floats gently */
        .smart-empty-icon {
          animation: smartBob 3.2s ease-in-out infinite;
          filter: drop-shadow(0 5px 5px rgba(0, 0, 0, 0.12));
        }

        @keyframes smartBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .smart-page *,
          .smart-page *::before,
          .smart-page *::after {
            animation: none !important;
            transition: none !important;
          }
        }

        /* ====================================
           NEW EFFECTS: LIQUID, SPARKLES, GLOW, SONAR
        ==================================== */

        /* content and number stay above the liquid */
        .smart-compartment-number,
        .smart-compartment-content {
          z-index: 2;
        }

        .smart-compartment-content {
          position: relative;
        }

        .smart-liquid {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
          pointer-events: none;
          background: linear-gradient(
            to top,
            color-mix(in srgb, var(--sb-c) 46%, transparent),
            color-mix(in srgb, var(--sb-c) 24%, transparent)
          );
        }

        .smart-liquid.idle {
          background: color-mix(in srgb, var(--sb-c) 18%, transparent);
        }

        .smart-wave {
          position: absolute;
          left: 0;
          bottom: calc(100% - 1px);
          width: 200%;
          height: 12px;
          animation: smartWave 3.4s linear infinite;
        }

        .smart-wave path {
          fill: color-mix(in srgb, var(--sb-c) 24%, transparent);
        }

        .smart-wave.back {
          height: 14px;
          opacity: 0.6;
          animation-duration: 5.2s;
          animation-direction: reverse;
        }

        .smart-wave.back path {
          fill: color-mix(in srgb, var(--sb-c) 14%, transparent);
        }

        .smart-liquid.idle .smart-wave path {
          fill: color-mix(in srgb, var(--sb-c) 18%, transparent);
        }

        @keyframes smartWave {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .smart-bubble {
          position: absolute;
          bottom: 6px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          animation: smartBubble 3.8s ease-in infinite;
        }

        .smart-bubble:nth-of-type(1) { left: 22%; animation-delay: 0.3s; }
        .smart-bubble:nth-of-type(2) { left: 55%; width: 4px; height: 4px; animation-delay: 1.5s; }
        .smart-bubble:nth-of-type(3) { left: 78%; width: 5px; height: 5px; animation-delay: 2.6s; }

        @keyframes smartBubble {
          0% { transform: translateY(0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-140px); opacity: 0; }
        }

        .smart-sparkles {
          position: absolute;
          left: 50%;
          top: 38%;
          width: 0;
          height: 0;
          pointer-events: none;
        }

        .smart-sparkles i {
          position: absolute;
          left: -4px;
          top: -4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--sb-c);
          box-shadow: 0 0 8px var(--sb-c);
          opacity: 0;
          animation: smartSparkle 0.75s ease-out both;
        }

        .smart-sparkles i:nth-child(even) {
          width: 6px;
          height: 6px;
          background: var(--sb-mid);
        }

        @keyframes smartSparkle {
          0% { opacity: 0; transform: translate(0, 0) scale(0.3); }
          25% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--sx), var(--sy)) scale(1); }
        }

        .smart-ring-wrap {
          position: relative;
          flex-shrink: 0;
          display: grid;
          place-items: center;
        }

        .smart-ring-glow {
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          pointer-events: none;
          animation: smartRingGlow 1.3s ease-out 0.55s both;
        }

        @keyframes smartRingGlow {
          0% { box-shadow: 0 0 0 0 var(--sb-glow); }
          40% { box-shadow: 0 0 0 10px var(--sb-glow); }
          100% { box-shadow: 0 0 0 20px transparent; }
        }

        .smart-sonar {
          flex: 1 1 auto;
          min-height: 90px;
          position: relative;
          display: grid;
          place-items: center;
        }

        .smart-sonar-core {
          position: relative;
          z-index: 1;
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: var(--sb-background);
          border: 1px solid var(--sb-border);
          color: var(--sb-muted);
        }

        .smart-sonar.online .smart-sonar-core {
          background: var(--sb-soft);
          border-color: var(--sb-accent);
          color: var(--sb-ok);
          box-shadow: 0 0 0 6px var(--sb-glow);
        }

        .smart-sonar-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 52px;
          height: 52px;
          margin: -26px 0 0 -26px;
          border-radius: 50%;
          border: 2px solid var(--sb-accent);
          opacity: 0;
          animation: smartSonar 2.7s ease-out infinite;
        }

        .smart-sonar-ring:nth-child(2) { animation-delay: 0.9s; }
        .smart-sonar-ring:nth-child(3) { animation-delay: 1.8s; }

        @keyframes smartSonar {
          0% { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(3.2); opacity: 0; }
        }

        /* ====================================
           PAGE BACKGROUND — green blobs (N)
        ==================================== */

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

        /* ====================================
           BENTO TILES (RIGHT COLUMN)
        ==================================== */

        /* Higher specificity + !important so an older
           .smart-right-column rule elsewhere can't force one column */
        .smart-page .smart-layout .smart-right-column {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          grid-template-rows: auto auto minmax(0, 1fr) !important;
          gap: 12px;
          min-height: 0;
        }

        .smart-page .smart-layout {
          background: var(--sb-glass) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .smart-page .smart-layout .smart-card {
          background: var(--sb-glass-card);
        }

        .smart-page .smart-layout .smart-right-column > .smart-hero-tile {
          grid-column: 1 / -1 !important;
        }

        .smart-page .smart-layout .smart-right-column > .smart-metric-tile,
        .smart-page .smart-layout .smart-right-column > .smart-selected-tile,
        .smart-page .smart-layout .smart-right-column > .smart-device-tile-row {
          grid-column: auto !important;
          min-height: 0;
        }

        .smart-tile-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 700;
          color: var(--sb-muted);
        }

        .smart-tile-label svg {
          color: var(--sb-green);
        }

        .smart-tile-swatch {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          background: var(--sb-c);
        }

        .smart-tile-rows {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .smart-tile-rows > div {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }

        .smart-tile-rows dt {
          font-size: 12px;
          color: var(--sb-muted);
        }

        .smart-tile-rows dd {
          margin: 0;
          font-size: 13px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .smart-device-status-value {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .smart-tile-button {
          flex: 1;
          padding: 10px 12px !important;
          font-size: 12px !important;
          color: var(--sb-green) !important;
          border-color: var(--sb-accent) !important;
          background: var(--sb-soft) !important;
        }

        .smart-tile-button:hover {
          background: var(--sb-glow) !important;
        }

        .smart-device-note {
          margin: auto 0 0;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 10px;
          border-radius: 10px;
          border: 1px dashed var(--sb-border);
          font-size: 11px;
          color: var(--sb-muted);
        }

        .smart-device-note.ok {
          color: var(--sb-ok);
          border-style: solid;
        }

        .smart-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .smart-save-meal {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          border: 0;
          border-radius: 99px;
          background: var(--sb-green);
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(55, 107, 80, 0.2);
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        [data-theme="dark"] .smart-save-meal {
          color: #173c2a;
        }

        .smart-save-meal:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .smart-save-meal:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .smart-filled-pill {
          flex-shrink: 0;
          padding: 8px 14px;
          border-radius: 99px;
          border: 1px solid var(--sb-border);
          background: var(--sb-surface);
          color: var(--sb-green);
          font-size: 12px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }

        /* compartment colour dot on the tray number */
        .smart-compartment-number {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .smart-compartment-number::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 3px;
          background: var(--sb-c);
        }

        .smart-hero-tile {
          grid-column: 1 / -1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: clamp(12px, 1.4vw, 20px);
          padding: clamp(12px, 1.3vw, 18px) clamp(14px, 1.5vw, 20px);
          border-radius: 17px;
          border: 1px solid var(--sb-border);
          background: var(--sb-hero);
          color: var(--sb-hero-text);
          position: relative;
          overflow: hidden;
        }

        .smart-hero-tile .smart-calorie-ring {
          width: clamp(72px, 6.5vw, 104px);
          height: clamp(72px, 6.5vw, 104px);
        }

        .smart-hero-tile .smart-calorie-ring-track {
          stroke: var(--sb-hero-track);
        }

        .smart-hero-tile .smart-calorie-ring-bar {
          stroke: var(--sb-hero-ring);
        }

        .smart-hero-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
          position: relative;
          z-index: 1;
        }

        .smart-hero-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .smart-hero-label {
          margin: 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: var(--sb-hero-muted);
        }

        .smart-hero-clear {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 99px;
          border: 1px solid var(--sb-border);
          background: var(--sb-background);
          color: var(--sb-hero-text);
          font-size: 10px;
          font-weight: 750;
          transition: background-color 0.2s ease;
        }

        .smart-hero-clear:hover:not(:disabled) {
          background: var(--sb-soft);
        }

        .smart-hero-clear:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .smart-hero-value {
          font-size: clamp(26px, 2.6vw, 40px);
          font-weight: 850;
          line-height: 1;
          letter-spacing: -1px;
          font-variant-numeric: tabular-nums;
        }

        .smart-hero-value span {
          margin-left: 5px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0;
          color: var(--sb-hero-muted);
        }

        .smart-hero-meta {
          margin: 0;
          font-size: 11px;
          color: var(--sb-hero-muted);
        }

        .smart-stack-bar {
          display: flex;
          height: 9px;
          border-radius: 9px;
          overflow: hidden;
          background: var(--sb-hero-track);
          margin-top: 3px;
        }

        .smart-stack-bar > span {
          display: block;
          height: 100%;
        }

        .smart-stack-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 4px 12px;
          font-size: 10px;
          font-weight: 700;
          color: var(--sb-hero-muted);
        }

        .smart-stack-legend > span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .smart-stack-legend > span.empty {
          opacity: 0.55;
        }

        .smart-stack-legend i {
          width: 8px;
          height: 8px;
          border-radius: 3px;
        }

        .smart-metric-tile {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: clamp(10px, 1vw, 14px) clamp(12px, 1.1vw, 16px);
        }

        .smart-metric-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--sb-muted);
        }

        .smart-metric-label svg {
          color: var(--sb-green);
        }

        .smart-metric-value {
          font-size: clamp(20px, 1.9vw, 28px);
          font-weight: 850;
          line-height: 1.05;
          letter-spacing: -0.6px;
          font-variant-numeric: tabular-nums;
          transition: color 0.4s ease;
        }

        .smart-metric-value span {
          margin-left: 4px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0;
          color: var(--sb-muted);
        }

        .smart-metric-tile.mid .smart-metric-value { color: var(--sb-mid); }
        .smart-metric-tile.high .smart-metric-value { color: var(--sb-high); }

        .smart-metric-note {
          font-size: 10px;
          color: var(--sb-muted);
        }

        .smart-selected-tile {
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: clamp(12px, 1.2vw, 16px) clamp(14px, 1.3vw, 18px);
          overflow: hidden;
        }

        .smart-selected-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-shrink: 0;
        }

        .smart-selected-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1px;
          color: var(--sb-muted);
        }

        .smart-selected-eyebrow i {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          background: var(--sb-c);
        }

        .smart-selected-pill {
          padding: 4px 10px;
          border-radius: 99px;
          border: 1px solid var(--sb-border);
          background: var(--sb-soft);
          color: var(--sb-green);
          font-size: 10px;
          font-weight: 800;
        }

        .smart-selected-body {
          flex: 1 1 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 12px;
        }

        .smart-selected-empty {
          align-items: center;
          text-align: center;
          gap: 5px;
          justify-content: center;
          border: 1.5px dashed var(--sb-border);
          border-radius: 14px;
          padding: 10px;
        }

        .smart-selected-name {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: clamp(16px, 1.4vw, 20px);
          font-weight: 800;
          letter-spacing: -0.4px;
          line-height: 1.15;
        }

        .smart-selected-name span {
          font-size: 1.15em;
          filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.15));
        }

        .smart-selected-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .smart-mini-stat {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 9px 10px;
          border-radius: 12px;
          border: 1px solid var(--sb-border);
          background: var(--sb-background);
        }

        .smart-mini-stat span {
          font-size: 10px;
          font-weight: 700;
          color: var(--sb-muted);
        }

        .smart-mini-stat strong {
          font-size: clamp(13px, 1.1vw, 16px);
          font-weight: 850;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-variant-numeric: tabular-nums;
        }

        .smart-selected-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .smart-selected-actions .smart-button {
          padding: 10px 14px;
          font-size: 12px;
        }

        .smart-selected-actions .smart-button-primary {
          flex: 1;
        }

        .smart-remove-button {
          color: #b96060;
        }

        .smart-device-tile-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: clamp(12px, 1.2vw, 16px) clamp(14px, 1.3vw, 18px);
        }

        .smart-device-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: var(--sb-background);
          color: var(--sb-muted);
        }

        .smart-device-icon.online {
          background: var(--sb-soft);
          color: var(--sb-ok);
        }

        .smart-device-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .smart-device-info strong {
          font-size: 13px;
        }

        .smart-device-info > span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          color: var(--sb-muted);
        }

        .smart-device-reading {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1px;
          text-align: right;
        }

        .smart-device-reading > span {
          font-size: 10px;
          color: var(--sb-muted);
        }

        .smart-device-reading strong {
          font-size: 17px;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
        }

        .smart-device-reading em {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-style: normal;
          font-size: 10px;
          color: var(--sb-muted);
        }

        .smart-device-reading em.ok {
          color: var(--sb-ok);
        }

        @media (max-width: 600px) {
          .smart-page .smart-layout .smart-right-column {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .smart-selected-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .smart-hero-tile {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        /* ====================================
           NOTIFICATION
        ==================================== */

        .smart-toast {
          position: fixed;
          bottom: 20px;
          right: 20px;

          z-index: 1100;

          display: flex;
          align-items: center;

          gap: 8px;
          padding: 12px 16px;

          border-radius: 12px;

          background: var(--sb-toast);
          color: white;

          font-size: 12px;
          font-weight: 700;

          box-shadow:
            0 10px 30px rgba(0, 0, 0, 0.15);
        }

        /* ====================================
           SHORT DESKTOP SCREENS
           KEEP SINGLE SCREEN LAYOUT
        ==================================== */

        @media (min-width: 951px)
          and (max-height: 800px) {

          .smart-page {
            gap: 8px;
          }

          .smart-page .smart-layout {
            padding: 9px;
            gap: 9px;
          }

          .smart-page .smart-lunchbox-panel {
            padding: 0;
            gap: 8px;
          }

          .smart-page .smart-lunchbox-panel
          .smart-panel-heading {
            padding: 5px 4px 0;
          }

          .smart-page .smart-lunchbox-stage {
            padding: 12px;
            border-radius: 13px;
          }

          .smart-right-column {
            gap: 9px;
          }

          .smart-panel {
            padding: 10px;
            gap: 6px;
          }

          .smart-lunchbox-shell {
            padding: 9px;
            gap: 9px;
            border-width: 6px;
            border-radius: 23px;
          }

          .smart-panel-title {
            font-size: 19px;
          }

          .smart-panel-icon {
            width: 26px;
            height: 26px;
          }

          .smart-detail-card {
            padding: 5px;
            gap: 4px;
          }

          .smart-detail-food {
            gap: 3px;
            padding: 4px;
          }

          .smart-nutrition-stat {
            padding: 6px;
          }

          .smart-nutrition-footer
          .smart-button {
            padding: 5px 8px;
          }

          .smart-detail-actions
          .smart-button {
            padding: 5px 3px;
          }

          .smart-compartment-button {
            gap: 6px;
            padding: 8px;
          }

          .smart-info-line {
            font-size: 9px;
            padding-bottom: 3px;
          }
        }

        /* ====================================
           TABLET / SMALL SCREEN FALLBACK
        ==================================== */

        @media (max-width: 950px),
          (max-height: 560px) {

          .smart-page {
            height: auto;
            overflow: visible;
          }

          .smart-page .smart-layout {
            flex: none;

            grid-template-columns: 1fr;
            grid-template-rows: auto;

            overflow: visible;
          }

          .smart-page .smart-lunchbox-panel {
            grid-column: 1;
            grid-row: auto;

            min-height: 440px;
            padding: 0;
          }

          .smart-page .smart-lunchbox-stage {
            min-height: 340px;
          }

          .smart-lunchbox-shell {
            min-height: 310px;
          }

          .smart-page .smart-layout .smart-right-column {
            grid-template-rows: auto !important;
          }

          .smart-page .smart-selected-tile {
            min-height: 260px;
          }

          .smart-nutrition-panel {
            min-height: 240px;
          }

          .smart-details-panel {
            min-height: 260px;
          }
        }

        @media (max-width: 600px) {

          .smart-header {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .smart-page .smart-layout {
            gap: 10px;
            padding: 8px;
          }

          .smart-page .smart-lunchbox-panel {
            min-height: 370px;

            padding: 0;
            gap: 8px;
          }

          .smart-page .smart-lunchbox-panel
          .smart-panel-heading {
            padding: 5px 3px 0;
          }

          .smart-page .smart-lunchbox-stage {
            min-height: 275px;
            padding: 10px;
          }

          .smart-lunchbox-shell {
            min-height: 255px;

            border-width: 5px;
            padding: 8px;
            gap: 7px;

            border-radius: 20px;
          }

          .smart-compartment-button {
            padding: 6px;
            border-radius: 12px;
          }

          .smart-device-dropdown {
            width: min(420px, calc(100vw - 40px));

            left: 0;
            right: auto;
          }

          .smart-detail-actions {
            flex-wrap: wrap;
          }

          .smart-detail-actions
          .smart-button {
            white-space: normal;
          }

          .smart-panel {
            padding: 9px;
          }

          .smart-modal {
            padding: 16px;
          }
        }

      `}</style>

      {/* ====================================
          PAGE HEADER
      ==================================== */}

      <motion.header
        className="smart-header"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <p className="smart-eyebrow">
            YOUR SMART LUNCHBOX
          </p>

          <h2 className="smart-title">
            Your lunch, at a glance.
          </h2>

          <p className="smart-muted">
            Manage your compartments and monitor
            your BiteWise device.
          </p>
        </div>

        {/* COMPARTMENT COUNT */}

        <div className="smart-header-actions">
          <span className="smart-filled-pill">
            {filledCount} / 3 filled
          </span>

          {onSaveMeals && (
            <button
              type="button"
              className="smart-save-meal"
              onClick={saveToHistory}
              disabled={filledCount === 0 || savingMeal}
              title={
                filledCount === 0
                  ? 'Add food to a compartment first'
                  : 'Record this lunchbox as a meal'
              }
            >
              <Save size={15} />
              {savingMeal ? 'Saving…' : 'Save to Meal History'}
            </button>
          )}
        </div>
      </motion.header>

      {/* ====================================
          SINGLE MAIN BOX
      ==================================== */}

      <main className="smart-layout">

        {/* ==================================
            LEFT: LUNCHBOX COMPARTMENTS

            NO EXTRA WHITE CARD
        ================================== */}

        <motion.section
          className="smart-lunchbox-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >

          {/* TITLE OUTSIDE GREEN BACKGROUND */}

          <div className="smart-panel-heading">
            <div>
              <h3 className="smart-panel-title">
                Lunchbox Compartments
              </h3>

              <p className="smart-panel-subtitle">
                Select a compartment to preview
                its food and weight.
              </p>
            </div>

            <span className="smart-panel-icon">
              <UtensilsCrossed size={17} />
            </span>
          </div>

          {/* ==================================
              GREEN BACKGROUND STARTS HERE
          ================================== */}

          <div className="smart-lunchbox-stage">

            <div className="smart-lunchbox-shell">

              {compartments.map((compartment, index) => {
                // Liquid level: how full this compartment is (idle 6% when empty)
                const level = compartment.food
                  ? Math.max(
                      14,
                      Math.min(
                        88,
                        percentOf(
                          compartment.weight,
                          COMPARTMENT_CAPACITY[compartment.id] ?? 250
                        )
                      )
                    )
                  : 6

                return (
                <motion.button
                  key={compartment.id}
                  type="button"
                  className={`smart-compartment-button ${
                    selectedCompartment === compartment.id ||
                    activeCompartment === compartment.id
                      ? 'is-active'
                      : ''
                  }`}
                  style={{
                    ['--sb-c' as string]: `var(--sb-c${compartment.id})`,
                  }}
                  aria-pressed={selectedCompartment === compartment.id}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{
                    type: 'spring',
                    stiffness: 320,
                    damping: 22,
                  }}
                  onClick={() =>
                    selectCompartment(compartment.id)
                  }
                  aria-label={
                    compartment.food
                      ? `Compartment ${compartment.id}: ${compartment.food.name}, ${formatNumber(compartment.weight, 1)} grams`
                      : `Select food for compartment ${compartment.id}`
                  }
                >
                  <span className="smart-compartment-number">
                    {String(compartment.id)
                      .padStart(2, '0')}
                  </span>

                  <AnimatePresence mode="wait" initial={false}>
                    {compartment.food ? (
                      <motion.span
                        key={compartment.food.id}
                        className="smart-compartment-content"
                        initial={{ opacity: 0, y: -46, scale: 0.6 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                          opacity: 0,
                          scale: 0.6,
                          transition: {
                            duration: 0.22,
                            delay: index * 0.08,
                          },
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 260,
                          damping: 14,
                        }}
                      >
                        <span className="smart-compartment-emoji">
                          {compartment.food.emoji}
                        </span>

                        <span className="smart-compartment-name">
                          {compartment.food.name}
                        </span>

                        <CompartmentWeight
                          weight={compartment.weight}
                        />

                        {/* SPARKLES when the food lands */}
                        <span
                          className="smart-sparkles"
                          aria-hidden="true"
                        >
                          {SPARKLES.map(([x, y], sparkle) => (
                            <i
                              key={sparkle}
                              style={{
                                ['--sx' as string]: `${x}px`,
                                ['--sy' as string]: `${y}px`,
                                animationDelay: `${0.28 + sparkle * 0.03}s`,
                              }}
                            />
                          ))}
                        </span>
                      </motion.span>
                    ) : (
                      <motion.span
                        key="empty"
                        className="smart-compartment-content"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.25 }}
                      >
                        <span className="smart-compartment-plus-wrap">
                          <Plus className="smart-compartment-plus" />
                        </span>

                        <span className="smart-compartment-name">
                          Add Food
                        </span>

                        <span className="smart-compartment-weight">
                          Compartment {compartment.id}
                        </span>
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* LIQUID FILL — rises with the food weight */}
                  <motion.span
                    className={`smart-liquid ${
                      compartment.food ? '' : 'idle'
                    }`}
                    aria-hidden="true"
                    initial={false}
                    animate={{ height: `${level}%` }}
                    transition={{
                      type: 'spring',
                      stiffness: 55,
                      damping: 13,
                      delay: compartment.food ? 0.25 : index * 0.08,
                    }}
                  >
                    <svg
                      className="smart-wave back"
                      viewBox="0 0 200 14"
                      preserveAspectRatio="none"
                    >
                      <path d="M0 8 Q25 0 50 8 T100 8 T150 8 T200 8 V14 H0 Z" />
                    </svg>
                    <svg
                      className="smart-wave"
                      viewBox="0 0 200 12"
                      preserveAspectRatio="none"
                    >
                      <path d="M0 6 Q25 12 50 6 T100 6 T150 6 T200 6 V12 H0 Z" />
                    </svg>

                    {compartment.food && (
                      <>
                        <i className="smart-bubble" />
                        <i className="smart-bubble" />
                        <i className="smart-bubble" />
                      </>
                    )}
                  </motion.span>
                </motion.button>
                )
              })}

            </div>
          </div>

          {/* ==================================
              GREEN BACKGROUND ENDS HERE
          ================================== */}

          {/* BOTTOM DESCRIPTION OUTSIDE GREEN */}

          <div className="smart-info-line">
            <Info size={12} />

            <span>
              Select a compartment to manage its food.
              Portion weights are entered separately.
            </span>
          </div>

        </motion.section>

        {/* ==================================
            RIGHT COLUMN
        ================================== */}

        <div className="smart-right-column">

          {/* ================================
              TOTAL CALORIES (HERO)
          ================================ */}

          <motion.section
            className="smart-hero-tile"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14 }}
          >
            <span className="smart-ring-wrap">
              {/* GLOW each time the calorie total changes */}
              {totals.calories > 0 && (
                <span
                  key={Math.round(totals.calories)}
                  className="smart-ring-glow"
                  aria-hidden="true"
                />
              )}

            <svg
              className="smart-calorie-ring"
              viewBox="0 0 80 80"
              aria-hidden="true"
            >
              <circle
                className="smart-calorie-ring-track"
                cx="40"
                cy="40"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="8"
              />
              <motion.circle
                className="smart-calorie-ring-bar"
                cx="40"
                cy="40"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={RING_LENGTH}
                initial={{ strokeDashoffset: RING_LENGTH }}
                animate={{
                  strokeDashoffset:
                    RING_LENGTH * (1 - caloriePercent / 100),
                }}
                transition={{
                  type: 'spring',
                  stiffness: 70,
                  damping: 15,
                }}
              />
            </svg>
            </span>

            <div className="smart-hero-body">
              <div className="smart-hero-top">
                <p className="smart-hero-label">
                  <Flame size={14} />
                  Total calories
                </p>

                <button
                  type="button"
                  className="smart-hero-clear"
                  onClick={clearAll}
                  disabled={filledCount === 0}
                >
                  <RefreshCcw size={12} />
                  Clear All
                </button>
              </div>

              <strong className="smart-hero-value">
                {formatNumber(animatedCalories)}
                <span>kcal</span>
              </strong>

              <p className="smart-hero-meta">
                {formatNumber(animatedWeight, 1)} g of food ·{' '}
                {filledCount} / 3 filled ·{' '}
                {formatNumber(caloriePercent)}% of{' '}
                {formatNumber(reference.calories)} kcal
              </p>
            </div>
          </motion.section>

          {/* ================================
              SUGAR AND SODIUM
          ================================ */}

          {[
            {
              key: 'sugar',
              label: 'Sugar',
              icon: <Droplets size={14} />,
              value: formatNumber(animatedSugar, 1),
              unit: 'g',
              percent: sugarPercent,
              reference: `${reference.sugar} g`,
              delay: 0.2,
            },
            {
              key: 'sodium',
              label: 'Sodium',
              icon: <Scale size={14} />,
              value: formatNumber(animatedSodium),
              unit: 'mg',
              percent: sodiumPercent,
              reference: `${formatNumber(reference.sodium)} mg`,
              delay: 0.26,
            },
          ].map((item) => (
            <motion.section
              key={item.key}
              className={`smart-card smart-metric-tile ${levelOf(item.percent)}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: item.delay }}
            >
              <span className="smart-metric-label">
                {item.icon}
                {item.label}
              </span>

              <strong className="smart-metric-value">
                {item.value}
                <span>{item.unit}</span>
              </strong>

              <span
                className={`smart-stat-bar ${levelOf(item.percent)}`}
                aria-hidden="true"
              >
                <span style={{ width: `${item.percent}%` }} />
              </span>

              <span className="smart-metric-note">
                {formatNumber(item.percent)}% of {item.reference} daily
                reference
              </span>
            </motion.section>
          ))}

          {/* ================================
              SELECTED COMPARTMENT
          ================================ */}

          <motion.section
            className="smart-card smart-selected-tile"
            style={{
              ['--sb-c' as string]: `var(--sb-c${selected.id})`,
            }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.32 }}
          >
            <span className="smart-tile-label">
              <i className="smart-tile-swatch" />
              Compartment {selected.id}
            </span>

            <AnimatePresence mode="wait" initial={false}>
              {selected.food && selectedTileNutrition ? (
                <motion.div
                  key={`${selected.id}-${selected.food.id}`}
                  className="smart-selected-body"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.25 }}
                >
                  <h3 className="smart-selected-name">
                    {selected.food.name}
                  </h3>

                  <dl className="smart-tile-rows">
                    <div>
                      <dt>Weight</dt>
                      <dd>{formatNumber(selected.weight, 1)} g</dd>
                    </div>
                    <div>
                      <dt>Calories</dt>
                      <dd>{formatNumber(selectedTileNutrition.calories)} kcal</dd>
                    </div>
                    <div>
                      <dt>Sugar</dt>
                      <dd>{formatNumber(selectedTileNutrition.sugar, 1)} g</dd>
                    </div>
                    <div>
                      <dt>Sodium</dt>
                      <dd>{formatNumber(selectedTileNutrition.sodium)} mg</dd>
                    </div>
                  </dl>
                </motion.div>
              ) : (
                <motion.div
                  key={`${selected.id}-empty`}
                  className="smart-selected-body smart-selected-empty"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.25 }}
                >
                  <EmptyLunchboxIcon />

                  <strong className="smart-detail-food-name">
                    No food yet
                  </strong>

                  <span className="smart-detail-food-meta">
                    Tap a compartment or add food.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="smart-selected-actions">
              <button
                type="button"
                className="smart-button smart-tile-button"
                onClick={() => openPicker(selected.id)}
              >
                {selected.food ? 'Change food' : '+ Add food'}
              </button>

              {selected.food && (
                <button
                  type="button"
                  className="smart-button smart-remove-button"
                  aria-label={`Clear compartment ${selected.id}`}
                  onClick={() => clearCompartment(selected.id)}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </motion.section>

          {/* ================================
              BITEWISE DEVICE
          ================================ */}

          <motion.section
            className="smart-card smart-device-tile-row"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.38 }}
          >
            <span className="smart-tile-label">
              {deviceOnline ? (
                <Wifi size={14} />
              ) : (
                <WifiOff size={14} />
              )}
              Device
            </span>

            <dl className="smart-tile-rows">
              <div>
                <dt>Status</dt>
                <dd className="smart-device-status-value">
                  <span
                    className={`smart-pulse-dot ${
                      deviceOnline ? 'online' : ''
                    }`}
                    aria-hidden="true"
                  />
                  {deviceOnline ? 'Online' : 'Offline'}
                </dd>
              </div>
              <div>
                <dt>Live weight</dt>
                <dd>{displayedWeight}</dd>
              </div>
              <div>
                <dt>Sensor</dt>
                <dd>{hasValidWeight ? 'Ready' : deviceOnline ? 'Not ready' : '—'}</dd>
              </div>
            </dl>

            {/* SONAR — searching while offline, steady glow when online */}
            <div
              className={`smart-sonar ${
                deviceOnline ? 'online' : ''
              }`}
              aria-hidden="true"
            >
              {!deviceOnline && (
                <>
                  <span className="smart-sonar-ring" />
                  <span className="smart-sonar-ring" />
                  <span className="smart-sonar-ring" />
                </>
              )}

              <span className="smart-sonar-core">
                {deviceOnline ? (
                  <Wifi size={22} />
                ) : (
                  <WifiOff size={22} />
                )}
              </span>
            </div>

            <p
              className={`smart-device-note ${
                hasValidWeight ? 'ok' : ''
              }`}
            >
              {hasValidWeight ? (
                <CheckCircle2 size={13} />
              ) : (
                <Info size={13} />
              )}
              {deviceOnline
                ? sensorStatus
                : 'Reconnecting to BiteWise...'}
            </p>
          </motion.section>

        </div>
      </main>

      {/* ====================================
          FOOD SELECTION MODAL
      ==================================== */}

      <AnimatePresence>
        {activeCompartment !== null && (
          <motion.div
            className="smart-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePicker}
          >
            <motion.div
              className="smart-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Select your food"
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 12,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 12,
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="smart-modal-header">
                <div>
                  <p className="smart-modal-label">
                    COMPARTMENT {activeCompartment}
                  </p>

                  <h3 className="smart-modal-title">
                    Select Your Food
                  </h3>

                  <p className="smart-muted">
                    Choose a food and enter
                    its portion weight.
                  </p>
                </div>

                <button
                  type="button"
                  className="smart-button"
                  aria-label="Close food picker"
                  onClick={closePicker}
                >
                  <X size={17} />
                </button>
              </div>

              {/* ACTUAL LIVE DEVICE WEIGHT */}

              <div className="smart-sensor-preview">
                <div className="smart-sensor-icon">
                  <Scale size={21} />
                </div>

                <div style={{ flex: 1 }}>
                  <strong
                    style={{
                      fontSize: 12,
                    }}
                  >
                    Live Scale Weight
                  </strong>

                  <p className="smart-muted">
                    Total weight measured by BiteWise.
                  </p>
                </div>

                <strong
                  style={{
                    fontSize: 19,
                    color: 'var(--sb-green)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {displayedWeight}
                </strong>
              </div>

              {/* INDIVIDUAL PORTION WEIGHT */}

              <div className="smart-portion-input">
                <div className="smart-portion-heading">
                  <div>
                    <strong
                      style={{
                        fontSize: 12,
                      }}
                    >
                      Portion Weight
                    </strong>

                    <p className="smart-muted">
                      Enter the weight of this food only.
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <input
                      className="smart-weight-input"
                      type="number"
                      min={0}
                      step={0.1}
                      value={portionWeight}
                      aria-label="Portion weight in grams"
                      onChange={(event) =>
                        setPortionWeight(
                          Math.max(
                            0,
                            Number(
                              event.target.value
                            ) || 0
                          )
                        )
                      }
                    />

                    <span className="smart-muted">
                      g
                    </span>
                  </div>
                </div>

                <p className="smart-muted">
                  The load cell measures total weight,
                  not individual compartments.
                </p>
              </div>

              {/* FOOD SEARCH */}

              <div className="smart-search-box">
                <Search
                  size={16}
                  color="var(--sb-muted)"
                />

                <input
                  className="smart-search-input"
                  type="text"
                  placeholder="Search food or category..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />

                {search && (
                  <button
                    type="button"
                    className="smart-button"
                    aria-label="Clear search"
                    onClick={() => setSearch('')}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* FOOD OPTIONS */}

              <div className="smart-food-list">

                {filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    className={`smart-food-option ${
                      selectedFood?.id === food.id
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() =>
                      setSelectedFood(food)
                    }
                  >
                    <span
                      style={{
                        fontSize: 27,
                      }}
                    >
                      {food.emoji}
                    </span>

                    <div style={{ flex: 1 }}>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: 12,
                        }}
                      >
                        {food.name}
                      </strong>

                      <span className="smart-muted">
                        {food.category}
                      </span>
                    </div>

                    <span className="smart-muted">
                      {food.calories} kcal / 100 g
                    </span>

                    {selectedFood?.id === food.id && (
                      <Check
                        size={16}
                        color="var(--sb-green)"
                      />
                    )}
                  </button>
                ))}

                {filteredFoods.length === 0 && (
                  <p
                    className="smart-muted"
                    style={{
                      padding: 16,
                      textAlign: 'center',
                    }}
                  >
                    No matching foods found.
                  </p>
                )}

              </div>

              {/* SELECTED FOOD SUMMARY */}

              {selectedFood && selectedNutrition && (
                <div className="smart-selected-summary">

                  <strong
                    style={{
                      fontSize: 13,
                    }}
                  >
                    {selectedFood.emoji}{' '}
                    {selectedFood.name}
                  </strong>

                  <p className="smart-muted">
                    Estimated nutrition for{' '}
                    {formatNumber(portionWeight, 1)} g
                  </p>

                  <div className="smart-selected-stats">
                    <div>
                      <p className="smart-muted">
                        Calories
                      </p>

                      <strong>
                        {formatNumber(
                          selectedNutrition.calories
                        )} kcal
                      </strong>
                    </div>

                    <div>
                      <p className="smart-muted">
                        Sugar
                      </p>

                      <strong>
                        {formatNumber(
                          selectedNutrition.sugar,
                          1
                        )} g
                      </strong>
                    </div>

                    <div>
                      <p className="smart-muted">
                        Sodium
                      </p>

                      <strong>
                        {formatNumber(
                          selectedNutrition.sodium
                        )} mg
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL FOOTER */}

              <div className="smart-modal-footer">
                <button
                  type="button"
                  className="smart-button"
                  onClick={closePicker}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="
                    smart-button
                    smart-button-primary
                  "
                  disabled={
                    !selectedFood ||
                    !Number.isFinite(portionWeight) ||
                    portionWeight <= 0
                  }
                  onClick={saveFood}
                >
                  <Check size={15} />
                  Save Food
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================
          NOTIFICATION
      ==================================== */}

      <AnimatePresence>
        {notification && (
          <motion.div
            className="smart-toast"
            role="status"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 15,
            }}
          >
            <CheckCircle2 size={17} />

            {notification}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
    </MotionConfig>
  )
}