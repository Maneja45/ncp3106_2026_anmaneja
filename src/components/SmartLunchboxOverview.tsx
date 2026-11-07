
import { motion } from 'motion/react'
import {
  Wifi,
  Scale,
  Utensils,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react'

const compartments = [
  {
    number: '01',
    name: 'White Rice',
    category: 'Carbohydrates',
    weight: 150,
    calories: 195,
    sugar: 0.1,
    sodium: 2,
    emoji: '🍚',
    color: '#F5E8C9',
  },
  {
    number: '02',
    name: 'Grilled Chicken',
    category: 'Protein',
    weight: 120,
    calories: 198,
    sugar: 0,
    sodium: 89,
    emoji: '🍗',
    color: '#F2DCCB',
  },
  {
    number: '03',
    name: 'Steamed Broccoli',
    category: 'Vegetables',
    weight: 80,
    calories: 28,
    sugar: 1.4,
    sodium: 26,
    emoji: '🥦',
    color: '#DDE9D4',
  },
]

export default function SmartLunchboxOverview() {
  const totalWeight = compartments.reduce(
    (sum, item) => sum + item.weight,
    0
  )

  const totalCalories = compartments.reduce(
    (sum, item) => sum + item.calories,
    0
  )

  return (
    <section style={{ marginTop: 20, marginBottom: 48 }}>
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
          marginTop: 5,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 20,
              color: 'var(--text)',
              margin: '0 0 7px',
            }}
          >
            Smart Lunchbox Overview
          </h2>

          <p
            style={{
              fontSize: 13,
              color: 'var(--muted)',
              margin: 0,
            }}
          >
            Monitor your three food compartments.
          </p>
        </div>

        {/* Demo connection status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '10px 15px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            color: 'var(--primary)',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Wifi size={16} />
          Demo Mode
        </div>
      </div>

      {/* Compartment cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: 18,
        }}
      >
        {compartments.map((item, index) => (
          <motion.div
            key={item.number}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.45,
              delay: index * 0.1,
            }}
            whileHover={{ y: -5 }}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 22,
              padding: 22,
              minWidth: 0,
            }}
          >
            {/* Top row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                COMPARTMENT {item.number}
              </span>

              <CheckCircle2
                size={19}
                color="var(--primary)"
              />
            </div>

            {/* Food illustration */}
            <div
              style={{
                background: item.color,
                borderRadius: 18,
                height: 112,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <span
                role="img"
                aria-label={item.name}
                style={{ fontSize: 54 }}
              >
                {item.emoji}
              </span>
            </div>

            {/* Food details */}
            <h3
              style={{
                color: 'var(--text)',
                fontSize: 18,
                margin: '0 0 6px',
              }}
            >
              {item.name}
            </h3>

            <p
              style={{
                color: 'var(--muted)',
                fontSize: 13,
                margin: '0 0 22px',
              }}
            >
              {item.category}
            </p>

            {/* Weight and calories */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    color: 'var(--muted)',
                    fontSize: 12,
                    marginBottom: 6,
                  }}
                >
                  <Scale size={14} />
                  Weight
                </div>

                <strong
                  style={{
                    color: 'var(--text)',
                    fontSize: 21,
                  }}
                >
                  {item.weight}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 400,
                      marginLeft: 4,
                    }}
                  >
                    g
                  </span>
                </strong>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    color: 'var(--muted)',
                    fontSize: 12,
                    marginBottom: 6,
                  }}
                >
                  <Utensils size={14} />
                  Calories
                </div>

                <strong
                  style={{
                    color: 'var(--text)',
                    fontSize: 21,
                  }}
                >
                  {item.calories}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 400,
                      marginLeft: 4,
                    }}
                  >
                    kcal
                  </span>
                </strong>
              </div>
            </div>

            {/* Nutrition footer */}
            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: 15,
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--muted)',
                fontSize: 12,
              }}
            >
              <span>Sugar: {item.sugar} g</span>
              <span>Sodium: {item.sodium} mg</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        style={{
          marginTop: 18,
          padding: '20px 24px',
          borderRadius: 18,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: 12,
              margin: '0 0 6px',
            }}
          >
            Total Lunchbox Weight
          </p>
          <strong
            style={{
              color: 'var(--text)',
              fontSize: 24,
            }}
          >
            {totalWeight} g
          </strong>
        </div>

        <div>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: 12,
              margin: '0 0 6px',
            }}
          >
            Total Meal Calories
          </p>
          <strong
            style={{
              color: 'var(--text)',
              fontSize: 24,
            }}
          >
            {totalCalories} kcal
          </strong>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            color: 'var(--primary)',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          View Lunchbox
          <ArrowUpRight size={17} />
        </div>
      </motion.div>

      <p
        style={{
          marginTop: 12,
          color: 'var(--muted)',
          fontSize: 12,
        }}
      >
        Preview data only. Food weights and nutrition values
        will be connected to your smart lunchbox system later.
      </p>
    </section>
  )
}
