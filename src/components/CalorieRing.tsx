
import { motion } from 'motion/react'

type CalorieRingProps = {
  consumed?: number
  goal?: number
}

export default function CalorieRing({
  consumed = 1250,
  goal = 2000,
}: CalorieRingProps) {
  const percentage =
    goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0

  const radius = 85
  const circumference = 2 * Math.PI * radius
  const offset =
    circumference - (percentage / 100) * circumference

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ alignSelf: 'flex-start' }}>
        <h3
          style={{
            margin: 0,
            color: 'var(--text)',
            fontSize: 18,
          }}
        >
          Daily Calorie Intake
        </h3>

        <p
          style={{
            margin: '6px 0 0',
            color: 'var(--muted)',
            fontSize: 13,
          }}
        >
          Track your daily nutrition progress
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 260,
          aspectRatio: '1',
        }}
      >
        <svg
          viewBox="0 0 220 220"
          style={{ width: '100%', height: '100%' }}
        >
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="16"
          />

          <motion.circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{
              duration: 1.6,
              ease: 'easeOut',
            }}
            transform="rotate(-90 110 110)"
          />
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{
              color: 'var(--text)',
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: '-1px',
            }}
          >
            {consumed.toLocaleString()}
          </motion.span>

          <span
            style={{
              color: 'var(--muted)',
              fontSize: 13,
            }}
          >
            of {goal.toLocaleString()} kcal
          </span>

          <span
            style={{
              color: 'var(--primary)',
              fontSize: 14,
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      <div
        style={{
          color: 'var(--muted)',
          fontSize: 13,
          textAlign: 'center',
        }}
      >
        {Math.max(goal - consumed, 0).toLocaleString()} kcal remaining
      </div>
    </div>
  )
}
