
import { motion } from 'motion/react'

type CalorieRingProps = {
  consumed?: number
  goal?: number
  sugarConsumed?: number
  sugarGoal?: number
  sodiumConsumed?: number
  sodiumGoal?: number
}

type RingData = {
  label: string
  consumed: number
  goal: number
  radius: number
  color: string
  width: number
}

export default function CalorieRing({
  consumed = 1250,
  goal = 2000,
  sugarConsumed = 28,
  sugarGoal = 50,
  sodiumConsumed = 1400,
  sodiumGoal = 2300,
}: CalorieRingProps) {
  const safePercent = (value: number, target: number) =>
    target > 0
      ? Math.max(0, Math.min(value / target, 1))
      : 0

  const rings: RingData[] = [
    {
      label: 'Calories',
      consumed,
      goal,
      radius: 91,
      color: '#376B50',
      width: 13,
    },
    {
      label: 'Sugar',
      consumed: sugarConsumed,
      goal: sugarGoal,
      radius: 72,
      color: '#C58A63',
      width: 12,
    },
    {
      label: 'Sodium',
      consumed: sodiumConsumed,
      goal: sodiumGoal,
      radius: 54,
      color: '#83A9A0',
      width: 11,
    },
  ]

  return (
    <div className="sb-triple-ring">
      <style>{`
        .sb-triple-ring {
          width: 100%;
          height: 100%;
          min-height: 0;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e8eee8);
          border-radius: 18px;
          padding: 12px;
          overflow: hidden;
          box-sizing: border-box;
        }

        .sb-triple-ring * {
          box-sizing: border-box;
        }

        .sb-triple-ring-header {
          align-self: stretch;
          flex-shrink: 0;
        }

        .sb-triple-ring-header h3 {
          margin: 0;
          color: var(--text, #243e32);
          font-size: 14px;
          font-weight: 750;
        }

        .sb-triple-ring-header p {
          margin: 3px 0 0;
          color: var(--muted, #84928a);
          font-size: 10px;
        }

        .sb-triple-ring-graphic {
          flex: 1;
          min-height: 0;
          min-width: 0;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .sb-triple-ring-chart {
          display: block;
          width: auto;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          aspect-ratio: 1;
          overflow: visible;
        }

        .sb-triple-ring-center {
          fill: var(--text, #243e32);
          font-size: 18px;
          font-weight: 800;
          text-anchor: middle;
        }

        .sb-triple-ring-subtext {
          fill: var(--muted, #84928a);
          font-size: 8px;
          text-anchor: middle;
        }

        .sb-triple-ring-legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 5px 11px;
          width: 100%;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .sb-triple-ring-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          color: var(--muted, #84928a);
          white-space: nowrap;
        }

        .sb-triple-ring-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .sb-triple-ring-legend-item strong {
          color: var(--text, #243e32);
          font-size: 10px;
        }

        @media (max-height: 800px) {
          .sb-triple-ring {
            padding: 8px;
          }

          .sb-triple-ring-header h3 {
            font-size: 12px;
          }

          .sb-triple-ring-header p {
            font-size: 9px;
          }

          .sb-triple-ring-legend-item {
            font-size: 9px;
          }
        }
      `}</style>

      <div className="sb-triple-ring-header">
        <h3>Daily Nutrition Rings</h3>
        <p>Track your daily nutrition progress</p>
      </div>

      <div className="sb-triple-ring-graphic">
        <svg
          className="sb-triple-ring-chart"
          viewBox="0 0 220 220"
          role="img"
          aria-label={
            `Nutrition progress: ${consumed} calories, ` +
            `${sugarConsumed} grams of sugar, ` +
            `${sodiumConsumed} milligrams of sodium`
          }
        >
          {rings.map((ring) => {
            const circumference =
              2 * Math.PI * ring.radius

            const progress = safePercent(
              ring.consumed,
              ring.goal
            )

            const offset =
              circumference * (1 - progress)

            return (
              <g key={ring.label}>
                {/* Background track */}
                <circle
                  cx="110"
                  cy="110"
                  r={ring.radius}
                  fill="none"
                  stroke={ring.color}
                  strokeOpacity={0.15}
                  strokeWidth={ring.width}
                />

                {/* Animated progress */}
                <motion.circle
                  cx="110"
                  cy="110"
                  r={ring.radius}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={ring.width}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{
                    strokeDashoffset: circumference,
                  }}
                  animate={{
                    strokeDashoffset: offset,
                  }}
                  transition={{
                    duration: 1.5,
                    ease: 'easeOut',
                    delay:
                      ring.label === 'Calories'
                        ? 0
                        : ring.label === 'Sugar'
                          ? 0.15
                          : 0.3,
                  }}
                  transform="rotate(-90 110 110)"
                />
              </g>
            )
          })}

          {/* Center label */}
          <text
            x="110"
            y="106"
            className="sb-triple-ring-center"
          >
            {consumed.toLocaleString()}
          </text>

          <text
            x="110"
            y="120"
            className="sb-triple-ring-subtext"
          >
            kcal consumed
          </text>
        </svg>
      </div>

      {/* Ring legend */}
      <div className="sb-triple-ring-legend">
        {rings.map((ring) => {
          const percentage = Math.round(
            safePercent(ring.consumed, ring.goal) * 100
          )

          return (
            <div
              className="sb-triple-ring-legend-item"
              key={ring.label}
            >
              <span
                className="sb-triple-ring-dot"
                style={{ background: ring.color }}
              />

              <span>{ring.label}</span>

              <strong>{percentage}%</strong>
            </div>
          )
        })}
      </div>
    </div>
  )
}
