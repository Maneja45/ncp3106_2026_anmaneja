import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Droplets,
  Info,
  Plus,
  RefreshCcw,
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

type SmartLunchboxProps = {
  deviceOnline: boolean
  liveWeight: number | null
  sensorReady: boolean
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

// ============================================
// MAIN COMPONENT
// ============================================

export default function SmartLunchbox({
  deviceOnline,
  liveWeight,
  sensorReady,
}: SmartLunchboxProps) {

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

  const [deviceMenuOpen, setDeviceMenuOpen] =
    useState<boolean>(false)

  const [notification, setNotification] =
    useState<string>('')

  const deviceMenuRef =
    useRef<HTMLDivElement>(null)

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
    if (!deviceMenuOpen) return

    const handleOutsideClick = (
      event: MouseEvent
    ): void => {
      if (
        deviceMenuRef.current &&
        !deviceMenuRef.current.contains(
          event.target as Node
        )
      ) {
        setDeviceMenuOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )
    }
  }, [deviceMenuOpen])

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent
    ): void => {
      if (event.key === 'Escape') {
        setActiveCompartment(null)
        setSelectedFood(null)
        setDeviceMenuOpen(false)
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
    setDeviceMenuOpen(false)
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

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <motion.div
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

        .smart-page button,
        .smart-page input {
          font-family: inherit;
        }

        .smart-page button {
          cursor: pointer;
        }

        .smart-page button:focus-visible {
          outline: 3px solid #91b69a;
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
          color: white;
          background: var(--sb-green);
          border-color: var(--sb-green);
        }

        .smart-button-primary:hover {
          background: var(--sb-dark-green);
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

          grid-template-columns:
            minmax(0, 1fr);

          grid-template-rows:
            minmax(0, 45fr)
            minmax(0, 55fr);

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

          padding: clamp(12px, 1.6vw, 25px);

          background: #e7ecdf;

          border: none;
          border-radius: 17px;

          overflow: hidden;
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

          border: 7px solid #82977c;
          border-radius: 27px;

          background: #aebfa7;

          box-shadow:
            inset 0 2px 6px rgba(0, 0, 0, 0.07),
            0 10px 25px rgba(65, 88, 58, 0.13);
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

          border: 2px solid #d5dfcf;
          border-radius: 18px;

          background: #faf8f0;
          color: #344e41;

          overflow: hidden;

          transition:
            background 0.2s,
            border-color 0.2s,
            box-shadow 0.2s;
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

        .smart-compartment-button:hover {
          background: #fffdf7;
          border-color: #88a58a;

          box-shadow:
            inset 0 0 0 1px #88a58a;
        }

        .smart-compartment-number {
          position: absolute;

          top: 12px;
          left: 13px;

          color: #809184;

          font-size: 12px;
          font-weight: 850;
        }

        .smart-compartment-plus {
          width: clamp(26px, 2.8vw, 44px);
          height: clamp(26px, 2.8vw, 44px);

          color: #81977d;
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

          color: #7a8d7f;
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
          color: #45634d;
          background: #e2eee3;
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

          background: #e1ebdf;
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
          border-color: #8cae90;
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

          background: #45634d;
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

          .smart-right-column {
            grid-template-rows: auto auto;
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

      <header className="smart-header">
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

        {/* ==================================
            DEVICE CONNECTION
        ================================== */}

        <div
          className="smart-device-wrap"
          ref={deviceMenuRef}
        >
          <button
            type="button"
            className="smart-device-trigger"
            aria-expanded={deviceMenuOpen}
            onClick={() =>
              setDeviceMenuOpen(
                (previous) => !previous
              )
            }
          >
            {deviceOnline ? (
              <Wifi
                size={17}
                color="#59956a"
              />
            ) : (
              <WifiOff
                size={17}
                color="#819086"
              />
            )}

            Device Connection

            <ChevronDown
              size={15}
              style={{
                transform: deviceMenuOpen
                  ? 'rotate(180deg)'
                  : 'rotate(0deg)',

                transition: 'transform 0.2s',
              }}
            />
          </button>

          <AnimatePresence>
            {deviceMenuOpen && (
              <motion.div
                className="smart-device-dropdown"
                initial={{
                  opacity: 0,
                  y: -8,
                  scale: 0.97,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                  scale: 0.97,
                }}
                transition={{
                  duration: 0.2,
                }}
              >
                <div className="smart-device-dropdown-header">
                  <div>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: 14,
                        marginBottom: 4,
                      }}
                    >
                      BiteWise Device
                    </strong>

                    <p className="smart-muted">
                      {deviceOnline
                        ? 'Device connected'
                        : 'Device disconnected'}
                    </p>
                  </div>

                  <span className="smart-device-status">
                    <span
                      className={`smart-status-dot ${
                        deviceOnline
                          ? 'online'
                          : ''
                      }`}
                    />

                    {deviceOnline
                      ? 'Online'
                      : 'Offline'}
                  </span>
                </div>

                <div className="smart-device-grid">

                  {/* COMPARTMENT STATUS */}

                  <div className="smart-device-tile">
                    <div className="smart-device-tile-heading">
                      <UtensilsCrossed size={19} />
                      <span>03</span>
                    </div>

                    <span className="smart-muted">
                      Compartments
                    </span>

                    <strong className="smart-device-value">
                      {filledCount}

                      <span
                        style={{
                          fontSize: 15,
                          color: 'var(--sb-muted)',
                        }}
                      >
                        {' '}/ 3
                      </span>
                    </strong>

                    <span className="smart-muted">
                      Foods selected
                    </span>

                    <div
                      style={{
                        display: 'flex',
                        gap: 5,
                        marginTop: 'auto',
                      }}
                    >
                      {compartments.map((item) => (
                        <span
                          key={item.id}
                          style={{
                            flex: 1,
                            height: 6,
                            borderRadius: 99,

                            background:
                              item.food
                                ? '#7eaa84'
                                : 'var(--sb-border)',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* ACTUAL LIVE WEIGHT */}

                  <div className="smart-device-tile">
                    <div className="smart-device-tile-heading">
                      <Scale size={19} />

                      {hasValidWeight ? (
                        <CheckCircle2 size={15} />
                      ) : (
                        <WifiOff size={15} />
                      )}
                    </div>

                    <span className="smart-muted">
                      Live Weight
                    </span>

                    <strong className="smart-device-value">
                      {displayedWeight}
                    </strong>

                    <span className="smart-muted">
                      HX711 + load cell
                    </span>

                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 'auto',
                        fontSize: 10,

                        color: hasValidWeight
                          ? '#59956a'
                          : 'var(--sb-muted)',
                      }}
                    >
                      {hasValidWeight ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <Info size={13} />
                      )}

                      {sensorStatus}
                    </span>
                  </div>
                </div>

                <div className="smart-device-footer">
                  <span className="smart-muted">
                    Live ESP32 monitoring
                  </span>

                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 10,

                      color: deviceOnline
                        ? '#59956a'
                        : 'var(--sb-muted)',
                    }}
                  >
                    {deviceOnline ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <RefreshCcw size={13} />
                    )}

                    {deviceOnline
                      ? 'Auto-connected'
                      : 'Reconnecting...'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ====================================
          SINGLE MAIN BOX
      ==================================== */}

      <main className="smart-layout">

        {/* ==================================
            LEFT: LUNCHBOX COMPARTMENTS

            NO EXTRA WHITE CARD
        ================================== */}

        <section className="smart-lunchbox-panel">

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

              {compartments.map((compartment) => (
                <motion.button
                  key={compartment.id}
                  type="button"
                  className="smart-compartment-button"
                  whileHover={{
                    scale: 1.005,
                  }}
                  whileTap={{
                    scale: 0.99,
                  }}
                  onClick={() =>
                    openPicker(compartment.id)
                  }
                  aria-label={
                    `Select food for compartment ${compartment.id}`
                  }
                >
                  <span className="smart-compartment-number">
                    {String(compartment.id)
                      .padStart(2, '0')}
                  </span>

                  {compartment.food ? (
                    <>
                      <span className="smart-compartment-emoji">
                        {compartment.food.emoji}
                      </span>

                      <span className="smart-compartment-name">
                        {compartment.food.name}
                      </span>

                      <span className="smart-compartment-weight">
                        {formatNumber(
                          compartment.weight,
                          1
                        )} g
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus className="smart-compartment-plus" />

                      <span className="smart-compartment-name">
                        Add Food
                      </span>

                      <span className="smart-compartment-weight">
                        Compartment {compartment.id}
                      </span>
                    </>
                  )}
                </motion.button>
              ))}

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

        </section>

        {/* ==================================
            RIGHT COLUMN
        ================================== */}

        <div className="smart-right-column">

          {/* ================================
              TOP: LUNCHBOX NUTRITION
          ================================ */}

          <section
            className="
              smart-card
              smart-panel
              smart-nutrition-panel
            "
          >
            <div className="smart-panel-heading">
              <div>
                <h3 className="smart-panel-title">
                  Lunchbox Nutrition
                </h3>

                <p className="smart-panel-subtitle">
                  Estimated nutrition for your
                  selected foods.
                </p>
              </div>

              <span className="smart-panel-icon">
                <Droplets size={18} />
              </span>
            </div>

            <div className="smart-nutrition-content">

              <div className="smart-calorie-box">
                <p className="smart-calorie-label">
                  TOTAL CALORIES
                </p>

                <strong className="smart-calorie-value">
                  {formatNumber(totals.calories)}

                  <span className="smart-calorie-unit">
                    kcal
                  </span>
                </strong>

                <p className="smart-muted">
                  {formatNumber(totals.weight, 1)} g
                  of selected food
                </p>
              </div>

              <div className="smart-nutrition-stats">

                <div className="smart-nutrition-stat">
                  <span className="smart-nutrition-stat-label">
                    <Droplets size={11} />
                    Sugar
                  </span>

                  <strong className="smart-nutrition-stat-value">
                    {formatNumber(totals.sugar, 1)} g
                  </strong>
                </div>

                <div className="smart-nutrition-stat">
                  <span className="smart-nutrition-stat-label">
                    <Scale size={11} />
                    Sodium
                  </span>

                  <strong className="smart-nutrition-stat-value">
                    {formatNumber(totals.sodium)} mg
                  </strong>
                </div>

                <div className="smart-nutrition-stat">
                  <span className="smart-nutrition-stat-label">
                    <UtensilsCrossed size={11} />
                    Compartments
                  </span>

                  <strong className="smart-nutrition-stat-value">
                    {filledCount} / 3
                  </strong>
                </div>

              </div>
            </div>

            <div className="smart-nutrition-footer">
              <button
                type="button"
                className="smart-button"
                onClick={clearAll}
              >
                <RefreshCcw size={12} />
                Clear All
              </button>

              <p className="smart-muted">
                Nutrition estimates vary
                by preparation.
              </p>
            </div>
          </section>

          {/* ================================
              BOTTOM: COMPARTMENT DETAILS
          ================================ */}

          <section
            className="
              smart-card
              smart-panel
              smart-details-panel
            "
          >
            <div className="smart-panel-heading">
              <div>
                <h3 className="smart-panel-title">
                  Compartment Details
                </h3>

                <p className="smart-panel-subtitle">
                  Manage each compartment separately.
                </p>
              </div>

              <span className="smart-panel-icon">
                <UtensilsCrossed size={17} />
              </span>
            </div>

            <div className="smart-details-grid">

              {compartments.map((compartment) => {
                const nutrition =
                  compartment.food
                    ? calculateNutrition(
                        compartment.food,
                        compartment.weight
                      )
                    : null

                return (
                  <div
                    key={compartment.id}
                    className="smart-detail-card"
                  >

                    <div className="smart-detail-header">

                      <strong className="smart-detail-name">
                        Compartment {compartment.id}
                      </strong>

                      <span
                        className={`smart-detail-badge ${
                          compartment.food
                            ? 'filled'
                            : ''
                        }`}
                      >
                        {compartment.food
                          ? 'Filled'
                          : 'Empty'}
                      </span>
                    </div>

                    <div className="smart-detail-food">

                      {compartment.food ? (
                        <>
                          <span className="smart-detail-emoji">
                            {compartment.food.emoji}
                          </span>

                          <strong className="smart-detail-food-name">
                            {compartment.food.name}
                          </strong>

                          <span className="smart-detail-food-meta">
                            {formatNumber(
                              compartment.weight,
                              1
                            )} g
                          </span>

                          <span className="smart-detail-food-meta">
                            {formatNumber(
                              nutrition?.calories ?? 0
                            )} kcal
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="smart-detail-emoji">
                            🍱
                          </span>

                          <strong className="smart-detail-food-name">
                            No food selected
                          </strong>

                          <span className="smart-detail-food-meta">
                            Waiting for food
                          </span>
                        </>
                      )}

                    </div>

                    <div className="smart-detail-actions">
                      <button
                        type="button"
                        className="
                          smart-button
                          smart-button-primary
                        "
                        onClick={() =>
                          openPicker(compartment.id)
                        }
                      >
                        <Plus size={12} />

                        {compartment.food
                          ? 'Edit Food'
                          : 'Select Food'}
                      </button>

                      {compartment.food && (
                        <button
                          type="button"
                          className="
                            smart-button
                            smart-remove-button
                          "
                          aria-label={
                            `Clear compartment ${compartment.id}`
                          }
                          onClick={() =>
                            clearCompartment(
                              compartment.id
                            )
                          }
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                  </div>
                )
              })}

            </div>
          </section>

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
  )
}