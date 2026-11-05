
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

type NutritionCardProps = {
  title: string
  consumed: number
  goal: number
  unit: string
  icon: LucideIcon
  color: string
}

export default function NutritionCard({
  title,
  consumed,
  goal,
  unit,
  icon: Icon,
  color,
}: NutritionCardProps) {
  const percentage = goal > 0
    ? Math.min((consumed / goal) * 100, 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3
          style={{
            margin: 0,
            color: 'var(--text)',
            fontSize: 17,
          }}
        >
          {title}
        </h3>

        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'var(--bg)',
            display: 'grid',
            placeItems: 'center',
            color,
          }}
        >
          <Icon size={22} />
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <span
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: 'var(--text)',
          }}
        >
          {consumed.toLocaleString()}
        </span>

        <span
          style={{
            color: 'var(--muted)',
            fontSize: 14,
            marginLeft: 7,
          }}
        >
          / {goal.toLocaleString()} {unit}
        </span>
      </div>

      <div
        style={{
          height: 10,
          borderRadius: 20,
          background: 'var(--border)',
          marginTop: 20,
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 1.3,
            ease: 'easeOut',
          }}
          style={{
            height: '100%',
            background: color,
            borderRadius: 20,
          }}
        />
      </div>

      <p
        style={{
          margin: '14px 0 0',
          color: 'var(--muted)',
          fontSize: 13,
        }}
      >
        {percentage.toFixed(0)}% of daily goal
      </p>
    </motion.div>
  )
}
