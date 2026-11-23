import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Activity,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Droplets,
  Eye,
  Flame,
  Info,
  LayoutGrid,
  Pencil,
  Scale,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { type Meal, nutrition, dateOffset } from '../types/meals'

type Filter = 'All Meals' | 'Today' | 'This Week' | 'This Month'
type ModalMode = 'view' | 'edit' | 'delete'

const FILTERS: Filter[] = ['All Meals', 'Today', 'This Week', 'This Month']

/* Fallback daily reference values (used when no personal targets are passed). */
const DEFAULT_REFERENCE = { calories: 2000, sugar: 50, sodium: 2000 }

const RING_R = 58
const RING_C = 2 * Math.PI * RING_R

function format(value: number, digits = 0) {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits })
}

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function shortDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function pct(value: number, max: number) {
  return Math.min(100, max > 0 ? (value / max) * 100 : 0)
}

function matchesFilter(date: string, filter: Filter) {
  const now = new Date()
  const parsed = new Date(date + 'T12:00:00')

  if (filter === 'All Meals') return true
  if (filter === 'Today') return date === dateOffset(0)

  if (filter === 'This Week') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return parsed >= start && parsed < end
  }

  return (
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth()
  )
}

function mealTimestamp(meal: Meal) {
  const [time, period] = meal.time.split(' ')
  const [hour, minute] = time.split(':').map(Number)
  const hour24 = (hour % 12) + (period === 'PM' ? 12 : 0)

  return new Date(
    `${meal.date}T${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
  ).getTime()
}

type MealHistoryProps = {
  meals: Meal[]
  onUpdate: (id: number, changes: { food: string; date: string; compartment: number }) => Promise<void>
  onDelete: (id: number) => Promise<void>
  calorieGoal?: number
  sugarGoal?: number
  sodiumGoal?: number
}

export default function MealHistory({
  meals,
  onUpdate,
  onDelete,
  calorieGoal,
  sugarGoal,
  sodiumGoal,
}: MealHistoryProps) {
  const REFERENCE = {
    calories: calorieGoal || DEFAULT_REFERENCE.calories,
    sugar: sugarGoal || DEFAULT_REFERENCE.sugar,
    sodium: sodiumGoal || DEFAULT_REFERENCE.sodium,
  }
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All Meals')
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editFood, setEditFood] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editCompartment, setEditCompartment] = useState(1)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  // Apply the "Green blobs" background to the page area that holds this component.
  useEffect(() => {
    const host = rootRef.current?.closest('main') ?? rootRef.current?.parentElement
    if (!host) return
    host.classList.add('mh-page-bg')
    return () => host.classList.remove('mh-page-bg')
  }, [])

  // Always show the five most recent records first, then apply search/date filters.
  const recentMeals = useMemo(
    () =>
      [...meals]
        .sort((a, b) => mealTimestamp(b) - mealTimestamp(a) || b.id - a.id)
        .slice(0, 5),
    [meals]
  )

  const visibleMeals = recentMeals.filter(
    meal =>
      matchesFilter(meal.date, filter) &&
      (meal.food + ' ' + meal.compartment)
        .toLowerCase()
        .includes(search.toLowerCase())
  )

  const totals = visibleMeals.reduce(
    (acc, meal) => {
      const values = nutrition(meal)
      acc.calories += values.calories
      acc.sugar += values.sugar
      acc.sodium += values.sodium
      return acc
    },
    { calories: 0, sugar: 0, sodium: 0 }
  )

  const compartments = [1, 2, 3].map(number => {
    const items = visibleMeals.filter(meal => meal.compartment === number)
    return {
      number,
      count: items.length,
      calories: items.reduce((sum, meal) => sum + nutrition(meal).calories, 0),
    }
  })

  const selectedMeal = meals.find(meal => meal.id === selectedId)
  const selectedNutrition = selectedMeal ? nutrition(selectedMeal) : null
  const canSave = Boolean(editFood.trim() && editDate)
  const calorieShare = pct(totals.calories, REFERENCE.calories)

  function openModal(meal: Meal, mode: ModalMode) {
    setSelectedId(meal.id)
    setModalMode(mode)
    setEditFood(meal.food)
    setEditDate(meal.date)
    setEditCompartment(meal.compartment)
  }

  function closeModal() {
    if (busy) return
    setSelectedId(null)
    setModalMode(null)
    setError('')
  }

  async function saveEdit() {
    if (!selectedMeal || !canSave || busy) return

    setBusy(true)
    setError('')

    try {
      await onUpdate(selectedMeal.id, {
        food: editFood.trim(),
        date: editDate,
        compartment: editCompartment,
      })
      setMessage('Meal updated.')
      setSelectedId(null)
      setModalMode(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update this meal.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteMeal() {
    if (selectedId === null || busy) return

    setBusy(true)
    setError('')

    try {
      await onDelete(selectedId)
      setMessage('Meal deleted.')
      setSelectedId(null)
      setModalMode(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete this meal.')
    } finally {
      setBusy(false)
    }
  }

  // Hide the toast after a few seconds
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), 3500)
    return () => window.clearTimeout(timer)
  }, [message])

  return (
    <motion.div
      ref={rootRef}
      className="sb-mh"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <style>{`
        /* ================= PAGE BACKGROUND — N. Green blobs ================= */
        .mh-page-bg {
          background:
            radial-gradient(circle at 15% 15%, rgba(190, 222, 160, .5) 0, transparent 40%),
            radial-gradient(circle at 85% 30%, rgba(205, 232, 190, .45) 0, transparent 40%),
            radial-gradient(circle at 60% 95%, rgba(185, 220, 165, .4) 0, transparent 45%),
            #f8faf5 !important;
          background-attachment: fixed !important;
        }
        :is([data-theme="dark"], [data-mode="dark"], .dark, .dark-mode, .theme-dark) .mh-page-bg,
        :is([data-theme="dark"], [data-mode="dark"], .dark, .dark-mode, .theme-dark).mh-page-bg {
          background:
            radial-gradient(circle at 15% 15%, rgba(180, 225, 140, .14) 0, transparent 40%),
            radial-gradient(circle at 85% 30%, rgba(200, 235, 170, .1) 0, transparent 40%),
            radial-gradient(circle at 60% 95%, rgba(170, 215, 140, .12) 0, transparent 45%),
            #0f1612 !important;
          background-attachment: fixed !important;
        }

        /* ================= THEME TOKENS ================= */
        .sb-mh {
          /* Space taken by the page title + paddings above/below this component.
             Increase if you still see a page scrollbar, decrease to fill more. */
          --mh-offset: 96px;

          --mh-accent: #3d674b;
          --mh-accent-2: #7fa66a;
          --mh-accent-ink: #244b36;
          --mh-soft: #eef4e9;
          --mh-line: #dde7d5;
          --mh-row: #fbfdf8;
          --mh-chip: #e3efdc;
          --mh-ink: #1f3d2c;
          --mh-track: #e4ecdf;
          --mh-shadow: 0 6px 24px rgba(25, 60, 36, .06);
          --mh-hero: linear-gradient(150deg, #2f5a3e 0%, #3d6b4a 55%, #557f55 100%);
          --mh-hero-ink: #f4f8ee;
          --mh-hero-muted: rgba(244, 248, 238, .72);
          --mh-hero-track: rgba(255, 255, 255, .16);
          --mh-hero-ring: #cfe6a8;
          --mh-primary-bg: #45634d;
          --mh-primary-text: #ffffff;
          --mh-danger-bg: #a34c47;
          --mh-danger-text: #ffffff;
          --mh-overlay: rgba(20, 32, 25, .55);
          --mh-glass: rgba(255, 255, 255, .82);

          --mh-c1: #6f9a5c;
          --mh-c2: #c49a4a;
          --mh-c3: #4f8a8b;

          --mh-view-text: #45634d;  --mh-view-bg: #e6efe5;  --mh-view-border: #b8ceb7;
          --mh-edit-text: #a47736;  --mh-edit-bg: #fbf0dc;  --mh-edit-border: #e9d0a2;
          --mh-del-text:  #c94b4b;  --mh-del-bg:  #fde9e9;  --mh-del-border:  #f0b8b8;
        }

        :is([data-theme="dark"], [data-mode="dark"], .dark, .dark-mode, .theme-dark) .sb-mh {
          --mh-accent: #bbd5a3;
          --mh-accent-2: #8fb57a;
          --mh-accent-ink: #d6ebc0;
          --mh-soft: #243b2e;
          --mh-line: #36503f;
          --mh-row: #1f352a;
          --mh-chip: #2f4d3a;
          --mh-ink: #eef6e6;
          --mh-track: #2c4536;
          --mh-shadow: 0 6px 24px rgba(0, 0, 0, .22);
          --mh-hero: linear-gradient(150deg, #1d3a2a 0%, #24452f 55%, #2e5438 100%);
          --mh-hero-ink: #f1f8e9;
          --mh-hero-muted: rgba(241, 248, 233, .66);
          --mh-hero-track: rgba(255, 255, 255, .1);
          --mh-hero-ring: #bbd5a3;
          --mh-primary-bg: #bbd5a3;
          --mh-primary-text: #173c2a;
          --mh-danger-bg: #c5615b;
          --mh-danger-text: #ffffff;
          --mh-overlay: rgba(5, 12, 8, .7);
          --mh-glass: rgba(22, 36, 29, .78);

          --mh-c1: #9cc685;
          --mh-c2: #e2bd72;
          --mh-c3: #7fbcbc;

          --mh-view-text: #b7d5b5;  --mh-view-bg: #304b3b;  --mh-view-border: #567a60;
          --mh-edit-text: #f0cf8d;  --mh-edit-bg: #493c29;  --mh-edit-border: #80663b;
          --mh-del-text:  #ffb4af;  --mh-del-bg:  #4c2d30;  --mh-del-border:  #98535a;
        }

        /* ================= SHELL — fills the viewport, never scrolls ================= */
        .sb-mh {
          width: 100%;
          max-width: 1680px;
          margin: 0 auto;
          height: calc(100dvh - var(--mh-offset));
          min-height: 600px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow: hidden;
          box-sizing: border-box;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
        }
        .sb-mh *, .sb-mh *::before, .sb-mh *::after { box-sizing: border-box; }
        .sb-mh button, .sb-mh input, .sb-mh select { font-family: inherit; }
        .sb-mh .num { font-family: 'Manrope', sans-serif; font-variant-numeric: tabular-nums; }
        .sb-mh .serif { font-family: Georgia, 'Times New Roman', serif; }

        /* ================= TOP BAR ================= */
        .sb-mh .mh-top {
          flex: 0 0 auto;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }
        .sb-mh .mh-eyebrow {
          margin: 0 0 5px;
          font-family: 'Manrope', sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.4px;
          color: var(--primary);
        }
        .sb-mh .mh-title {
          margin: 0;
          font-size: clamp(24px, 2.1vw, 32px);
          font-weight: 700;
          letter-spacing: -.6px;
          line-height: 1.1;
          color: var(--mh-ink);
        }
        .sb-mh .mh-sub { margin: 5px 0 0; font-size: 13px; color: var(--muted); }

        .sb-mh .mh-tools { display: flex; gap: 10px; flex: 0 1 560px; min-width: 0; }
        .sb-mh .mh-search {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          height: 46px;
          border-radius: 14px;
          border: 1px solid var(--mh-line);
          background: var(--surface);
          box-shadow: var(--mh-shadow);
          transition: border-color .2s ease, box-shadow .2s ease;
        }
        .sb-mh .mh-search:focus-within {
          border-color: var(--mh-accent);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--mh-accent) 16%, transparent);
        }
        .sb-mh .mh-search input {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          color: var(--text);
          font-size: 14px;
        }
        .sb-mh .mh-search input::placeholder { color: var(--muted); }

        .sb-mh .mh-select { position: relative; flex: 0 0 180px; }
        .sb-mh .mh-select select {
          width: 100%;
          height: 46px;
          appearance: none;
          border-radius: 14px;
          border: 1px solid var(--mh-line);
          background: var(--surface);
          box-shadow: var(--mh-shadow);
          color: var(--text);
          font-size: 13px;
          font-weight: 700;
          padding: 0 34px 0 40px;
          cursor: pointer;
        }
        .sb-mh .mh-select select:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
        .sb-mh .mh-select svg {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: var(--muted);
        }

        /* ================= MAIN GRID ================= */
        .sb-mh .mh-grid {
          flex: 1 1 auto;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) clamp(320px, 26vw, 400px);
          gap: 18px;
        }

        .sb-mh .mh-panel {
          min-height: 0;
          display: flex;
          flex-direction: column;
          border-radius: 22px;
          border: 1px solid var(--mh-line);
          background: var(--mh-glass);
          backdrop-filter: blur(10px);
          box-shadow: var(--mh-shadow);
          padding: 20px 22px;
        }

        /* ================= MEAL LIST ================= */
        .sb-mh .mh-list-head {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .sb-mh .mh-list-head h3 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -.4px;
          color: var(--text);
        }
        .sb-mh .mh-head-icon {
          width: 38px; height: 38px;
          display: grid; place-items: center;
          border-radius: 11px;
          background: var(--mh-soft);
          color: var(--primary);
        }
        .sb-mh .mh-pill {
          display: inline-flex;
          align-items: center;
          padding: 5px 12px;
          border-radius: 100px;
          background: var(--mh-soft);
          border: 1px solid var(--mh-line);
          color: var(--mh-accent-ink);
          font-size: 11px;
          font-weight: 700;
        }
        .sb-mh .mh-count { margin-left: auto; font-size: 12px; color: var(--muted); }
        .sb-mh .mh-count b { color: var(--text); }

        .sb-mh .mh-rows {
          flex: 1 1 auto;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
        }

        /* Timeline rail behind the time column */
        .sb-mh .mh-rows::before {
          content: '';
          position: absolute;
          left: 47px;
          top: 18px;
          bottom: 18px;
          width: 2px;
          border-radius: 2px;
          background: linear-gradient(var(--mh-line), var(--mh-line)) ;
        }

        .sb-mh .mh-row {
          position: relative;
          flex: 1 1 0;
          min-height: 74px;
          max-height: 132px;
          display: grid;
          grid-template-columns: 96px 64px minmax(0, 1fr) auto 128px auto;
          align-items: center;
          gap: 18px;
          padding: 10px 18px 10px 0;
          border-radius: 18px;
          border: 1px solid var(--mh-line);
          background: var(--mh-row);
          transition: background .2s ease, border-color .2s ease, transform .2s ease, box-shadow .2s ease;
        }
        .sb-mh .mh-row:hover {
          background: var(--mh-soft);
          border-color: var(--mh-accent);
          transform: translateX(3px);
          box-shadow: var(--mh-shadow);
        }

        .sb-mh .mh-time {
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-right: 1px dashed var(--mh-line);
        }
        .sb-mh .mh-time strong { font-size: 17px; font-weight: 800; color: var(--mh-ink); line-height: 1.1; }
        .sb-mh .mh-time span { font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: .4px; }

        .sb-mh .mh-emoji {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          font-size: 34px;
          background: var(--mh-chip);
          border: 1px solid var(--mh-line);
        }

        .sb-mh .mh-info { min-width: 0; }
        .sb-mh .mh-food {
          display: block;
          font-size: 17px;
          font-weight: 700;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sb-mh .mh-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px 10px;
          margin-top: 7px;
          font-size: 12.5px;
          color: var(--muted);
        }
        .sb-mh .mh-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px 3px 8px;
          border-radius: 100px;
          background: var(--surface);
          border: 1px solid var(--mh-line);
          color: var(--text);
          font-size: 12px;
          font-weight: 700;
        }
        .sb-mh .mh-tag i {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--c);
        }

        .sb-mh .mh-macros { display: flex; gap: 8px; }
        .sb-mh .mh-macro {
          min-width: 92px;
          padding: 8px 12px;
          border-radius: 12px;
          border: 1px solid var(--mh-line);
          background: var(--surface);
        }
        .sb-mh .mh-macro span {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; color: var(--muted);
        }
        .sb-mh .mh-macro span svg { color: var(--primary); }
        .sb-mh .mh-macro b { display: block; margin-top: 2px; font-size: 15px; font-weight: 800; color: var(--text); }
        .sb-mh .mh-macro b small { font-size: 11px; font-weight: 700; color: var(--muted); margin-left: 2px; }

        .sb-mh .mh-kcal { text-align: right; }
        .sb-mh .mh-kcal strong { font-size: 26px; font-weight: 800; letter-spacing: -.6px; color: var(--mh-ink); }
        .sb-mh .mh-kcal strong small { font-size: 12px; font-weight: 700; color: var(--muted); margin-left: 3px; letter-spacing: 0; }
        .sb-mh .mh-kcal-bar {
          margin-top: 6px;
          height: 6px;
          border-radius: 6px;
          background: var(--mh-track);
          overflow: hidden;
        }
        .sb-mh .mh-kcal-bar div {
          height: 100%;
          border-radius: 6px;
          background: linear-gradient(90deg, var(--mh-accent-2), var(--mh-accent));
        }
        .sb-mh .mh-kcal p { margin: 4px 0 0; font-size: 10.5px; color: var(--muted); }

        .sb-mh .mh-actions { display: flex; gap: 7px; }
        .sb-mh .mh-act {
          --t: var(--mh-view-text); --b: var(--mh-view-bg); --o: var(--mh-view-border);
          appearance: none;
          width: 40px;
          height: 40px;
          padding: 0;
          border-radius: 12px;
          border: 1px solid var(--mh-line);
          background: var(--surface);
          color: var(--text);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color .2s ease, border-color .2s ease, color .2s ease, transform .2s ease;
        }
        .sb-mh .mh-act.edit   { --t: var(--mh-edit-text); --b: var(--mh-edit-bg); --o: var(--mh-edit-border); }
        .sb-mh .mh-act.delete { --t: var(--mh-del-text);  --b: var(--mh-del-bg);  --o: var(--mh-del-border); }
        .sb-mh .mh-act:hover { background: var(--b); border-color: var(--o); color: var(--t); transform: translateY(-2px); }
        .sb-mh .mh-act:active { transform: scale(.95); }
        .sb-mh .mh-act:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

        .sb-mh .mh-empty {
          flex: 1 1 auto;
          display: grid;
          place-content: center;
          justify-items: center;
          gap: 6px;
          border: 1.5px dashed var(--mh-line);
          border-radius: 18px;
          color: var(--muted);
          text-align: center;
        }
        .sb-mh .mh-empty h4 { margin: 8px 0 0; font-size: 21px; color: var(--text); }
        .sb-mh .mh-empty p { margin: 0; font-size: 13px; }

        /* ================= SUMMARY ASIDE ================= */
        .sb-mh .mh-aside { gap: 14px; padding: 0; border: 0; background: transparent; box-shadow: none; }

        .sb-mh .mh-hero {
          position: relative;
          overflow: hidden;
          flex: 0 0 auto;
          padding: 20px 22px;
          border-radius: 22px;
          background: var(--mh-hero);
          color: var(--mh-hero-ink);
          box-shadow: var(--mh-shadow);
        }
        .sb-mh .mh-hero::after {
          content: '';
          position: absolute;
          width: 220px; height: 220px;
          right: -90px; top: -110px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,.14);
          pointer-events: none;
        }
        .sb-mh .mh-hero-label {
          display: flex; align-items: center; gap: 7px;
          margin: 0;
          font-size: 12px; font-weight: 700;
          color: var(--mh-hero-muted);
        }
        .sb-mh .mh-hero-body { display: flex; align-items: center; gap: 18px; margin-top: 12px; }
        .sb-mh .mh-ring { position: relative; width: 140px; height: 140px; flex-shrink: 0; }
        .sb-mh .mh-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .sb-mh .mh-ring-center {
          position: absolute; inset: 0;
          display: grid; place-content: center; text-align: center;
        }
        .sb-mh .mh-ring-center strong { font-size: 30px; font-weight: 800; letter-spacing: -.8px; line-height: 1; }
        .sb-mh .mh-ring-center span { margin-top: 3px; font-size: 11px; font-weight: 700; color: var(--mh-hero-muted); }
        .sb-mh .mh-hero-side p { margin: 0; font-size: 12px; line-height: 1.5; color: var(--mh-hero-muted); }
        .sb-mh .mh-hero-side strong { display: block; font-size: 22px; font-weight: 800; color: var(--mh-hero-ink); }
        .sb-mh .mh-hero-side .mh-hero-records { margin-top: 12px; }

        .sb-mh .mh-card {
          border-radius: 20px;
          border: 1px solid var(--mh-line);
          background: var(--mh-glass);
          backdrop-filter: blur(10px);
          box-shadow: var(--mh-shadow);
          padding: 16px 18px;
        }
        .sb-mh .mh-card-title {
          margin: 0 0 12px;
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px; font-weight: 800; color: var(--text);
        }
        .sb-mh .mh-card-title span { font-size: 11px; font-weight: 600; color: var(--muted); }

        .sb-mh .mh-meter + .mh-meter { margin-top: 14px; }
        .sb-mh .mh-meter-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        .sb-mh .mh-meter-top span { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 700; color: var(--muted); }
        .sb-mh .mh-meter-top span svg { color: var(--primary); }
        .sb-mh .mh-meter-top b { font-size: 18px; font-weight: 800; color: var(--mh-ink); }
        .sb-mh .mh-meter-top b small { font-size: 11px; color: var(--muted); margin-left: 2px; }
        .sb-mh .mh-track { margin-top: 7px; height: 8px; border-radius: 8px; background: var(--mh-track); overflow: hidden; }
        .sb-mh .mh-track div { height: 100%; border-radius: 8px; background: linear-gradient(90deg, var(--mh-accent-2), var(--mh-accent)); }
        .sb-mh .mh-meter p { margin: 4px 0 0; font-size: 10.5px; color: var(--muted); }

        /* Lunchbox compartment visual */
        .sb-mh .mh-box-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
        .sb-mh .mh-box {
          flex: 1 1 auto;
          min-height: 96px;
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 8px;
          padding: 8px;
          border-radius: 16px;
          background: var(--mh-soft);
          border: 1px solid var(--mh-line);
        }
        .sb-mh .mh-comp {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 12px;
          background: var(--surface);
          border: 1px solid var(--mh-line);
          overflow: hidden;
        }
        .sb-mh .mh-comp:first-child { grid-row: 1 / span 2; }
        .sb-mh .mh-comp > :not(.mh-liquid) { position: relative; z-index: 2; }
        .sb-mh .mh-comp-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .sb-mh .mh-comp span { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: var(--muted); }
        .sb-mh .mh-comp span i { width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
        .sb-mh .mh-comp-pct {
          padding: 2px 8px;
          border-radius: 100px;
          background: var(--c);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 2px 8px color-mix(in srgb, var(--c) 40%, transparent);
        }
        .sb-mh .mh-comp strong { display: block; font-size: 22px; font-weight: 800; color: var(--mh-ink); line-height: 1.1; }
        .sb-mh .mh-comp strong small { font-size: 11px; color: var(--muted); margin-left: 3px; }
        .sb-mh .mh-comp em { display: block; margin-top: 2px; font-style: normal; font-size: 11px; font-weight: 600; color: var(--muted); }

        /* Liquid fill — height = share of total kcal, with moving waves */
        .sb-mh .mh-liquid {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          z-index: 1;
          background: linear-gradient(
            to top,
            color-mix(in srgb, var(--c) 62%, transparent),
            color-mix(in srgb, var(--c) 34%, transparent)
          );
        }
        .sb-mh .mh-wave {
          position: absolute;
          left: 0;
          bottom: calc(100% - 1px);
          width: 200%;
          height: 12px;
          animation: mhWave 3.2s linear infinite;
        }
        .sb-mh .mh-wave.back {
          height: 15px;
          opacity: .55;
          animation-duration: 5s;
          animation-direction: reverse;
        }
        .sb-mh .mh-wave path { fill: color-mix(in srgb, var(--c) 34%, transparent); }
        .sb-mh .mh-wave.back path { fill: color-mix(in srgb, var(--c) 22%, transparent); }
        .sb-mh .mh-liquid.empty .mh-wave { display: none; }
        @keyframes mhWave { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* Bubbles for a "filling up" feel */
        .sb-mh .mh-bubble {
          position: absolute;
          bottom: 6px;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, .55);
          animation: mhBubble 3.6s ease-in infinite;
        }
        .sb-mh .mh-bubble:nth-child(3) { left: 22%; animation-delay: .4s; }
        .sb-mh .mh-bubble:nth-child(4) { left: 58%; width: 4px; height: 4px; animation-delay: 1.6s; }
        .sb-mh .mh-bubble:nth-child(5) { left: 80%; width: 5px; height: 5px; animation-delay: 2.4s; }
        @keyframes mhBubble {
          0%   { transform: translateY(0); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translateY(-120px); opacity: 0; }
        }

        /* Top compartment (highest kcal) gets a glow */
        .sb-mh .mh-comp.is-top {
          border-color: var(--c);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 22%, transparent);
        }

        .sb-mh .mh-note {
          flex: 0 0 auto;
          display: flex;
          align-items: flex-start;
          gap: 7px;
          margin: 0;
          padding: 0 4px;
          font-size: 11.5px;
          line-height: 1.5;
          color: var(--muted);
        }
        .sb-mh .mh-note svg { flex-shrink: 0; margin-top: 2px; }

        /* ================= TOAST ================= */
        .sb-mh .mh-toast {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 80;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 16px;
          border-radius: 14px;
          background: var(--mh-primary-bg);
          color: var(--mh-primary-text);
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 14px 34px rgba(0,0,0,.2);
        }
        .sb-mh .mh-toast button {
          border: 0; background: transparent; color: inherit; cursor: pointer;
          display: inline-flex; padding: 2px;
        }

        /* ================= MODAL ================= */
        .sb-mh .mh-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: var(--mh-overlay);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .sb-mh .mh-modal {
          width: 100%;
          max-width: 480px;
          padding: 24px;
          border-radius: 22px;
          background: var(--surface);
          border: 1px solid var(--mh-line);
          box-shadow: 0 25px 70px rgba(0,0,0,.25);
          color: var(--text);
        }
        .sb-mh .mh-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }
        .sb-mh .mh-modal-head h2 { margin: 0; font-size: 24px; letter-spacing: -.4px; color: var(--mh-ink); }
        .sb-mh .mh-icon-btn {
          width: 36px; height: 36px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 10px;
          border: 1px solid var(--mh-line);
          background: var(--surface);
          color: var(--text);
          cursor: pointer;
        }
        .sb-mh .mh-icon-btn:hover { background: var(--mh-soft); }

        .sb-mh .mh-hero-meal {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border-radius: 16px;
          background: var(--mh-soft);
          border: 1px solid var(--mh-line);
          margin-bottom: 12px;
        }
        .sb-mh .mh-hero-meal .mh-emoji { width: 58px; height: 58px; font-size: 32px; background: var(--surface); }
        .sb-mh .mh-hero-meal h3 { margin: 0; font-size: 19px; color: var(--text); }
        .sb-mh .mh-hero-meal p { margin: 3px 0 0; font-size: 12px; color: var(--muted); }

        .sb-mh .mh-tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .sb-mh .mh-tile {
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid var(--mh-line);
          background: var(--mh-row);
        }
        .sb-mh .mh-tile span { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: var(--muted); }
        .sb-mh .mh-tile span svg { color: var(--primary); }
        .sb-mh .mh-tile strong { display: block; margin-top: 3px; font-size: 20px; font-weight: 800; color: var(--mh-ink); }
        .sb-mh .mh-tile strong small { font-size: 12px; font-weight: 700; color: var(--muted); margin-left: 3px; }

        .sb-mh .mh-field { margin-bottom: 14px; }
        .sb-mh .mh-field label, .sb-mh .mh-field .mh-label {
          display: block;
          font-size: 12.5px;
          font-weight: 700;
          margin-bottom: 7px;
          color: var(--text);
        }
        .sb-mh .mh-input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid var(--mh-line);
          background: var(--bg);
          color: var(--text);
          font-size: 13.5px;
          color-scheme: light dark;
        }
        .sb-mh .mh-input:focus { outline: none; border-color: var(--mh-accent); }

        .sb-mh .mh-seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .sb-mh .mh-seg button {
          height: 44px;
          border-radius: 12px;
          border: 1px solid var(--mh-line);
          background: var(--bg);
          color: var(--text);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          transition: background .2s ease, border-color .2s ease;
        }
        .sb-mh .mh-seg button[aria-pressed="true"] {
          background: var(--mh-chip);
          border-color: var(--mh-accent);
          color: var(--mh-accent-ink);
        }

        .sb-mh .mh-hint { margin: 0; font-size: 12px; line-height: 1.5; color: var(--muted); }

        .sb-mh .mh-btns { display: flex; gap: 10px; margin-top: 18px; }
        .sb-mh .mh-btn {
          flex: 1;
          height: 44px;
          border-radius: 12px;
          border: 1px solid var(--mh-line);
          background: var(--surface);
          color: var(--text);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          transition: filter .2s ease, opacity .2s ease;
        }
        .sb-mh .mh-btn:hover { filter: brightness(.96); }
        .sb-mh .mh-btn.primary { background: var(--mh-primary-bg); border-color: var(--mh-primary-bg); color: var(--mh-primary-text); }
        .sb-mh .mh-btn.danger  { background: var(--mh-danger-bg);  border-color: var(--mh-danger-bg);  color: var(--mh-danger-text); }
        .sb-mh .mh-btn:disabled { opacity: .5; cursor: not-allowed; }

        .sb-mh .mh-delete-copy { margin: 0 0 6px; font-size: 14px; line-height: 1.6; color: var(--muted); }
        .sb-mh .mh-delete-copy strong { color: var(--text); }

        /* ================= RESPONSIVE ================= */
        @media (max-height: 820px) {
          .sb-mh { gap: 12px; }
          .sb-mh .mh-sub { display: none; }
          .sb-mh .mh-ring { width: 118px; height: 118px; }
          .sb-mh .mh-ring-center strong { font-size: 25px; }
          .sb-mh .mh-hero { padding: 16px 18px; }
          .sb-mh .mh-card { padding: 13px 16px; }
          .sb-mh .mh-emoji { width: 54px; height: 54px; font-size: 29px; }
          .sb-mh .mh-row { grid-template-columns: 88px 54px minmax(0, 1fr) auto 120px auto; }
          .sb-mh .mh-rows::before { left: 43px; }
        }
        @media (max-width: 1380px) {
          .sb-mh .mh-macros { display: none; }
          .sb-mh .mh-row { grid-template-columns: 88px 58px minmax(0, 1fr) 120px auto; }
          .sb-mh .mh-rows::before { left: 43px; }
        }
        @media (max-width: 1080px) {
          /* Too narrow for side-by-side: stack and let the page size naturally. */
          .sb-mh { height: auto; min-height: 0; overflow: visible; }
          .sb-mh .mh-grid { grid-template-columns: 1fr; }
          .sb-mh .mh-aside { order: -1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .sb-mh .mh-aside .mh-note { grid-column: 1 / -1; }
          .sb-mh .mh-row { flex: 0 0 auto; }
        }
        @media (max-width: 680px) {
          .sb-mh .mh-tools { flex: 1 1 100%; }
          .sb-mh .mh-select { flex-basis: 140px; }
          .sb-mh .mh-aside { grid-template-columns: 1fr; }
          .sb-mh .mh-panel { padding: 14px; }
          .sb-mh .mh-rows::before { display: none; }
          .sb-mh .mh-row {
            grid-template-columns: 46px minmax(0, 1fr) auto;
            grid-template-areas: "icon info kcal" "icon info actions";
            gap: 6px 12px;
            padding: 10px 12px;
            min-height: 0;
          }
          .sb-mh .mh-time { display: none; }
          .sb-mh .mh-emoji { grid-area: icon; width: 46px; height: 46px; font-size: 25px; border-radius: 13px; }
          .sb-mh .mh-info { grid-area: info; }
          .sb-mh .mh-food { font-size: 15px; }
          .sb-mh .mh-kcal { grid-area: kcal; }
          .sb-mh .mh-kcal strong { font-size: 19px; }
          .sb-mh .mh-kcal-bar, .sb-mh .mh-kcal p { display: none; }
          .sb-mh .mh-actions { grid-area: actions; justify-self: end; }
          .sb-mh .mh-act { width: 34px; height: 34px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sb-mh .mh-row, .sb-mh .mh-act { transition: none; }
          .sb-mh .mh-wave, .sb-mh .mh-bubble { animation: none; }
          .sb-mh .mh-row:hover, .sb-mh .mh-act:hover, .sb-mh .mh-act:active { transform: none; }
        }
      `}</style>

      {/* ============ TOP BAR ============ */}
      <header className="mh-top">
        <div>
          <p className="mh-eyebrow">YOUR NUTRITION JOURNEY</p>
          <h2 className="mh-title serif">Every meal tells a story.</h2>
          <p className="mh-sub">Your five most recent food records, at a glance.</p>
        </div>

        <div className="mh-tools">
          <label className="mh-search">
            <Search size={17} color="var(--muted)" />
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search food or compartment..."
              aria-label="Search meals"
            />
          </label>

          <div className="mh-select">
            <CalendarDays size={17} style={{ left: 14 }} />
            <select
              value={filter}
              onChange={event => setFilter(event.target.value as Filter)}
              aria-label="Filter by date"
            >
              {FILTERS.map(option => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <ChevronDown size={15} style={{ right: 13 }} />
          </div>
        </div>
      </header>

      <div className="mh-grid">
        {/* ============ RECENT MEALS ============ */}
        <section className="mh-panel">
          <div className="mh-list-head">
            <div className="mh-head-icon"><Clock3 size={20} /></div>
            <h3 className="serif">Recent Meals</h3>
            <span className="mh-pill">Latest 5 food records</span>
            <span className="mh-count num">
              <b>{visibleMeals.length}</b> of {recentMeals.length} shown
            </span>
          </div>

          {visibleMeals.length === 0 ? (
            <div className="mh-empty">
              <UtensilsCrossed size={34} />
              <h4 className="serif">{meals.length === 0 ? 'No meals yet' : 'No meals found'}</h4>
              <p>
                {meals.length === 0
                  ? 'Fill your lunchbox in Smart Lunchbox, then tap “Save to Meal History”.'
                  : 'Try changing your search or date filter.'}
              </p>
            </div>
          ) : (
            <div className="mh-rows">
              {visibleMeals.map((meal, index) => {
                const values = nutrition(meal)
                const [clock, period] = meal.time.split(' ')
                const share = pct(values.calories, totals.calories)

                return (
                  <motion.div
                    className="mh-row"
                    key={meal.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.25) }}
                  >
                    <div className="mh-time">
                      <strong className="num">{clock}</strong>
                      <span className="num">{period}</span>
                      <span>{shortDate(meal.date)}</span>
                    </div>

                    <div className="mh-emoji" aria-hidden="true">{meal.emoji}</div>

                    <div className="mh-info">
                      <strong className="mh-food">{meal.food}</strong>
                      <div className="mh-meta">
                        <span
                          className="mh-tag"
                          style={{ ['--c' as string]: `var(--mh-c${meal.compartment})` }}
                        >
                          <i />
                          Compartment {meal.compartment}
                        </span>
                        <span className="num">
                          <Scale size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                          {meal.weight} g
                        </span>
                      </div>
                    </div>

                    <div className="mh-macros">
                      <div className="mh-macro">
                        <span><Droplets size={12} />Sugar</span>
                        <b className="num">{format(values.sugar, 1)}<small>g</small></b>
                      </div>
                      <div className="mh-macro">
                        <span><Activity size={12} />Sodium</span>
                        <b className="num">{format(values.sodium)}<small>mg</small></b>
                      </div>
                    </div>

                    <div className="mh-kcal">
                      <strong className="num">
                        {format(values.calories)}
                        <small>kcal</small>
                      </strong>
                      <div className="mh-kcal-bar">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${share}%` }}
                          transition={{ duration: 0.6, delay: 0.1 + index * 0.05 }}
                        />
                      </div>
                      <p className="num">{format(share)}% of shown kcal</p>
                    </div>

                    <div className="mh-actions">
                      {[
                        { icon: Eye, title: 'View details', mode: 'view' as const },
                        { icon: Pencil, title: 'Edit record', mode: 'edit' as const },
                        { icon: Trash2, title: 'Delete record', mode: 'delete' as const },
                      ].map(action => {
                        const Icon = action.icon
                        return (
                          <button
                            key={action.mode}
                            type="button"
                            className={`mh-act ${action.mode}`}
                            title={action.title}
                            aria-label={`${action.title}: ${meal.food}`}
                            onClick={() => openModal(meal, action.mode)}
                          >
                            <Icon size={17} strokeWidth={1.9} />
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>

        {/* ============ SUMMARY ============ */}
        <aside className="mh-panel mh-aside">
          <div className="mh-hero">
            <p className="mh-hero-label">
              <Flame size={14} />
              Total Calories
            </p>

            <div className="mh-hero-body">
              <div className="mh-ring">
                <svg viewBox="0 0 140 140" aria-hidden="true">
                  <circle cx="70" cy="70" r={RING_R} fill="none" stroke="var(--mh-hero-track)" strokeWidth="11" />
                  <motion.circle
                    cx="70"
                    cy="70"
                    r={RING_R}
                    fill="none"
                    stroke="var(--mh-hero-ring)"
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray={RING_C}
                    initial={{ strokeDashoffset: RING_C }}
                    animate={{ strokeDashoffset: RING_C * (1 - calorieShare / 100) }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                </svg>
                <div className="mh-ring-center">
                  <strong className="num">{format(totals.calories)}</strong>
                  <span>kcal</span>
                </div>
              </div>

              <div className="mh-hero-side">
                <p>
                  <strong className="num">{format(calorieShare)}%</strong>
                  of your {format(REFERENCE.calories)} kcal daily target
                </p>
                <p className="mh-hero-records">
                  <strong className="num">{visibleMeals.length}</strong>
                  food records
                </p>
              </div>
            </div>
          </div>

          <div className="mh-card">
            <p className="mh-card-title">
              Nutrients
              <span>vs. your daily limits</span>
            </p>

            {[
              { label: 'Total Sugar', icon: Droplets, value: totals.sugar, digits: 1, unit: 'g', ref: REFERENCE.sugar },
              { label: 'Total Sodium', icon: Activity, value: totals.sodium, digits: 0, unit: 'mg', ref: REFERENCE.sodium },
            ].map(item => {
              const Icon = item.icon
              const share = pct(item.value, item.ref)
              return (
                <div className="mh-meter" key={item.label}>
                  <div className="mh-meter-top">
                    <span><Icon size={14} />{item.label}</span>
                    <b className="num">
                      {format(item.value, item.digits)}
                      <small>{item.unit}</small>
                    </b>
                  </div>
                  <div className="mh-track">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${share}%` }}
                      transition={{ duration: 0.7 }}
                    />
                  </div>
                  <p className="num">
                    {format(share)}% of {format(item.ref)} {item.unit}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mh-card mh-box-card">
            <p className="mh-card-title">
              Lunchbox Compartments
              <span>kcal per section</span>
            </p>

            <div className="mh-box">
              {compartments.map(item => {
                const fill = pct(item.calories, totals.calories)
                const isTop =
                  item.calories > 0 &&
                  item.calories === Math.max(...compartments.map(c => c.calories))

                return (
                  <div
                    key={item.number}
                    className={`mh-comp${isTop ? ' is-top' : ''}`}
                    style={{ ['--c' as string]: `var(--mh-c${item.number})` }}
                  >
                    {/* LIQUID FILL */}
                    <motion.div
                      className={`mh-liquid${fill === 0 ? ' empty' : ''}`}
                      initial={{ height: '0%' }}
                      animate={{ height: `${fill}%` }}
                      transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                    >
                      <svg className="mh-wave back" viewBox="0 0 200 15" preserveAspectRatio="none" aria-hidden="true">
                        <path d="M0 8 Q25 0 50 8 T100 8 T150 8 T200 8 V15 H0 Z" />
                      </svg>
                      <svg className="mh-wave" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                        <path d="M0 6 Q25 12 50 6 T100 6 T150 6 T200 6 V12 H0 Z" />
                      </svg>
                      {fill > 0 && (
                        <>
                          <i className="mh-bubble" />
                          <i className="mh-bubble" />
                          <i className="mh-bubble" />
                        </>
                      )}
                    </motion.div>

                    <div className="mh-comp-top">
                      <span>
                        <i />
                        C{item.number}
                      </span>
                      <motion.b
                        key={Math.round(fill)}
                        className="mh-comp-pct num"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        {format(fill)}%
                      </motion.b>
                    </div>

                    <div>
                      <strong className="num">
                        {format(item.calories)}
                        <small>kcal</small>
                      </strong>
                      <em className="num">
                        {item.count} {item.count === 1 ? 'item' : 'items'}
                      </em>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="mh-note">
            <Info size={13} />
            Saved to your account. Nutrition is estimated from each food's values per 100 g and the measured weight.
          </p>
        </aside>
      </div>

      {/* ============ TOAST ============ */}
      <AnimatePresence>
        {message && (
          <motion.div
            className="mh-toast"
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <Check size={16} />
            {message}
            <button type="button" aria-label="Dismiss notification" onClick={() => setMessage('')}>
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ VIEW / EDIT / DELETE MODAL ============ */}
      <AnimatePresence>
        {modalMode && selectedMeal && selectedNutrition && (
          <motion.div
            className="mh-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="mh-modal"
              role="dialog"
              aria-modal="true"
              aria-label={modalMode + ' meal'}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              onClick={event => event.stopPropagation()}
            >
              <div className="mh-modal-head">
                <div>
                  <p className="mh-eyebrow">MEAL HISTORY</p>
                  <h2 className="serif">
                    {modalMode === 'view'
                      ? 'Meal Details'
                      : modalMode === 'edit'
                        ? 'Edit Meal'
                        : 'Delete Meal?'}
                  </h2>
                </div>
                <button type="button" className="mh-icon-btn" aria-label="Close modal" onClick={closeModal}>
                  <X size={17} />
                </button>
              </div>

              {modalMode === 'delete' ? (
                <>
                  <div className="mh-hero-meal">
                    <div className="mh-emoji" aria-hidden="true">{selectedMeal.emoji}</div>
                    <div>
                      <h3 className="serif">{selectedMeal.food}</h3>
                      <p className="num">{formatDate(selectedMeal.date)} · {selectedMeal.time}</p>
                    </div>
                  </div>
                  <p className="mh-delete-copy">
                    Are you sure you want to delete <strong>{selectedMeal.food}</strong> from your meal history?
                  </p>
                  <p className="mh-hint">This action cannot be undone.</p>
                  {error && <p className="mh-hint" role="alert" style={{ color: 'var(--mh-del-text)' }}>{error}</p>}
                  <div className="mh-btns">
                    <button type="button" className="mh-btn" onClick={closeModal} disabled={busy}>Cancel</button>
                    <button type="button" className="mh-btn danger" onClick={deleteMeal} disabled={busy}>
                      <Trash2 size={15} />
                      {busy ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </>
              ) : modalMode === 'edit' ? (
                <>
                  <div className="mh-field">
                    <label htmlFor="edit-food">Food Name</label>
                    <input
                      id="edit-food"
                      className="mh-input"
                      value={editFood}
                      onChange={event => setEditFood(event.target.value)}
                    />
                  </div>

                  <div className="mh-field">
                    <label htmlFor="edit-date">Date</label>
                    <input
                      id="edit-date"
                      type="date"
                      className="mh-input"
                      value={editDate}
                      onChange={event => setEditDate(event.target.value)}
                    />
                  </div>

                  <div className="mh-field">
                    <span className="mh-label" id="edit-compartment-label">Compartment</span>
                    <div className="mh-seg" role="group" aria-labelledby="edit-compartment-label">
                      {[1, 2, 3].map(value => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={editCompartment === value}
                          onClick={() => setEditCompartment(value)}
                        >
                          <LayoutGrid size={14} />
                          Compartment {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="mh-hint">
                    Weight and nutrition stay as recorded. The time of the meal is kept; only the date changes.
                  </p>
                  {error && <p className="mh-hint" role="alert" style={{ color: 'var(--mh-del-text)' }}>{error}</p>}

                  <div className="mh-btns">
                    <button type="button" className="mh-btn" onClick={closeModal} disabled={busy}>Cancel</button>
                    <button type="button" className="mh-btn primary" onClick={saveEdit} disabled={!canSave || busy}>
                      <Check size={15} />
                      {busy ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mh-hero-meal">
                    <div className="mh-emoji" aria-hidden="true">{selectedMeal.emoji}</div>
                    <div>
                      <h3 className="serif">{selectedMeal.food}</h3>
                      <p className="num">
                        {formatDate(selectedMeal.date)} · {selectedMeal.time} · Compartment {selectedMeal.compartment}
                      </p>
                    </div>
                  </div>

                  <div className="mh-tiles">
                    <div className="mh-tile">
                      <span><Flame size={13} />Calories</span>
                      <strong className="num">{format(selectedNutrition.calories)}<small>kcal</small></strong>
                    </div>
                    <div className="mh-tile">
                      <span><Scale size={13} />Measured Weight</span>
                      <strong className="num">{selectedMeal.weight}<small>g</small></strong>
                    </div>
                    <div className="mh-tile">
                      <span><Droplets size={13} />Sugar</span>
                      <strong className="num">{format(selectedNutrition.sugar, 1)}<small>g</small></strong>
                    </div>
                    <div className="mh-tile">
                      <span><Activity size={13} />Sodium</span>
                      <strong className="num">{format(selectedNutrition.sodium)}<small>mg</small></strong>
                    </div>
                  </div>

                  <div className="mh-btns">
                    <button type="button" className="mh-btn" onClick={closeModal}>Close Details</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}