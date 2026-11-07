
import { useMemo, useState, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Activity,
  CalendarDays,
  Download,
  Flame,
  Candy,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Info,
} from 'lucide-react'

type Nutrient = 'calories' | 'sugar' | 'sodium'
type Period = '7 Days' | '30 Days'

type DayRecord = {
  date: string
  calories: number
  sugar: number
  sodium: number
}

const sampleData: DayRecord[] = Array.from(
  { length: 30 },
  (_, i) => {
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
  }
)

const nutrientConfig = {
  calories: {
    title: 'Calories',
    unit: 'kcal',
    goal: 2000,
    color: '#78936A',
    icon: Flame,
    description: 'Daily energy intake',
  },
  sugar: {
    title: 'Sugar',
    unit: 'g',
    goal: 50,
    color: '#C58A63',
    icon: Candy,
    description: 'Daily sugar intake',
  },
  sodium: {
    title: 'Sodium',
    unit: 'mg',
    goal: 2300,
    color: '#83A9A0',
    icon: Droplets,
    description: 'Daily sodium intake',
  },
}

const panel: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 16,
  minWidth: 0,
  boxSizing: 'border-box',
}

const muted: CSSProperties = {
  color: 'var(--muted)',
  fontSize: 12,
}

const formatNumber = (value: number) =>
  Math.round(value).toLocaleString()

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
      calories:
        data.reduce((sum, day) => sum + day.calories, 0) /
        data.length,
      sugar:
        data.reduce((sum, day) => sum + day.sugar, 0) /
        data.length,
      sodium:
        data.reduce((sum, day) => sum + day.sodium, 0) /
        data.length,
    }),
    [data]
  )

  const current = nutrientConfig[nutrient]

  const maxValue = Math.max(
    current.goal * 1.15,
    ...data.map(day => day[nutrient])
  )

  const statCards: Nutrient[] = [
    'calories',
    'sugar',
    'sodium',
  ]

  const exportCSV = () => {
    const rows = [
      ['Date', 'Calories (kcal)', 'Sugar (g)', 'Sodium (mg)'],
      ...data.map(day => [
        day.date,
        day.calories,
        day.sugar,
        day.sodium,
      ]),
    ]

    const csv = rows
      .map(row => row.join(','))
      .join('\r\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `sustansyabox-nutrition-${
      period === '7 Days' ? '7d' : '30d'
    }.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

 
return (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="nutrition-reports-page"
    style={{
      color: 'var(--text)',
      width: '100%',
      maxWidth: 1500,
      margin: '0 auto',
      paddingTop: 4,
      paddingBottom: 8,
      display: 'grid',
      gap: 9,
      boxSizing: 'border-box',
    }}
  >

  
<style>{`
  .nutrition-reports-page {
    --reports-chart-height: 145px;
  }

  .reports-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .reports-insights-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .reports-action-button {
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      transform 0.2s ease;
  }

  .reports-action-button:hover {
    transform: translateY(-1px);
    filter: brightness(0.96);
  }

  .reports-export-button:hover {
    filter: brightness(1.08);
  }

  @media (max-width: 900px) {
    .reports-insights-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 650px) {
    .nutrition-reports-page {
      padding-top: 8px !important;
    }

    .reports-summary-grid,
    .reports-insights-grid {
      grid-template-columns: 1fr;
    }

    .reports-chart-header {
      flex-direction: column;
    }
  }

  @media (min-width: 1100px) and (max-height: 800px) {
    .nutrition-reports-page {
      padding-top: 0 !important;
      padding-bottom: 4px !important;
      gap: 7px !important;
      --reports-chart-height: 115px;
    }
  }

  @media (min-width: 1100px) and (min-height: 950px) {
    .nutrition-reports-page {
      padding-top: 12px !important;
      padding-bottom: 16px !important;
      gap: 13px !important;
      --reports-chart-height: 170px;
    }
  }
`}</style>

      {/* INTRODUCTION */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 2,
        }}
      >
        <div>
          <p
            style={{
              color: 'var(--primary)',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              margin: '0 0 5px',
            }}
          >
            YOUR NUTRITION AT A GLANCE
          </p>

          <h2
            style={{
              fontSize: 23,
              margin: '0 0 5px',
              letterSpacing: '-0.4px',
            }}
          >
            Nutrition Insights
          </h2>

          <p
            style={{
              ...muted,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Understand your eating patterns and monitor your progress.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          className="reports-export-button"
          style={{
            background: 'var(--primary)',
            color: '#fff',
            border: 0,
            borderRadius: 11,
            padding: '10px 15px',
            fontWeight: 700,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'filter 0.2s ease',
          }}
        >
          <Download size={15} />
          Export CSV
        </button>
      </motion.div>

      {/* PERIOD SELECTOR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            ...muted,
            fontWeight: 600,
          }}
        >
          <CalendarDays size={15} />
          Reporting period
        </span>

        <div
          style={{
            display: 'flex',
            gap: 5,
            padding: 4,
            borderRadius: 11,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          {(['7 Days', '30 Days'] as Period[]).map(option => (
            <button
              key={option}
              type="button"
              className="reports-action-button"
              onClick={() => {
                setPeriod(option)
                setHovered(null)
              }}
              style={{
                border: 0,
                borderRadius: 8,
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
                background:
                  period === option
                    ? 'var(--primary)'
                    : 'transparent',
                color:
                  period === option
                    ? '#fff'
                    : 'var(--text)',
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* NUTRITION SUMMARY CARDS */}
      <div className="reports-summary-grid">
        {statCards.map((key, index) => {
          const config = nutrientConfig[key]
          const Icon = config.icon
          const average = averages[key]
          const percent = (average / config.goal) * 100
          const over = average > config.goal

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              whileHover={{ y: -2 }}
              style={{
                ...panel,
                padding: '14px 17px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: `${config.color}20`,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon size={18} color={config.color} />
                </div>

                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--muted)',
                    fontWeight: 700,
                    letterSpacing: 0.4,
                  }}
                >
                  DAILY AVERAGE
                </span>
              </div>

              <p
                style={{
                  ...muted,
                  margin: '9px 0 3px',
                }}
              >
                {config.title}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 5,
                }}
              >
                <strong
                  style={{
                    fontSize: 25,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {formatNumber(average)}
                </strong>

                <span style={muted}>
                  {config.unit}
                </span>
              </div>

              <div
                style={{
                  height: 6,
                  background: 'var(--border)',
                  borderRadius: 20,
                  marginTop: 10,
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(percent, 100)}%`,
                  }}
                  transition={{
                    duration: 0.8,
                    ease: 'easeOut',
                  }}
                  style={{
                    height: '100%',
                    background: config.color,
                    borderRadius: 20,
                  }}
                />
              </div>

              <p
                style={{
                  margin: '7px 0 0',
                  fontSize: 11,
                  color: 'var(--muted)',
                }}
              >
                {formatNumber(percent)}% of reference goal
                {over ? ' · Above goal' : ''}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* MAIN CHART */}
      <motion.section
        layout
        style={{
          ...panel,
          padding: '15px 18px',
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="reports-chart-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 17,
                margin: '0 0 4px',
              }}
            >
              Nutrition Trends
            </h3>

            <p
              style={{
                ...muted,
                margin: 0,
              }}
            >
              Compare your daily intake across the selected period.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {statCards.map(key => {
              const config = nutrientConfig[key]

              return (
                <button
                  key={key}
                  type="button"
                  className="reports-action-button"
                  onClick={() => {
                    setNutrient(key)
                    setHovered(null)
                  }}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 9,
                    padding: '7px 11px',
                    background:
                      nutrient === key
                        ? config.color
                        : 'var(--surface)',
                    color:
                      nutrient === key
                        ? '#fff'
                        : 'var(--text)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {config.title}
                </button>
              )
            })}
          </div>
        </div>

        {/* SELECTED NUTRIENT AVERAGE */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <div>
            <span
              style={{
                fontSize: 10,
                color: 'var(--muted)',
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              AVERAGE {current.title.toUpperCase()}
            </span>

            <h3
              style={{
                fontSize: 24,
                margin: '3px 0 0',
              }}
            >
              {formatNumber(averages[nutrient])}

              <span
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  fontWeight: 400,
                  marginLeft: 6,
                }}
              >
                {current.unit} / day
              </span>
            </h3>
          </div>

          <Activity size={21} color={current.color} />
        </div>

        {/* CHART */}
        <div
          style={{
            position: 'relative',
            height: 'var(--reports-chart-height)',
            paddingTop: 12,
            paddingBottom: 23,
            boxSizing: 'border-box',
          }}
        >
          {/* REFERENCE GOAL LINE */}
          <div
            style={{
              position: 'absolute',
              top: `calc(12px + (var(--reports-chart-height) - 35px) * ${
                1 - current.goal / maxValue
              })`,
              left: 0,
              right: 0,
              borderTop: '1px dashed var(--muted)',
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'flex-end',
              gap: period === '7 Days' ? 12 : 4,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${period}-${nutrient}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: period === '7 Days' ? 12 : 4,
                  width: '100%',
                  height: '100%',
                }}
              >
                {data.map((day, index) => {
                  const value = day[nutrient]
                  const height = Math.max(
                    3,
                    (value / maxValue) * 100
                  )

                  return (
                    <div
                      key={day.date}
                      style={{
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        position: 'relative',
                        minWidth: 0,
                      }}
                      onMouseEnter={() => setHovered(index)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {hovered === index && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: `${height}%`,
                            left: '50%',
                            transform:
                              'translate(-50%, -8px)',
                            background: 'var(--text)',
                            color: 'var(--surface)',
                            padding: '7px 9px',
                            borderRadius: 8,
                            fontSize: 10,
                            whiteSpace: 'nowrap',
                            zIndex: 5,
                            pointerEvents: 'none',
                          }}
                        >
                          {day.date}: {formatNumber(value)}{' '}
                          {current.unit}
                        </div>
                      )}

                      <motion.div
                        initial={{ height: 0 }}
                        animate={{
                          height: `${height}%`,
                        }}
                        transition={{
                          duration: 0.55,
                          delay: index * 0.012,
                        }}
                        style={{
                          background: current.color,
                          borderRadius: '6px 6px 2px 2px',
                          opacity:
                            hovered === index ? 1 : 0.8,
                          minHeight: 3,
                        }}
                      />

                      <span
                        style={{
                          position: 'absolute',
                          top: '100%',
                          width: '100%',
                          textAlign: 'center',
                          marginTop: 7,
                          fontSize: 10,
                          color: 'var(--muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {period === '7 Days' ||
                        index % 5 === 0
                          ? new Date(
                              `${day.date}T12:00:00`
                            ).toLocaleDateString('en-US', {
                              month:
                                period === '7 Days'
                                  ? undefined
                                  : 'short',
                              day: 'numeric',
                            })
                          : ''}
                      </span>
                    </div>
                  )
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* CHART LEGEND */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 6,
            fontSize: 11,
            color: 'var(--muted)',
          }}
        >
          <span
            style={{
              width: 20,
              borderTop: '1px dashed var(--muted)',
            }}
          />
          Dashed line indicates the reference goal.
        </div>
      </motion.section>

      {/* ADDITIONAL INSIGHTS */}
      <div className="reports-insights-grid">
        {/* GOAL OVERVIEW */}
        <motion.section
          style={{
            ...panel,
            padding: '14px 17px',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <h3
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: '0 0 9px',
              fontSize: 15,
            }}
          >
            <BarChart3
              size={17}
              color="var(--primary)"
            />
            Goal Overview
          </h3>

          {statCards.map(key => {
            const config = nutrientConfig[key]
            const value = averages[key]
            const difference = value - config.goal

            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom:
                    '1px solid var(--border)',
                }}
              >
                <div>
                  <strong style={{ fontSize: 12 }}>
                    {config.title}
                  </strong>

                  <p
                    style={{
                      margin: '3px 0 0',
                      fontSize: 10,
                      color: 'var(--muted)',
                    }}
                  >
                    Reference: {formatNumber(config.goal)}{' '}
                    {config.unit}
                  </p>
                </div>

                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    color:
                      difference > 0
                        ? '#B87955'
                        : 'var(--primary)',
                  }}
                >
                  {difference > 0 ? (
                    <TrendingUp size={14} />
                  ) : difference < 0 ? (
                    <TrendingDown size={14} />
                  ) : (
                    <Minus size={14} />
                  )}

                  {difference > 0 ? '+' : ''}
                  {formatNumber(difference)} {config.unit}
                </span>
              </div>
            )
          })}
        </motion.section>

        {/* NUTRITION NOTES */}
        <motion.section
          style={{
            ...panel,
            padding: '14px 17px',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: '0 0 9px',
              fontSize: 15,
            }}
          >
            <Info size={17} color="var(--primary)" />
            Nutrition Notes
          </h3>

          <p
            style={{
              color: 'var(--muted)',
              lineHeight: 1.55,
              fontSize: 12,
              margin: '0 0 11px',
            }}
          >
            These reports help you observe your meal
            patterns over time. Calorie needs vary
            between individuals, while sugar and sodium
            goals depend on the recommendations you follow.
          </p>

          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              padding: '10px 12px',
              borderRadius: 11,
            }}
          >
            <strong style={{ fontSize: 12 }}>
              Sample Data Preview
            </strong>

            <p
              style={{
                color: 'var(--muted)',
                lineHeight: 1.5,
                fontSize: 11,
                margin: '5px 0 0',
              }}
            >
              The current chart uses demonstration values
              and reference goals. It does not represent
              your actual food consumption or connected
              lunchbox readings.
            </p>
          </div>
        </motion.section>
      </div>
    </motion.div>
  )
}
