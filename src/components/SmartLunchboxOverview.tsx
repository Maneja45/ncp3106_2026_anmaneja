
import { motion } from 'motion/react'
import {
  Scale,
  Utensils,
  CheckCircle2,
  Wifi,
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
    <section className="sb-compact-lunchbox">
      <style>{`
        .sb-compact-lunchbox {
          width: 100%;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 9px;
          overflow: hidden;
          color: var(--text, #243e32);
        }

        .sb-compact-lunchbox * {
          box-sizing: border-box;
        }

        .sb-compact-lunchbox .sl-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .sb-compact-lunchbox .sl-top p {
          margin: 0;
          color: var(--muted, #84928a);
          font-size: 10px;
        }

        .sb-compact-lunchbox .sl-demo {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid var(--border, #e8eee8);
          background: var(--surface, #fff);
          color: var(--primary, #376b50);
          padding: 5px 8px;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 700;
          white-space: nowrap;
        }

        .sb-compact-lunchbox .sl-grid {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 9px;
        }

        .sb-compact-lunchbox .sl-card {
          min-width: 0;
          min-height: 0;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e8eee8);
          border-radius: 13px;
          padding: 9px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow: hidden;
        }

        .sb-compact-lunchbox .sl-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }

        .sb-compact-lunchbox .sl-number {
          color: var(--muted, #84928a);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.8px;
          white-space: nowrap;
        }

        .sb-compact-lunchbox .sl-illustration {
          display: grid;
          place-items: center;
          flex: 1;
          min-height: 25px;
          max-height: 65px;
          border-radius: 10px;
        }

        .sb-compact-lunchbox .sl-emoji {
          font-size: clamp(20px, 2.2vw, 30px);
          line-height: 1;
        }

        .sb-compact-lunchbox .sl-name {
          margin: 0;
          color: var(--text, #243e32);
          font-size: 11px;
          font-weight: 800;
          line-height: 1.2;
        }

        .sb-compact-lunchbox .sl-category {
          margin: 0;
          color: var(--muted, #84928a);
          font-size: 9px;
        }

        .sb-compact-lunchbox .sl-stats {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 6px;
          flex-shrink: 0;
        }

        .sb-compact-lunchbox .sl-stat-label {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--muted, #84928a);
          font-size: 8px;
          margin-bottom: 3px;
        }

        .sb-compact-lunchbox .sl-stat-value {
          font-size: 12px;
          font-weight: 800;
          color: var(--text, #243e32);
        }

        .sb-compact-lunchbox .sl-stat-value span {
          font-size: 8px;
          font-weight: 500;
        }

        .sb-compact-lunchbox .sl-nutrients {
          border-top: 1px solid var(--border, #e8eee8);
          padding-top: 5px;
          display: flex;
          justify-content: space-between;
          gap: 4px;
          color: var(--muted, #84928a);
          font-size: 8px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .sb-compact-lunchbox .sl-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          border-radius: 10px;
          background: #edf4ee;
          padding: 8px 10px;
          color: #294b38;
        }

        .sb-compact-lunchbox .sl-summary-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
        }

        .sb-compact-lunchbox .sl-summary-item strong {
          font-weight: 800;
          font-size: 11px;
        }

        @media (max-height: 800px) {
          .sb-compact-lunchbox {
            gap: 5px;
          }

          .sb-compact-lunchbox .sl-card {
            padding: 6px;
            gap: 4px;
          }

          .sb-compact-lunchbox .sl-illustration {
            max-height: 42px;
          }

          .sb-compact-lunchbox .sl-summary {
            padding: 5px 8px;
          }
        }

        @media (max-width: 760px) {
          .sb-compact-lunchbox .sl-top {
            display: none;
          }

          .sb-compact-lunchbox .sl-grid {
            gap: 4px;
          }

          .sb-compact-lunchbox .sl-card {
            padding: 4px;
            gap: 3px;
          }

          .sb-compact-lunchbox .sl-number,
          .sb-compact-lunchbox .sl-category,
          .sb-compact-lunchbox .sl-nutrients {
            display: none;
          }

          .sb-compact-lunchbox .sl-name {
            font-size: 9px;
          }

          .sb-compact-lunchbox .sl-stats {
            grid-template-columns: 1fr;
            gap: 2px;
          }

          .sb-compact-lunchbox .sl-summary {
            padding: 4px;
          }
        }
      `}</style>

      {/* DEMO STATUS */}
      <div className="sl-top">
        <p>Monitor your three food compartments.</p>

        <span className="sl-demo">
          <Wifi size={11} />
          Demo Mode
        </span>
      </div>

      {/* THREE COMPARTMENTS */}
      <div className="sl-grid">
        {compartments.map((item, index) => (
          <motion.div
            key={item.number}
            className="sl-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: index * 0.07,
            }}
            whileHover={{
              y: -2,
              borderColor: '#a8c5b1',
            }}
          >
            <div className="sl-card-head">
              <span className="sl-number">
                COMPARTMENT {item.number}
              </span>

              <CheckCircle2
                size={12}
                color="var(--primary, #376b50)"
              />
            </div>

            <div
              className="sl-illustration"
              style={{ background: item.color }}
            >
              <span
                className="sl-emoji"
                role="img"
                aria-label={item.name}
              >
                {item.emoji}
              </span>
            </div>

            <h3 className="sl-name">{item.name}</h3>
            <p className="sl-category">{item.category}</p>

            <div className="sl-stats">
              <div>
                <div className="sl-stat-label">
                  <Scale size={10} />
                  Weight
                </div>

                <strong className="sl-stat-value">
                  {item.weight}
                  <span> g</span>
                </strong>
              </div>

              <div>
                <div className="sl-stat-label">
                  <Utensils size={10} />
                  Calories
                </div>

                <strong className="sl-stat-value">
                  {item.calories}
                  <span> kcal</span>
                </strong>
              </div>
            </div>

            <div className="sl-nutrients">
              <span>Sugar: {item.sugar} g</span>
              <span>Sodium: {item.sodium} mg</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* COMPACT TOTALS */}
      <div className="sl-summary">
        <div className="sl-summary-item">
          <Scale size={12} />
          <span>Total Weight:</span>
          <strong>{totalWeight} g</strong>
        </div>

        <div className="sl-summary-item">
          <Utensils size={12} />
          <span>Total Calories:</span>
          <strong>{totalCalories} kcal</strong>
        </div>
      </div>
    </section>
  )
}
