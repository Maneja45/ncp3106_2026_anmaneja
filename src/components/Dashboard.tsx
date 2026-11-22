import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'

import {
  CheckCircle2,
  Clock3,
  Cpu,
  Layers3,
  Leaf,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Utensils,
  Wifi,
  WifiOff,
} from 'lucide-react'

import CalorieRing from './CalorieRing'
import { type Meal, nutrition } from '../types/meals'

// ==========================================
// TYPES
// ==========================================

type DashboardProps = {
  calorieGoal: number
  sugarGoal: number
  sodiumGoal: number
  meals: Meal[]
  deviceOnline: boolean
  liveWeight: number | null
}

type TrendKey = 'calories' | 'sugar' | 'sodium'
type Status = 'ok' | 'near' | 'over'

// ==========================================
// HELPERS
// ==========================================

const dateKey = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

const percent = (value: number, goal: number) =>
  goal > 0 ? Math.round((value / goal) * 100) : 0

// For limits: under 80% = ok, 80–100% = near, above 100% = over
function statusOf(value: number, goal: number): Status {
  const ratio = goal > 0 ? value / goal : 0
  if (ratio > 1) return 'over'
  if (ratio >= 0.8) return 'near'
  return 'ok'
}

function mealMinutes(time: string) {
  const [clock, period] = time.split(' ')
  const [hour, minute] = clock.split(':').map(Number)
  return ((hour % 12) + (period === 'PM' ? 12 : 0)) * 60 + (minute || 0)
}

// Smoothly counts a number from its previous value to the new one.
function useCountUp(value: number, duration = 700): number {
  const [display, setDisplay] = useState(0)
  const current = useRef(0)

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

    const tick = (now: number) => {
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

// Chart geometry (SVG viewBox 0 0 620 180)
const CHART_W = 620
const CHART_H = 180
const X_START = 46
const X_END = 600
const Y_TOP = 18
const Y_BOTTOM = 150

const pointX = (index: number) => X_START + index * ((X_END - X_START) / 6)

const card = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay },
})

// ==========================================
// DASHBOARD
// ==========================================

export default function Dashboard({
  calorieGoal,
  sugarGoal,
  sodiumGoal,
  meals,
  deviceOnline,
  liveWeight,
}: DashboardProps) {
  // ---------- ESP32 (from App.tsx) ----------
  const isOnline = deviceOnline

  const hasValidWeight =
    typeof liveWeight === 'number' && Number.isFinite(liveWeight)

  const displayedWeight =
    isOnline && hasValidWeight && liveWeight !== null
      ? `${liveWeight.toFixed(1)} g`
      : '-- g'

  // ---------- This week (Sun → Sat, same as Meal Planner) ----------
  const today = new Date()
  const todayKey = dateKey(today)

  const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  sunday.setDate(sunday.getDate() - sunday.getDay())

  const WEEK = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday)
    date.setDate(sunday.getDate() + index)

    const key = dateKey(date)
    const dayMeals = meals.filter(meal => meal.date === key)

    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      full: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
      isToday: key === todayKey,
      calories: dayMeals.reduce((sum, meal) => sum + nutrition(meal).calories, 0),
      sugar: dayMeals.reduce((sum, meal) => sum + nutrition(meal).sugar, 0),
      sodium: dayMeals.reduce((sum, meal) => sum + nutrition(meal).sodium, 0),
    }
  })

  const [selectedDay, setSelectedDay] = useState<number>(today.getDay())
  const [trend, setTrend] = useState<TrendKey>('calories')

  // ---------- Today ----------
  const todayMeals = meals
    .filter(meal => meal.date === todayKey)
    .sort((a, b) => mealMinutes(a.time) - mealMinutes(b.time))

  const totals = todayMeals.reduce(
    (sum, meal) => {
      const value = nutrition(meal)

      return {
        calories: sum.calories + value.calories,
        sugar: sum.sugar + value.sugar,
        sodium: sum.sodium + value.sodium,
        weight: sum.weight + meal.weight,
      }
    },
    { calories: 0, sugar: 0, sodium: 0, weight: 0 }
  )

  const animatedCalories = useCountUp(totals.calories)
  const animatedSugar = useCountUp(totals.sugar)
  const animatedSodium = useCountUp(totals.sodium)

  const sugarStatus = statusOf(totals.sugar, sugarGoal)
  const sodiumStatus = statusOf(totals.sodium, sodiumGoal)

  const nutrients = [
    {
      label: 'Calories',
      value: Math.round(animatedCalories).toLocaleString(),
      goal: calorieGoal.toLocaleString(),
      unit: 'kcal',
      percentage: percent(totals.calories, calorieGoal),
      color: 'var(--db-calories)',
      status: null as Status | null,
    },
    {
      label: 'Sugar',
      value: Number(animatedSugar.toFixed(1)).toLocaleString(),
      goal: sugarGoal.toLocaleString(),
      unit: 'g',
      percentage: percent(totals.sugar, sugarGoal),
      color: 'var(--db-sugar)',
      status: sugarStatus,
    },
    {
      label: 'Sodium',
      value: Math.round(animatedSodium).toLocaleString(),
      goal: sodiumGoal.toLocaleString(),
      unit: 'mg',
      percentage: percent(totals.sodium, sodiumGoal),
      color: 'var(--db-sodium)',
      status: sodiumStatus,
    },
  ]

  // ---------- Smart Lunchbox compartments ----------
  const FOODS = [1, 2, 3].map(compartment => {
    const items = todayMeals.filter(meal => meal.compartment === compartment)
    const weight = items.reduce((sum, meal) => sum + meal.weight, 0)

    return {
      compartment,
      name: items.length === 0 ? 'Empty' : items.map(meal => meal.food).join(', '),
      weight,
      calories: Math.round(
        items.reduce((sum, meal) => sum + nutrition(meal).calories, 0)
      ),
      emoji: items[0]?.emoji ?? null,
      share: totals.weight > 0 ? (weight / totals.weight) * 100 : 0,
    }
  })

  // ---------- Daily insights ----------
  const insights: { status: Status; text: string }[] = []

  const caloriesLeft = Math.round(calorieGoal - totals.calories)
  insights.push({
    status: caloriesLeft < 0 ? 'near' : 'ok',
    text:
      caloriesLeft >= 0
        ? `${caloriesLeft.toLocaleString()} kcal left of your ${calorieGoal.toLocaleString()} kcal reference today.`
        : `${Math.abs(caloriesLeft).toLocaleString()} kcal above your ${calorieGoal.toLocaleString()} kcal reference today.`,
  })

  const sodiumLeft = Math.round(sodiumGoal - totals.sodium)
  insights.push({
    status: sodiumStatus,
    text:
      sodiumStatus === 'over'
        ? `Sodium is ${Math.abs(sodiumLeft).toLocaleString()} mg above the WHO limit. Choose less salty food for the rest of the day.`
        : sodiumStatus === 'near'
          ? `Sodium is close to the WHO limit (${percent(totals.sodium, sodiumGoal)}%). Go easy on salty food.`
          : `Sodium is at ${percent(totals.sodium, sodiumGoal)}% of the WHO limit — about ${sodiumLeft.toLocaleString()} mg left today.`,
  })

  insights.push({
    status: sugarStatus,
    text:
      sugarStatus === 'over'
        ? `Sugar is above the ${sugarGoal} g reference today.`
        : sugarStatus === 'near'
          ? `Sugar is close to the ${sugarGoal} g reference (${percent(totals.sugar, sugarGoal)}%).`
          : `Sugar is well within the ${sugarGoal} g reference (${percent(totals.sugar, sugarGoal)}%).`,
  })

  // ---------- Trend chart ----------
  const trendConfig: Record<TrendKey, { label: string; unit: string; goal: number; color: string; isLimit: boolean }> = {
    calories: { label: 'Calories', unit: 'kcal', goal: calorieGoal, color: 'var(--db-calories)', isLimit: false },
    sugar: { label: 'Sugar', unit: 'g', goal: sugarGoal, color: 'var(--db-sugar)', isLimit: true },
    sodium: { label: 'Sodium', unit: 'mg', goal: sodiumGoal, color: 'var(--db-sodium)', isLimit: true },
  }

  const currentTrend = trendConfig[trend]
  const values = WEEK.map(day => day[trend])

  const step = trend === 'sugar' ? 10 : 500
  const chartMax = Math.max(
    step,
    Math.ceil((Math.max(currentTrend.goal, ...values) * 1.1) / step) * step
  )

  const pointY = (value: number) =>
    Y_BOTTOM - (value / chartMax) * (Y_BOTTOM - Y_TOP)

  const linePoints = values.map((value, index) => `${pointX(index)},${pointY(value)}`)
  const trendLine = `M ${linePoints.join(' L ')}`
  const trendArea = `${trendLine} L ${pointX(6)},${Y_BOTTOM} L ${pointX(0)},${Y_BOTTOM} Z`
  const referenceY = pointY(currentTrend.goal)

  const selected = WEEK[selectedDay] ?? WEEK[0]
  const selectedValue = selected[trend]
  const selectedStatus = currentTrend.isLimit
    ? statusOf(selectedValue, currentTrend.goal)
    : null

  const formatTrend = (value: number) =>
    trend === 'sugar'
      ? Number(value.toFixed(1)).toLocaleString()
      : Math.round(value).toLocaleString()

  return (
    <MotionConfig reducedMotion="user">
      <div className="db-page">
        <style>{`
          /* ================= THEME ================= */
          .db-page {
            --db-text: var(--text, #203a2e);
            --db-muted: var(--muted, #6f8176);
            --db-border: var(--border, #e2eadc);
            --db-surface: var(--surface, #ffffff);
            --db-primary: var(--primary, #376b50);

            --db-ink: #1f3d2c;
            --db-glass: rgba(255, 255, 255, 0.86);
            --db-soft: #e9f1e8;
            --db-tile: #f6f7f3;
            --db-track: #e3eadf;
            --db-ok: #5f9a6c;
            --db-near: #c98a2b;
            --db-over: #c4544c;
            --db-calories: #376b50;
            --db-sugar: #d98a3d;
            --db-sodium: #3f9e8f;
            --db-c1: #d4b878;
            --db-c2: #c0843e;
            --db-c3: #5f9c45;
            --db-bubble: #376b50;
            --db-bubble-text: #ffffff;
          }

          [data-theme="dark"] .db-page {
            --db-ink: #eef6e6;
            --db-glass: rgba(22, 36, 29, 0.82);
            --db-soft: #27412f;
            --db-tile: #22372b;
            --db-track: #2f4637;
            --db-ok: #8cc77a;
            --db-near: #e2b15f;
            --db-over: #ee8b80;
            --db-calories: #a1d7ae;
            --db-sugar: #efb57a;
            --db-sodium: #7fd0c2;
            --db-c1: #e8d7a4;
            --db-c2: #e0a35c;
            --db-c3: #8cc76f;
            --db-bubble: #b6dec0;
            --db-bubble-text: #173c2a;
          }

          /* ================= SHELL ================= */
          .db-page {
            width: 100%;
            height: 100%;
            min-height: 0;
            min-width: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            color: var(--db-text);
            font-family: inherit;
          }

          .db-page *,
          .db-page *::before,
          .db-page *::after {
            box-sizing: border-box;
          }

          .db-page button {
            font-family: inherit;
            cursor: pointer;
          }

          .db-page button:focus-visible {
            outline: 2px solid var(--db-primary);
            outline-offset: 2px;
          }

          .db-num {
            font-family: 'Manrope', sans-serif;
            font-variant-numeric: tabular-nums;
          }

          .db-grid {
            flex: 1;
            min-height: 0;
            display: grid;
            grid-template-columns: repeat(12, minmax(0, 1fr));
            grid-template-rows: minmax(0, 1.3fr) minmax(0, 1fr);
            grid-template-areas:
              "nutrition nutrition nutrition nutrition nutrition lunchbox lunchbox lunchbox right right right right"
              "trends trends trends trends trends trends trends meals meals meals meals meals";
            gap: 12px;
            padding: 2px;
          }

          .db-card {
            min-width: 0;
            min-height: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            padding: 16px;
            border-radius: 20px;
            border: 1px solid var(--db-border);
            background: var(--db-glass);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            box-shadow: 0 5px 17px rgba(30, 60, 40, 0.05);
            transition: background-color 0.35s ease, border-color 0.35s ease;
          }

          .db-nutrition { grid-area: nutrition; }
          .db-lunchbox { grid-area: lunchbox; }
          .db-trends { grid-area: trends; }
          .db-meals { grid-area: meals; }

          .db-right {
            grid-area: right;
            min-height: 0;
            display: grid;
            grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
            gap: 12px;
          }

          /* headings */
          .db-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 12px;
            flex-shrink: 0;
          }

          .db-heading-left {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
          }

          .db-heading-icon {
            width: 34px;
            height: 34px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            border-radius: 11px;
            background: var(--db-soft);
            color: var(--db-primary);
          }

          [data-theme="dark"] .db-heading-icon {
            color: var(--db-calories);
          }

          .db-heading h3 {
            margin: 0;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: clamp(14px, 1.2vw, 18px);
            font-weight: 700;
            letter-spacing: -0.3px;
            color: var(--db-ink);
          }

          .db-heading p {
            margin: 2px 0 0;
            font-size: 11px;
            color: var(--db-muted);
          }

          .db-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 8px;
            border-radius: 99px;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
          }

          .db-chip.ok { color: var(--db-ok); background: color-mix(in srgb, var(--db-ok) 14%, transparent); }
          .db-chip.near { color: var(--db-near); background: color-mix(in srgb, var(--db-near) 16%, transparent); }
          .db-chip.over { color: var(--db-over); background: color-mix(in srgb, var(--db-over) 16%, transparent); }
          .db-chip.info { color: var(--db-muted); background: var(--db-soft); }

          /* ================= TODAY'S NUTRITION ================= */
          .db-nutrition-body {
            flex: 1;
            min-height: 0;
            display: grid;
            grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
            gap: 12px;
          }

          .db-rings {
            min-width: 0;
            min-height: 0;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .db-rings > * {
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
          }

          .db-rings .sb-triple-ring {
            padding: 0;
            border: none;
            border-radius: 0;
            background: transparent;
          }

          .db-rings .sb-triple-ring-header,
          .db-rings .sb-triple-ring-legend {
            display: none;
          }

          .db-rings .sb-triple-ring-graphic {
            width: 100%;
            height: 100%;
            flex: 1;
            min-height: 0;
          }

          .db-nutrient-list {
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 0;
            min-height: 0;
          }

          .db-nutrient {
            padding: 11px 0;
            border-bottom: 1px solid var(--db-border);
          }

          .db-nutrient:last-child {
            border-bottom: 0;
          }

          .db-nutrient-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            margin-bottom: 4px;
          }

          .db-nutrient-label {
            display: flex;
            align-items: center;
            gap: 7px;
            font-size: 12px;
            font-weight: 700;
          }

          .db-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
          }

          .db-nutrient-bottom {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 6px;
            padding-left: 17px;
          }

          .db-nutrient-bottom strong {
            font-size: clamp(14px, 1.3vw, 19px);
            font-weight: 800;
            color: var(--db-ink);
          }

          .db-nutrient-bottom span {
            font-size: 10px;
            color: var(--db-muted);
          }

          .db-nutrient-bottom b {
            font-size: 11px;
            font-weight: 800;
            color: var(--db-muted);
          }

          /* ================= SMART LUNCHBOX ================= */
          .db-food-list {
            flex: 1;
            min-height: 0;
            display: grid;
            grid-template-rows: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }

          .db-food {
            position: relative;
            min-width: 0;
            min-height: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px 12px;
            border-radius: 14px;
            background: var(--db-tile);
            border: 1px solid var(--db-border);
            overflow: hidden;
          }

          .db-food-emoji {
            width: 42px;
            height: 42px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            border-radius: 12px;
            font-size: 24px;
            background: color-mix(in srgb, var(--db-c) 18%, transparent);
          }

          .db-food-empty {
            width: 42px;
            height: 42px;
            flex-shrink: 0;
            border-radius: 12px;
            border: 1.5px dashed color-mix(in srgb, var(--db-c) 60%, transparent);
          }

          .db-food-info {
            flex: 1;
            min-width: 0;
          }

          .db-food-info strong {
            display: block;
            font-size: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .db-food-info span {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            margin-top: 3px;
            font-size: 10px;
            color: var(--db-muted);
          }

          .db-food-info span i {
            width: 7px;
            height: 7px;
            border-radius: 2px;
            background: var(--db-c);
          }

          .db-food-stats {
            text-align: right;
            flex-shrink: 0;
          }

          .db-food-stats strong {
            display: block;
            font-size: 12px;
          }

          .db-food-stats span {
            display: block;
            margin-top: 3px;
            font-size: 10px;
            color: var(--db-muted);
          }

          .db-food-fill {
            position: absolute;
            left: 12px;
            right: 12px;
            bottom: 6px;
            height: 3px;
            border-radius: 3px;
            background: var(--db-track);
            overflow: hidden;
          }

          .db-food-fill > span {
            display: block;
            height: 100%;
            background: var(--db-c);
          }

          /* ================= DEVICE ================= */
          .db-device {
            position: relative;
            padding: 14px;
            border: 0;
            color: #ffffff;
            background: linear-gradient(125deg, #244b34 0%, #376b50 60%, #234c35 100%);
          }

          [data-theme="dark"] .db-device {
            background: linear-gradient(125deg, #1b3a28 0%, #24452f 60%, #1b3a28 100%);
          }

          .db-device::after {
            content: '';
            position: absolute;
            width: 150px;
            height: 150px;
            right: -65px;
            bottom: -100px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.13);
            box-shadow:
              0 0 0 15px rgba(255, 255, 255, 0.035),
              0 0 0 32px rgba(255, 255, 255, 0.025);
            pointer-events: none;
          }

          .db-device .db-heading {
            margin-bottom: 6px;
            position: relative;
            z-index: 1;
          }

          .db-device .db-heading h3 {
            color: #ffffff;
          }

          .db-device .db-heading-icon {
            background: rgba(255, 255, 255, 0.14);
            color: #ffffff;
          }

          .db-device-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 10px;
            border-radius: 99px;
            background: #ffffff;
            color: #31513c;
            font-size: 10px;
            font-weight: 800;
          }

          .db-status-dot {
            position: relative;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #eba25b;
          }

          .db-status-dot.online {
            background: #45b879;
          }

          .db-status-dot::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: inherit;
            animation: dbPulse 2.4s ease-out infinite;
          }

          .db-status-dot.online::after {
            animation-duration: 1.4s;
          }

          @keyframes dbPulse {
            0% { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(2.8); opacity: 0; }
          }

          .db-device-content {
            flex: 1;
            min-height: 0;
            display: flex;
            align-items: center;
            gap: 14px;
            position: relative;
            z-index: 1;
          }

          .db-device-visual {
            width: 38%;
            display: grid;
            place-items: center;
          }

          .db-device-box {
            width: clamp(52px, 6vw, 86px);
            height: clamp(42px, 4.6vw, 62px);
            display: grid;
            place-items: center;
            border-radius: 16px;
            border: 5px solid #9cb8a4;
            background: #dce7d8;
            color: #376b50;
            transform: rotate(-12deg);
            box-shadow:
              0 10px 18px rgba(0, 0, 0, 0.18),
              inset 0 -10px 0 rgba(60, 100, 70, 0.12);
            animation: dbFloat 4s ease-in-out infinite;
          }

          @keyframes dbFloat {
            0%, 100% { transform: rotate(-12deg) translateY(0); }
            50% { transform: rotate(-9deg) translateY(-4px); }
          }

          .db-device-info {
            flex: 1;
            min-width: 0;
            padding-left: 14px;
            border-left: 1px solid rgba(255, 255, 255, 0.25);
          }

          .db-device-info p {
            margin: 0 0 2px;
            font-size: 10px;
            color: rgba(255, 255, 255, 0.8);
          }

          .db-device-info strong {
            display: block;
            font-size: clamp(18px, 2vw, 28px);
            letter-spacing: -0.5px;
            white-space: nowrap;
          }

          .db-device-info span {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 4px;
            font-size: 10px;
            color: rgba(255, 255, 255, 0.72);
          }

          /* ================= INSIGHTS ================= */
          .db-insights {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
            gap: 8px;
            overflow: hidden;
          }

          .db-insight {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 12.5px;
            line-height: 1.45;
            padding: 8px 10px;
            border-radius: 12px;
            background: var(--db-tile);
            border: 1px solid var(--db-border);
            color: var(--db-text);
          }

          .db-insight svg {
            flex-shrink: 0;
            margin-top: 2px;
          }

          .db-insight.ok svg { color: var(--db-ok); }
          .db-insight.near svg { color: var(--db-near); }
          .db-insight.over svg { color: var(--db-over); }

          /* ================= TRENDS ================= */
          .db-tabs {
            display: flex;
            gap: 5px;
          }

          .db-tabs button {
            padding: 5px 10px;
            border-radius: 9px;
            border: 1px solid var(--db-border);
            background: var(--db-surface);
            color: var(--db-text);
            font-size: 11px;
            font-weight: 700;
            transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
          }

          .db-tabs button.on {
            border-color: var(--db-t);
            background: var(--db-t);
            color: #ffffff;
          }

          [data-theme="dark"] .db-tabs button.on {
            color: #173c2a;
          }

          .db-chart {
            position: relative;
            flex: 1;
            min-height: 0;
          }

          .db-chart svg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            overflow: visible;
          }

          .db-y-label {
            position: absolute;
            left: 0;
            transform: translateY(-50%);
            font-size: 10px;
            color: var(--db-muted);
          }

          .db-ref-tag {
            position: absolute;
            right: 0;
            transform: translateY(-120%);
            padding: 1px 7px;
            border-radius: 6px;
            border: 1px solid var(--db-border);
            background: var(--db-surface);
            font-size: 10px;
            font-weight: 700;
            color: var(--db-muted);
            pointer-events: none;
          }

          .db-point {
            position: absolute;
            width: 13px;
            height: 13px;
            border-radius: 50%;
            border: 3px solid var(--db-surface);
            background: var(--db-t);
            transform: translate(-50%, -50%);
            box-shadow: 0 0 0 5px color-mix(in srgb, var(--db-t) 22%, transparent);
            pointer-events: none;
            transition: left 0.35s ease, top 0.35s ease;
          }

          .db-bubble-anchor {
            position: absolute;
            z-index: 2;
            transform: translate(-50%, calc(-100% - 14px));
            pointer-events: none;
            transition: left 0.35s ease, top 0.35s ease;
          }

          .db-bubble-anchor.below {
            transform: translate(-50%, 14px);
          }

          .db-bubble {
            position: relative;
            display: block;
            padding: 5px 9px;
            border-radius: 8px;
            background: var(--db-bubble);
            color: var(--db-bubble-text);
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
          }

          .db-bubble-anchor.below .db-bubble::after {
            top: -4px;
            bottom: auto;
          }

          .db-bubble::after {
            content: '';
            position: absolute;
            left: 50%;
            bottom: -4px;
            width: 8px;
            height: 8px;
            background: inherit;
            transform: translateX(-50%) rotate(45deg);
          }

          .db-day {
            position: absolute;
            bottom: 0;
            transform: translateX(-50%);
            padding: 3px 7px;
            border: 0;
            border-radius: 7px;
            background: transparent;
            color: var(--db-muted);
            font-size: 11px;
            font-weight: 600;
            transition: background-color 0.2s ease, color 0.2s ease;
          }

          .db-day:hover {
            background: var(--db-soft);
          }

          .db-day.on {
            background: var(--db-soft);
            color: var(--db-ink);
            font-weight: 800;
          }

          .db-day.today::after {
            content: '';
            display: block;
            width: 4px;
            height: 4px;
            margin: 2px auto 0;
            border-radius: 50%;
            background: var(--db-t);
          }

          /* ================= TODAY'S MEALS ================= */
          .db-meal-list {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 7px;
            overflow: hidden;
          }

          .db-meal {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 7px 10px;
            border-radius: 12px;
            background: var(--db-tile);
            border: 1px solid var(--db-border);
          }

          .db-meal-emoji {
            width: 34px;
            height: 34px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            border-radius: 10px;
            font-size: 19px;
            background: color-mix(in srgb, var(--db-c) 18%, transparent);
          }

          .db-meal-info {
            flex: 1;
            min-width: 0;
          }

          .db-meal-info strong {
            display: block;
            font-size: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .db-meal-info span {
            font-size: 10px;
            color: var(--db-muted);
          }

          .db-meal-kcal {
            flex-shrink: 0;
            font-size: 12px;
            font-weight: 800;
            color: var(--db-ink);
          }

          .db-meal-more {
            font-size: 11px;
            color: var(--db-muted);
            text-align: center;
          }

          .db-meal-empty {
            flex: 1;
            display: grid;
            place-content: center;
            justify-items: center;
            gap: 6px;
            border: 1.5px dashed var(--db-border);
            border-radius: 14px;
            font-size: 12px;
            color: var(--db-muted);
          }

          /* ================= RESPONSIVE ================= */
          @media (max-height: 800px) {
            .db-grid { gap: 9px; }
            .db-card { padding: 11px; border-radius: 16px; }
            .db-heading { margin-bottom: 8px; }
            .db-heading-icon { width: 28px; height: 28px; }
            .db-nutrient { padding: 7px 0; }
            .db-food { padding: 6px 9px 10px; }
            .db-food-emoji, .db-food-empty { width: 34px; height: 34px; font-size: 20px; }
            .db-insight { font-size: 11px; }
          }

          @media (max-width: 1100px) {
            .db-heading p { display: none; }
            .db-food-info span { display: none; }
          }

          @media (max-width: 900px) {
            .db-page { height: auto; overflow: visible; }
            .db-grid {
              grid-template-columns: 1fr;
              grid-template-rows: auto;
              grid-template-areas: "nutrition" "lunchbox" "right" "trends" "meals";
            }
            .db-nutrition, .db-lunchbox { min-height: 300px; }
            .db-right { grid-template-rows: auto auto; }
            .db-device, .db-insights-card { min-height: 170px; }
            .db-trends { min-height: 280px; }
            .db-meals { min-height: 240px; }
          }

          @media (prefers-reduced-motion: reduce) {
            .db-page *,
            .db-page *::before,
            .db-page *::after {
              animation: none !important;
              transition: none !important;
            }
          }
        `}</style>

        <div className="db-grid">
          {/* ================= 1. TODAY'S NUTRITION ================= */}
          <motion.section {...card(0)} className="db-card db-nutrition">
            <div className="db-heading">
              <div className="db-heading-left">
                <span className="db-heading-icon">
                  <Leaf size={18} />
                </span>
                <div>
                  <h3>Today's Nutrition</h3>
                  <p>Your daily nutrition progress</p>
                </div>
              </div>
            </div>

            <div className="db-nutrition-body">
              <div className="db-rings">
                <CalorieRing
                  consumed={Math.round(totals.calories)}
                  goal={calorieGoal}
                  sugarConsumed={totals.sugar}
                  sugarGoal={sugarGoal}
                  sodiumConsumed={totals.sodium}
                  sodiumGoal={sodiumGoal}
                />
              </div>

              <div className="db-nutrient-list">
                {nutrients.map(item => (
                  <div className="db-nutrient" key={item.label}>
                    <div className="db-nutrient-top">
                      <span className="db-nutrient-label">
                        <span className="db-dot" style={{ background: item.color }} />
                        {item.label}
                      </span>

                      {item.status ? (
                        <span className={`db-chip ${item.status}`}>
                          {item.status === 'ok'
                            ? 'Within limit'
                            : item.status === 'near'
                              ? 'Near limit'
                              : 'Above limit'}
                        </span>
                      ) : (
                        <span className="db-chip info">Reference</span>
                      )}
                    </div>

                    <div className="db-nutrient-bottom">
                      <span>
                        <strong className="db-num">{item.value}</strong> / {item.goal}{' '}
                        {item.unit}
                      </span>
                      <b className="db-num">{item.percentage}%</b>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* ================= 2. SMART LUNCHBOX ================= */}
          <motion.section {...card(0.05)} className="db-card db-lunchbox">
            <div className="db-heading">
              <div className="db-heading-left">
                <span className="db-heading-icon">
                  <Layers3 size={18} />
                </span>
                <div>
                  <h3>Smart Lunchbox</h3>
                  <p>Food in each compartment</p>
                </div>
              </div>
            </div>

            <div className="db-food-list">
              {FOODS.map(food => (
                <div
                  key={food.compartment}
                  className="db-food"
                  style={{ ['--db-c' as string]: `var(--db-c${food.compartment})` }}
                >
                  {food.emoji ? (
                    <span className="db-food-emoji" role="img" aria-label={food.name}>
                      {food.emoji}
                    </span>
                  ) : (
                    <span className="db-food-empty" aria-hidden="true" />
                  )}

                  <div className="db-food-info">
                    <strong>{food.name}</strong>
                    <span>
                      <i />
                      Compartment {food.compartment}
                    </span>
                  </div>

                  <div className="db-food-stats db-num">
                    <strong>{food.weight} g</strong>
                    <span>{food.calories} kcal</span>
                  </div>

                  <span className="db-food-fill" aria-hidden="true">
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: `${food.share}%` }}
                      transition={{ duration: 0.7, delay: 0.3 }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ================= 3 + 4. DEVICE + INSIGHTS ================= */}
          <div className="db-right">
            <motion.section {...card(0.1)} className="db-card db-device">
              <div className="db-heading">
                <div className="db-heading-left">
                  <span className="db-heading-icon">
                    <Cpu size={17} />
                  </span>
                  <div>
                    <h3>Device Overview</h3>
                  </div>
                </div>

                <span className="db-device-status" role="status">
                  <span className={`db-status-dot ${isOnline ? 'online' : ''}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="db-device-content">
                <div className="db-device-visual">
                  <div className="db-device-box">
                    <Utensils size={24} />
                  </div>
                </div>

                <div className="db-device-info">
                  <p>Live Weight</p>
                  <strong className="db-num" aria-live="polite">
                    {displayedWeight}
                  </strong>
                  <span>
                    {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                    {isOnline
                      ? hasValidWeight
                        ? 'Live HX711 reading'
                        : 'Waiting for sensor reading'
                      : 'Waiting for ESP32'}
                  </span>
                </div>
              </div>
            </motion.section>

            <motion.section {...card(0.15)} className="db-card db-insights-card">
              <div className="db-heading">
                <div className="db-heading-left">
                  <span className="db-heading-icon">
                    <Lightbulb size={17} />
                  </span>
                  <div>
                    <h3>Daily Insight</h3>
                    <p>Based on today's meals</p>
                  </div>
                </div>
              </div>

              <div className="db-insights">
                {insights.map(item => (
                  <div key={item.text} className={`db-insight ${item.status}`}>
                    {item.status === 'ok' ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <AlertTriangle size={14} />
                    )}
                    <span className="db-num">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* ================= 5. WEEKLY TRENDS (merged chart) ================= */}
          <motion.section
            {...card(0.2)}
            className="db-card db-trends"
            style={{ ['--db-t' as string]: currentTrend.color }}
          >
            <div className="db-heading">
              <div className="db-heading-left">
                <span className="db-heading-icon">
                  <TrendingUp size={18} />
                </span>
                <div>
                  <h3>This Week</h3>
                  <p>
                    Daily {currentTrend.label.toLowerCase()} from Meal History ·{' '}
                    {currentTrend.isLimit ? 'limit' : 'reference'}{' '}
                    {currentTrend.goal.toLocaleString()} {currentTrend.unit}
                  </p>
                </div>
              </div>

              <div className="db-tabs" role="group" aria-label="Nutrient">
                {(Object.keys(trendConfig) as TrendKey[]).map(key => (
                  <button
                    key={key}
                    type="button"
                    className={trend === key ? 'on' : ''}
                    aria-pressed={trend === key}
                    style={{ ['--db-t' as string]: trendConfig[key].color }}
                    onClick={() => setTrend(key)}
                  >
                    {trendConfig[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="db-chart">
              {/* Y labels */}
              {[0, 0.5, 1].map(ratio => {
                const value = chartMax * ratio
                return (
                  <span
                    key={ratio}
                    className="db-y-label db-num"
                    style={{ top: `${(pointY(value) / CHART_H) * 100}%` }}
                  >
                    {formatTrend(value)}
                  </span>
                )
              })}

              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={`Daily ${currentTrend.label.toLowerCase()} this week`}
              >
                <defs>
                  <clipPath id="db-trend-reveal">
                    <motion.rect
                      key={`reveal-${trend}`}
                      x="0"
                      y="0"
                      height={CHART_H}
                      initial={{ width: 0 }}
                      animate={{ width: CHART_W }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </clipPath>

                  <linearGradient id="db-trend-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                <g style={{ color: currentTrend.color }}>
                  {[Y_TOP, (Y_TOP + Y_BOTTOM) / 2, Y_BOTTOM].map(y => (
                    <line
                      key={y}
                      x1={X_START - 6}
                      x2={X_END + 6}
                      y1={y}
                      y2={y}
                      stroke="var(--db-border)"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}

                  {/* reference / limit */}
                  <line
                    x1={X_START - 6}
                    x2={X_END + 6}
                    y1={referenceY}
                    y2={referenceY}
                    stroke="var(--db-muted)"
                    strokeDasharray="5 5"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.7"
                  />

                  <g clipPath="url(#db-trend-reveal)">
                    <path d={trendArea} fill="url(#db-trend-fill)" />

                    <path
                      d={trendLine}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>

                  <line
                    x1={pointX(selectedDay)}
                    x2={pointX(selectedDay)}
                    y1={pointY(selectedValue)}
                    y2={Y_BOTTOM}
                    stroke="currentColor"
                    strokeDasharray="3 4"
                    strokeOpacity="0.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              </svg>

              <span
                className="db-ref-tag db-num"
                style={{ top: `${(referenceY / CHART_H) * 100}%` }}
              >
                {currentTrend.isLimit ? 'Limit' : 'Reference'}{' '}
                {currentTrend.goal.toLocaleString()} {currentTrend.unit}
              </span>

              {/* selected point + bubble, positioned on the real data point */}
              <span
                className="db-point"
                style={{
                  left: `${(pointX(selectedDay) / CHART_W) * 100}%`,
                  top: `${(pointY(selectedValue) / CHART_H) * 100}%`,
                }}
              />

              <span
                className={`db-bubble-anchor ${
                  pointY(selectedValue) < 60 ? 'below' : ''
                }`}
                style={{
                  left: `${(pointX(selectedDay) / CHART_W) * 100}%`,
                  top: `${(pointY(selectedValue) / CHART_H) * 100}%`,
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${trend}-${selectedDay}`}
                    className="db-bubble db-num"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.18 }}
                  >
                    {selected.day} · {formatTrend(selectedValue)} {currentTrend.unit}
                    {selectedStatus === 'over' && ' · above limit'}
                  </motion.span>
                </AnimatePresence>
              </span>

              {/* day buttons, aligned with each point */}
              {WEEK.map((day, index) => (
                <button
                  key={day.full}
                  type="button"
                  className={`db-day ${index === selectedDay ? 'on' : ''} ${
                    day.isToday ? 'today' : ''
                  }`}
                  style={{ left: `${(pointX(index) / CHART_W) * 100}%` }}
                  aria-pressed={index === selectedDay}
                  aria-label={`${day.full}: ${formatTrend(day[trend])} ${currentTrend.unit}`}
                  onClick={() => setSelectedDay(index)}
                >
                  {day.day}
                </button>
              ))}
            </div>
          </motion.section>

          {/* ================= 6. TODAY'S MEALS ================= */}
          <motion.section {...card(0.25)} className="db-card db-meals">
            <div className="db-heading">
              <div className="db-heading-left">
                <span className="db-heading-icon">
                  <Clock3 size={18} />
                </span>
                <div>
                  <h3>Today's Meals</h3>
                  <p className="db-num">
                    {todayMeals.length} {todayMeals.length === 1 ? 'meal' : 'meals'} ·{' '}
                    {Math.round(totals.weight)} g · {Math.round(totals.calories)} kcal
                  </p>
                </div>
              </div>
            </div>

            {todayMeals.length === 0 ? (
              <div className="db-meal-empty">
                <Utensils size={22} />
                No meals recorded yet today.
              </div>
            ) : (
              <div className="db-meal-list">
                {todayMeals.slice(0, 4).map((meal, index) => (
                  <motion.div
                    key={meal.id}
                    className="db-meal"
                    style={{ ['--db-c' as string]: `var(--db-c${meal.compartment})` }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.06 }}
                  >
                    <span className="db-meal-emoji" aria-hidden="true">
                      {meal.emoji}
                    </span>

                    <div className="db-meal-info">
                      <strong>{meal.food}</strong>
                      <span className="db-num">
                        {meal.time} · Compartment {meal.compartment} · {meal.weight} g
                      </span>
                    </div>

                    <span className="db-meal-kcal db-num">
                      {Math.round(nutrition(meal).calories)} kcal
                    </span>
                  </motion.div>
                ))}

                {todayMeals.length > 4 && (
                  <span className="db-meal-more">
                    +{todayMeals.length - 4} more in Meal History
                  </span>
                )}
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </MotionConfig>
  )
}