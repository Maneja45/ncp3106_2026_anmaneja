import { useMemo, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import {
  Activity,
  BarChart3,
  Candy,
  CheckCircle2,
  Download,
  Droplets,
  Flame,
  Info,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import {
  NUTRITION_REFERENCE,
  NUTRITION_SOURCE,
} from '../services/nutrition'

type Nutrient = 'calories' | 'sugar' | 'sodium'
type Period = '7 Days' | '30 Days'
type Status = 'ok' | 'near' | 'over'

type DayRecord = {
  date: string
  calories: number
  sugar: number
  sodium: number
}

// Demonstration data (replace with real records later)
const sampleData: DayRecord[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 10, 7)
  date.setDate(date.getDate() - (29 - i))

  return {
    date: [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-'),
    calories: 1450 + ((i * 137 + 71) % 750),
    sugar: 19 + ((i * 11 + 5) % 36),
    sodium: 1100 + ((i * 179 + 83) % 1300),
  }
})

const nutrientConfig: Record<
  Nutrient,
  {
    title: string
    unit: string
    reference: number
    /** sugar and sodium are limits (stay under); calories is only a reference */
    isLimit: boolean
    icon: LucideIcon
    source: string
  }
> = {
  calories: {
    title: 'Calories',
    unit: 'kcal',
    reference: NUTRITION_REFERENCE.calories,
    isLimit: false,
    icon: Flame,
    source: NUTRITION_SOURCE.calories,
  },
  sugar: {
    title: 'Sugar',
    unit: 'g',
    reference: NUTRITION_REFERENCE.sugar,
    isLimit: true,
    icon: Candy,
    source: NUTRITION_SOURCE.sugar,
  },
  sodium: {
    title: 'Sodium',
    unit: 'mg',
    reference: NUTRITION_REFERENCE.sodium,
    isLimit: true,
    icon: Droplets,
    source: NUTRITION_SOURCE.sodium,
  },
}

const nutrients: Nutrient[] = ['calories', 'sugar', 'sodium']

const formatNumber = (value: number) => Math.round(value).toLocaleString()

// For limits: under 80% = ok, 80–100% = near, above 100% = over
function statusOf(value: number, reference: number): Status {
  const ratio = value / reference
  if (ratio > 1) return 'over'
  if (ratio >= 0.8) return 'near'
  return 'ok'
}

const statusLabel: Record<Status, string> = {
  ok: 'Within limit',
  near: 'Near limit',
  over: 'Above limit',
}

function dayLabel(date: string, period: Period) {
  const value = new Date(`${date}T12:00:00`)

  return period === '7 Days'
    ? value.toLocaleDateString('en-US', { weekday: 'short' })
    : value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fullDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function NutritionReports() {
  const [period, setPeriod] = useState<Period>('7 Days')
  const [nutrient, setNutrient] = useState<Nutrient>('calories')
  const [hovered, setHovered] = useState<number | null>(null)

  const data = useMemo(
    () => sampleData.slice(period === '7 Days' ? -7 : -30),
    [period]
  )

  const averages = useMemo(
    () => ({
      calories: data.reduce((sum, day) => sum + day.calories, 0) / data.length,
      sugar: data.reduce((sum, day) => sum + day.sugar, 0) / data.length,
      sodium: data.reduce((sum, day) => sum + day.sodium, 0) / data.length,
    }),
    [data]
  )

  const current = nutrientConfig[nutrient]

  const maxValue = Math.max(
    current.reference * 1.2,
    ...data.map(day => day[nutrient])
  )

  const referenceBottom = (current.reference / maxValue) * 100

  // Highest and lowest day for the nutrient shown in the chart
  const highestDay = data.reduce((best, day) =>
    day[nutrient] > best[nutrient] ? day : best
  )
  const lowestDay = data.reduce((best, day) =>
    day[nutrient] < best[nutrient] ? day : best
  )

  const exportCSV = () => {
    const rows = [
      ['Date', 'Calories (kcal)', 'Sugar (g)', 'Sodium (mg)'],
      ...data.map(day => [day.date, day.calories, day.sugar, day.sodium]),
    ]

    const csv = rows.map(row => row.join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `sustansyabox-nutrition-${period === '7 Days' ? '7d' : '30d'}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className="nr-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <style>{`
          /* ================= THEME ================= */
          .nr-page {
            --nr-text: var(--text, #243e32);
            --nr-muted: var(--muted, #6f8176);
            --nr-border: var(--border, #e2eadc);
            --nr-surface: var(--surface, #ffffff);
            --nr-bg: var(--bg, #f5f7f3);
            --nr-primary: var(--primary, #45634d);

            --nr-ink: #1f3d2c;
            --nr-glass: rgba(255, 255, 255, 0.84);
            --nr-soft: #e8f0e3;
            --nr-track: #e3eadf;
            --nr-ok: #5f9a6c;
            --nr-near: #c98a2b;
            --nr-over: #c4544c;
            --nr-btn: #45634d;
            --nr-btn-text: #ffffff;
            --nr-tooltip: #1f3d2c;
            --nr-tooltip-text: #ffffff;

            --nr-calories: #78936a;
            --nr-sugar: #c58a63;
            --nr-sodium: #5f9a90;
          }

          [data-theme="dark"] .nr-page {
            --nr-ink: #eef6e6;
            --nr-glass: rgba(22, 36, 29, 0.82);
            --nr-soft: #243b2e;
            --nr-track: #2a3f32;
            --nr-ok: #8cc77a;
            --nr-near: #e2b15f;
            --nr-over: #ee8b80;
            --nr-btn: #bbd5a3;
            --nr-btn-text: #173c2a;
            --nr-tooltip: #eef6e6;
            --nr-tooltip-text: #173c2a;

            --nr-calories: #a9c99a;
            --nr-sugar: #e3ad86;
            --nr-sodium: #8fcbc0;
          }

          /* ================= SHELL (no page scroll) ================= */
          .nr-page {
            width: 100%;
            max-width: 1600px;
            height: 100%;
            min-height: 540px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            overflow: hidden;
            box-sizing: border-box;
            color: var(--nr-text);
            font-family: 'DM Sans', sans-serif;
          }

          .nr-page *,
          .nr-page *::before,
          .nr-page *::after {
            box-sizing: border-box;
          }

          .nr-page button {
            font-family: inherit;
            cursor: pointer;
          }

          .nr-page button:focus-visible {
            outline: 2px solid var(--nr-primary);
            outline-offset: 2px;
          }

          .nr-num {
            font-family: 'Manrope', sans-serif;
            font-variant-numeric: tabular-nums;
          }

          .nr-card {
            min-width: 0;
            min-height: 0;
            border: 1px solid var(--nr-border);
            border-radius: 18px;
            background: var(--nr-glass);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: background-color 0.35s ease, border-color 0.35s ease;
          }

          /* ================= HEADER ================= */
          .nr-top {
            flex: 0 0 auto;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 14px;
            flex-wrap: wrap;
          }

          .nr-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .nr-segment {
            display: flex;
            gap: 4px;
            padding: 4px;
            border-radius: 12px;
            border: 1px solid var(--nr-border);
            background: var(--nr-surface);
          }

          .nr-segment button {
            border: 0;
            border-radius: 9px;
            padding: 8px 14px;
            background: transparent;
            color: var(--nr-text);
            font-size: 12px;
            font-weight: 700;
            transition: background-color 0.2s ease, color 0.2s ease;
          }

          .nr-segment button.on {
            background: var(--nr-btn);
            color: var(--nr-btn-text);
          }

          .nr-export {
            height: 40px;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 0 14px;
            border-radius: 12px;
            border: 1px solid var(--nr-btn);
            background: var(--nr-btn);
            color: var(--nr-btn-text);
            font-size: 12px;
            font-weight: 700;
            transition: transform 0.2s ease, filter 0.2s ease;
          }

          .nr-export:hover {
            transform: translateY(-1px);
            filter: brightness(1.06);
          }

          /* ================= STAT CARDS ================= */
          .nr-stats {
            flex: 0 0 auto;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
          }

          .nr-stat {
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .nr-stat-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          .nr-stat-icon {
            width: 34px;
            height: 34px;
            display: grid;
            place-items: center;
            border-radius: 10px;
            color: var(--nr-c);
            background: color-mix(in srgb, var(--nr-c) 16%, transparent);
          }

          .nr-chip {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 9px;
            border-radius: 99px;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
          }

          .nr-chip.ok { color: var(--nr-ok); background: color-mix(in srgb, var(--nr-ok) 14%, transparent); }
          .nr-chip.near { color: var(--nr-near); background: color-mix(in srgb, var(--nr-near) 16%, transparent); }
          .nr-chip.over { color: var(--nr-over); background: color-mix(in srgb, var(--nr-over) 16%, transparent); }
          .nr-chip.info { color: var(--nr-muted); background: var(--nr-soft); }

          .nr-stat-label {
            font-size: 12px;
            font-weight: 700;
            color: var(--nr-muted);
          }

          .nr-stat-value {
            font-size: clamp(22px, 2vw, 30px);
            font-weight: 800;
            letter-spacing: -0.6px;
            line-height: 1.05;
            color: var(--nr-ink);
          }

          .nr-stat-value small {
            margin-left: 4px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0;
            color: var(--nr-muted);
          }

          .nr-bar {
            position: relative;
            height: 7px;
            border-radius: 7px;
            background: var(--nr-track);
            overflow: hidden;
          }

          .nr-bar > span {
            display: block;
            height: 100%;
            border-radius: 7px;
          }

          .nr-note {
            font-size: 11px;
            color: var(--nr-muted);
          }

          /* ================= MAIN BENTO ================= */
          .nr-bento {
            flex: 1 1 auto;
            min-height: 0;
            display: grid;
            grid-template-columns: minmax(0, 1fr) clamp(280px, 26vw, 380px);
            gap: 12px;
          }

          .nr-chart-card {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 16px 18px 14px;
          }

          .nr-chart-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }

          .nr-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 19px;
            font-weight: 700;
            letter-spacing: -0.3px;
            color: var(--nr-ink);
          }

          .nr-card-title svg {
            color: var(--nr-primary);
          }

          .nr-card-sub {
            margin: 3px 0 0;
            font-size: 12px;
            color: var(--nr-muted);
          }

          .nr-tabs {
            display: flex;
            gap: 6px;
          }

          .nr-tabs button {
            padding: 7px 12px;
            border-radius: 10px;
            border: 1px solid var(--nr-border);
            background: var(--nr-surface);
            color: var(--nr-text);
            font-size: 12px;
            font-weight: 700;
            transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
          }

          .nr-tabs button.on {
            border-color: var(--nr-c);
            background: var(--nr-c);
            color: #ffffff;
          }

          [data-theme="dark"] .nr-tabs button.on {
            color: #173c2a;
          }

          .nr-avg {
            display: flex;
            align-items: baseline;
            gap: 8px;
            flex-wrap: wrap;
          }

          .nr-avg strong {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.6px;
            color: var(--nr-ink);
          }

          .nr-avg span {
            font-size: 12px;
            color: var(--nr-muted);
          }

          /* chart */
          .nr-chart {
            flex: 1 1 auto;
            min-height: 120px;
            display: flex;
            flex-direction: column;
          }

          .nr-plot {
            position: relative;
            flex: 1 1 auto;
            min-height: 0;
            border-bottom: 1px solid var(--nr-border);
          }

          .nr-ref-line {
            position: absolute;
            left: 0;
            right: 0;
            border-top: 1.5px dashed var(--nr-muted);
            opacity: 0.6;
            pointer-events: none;
            z-index: 2;
          }

          .nr-ref-tag {
            position: absolute;
            right: 0;
            transform: translateY(-100%);
            padding: 2px 8px;
            border-radius: 6px;
            background: var(--nr-surface);
            border: 1px solid var(--nr-border);
            font-size: 10px;
            font-weight: 700;
            color: var(--nr-muted);
            z-index: 3;
            pointer-events: none;
          }

          .nr-bars {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: flex-end;
          }

          .nr-col {
            position: relative;
            flex: 1;
            min-width: 0;
            height: 100%;
            display: flex;
            align-items: flex-end;
            justify-content: center;
          }

          .nr-col-bar {
            width: 70%;
            max-width: 72px;
            border-radius: 7px 7px 2px 2px;
            transition: opacity 0.2s ease, filter 0.2s ease;
          }

          .nr-col:hover .nr-col-bar {
            filter: brightness(1.08);
          }

          .nr-tooltip {
            position: absolute;
            left: 50%;
            transform: translate(-50%, -8px);
            padding: 6px 9px;
            border-radius: 8px;
            background: var(--nr-tooltip);
            color: var(--nr-tooltip-text);
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            pointer-events: none;
            z-index: 5;
          }

          .nr-labels {
            display: flex;
            padding-top: 7px;
          }

          .nr-labels span {
            flex: 1;
            min-width: 0;
            text-align: center;
            font-size: 11px;
            color: var(--nr-muted);
            white-space: nowrap;
          }

          .nr-legend {
            display: flex;
            align-items: center;
            gap: 14px;
            flex-wrap: wrap;
            font-size: 11px;
            color: var(--nr-muted);
          }

          .nr-legend span {
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .nr-legend i {
            width: 10px;
            height: 10px;
            border-radius: 3px;
          }

          .nr-legend .dash {
            width: 18px;
            height: 0;
            border-top: 1.5px dashed var(--nr-muted);
            border-radius: 0;
          }

          /* ================= SIDE ================= */
          .nr-side {
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .nr-goal-card {
            flex: 1 1 auto;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px 18px;
            overflow: hidden;
          }

          .nr-goal {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding-top: 12px;
            border-top: 1px solid var(--nr-border);
          }

          .nr-goal:first-of-type {
            border-top: 0;
            padding-top: 0;
          }

          .nr-goal-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          .nr-goal-top strong {
            font-size: 14px;
          }

          .nr-goal p {
            margin: 0;
            font-size: 12px;
            line-height: 1.45;
            color: var(--nr-muted);
          }

          .nr-goal p b {
            color: var(--nr-text);
          }

          .nr-days {
            display: flex;
            gap: 3px;
          }

          .nr-days i {
            flex: 1;
            height: 7px;
            border-radius: 3px;
          }

          .nr-highlights {
            margin-top: auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding-top: 12px;
            border-top: 1px solid var(--nr-border);
          }

          .nr-highlights-title {
            font-size: 12px;
            font-weight: 700;
            color: var(--nr-muted);
          }

          .nr-highlight-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .nr-highlight {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 10px 12px 10px 14px;
            border-radius: 12px;
            border: 1px solid var(--nr-border);
            background: var(--nr-surface);
            overflow: hidden;
          }

          .nr-highlight::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: var(--nr-c);
          }

          .nr-highlight span {
            font-size: 11px;
            font-weight: 700;
            color: var(--nr-muted);
          }

          .nr-highlight strong {
            font-size: 19px;
            font-weight: 800;
            color: var(--nr-ink);
          }

          .nr-highlight strong small {
            margin-left: 3px;
            font-size: 11px;
            color: var(--nr-muted);
          }

          .nr-highlight em {
            font-style: normal;
            font-size: 11px;
            color: var(--nr-muted);
          }

          .nr-notes {
            flex: 0 0 auto;
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 11px;
            line-height: 1.5;
            color: var(--nr-muted);
          }

          .nr-notes strong {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: var(--nr-text);
          }

          .nr-notes strong svg {
            color: var(--nr-primary);
          }

          /* ================= RESPONSIVE ================= */
          @media (max-height: 780px) {
            .nr-stat { padding: 10px 14px; gap: 4px; }
            .nr-chart-card { padding: 12px 14px 10px; gap: 8px; }
            .nr-goal-card { padding: 12px 14px; gap: 9px; }
            .nr-avg strong { font-size: 22px; }
          }

          @media (max-width: 1080px) {
            .nr-page { height: auto; overflow: visible; }
            .nr-bento { grid-template-columns: 1fr; }
            .nr-chart { min-height: 260px; }
          }

          @media (max-width: 680px) {
            .nr-stats { grid-template-columns: 1fr; }
            .nr-tabs { width: 100%; }
            .nr-tabs button { flex: 1; }
          }

          @media (prefers-reduced-motion: reduce) {
            .nr-page *,
            .nr-page *::before,
            .nr-page *::after {
              transition: none !important;
            }
          }
        `}</style>

        {/* ================= HEADER ================= */}
        <motion.header
          className="nr-top"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <p className="sb-hero-eyebrow">Your nutrition at a glance</p>
            <h2 className="sb-hero-title">Nutrition Insights</h2>
            <p className="sb-hero-sub">
              Understand your eating patterns and see how they compare with WHO
              guidance.
            </p>
          </div>

          <div className="nr-actions">
            <div className="nr-segment" role="group" aria-label="Reporting period">
              {(['7 Days', '30 Days'] as Period[]).map(option => (
                <button
                  key={option}
                  type="button"
                  className={period === option ? 'on' : ''}
                  aria-pressed={period === option}
                  onClick={() => {
                    setPeriod(option)
                    setHovered(null)
                  }}
                >
                  {option}
                </button>
              ))}
            </div>

            <button type="button" className="nr-export" onClick={exportCSV}>
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </motion.header>

        {/* ================= DAILY AVERAGE CARDS ================= */}
        <div className="nr-stats">
          {nutrients.map((key, index) => {
            const config = nutrientConfig[key]
            const Icon = config.icon
            const average = averages[key]
            const percent = (average / config.reference) * 100
            const status = statusOf(average, config.reference)
            const barColor = config.isLimit
              ? `var(--nr-${status})`
              : `var(--nr-${key})`

            return (
              <motion.section
                key={key}
                className="nr-card nr-stat"
                style={{ ['--nr-c' as string]: `var(--nr-${key})` }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 + index * 0.06 }}
              >
                <div className="nr-stat-top">
                  <span className="nr-stat-icon">
                    <Icon size={18} />
                  </span>

                  {config.isLimit ? (
                    <span className={`nr-chip ${status}`}>
                      {status === 'ok' ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <AlertTriangle size={11} />
                      )}
                      {statusLabel[status]}
                    </span>
                  ) : (
                    <span className="nr-chip info">Daily average</span>
                  )}
                </div>

                <span className="nr-stat-label">{config.title} · daily average</span>

                <strong className="nr-stat-value nr-num">
                  {formatNumber(average)}
                  <small>{config.unit}</small>
                </strong>

                <div className="nr-bar" aria-hidden="true">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percent, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ background: barColor }}
                  />
                </div>

                <span className="nr-note nr-num">
                  {formatNumber(percent)}% of {formatNumber(config.reference)}{' '}
                  {config.unit} · {config.source}
                </span>
              </motion.section>
            )
          })}
        </div>

        {/* ================= BENTO ================= */}
        <div className="nr-bento">
          {/* CHART */}
          <motion.section
            className="nr-card nr-chart-card"
            style={{ ['--nr-c' as string]: `var(--nr-${nutrient})` }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            <div className="nr-chart-head">
              <div>
                <h3 className="nr-card-title">
                  <Activity size={18} />
                  Nutrition Trends
                </h3>
                <p className="nr-card-sub">
                  Daily intake over the last {period === '7 Days' ? '7' : '30'}{' '}
                  days.
                </p>
              </div>

              <div className="nr-tabs" role="group" aria-label="Nutrient">
                {nutrients.map(key => (
                  <button
                    key={key}
                    type="button"
                    className={nutrient === key ? 'on' : ''}
                    aria-pressed={nutrient === key}
                    style={{ ['--nr-c' as string]: `var(--nr-${key})` }}
                    onClick={() => {
                      setNutrient(key)
                      setHovered(null)
                    }}
                  >
                    {nutrientConfig[key].title}
                  </button>
                ))}
              </div>
            </div>

            <div className="nr-avg">
              <strong className="nr-num">{formatNumber(averages[nutrient])}</strong>
              <span>
                {current.unit} / day on average ·{' '}
                {current.isLimit ? 'limit' : 'reference'}{' '}
                {formatNumber(current.reference)} {current.unit}
              </span>
            </div>

            <div className="nr-chart">
              <div className="nr-plot">
                {/* reference / limit line */}
                <span
                  className="nr-ref-line"
                  style={{ bottom: `${referenceBottom}%` }}
                />
                <span
                  className="nr-ref-tag nr-num"
                  style={{ bottom: `${referenceBottom}%` }}
                >
                  {current.isLimit ? 'Limit' : 'Reference'}{' '}
                  {formatNumber(current.reference)} {current.unit}
                </span>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${period}-${nutrient}`}
                    className="nr-bars"
                    style={{ gap: period === '7 Days' ? 14 : 4 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {data.map((day, index) => {
                      const value = day[nutrient]
                      const height = Math.max(2, (value / maxValue) * 100)
                      const status = statusOf(value, current.reference)
                      const color = current.isLimit
                        ? `var(--nr-${status})`
                        : `var(--nr-${nutrient})`

                      return (
                        <div
                          key={day.date}
                          className="nr-col"
                          onMouseEnter={() => setHovered(index)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          {hovered === index && (
                            <span
                              className="nr-tooltip nr-num"
                              style={{ bottom: `${height}%` }}
                            >
                              {fullDate(day.date)} · {formatNumber(value)}{' '}
                              {current.unit}
                            </span>
                          )}

                          <motion.span
                            className="nr-col-bar"
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{
                              duration: 0.55,
                              delay: index * 0.015,
                            }}
                            style={{
                              background: color,
                              opacity:
                                hovered === null || hovered === index ? 1 : 0.55,
                            }}
                          />
                        </div>
                      )
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div
                className="nr-labels nr-num"
                style={{ gap: period === '7 Days' ? 14 : 4 }}
              >
                {data.map((day, index) => (
                  <span key={day.date}>
                    {period === '7 Days' || index % 5 === 0
                      ? dayLabel(day.date, period)
                      : ''}
                  </span>
                ))}
              </div>
            </div>

            <div className="nr-legend">
              <span>
                <i className="dash" />
                {current.isLimit ? 'WHO / reference limit' : 'General reference'}
              </span>

              {current.isLimit && (
                <>
                  <span>
                    <i style={{ background: 'var(--nr-ok)' }} />
                    Within limit
                  </span>
                  <span>
                    <i style={{ background: 'var(--nr-near)' }} />
                    Near limit (80–100%)
                  </span>
                  <span>
                    <i style={{ background: 'var(--nr-over)' }} />
                    Above limit
                  </span>
                </>
              )}
            </div>
          </motion.section>

          {/* SIDE: GOAL CHECK + NOTES */}
          <motion.aside
            className="nr-side"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.28 }}
          >
            <section className="nr-card nr-goal-card">
              <h3 className="nr-card-title">
                <BarChart3 size={18} />
                Goal Check
              </h3>

              {nutrients.map(key => {
                const config = nutrientConfig[key]
                const average = averages[key]
                const difference = Math.abs(average - config.reference)
                const above = average > config.reference
                const status = statusOf(average, config.reference)
                const daysWithin = data.filter(
                  day => day[key] <= config.reference
                ).length

                return (
                  <div key={key} className="nr-goal">
                    <div className="nr-goal-top">
                      <strong>{config.title}</strong>

                      {config.isLimit ? (
                        <span className={`nr-chip ${status}`}>
                          {statusLabel[status]}
                        </span>
                      ) : (
                        <span className="nr-chip info">Reference</span>
                      )}
                    </div>

                    <p className="nr-num">
                      Average is <b>{formatNumber(difference)} {config.unit}</b>{' '}
                      {above ? 'above' : 'below'} the{' '}
                      {config.isLimit ? 'limit' : 'reference'}.
                      {config.isLimit && (
                        <>
                          {' '}
                          <b>
                            {daysWithin} of {data.length}
                          </b>{' '}
                          days stayed within it.
                        </>
                      )}
                    </p>

                    {config.isLimit && (
                      <div className="nr-days" aria-hidden="true">
                        {data.map(day => (
                          <i
                            key={day.date}
                            style={{
                              background: `var(--nr-${statusOf(
                                day[key],
                                config.reference
                              )})`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* HIGHLIGHTS — follows the nutrient selected in the chart */}
              <div className="nr-highlights">
                <span className="nr-highlights-title">
                  {current.title} highlights
                </span>

                <div className="nr-highlight-grid">
                  {[
                    { label: 'Highest day', day: highestDay },
                    { label: 'Lowest day', day: lowestDay },
                  ].map(item => {
                    const value = item.day[nutrient]
                    const status = statusOf(value, current.reference)

                    return (
                      <AnimatePresence mode="wait" key={item.label}>
                        <motion.div
                          key={`${item.label}-${nutrient}-${period}`}
                          className="nr-highlight"
                          style={{
                            ['--nr-c' as string]: current.isLimit
                              ? `var(--nr-${status})`
                              : `var(--nr-${nutrient})`,
                          }}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span>{item.label}</span>
                          <strong className="nr-num">
                            {formatNumber(value)}
                            <small>{current.unit}</small>
                          </strong>
                          <em className="nr-num">{fullDate(item.day.date)}</em>
                        </motion.div>
                      </AnimatePresence>
                    )
                  })}
                </div>
              </div>
            </section>

            <section className="nr-card nr-notes">
              <strong>
                <Info size={14} />
                About these numbers
              </strong>
              <span>
                Sodium uses the WHO limit of under 2,000 mg per day. Sugar and
                calories are general references; personal needs vary.
              </span>
              <span>
                Sample data preview — not your actual food intake or lunchbox
                readings yet.
              </span>
            </section>
          </motion.aside>
        </div>
      </motion.div>
    </MotionConfig>
  )
}