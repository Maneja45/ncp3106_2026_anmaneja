
import { useMemo, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  CalendarDays,
  Check,
  ChevronDown,
  Droplets,
  Eye,
  Flame,
  History,
  Info,
  Pencil,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { type Meal, nutrition, dateOffset } from '../types/meals'

type Filter = 'All Meals' | 'Today' | 'This Week' | 'This Month'
type ModalMode = 'view' | 'edit' | 'delete'

const FONT = {
  heading: "Georgia, 'Times New Roman', serif",
  body: "'DM Sans', sans-serif",
  number: "'Manrope', sans-serif",
}

const card: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 18,
  padding: 16,
  minWidth: 0,
  fontFamily: FONT.body,
}

const muted: CSSProperties = {
  color: 'var(--muted)',
  fontSize: 11,
  lineHeight: 1.5,
  fontFamily: FONT.body,
}

const buttonBase: CSSProperties = {
  background: 'var(--surface)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '9px 12px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  fontSize: 11,
  fontWeight: 700,
  fontFamily: FONT.body,
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'var(--bg)',
  color: 'var(--text)',
  padding: 11,
  fontSize: 12,
  fontFamily: FONT.body,
}

const headingStyle: CSSProperties = {
  fontFamily: FONT.heading,
  fontWeight: 700,
  letterSpacing: '-0.5px',
  color: 'var(--text)',
}

const numberStyle: CSSProperties = {
  fontFamily: FONT.number,
  fontWeight: 800,
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--text)',
}

const eyebrowStyle: CSSProperties = {
  fontFamily: FONT.number,
  color: 'var(--primary)',
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.2,
}

function format(value: number, digits = 0) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
  })
}

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString(
    undefined,
    { month: 'short', day: 'numeric', year: 'numeric' }
  )
}

function matchesFilter(date: string, filter: Filter) {
  const now = new Date()
  const parsed = new Date(date + 'T12:00:00')

  if (filter === 'All Meals') return true
  if (filter === 'Today') return date === dateOffset(0)

  if (filter === 'This Week') {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )

    start.setDate(start.getDate() - start.getDay())

    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    )

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

  const hour24 =
    (hour % 12) + (period === 'PM' ? 12 : 0)

  return new Date(
    `${meal.date}T${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
  ).getTime()
}

type MealHistoryProps = {
  meals: Meal[]
  setMeals: Dispatch<SetStateAction<Meal[]>>
}

export default function MealHistory({ meals, setMeals }: MealHistoryProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All Meals')
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editFood, setEditFood] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editCompartment, setEditCompartment] = useState(1)
  const [message, setMessage] = useState('')

  const filteredMeals = useMemo(() => {
    return meals
      .filter(meal => matchesFilter(meal.date, filter))
      .filter(meal =>
        (meal.food + ' ' + meal.compartment)
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) =>
        mealTimestamp(b) - mealTimestamp(a) || b.id - a.id
      )
  }, [meals, search, filter])

  // Preserve the five-record display limit.
  const visibleMeals = filteredMeals.slice(0, 5)

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

  const selectedMeal = meals.find(
    meal => meal.id === selectedId
  )

  function openModal(meal: Meal, mode: ModalMode) {
    setSelectedId(meal.id)
    setModalMode(mode)
    setEditFood(meal.food)
    setEditDate(meal.date)
    setEditCompartment(meal.compartment)
  }

  function closeModal() {
    setSelectedId(null)
    setModalMode(null)
  }

  function saveEdit() {
    if (!selectedMeal || !editFood.trim() || !editDate) return

    setMeals(previous =>
      previous.map(meal =>
        meal.id === selectedMeal.id
          ? {
              ...meal,
              food: editFood.trim(),
              date: editDate,
              compartment: editCompartment,
            }
          : meal
      )
    )

    setMessage('Meal updated in demo history.')
    closeModal()
  }

  function deleteMeal() {
    if (selectedId === null) return

    setMeals(previous =>
      previous.filter(meal => meal.id !== selectedId)
    )

    setMessage('Meal deleted from demo history.')
    closeModal()
  }

  return (
    <motion.div
      className="sb-meal-history"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        color: 'var(--text)',
        width: '100%',
        maxWidth: 1600,
        margin: '0 auto',
        boxSizing: 'border-box',
        fontFamily: FONT.body,
      }}
    >
      {/* MEAL HISTORY TYPOGRAPHY AND ACTION STYLES */}
      <style>{`
        .sb-meal-history {
          font-family: 'DM Sans', sans-serif;
        }

        .sb-meal-history button,
        .sb-meal-history input,
        .sb-meal-history select {
          font-family: 'DM Sans', sans-serif;
        }

        .sb-meal-history input::placeholder {
          font-family: 'DM Sans', sans-serif;
          color: var(--muted);
        }

        .sb-meal-history .meal-action-btn {
          --hover-text: #45634D;
          --hover-bg: #E6EFE5;
          --hover-border: #B8CEB7;

          appearance: none;
          width: 36px;
          height: 36px;
          padding: 0;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition:
            background-color 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
        }

        .sb-meal-history .meal-action-btn.view {
          --hover-text: #45634D;
          --hover-bg: #E6EFE5;
          --hover-border: #B8CEB7;
        }

        .sb-meal-history .meal-action-btn.edit {
          --hover-text: #A47736;
          --hover-bg: #FBF0DC;
          --hover-border: #E9D0A2;
        }

        .sb-meal-history .meal-action-btn.delete {
          --hover-text: #C94B4B;
          --hover-bg: #FDE9E9;
          --hover-border: #F0B8B8;
        }

        :is(
          [data-theme="dark"],
          [data-mode="dark"],
          .dark,
          .dark-mode,
          .theme-dark
        ) .sb-meal-history .meal-action-btn.view {
          --hover-text: #B7D5B5;
          --hover-bg: #304B3B;
          --hover-border: #567A60;
        }

        :is(
          [data-theme="dark"],
          [data-mode="dark"],
          .dark,
          .dark-mode,
          .theme-dark
        ) .sb-meal-history .meal-action-btn.edit {
          --hover-text: #F0CF8D;
          --hover-bg: #493C29;
          --hover-border: #80663B;
        }

        :is(
          [data-theme="dark"],
          [data-mode="dark"],
          .dark,
          .dark-mode,
          .theme-dark
        ) .sb-meal-history .meal-action-btn.delete {
          --hover-text: #FFB4AF;
          --hover-bg: #4C2D30;
          --hover-border: #98535A;
        }

        .sb-meal-history .meal-action-btn:hover {
          background: var(--hover-bg);
          border-color: var(--hover-border);
          color: var(--hover-text);
          transform: translateY(-2px) scale(1.06);
        }

        .sb-meal-history .meal-action-btn:active {
          transform: scale(0.95);
        }

        .sb-meal-history .meal-action-btn:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: reduce) {
          .sb-meal-history .meal-action-btn {
            transition: none;
          }

          .sb-meal-history .meal-action-btn:hover,
          .sb-meal-history .meal-action-btn:active {
            transform: none;
          }
        }
      `}</style>

      {/* PAGE HEADING */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 15,
        }}
      >
        <div>
          <p
            style={{
              ...eyebrowStyle,
              margin: '0 0 5px',
            }}
          >
            YOUR NUTRITION JOURNEY
          </p>

          <h2
            style={{
              ...headingStyle,
              fontSize: 26,
              lineHeight: 1.2,
              margin: '0 0 5px',
            }}
          >
            Every meal tells a story.
          </h2>

          <p style={{ ...muted, margin: 0 }}>
            Review your food records and track your nutrition.
          </p>
        </div>

        <span
          style={{
            ...buttonBase,
            borderRadius: 25,
            color: 'var(--muted)',
            cursor: 'default',
          }}
        >
          <History size={14} />
          Demo History
        </span>
      </div>

      {/* NUTRITION SUMMARY */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(min(100%, 175px), 1fr))',
          gap: 12,
          marginBottom: 14,
        }}
      >
        {[
          {
            label: 'Food Records',
            value: format(visibleMeals.length),
            unit: 'entries',
            icon: UtensilsCrossed,
          },
          {
            label: 'Total Calories',
            value: format(totals.calories),
            unit: 'kcal',
            icon: Flame,
          },
          {
            label: 'Total Sugar',
            value: format(totals.sugar, 1),
            unit: 'g',
            icon: Droplets,
          },
          {
            label: 'Total Sodium',
            value: format(totals.sodium),
            unit: 'mg',
            icon: Info,
          },
        ].map(item => {
          const Icon = item.icon

          return (
            <div key={item.label} style={card}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 9,
                }}
              >
                <span
                  style={{
                    ...muted,
                    fontWeight: 700,
                  }}
                >
                  {item.label}
                </span>

                <Icon
                  size={16}
                  color="var(--primary)"
                />
              </div>

              <strong
                style={{
                  ...numberStyle,
                  fontSize: 24,
                  letterSpacing: '-0.5px',
                }}
              >
                {item.value}
              </strong>

              <span
                style={{
                  ...muted,
                  fontFamily: FONT.number,
                  marginLeft: 5,
                }}
              >
                {item.unit}
              </span>
            </div>
          )
        })}
      </div>

      {/* SEARCH AND FILTER */}
      <div
        style={{
          ...card,
          padding: 12,
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            flex: '1 1 220px',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '0 12px',
            background: 'var(--bg)',
          }}
        >
          <Search size={16} color="var(--muted)" />

          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search food or compartment..."
            style={{
              width: '100%',
              border: 0,
              outline: 'none',
              background: 'transparent',
              color: 'var(--text)',
              padding: '11px 0',
              fontSize: 12,
              fontFamily: FONT.body,
            }}
          />
        </div>

        <div
          style={{
            position: 'relative',
            flex: '0 1 175px',
          }}
        >
          <CalendarDays
            size={15}
            color="var(--muted)"
            style={{
              position: 'absolute',
              left: 11,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />

          <select
            value={filter}
            onChange={event =>
              setFilter(event.target.value as Filter)
            }
            style={{
              ...buttonBase,
              width: '100%',
              appearance: 'none',
              textAlign: 'left',
              paddingLeft: 35,
              paddingRight: 28,
            }}
          >
            <option>All Meals</option>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>

          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: 11,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* RECORDED FOODS */}
      <section
        style={{
          ...card,
          padding: '15px 18px',
        }}
      >
        <h3
          style={{
            ...headingStyle,
            fontSize: 19,
            margin: '0 0 10px',
          }}
        >
          Recorded Foods
        </h3>

        {visibleMeals.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '28px 12px',
              color: 'var(--muted)',
            }}
          >
            <UtensilsCrossed size={28} />

            <h3
              style={{
                ...headingStyle,
                fontSize: 19,
                margin: '8px 0 5px',
              }}
            >
              No meals found
            </h3>

            <p style={{ ...muted, margin: 0 }}>
              Try changing your search or date filter.
            </p>
          </div>
        ) : (
          <div>
            {visibleMeals.map((meal, index) => {
              const values = nutrition(meal)

              return (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(index * 0.035, 0.2),
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 0',
                    borderBottom:
                      index === visibleMeals.length - 1
                        ? 'none'
                        : '1px solid var(--border)',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* FOOD EMOJI */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'var(--bg)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 25,
                      flexShrink: 0,
                    }}
                  >
                    {meal.emoji}
                  </div>

                  {/* FOOD INFORMATION */}
                  <div
                    style={{
                      flex: '1 1 160px',
                      minWidth: 0,
                    }}
                  >
                    <strong
                      style={{
                        display: 'block',
                        fontFamily: FONT.body,
                        fontSize: 13,
                        fontWeight: 700,
                        marginBottom: 3,
                      }}
                    >
                      {meal.food}
                    </strong>

                    <p
                      style={{
                        ...muted,
                        fontFamily: FONT.number,
                        margin: 0,
                      }}
                    >
                      {formatDate(meal.date)} · {meal.time}
                    </p>

                    <p
                      style={{
                        ...muted,
                        margin: '2px 0 0',
                      }}
                    >
                      Compartment {meal.compartment} ·{' '}
                      <span
                        style={{
                          fontFamily: FONT.number,
                        }}
                      >
                        {meal.weight} g
                      </span>
                    </p>
                  </div>

                  {/* NUTRITION */}
                  <div
                    style={{
                      textAlign: 'right',
                      marginRight: 6,
                    }}
                  >
                    <strong
                      style={{
                        ...numberStyle,
                        display: 'block',
                        fontSize: 14,
                      }}
                    >
                      {format(values.calories)} kcal
                    </strong>

                    <span
                      style={{
                        ...muted,
                        fontFamily: FONT.number,
                      }}
                    >
                      {format(values.sugar, 1)} g sugar
                    </span>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {[
                      {
                        icon: Eye,
                        title: 'View details',
                        mode: 'view' as const,
                      },
                      {
                        icon: Pencil,
                        title: 'Edit record',
                        mode: 'edit' as const,
                      },
                      {
                        icon: Trash2,
                        title: 'Delete record',
                        mode: 'delete' as const,
                      },
                    ].map(action => {
                      const Icon = action.icon

                      return (
                        <button
                          key={action.mode}
                          type="button"
                          className={`meal-action-btn ${action.mode}`}
                          title={action.title}
                          aria-label={`${action.title}: ${meal.food}`}
                          onClick={() =>
                            openModal(meal, action.mode)
                          }
                        >
                          <Icon size={16} strokeWidth={1.9} />
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

      {/* DEMO NOTICE */}
      <p
        style={{
          ...muted,
          margin: '10px 0 0',
        }}
      >
        <Info
          size={13}
          style={{
            verticalAlign: 'middle',
            marginRight: 6,
          }}
        />
        Preview data only. Device records and database storage
        will be connected later.
      </p>

      {/* NOTIFICATION */}
      <AnimatePresence>
        {message && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            style={{
              position: 'fixed',
              right: 24,
              bottom: 24,
              zIndex: 80,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '13px 16px',
              borderRadius: 12,
              background: '#45634D',
              color: '#FFFFFF',
              fontFamily: FONT.body,
              fontSize: 12,
            }}
          >
            <Check size={16} />
            {message}

            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setMessage('')}
              style={{
                border: 0,
                background: 'transparent',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW / EDIT / DELETE MODAL */}
      <AnimatePresence>
        {modalMode && selectedMeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(20,32,25,0.55)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={modalMode + ' meal'}
              initial={{
                opacity: 0,
                y: 15,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.98,
              }}
              onClick={event => event.stopPropagation()}
              style={{
                ...card,
                width: '100%',
                maxWidth: 460,
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: 24,
                boxSizing: 'border-box',
                boxShadow: '0 25px 70px rgba(0,0,0,0.18)',
                fontFamily: FONT.body,
              }}
            >
              {/* MODAL HEADER */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <div>
                  <p
                    style={{
                      ...eyebrowStyle,
                      margin: '0 0 6px',
                    }}
                  >
                    MEAL HISTORY
                  </p>

                  <h2
                    style={{
                      ...headingStyle,
                      fontSize: 23,
                      margin: 0,
                    }}
                  >
                    {modalMode === 'view'
                      ? 'Meal Details'
                      : modalMode === 'edit'
                        ? 'Edit Meal'
                        : 'Delete Meal?'}
                  </h2>
                </div>

                <button
                  type="button"
                  aria-label="Close modal"
                  style={{
                    ...buttonBase,
                    padding: 8,
                  }}
                  onClick={closeModal}
                >
                  <X size={17} />
                </button>
              </div>

              {/* DELETE MODAL */}
              {modalMode === 'delete' ? (
                <>
                  <p
                    style={{
                      color: 'var(--muted)',
                      fontFamily: FONT.body,
                      fontSize: 13,
                      lineHeight: 1.7,
                    }}
                  >
                    Are you sure you want to delete{' '}
                    <strong
                      style={{
                        color: 'var(--text)',
                      }}
                    >
                      {selectedMeal.food}
                    </strong>{' '}
                    from your demo meal history?
                  </p>

                  <p style={muted}>
                    This action cannot be undone within this session.
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      marginTop: 20,
                    }}
                  >
                    <button
                      type="button"
                      onClick={closeModal}
                      style={{
                        ...buttonBase,
                        flex: 1,
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={deleteMeal}
                      style={{
                        ...buttonBase,
                        flex: 1,
                        background: '#A34C47',
                        borderColor: '#A34C47',
                        color: '#FFFFFF',
                      }}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </>
              ) : modalMode === 'edit' ? (
                /* EDIT MODAL */
                <>
                  <label
                    htmlFor="edit-food"
                    style={{
                      display: 'block',
                      fontFamily: FONT.body,
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 7,
                    }}
                  >
                    Food Name
                  </label>

                  <input
                    id="edit-food"
                    value={editFood}
                    onChange={event =>
                      setEditFood(event.target.value)
                    }
                    style={{
                      ...inputStyle,
                      marginBottom: 15,
                    }}
                  />

                  <label
                    htmlFor="edit-date"
                    style={{
                      display: 'block',
                      fontFamily: FONT.body,
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 7,
                    }}
                  >
                    Date
                  </label>

                  <input
                    id="edit-date"
                    type="date"
                    value={editDate}
                    onChange={event =>
                      setEditDate(event.target.value)
                    }
                    style={{
                      ...inputStyle,
                      marginBottom: 15,
                    }}
                  />

                  <label
                    htmlFor="edit-compartment"
                    style={{
                      display: 'block',
                      fontFamily: FONT.body,
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 7,
                    }}
                  >
                    Compartment
                  </label>

                  <select
                    id="edit-compartment"
                    value={editCompartment}
                    onChange={event =>
                      setEditCompartment(
                        Number(event.target.value)
                      )
                    }
                    style={inputStyle}
                  >
                    <option value={1}>Compartment 1</option>
                    <option value={2}>Compartment 2</option>
                    <option value={3}>Compartment 3</option>
                  </select>

                  <p
                    style={{
                      ...muted,
                      marginTop: 12,
                    }}
                  >
                    Weight and nutrition values remain unchanged.
                    Actual weight will come from the sensor later.
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      marginTop: 20,
                    }}
                  >
                    <button
                      type="button"
                      onClick={closeModal}
                      style={{
                        ...buttonBase,
                        flex: 1,
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={!editFood.trim() || !editDate}
                      style={{
                        ...buttonBase,
                        flex: 1,
                        background: '#45634D',
                        borderColor: '#45634D',
                        color: '#FFFFFF',
                        opacity:
                          editFood.trim() && editDate
                            ? 1
                            : 0.5,
                      }}
                    >
                      <Check size={15} />
                      Save Changes
                    </button>
                  </div>
                </>
              ) : (
                /* VIEW DETAILS MODAL */
                <>
                  <div
                    style={{
                      background: 'var(--bg)',
                      borderRadius: 14,
                      padding: 17,
                      textAlign: 'center',
                      marginBottom: 15,
                    }}
                  >
                    <span style={{ fontSize: 40 }}>
                      {selectedMeal.emoji}
                    </span>

                    <h3
                      style={{
                        ...headingStyle,
                        fontSize: 20,
                        margin: '8px 0 4px',
                      }}
                    >
                      {selectedMeal.food}
                    </h3>

                    <p
                      style={{
                        ...muted,
                        fontFamily: FONT.number,
                        margin: 0,
                      }}
                    >
                      {formatDate(selectedMeal.date)} ·{' '}
                      {selectedMeal.time}
                    </p>
                  </div>

                  {[
                    [
                      'Compartment',
                      String(selectedMeal.compartment),
                    ],
                    [
                      'Measured Weight (Demo)',
                      selectedMeal.weight + ' g',
                    ],
                    [
                      'Calories',
                      format(
                        nutrition(selectedMeal).calories
                      ) + ' kcal',
                    ],
                    [
                      'Sugar',
                      format(
                        nutrition(selectedMeal).sugar,
                        1
                      ) + ' g',
                    ],
                    [
                      'Sodium',
                      format(
                        nutrition(selectedMeal).sodium
                      ) + ' mg',
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '10px 0',
                        borderBottom:
                          '1px solid var(--border)',
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--muted)',
                          fontFamily: FONT.body,
                        }}
                      >
                        {label}
                      </span>

                      <strong
                        style={{
                          ...numberStyle,
                          fontSize: 12,
                        }}
                      >
                        {value}
                      </strong>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      ...buttonBase,
                      width: '100%',
                      marginTop: 18,
                    }}
                  >
                    Close Details
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
