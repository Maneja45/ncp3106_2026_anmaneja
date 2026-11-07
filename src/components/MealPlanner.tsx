
import { useMemo, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Search,
  Flame,
  Droplets,
  Candy,
  Trash2,
  Utensils,
  Clock3,
  Check,
  Info,
} from 'lucide-react'

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'

type Food = {
  id: number
  name: string
  emoji: string
  calories: number
  sugar: number
  sodium: number
  serving: string
}

type PlannedMeal = {
  id: number
  date: string
  mealType: MealType
  food: Food
}

const foods: Food[] = [
  { id: 1, name: 'White Rice', emoji: '🍚', calories: 195, sugar: 0.2, sodium: 2, serving: '150 g' },
  { id: 2, name: 'Brown Rice', emoji: '🍚', calories: 185, sugar: 0.6, sodium: 6, serving: '150 g' },
  { id: 3, name: 'Chicken Adobo', emoji: '🍗', calories: 228, sugar: 1.8, sodium: 720, serving: '120 g' },
  { id: 4, name: 'Chicken Tinola', emoji: '🍲', calories: 153, sugar: 1.4, sodium: 504, serving: '180 g' },
  { id: 5, name: 'Sinigang', emoji: '🥣', calories: 150, sugar: 2.4, sodium: 700, serving: '200 g' },
  { id: 6, name: 'Steamed Broccoli', emoji: '🥦', calories: 28, sugar: 1.1, sodium: 26, serving: '80 g' },
  { id: 7, name: 'Boiled Egg', emoji: '🥚', calories: 85, sugar: 0.6, sodium: 68, serving: '55 g' },
  { id: 8, name: 'Banana', emoji: '🍌', calories: 89, sugar: 12.2, sodium: 1, serving: '100 g' },
  { id: 9, name: 'Oatmeal', emoji: '🥣', calories: 150, sugar: 1, sodium: 5, serving: '1 bowl' },
  { id: 10, name: 'Grilled Fish', emoji: '🐟', calories: 165, sugar: 0, sodium: 90, serving: '120 g' },
  { id: 11, name: 'Fresh Mango', emoji: '🥭', calories: 99, sugar: 22.5, sodium: 2, serving: '165 g' },
  { id: 12, name: 'Vegetable Salad', emoji: '🥗', calories: 75, sugar: 4, sodium: 45, serving: '1 bowl' },
]

const mealTypes: MealType[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
]

const mealIcons: Record<MealType, string> = {
  Breakfast: '🌤️',
  Lunch: '☀️',
  Dinner: '🌙',
  Snacks: '🍎',
}

const card: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 17,
  padding: 16,
  minWidth: 0,
}

const button: CSSProperties = {
  background: 'var(--surface)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '9px 12px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  transition: 'all 0.2s ease',
}

const muted: CSSProperties = {
  color: 'var(--muted)',
  fontSize: 11,
  lineHeight: 1.5,
}

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function startOfWeek(date: Date) {
  const result = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )
  result.setDate(result.getDate() - result.getDay())
  return result
}

function formatNumber(value: number, decimals = 0) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  })
}

const today = new Date()
const initialDate = dateKey(today)

const initialMeals: PlannedMeal[] = [
  {
    id: 1,
    date: initialDate,
    mealType: 'Breakfast',
    food: foods[8],
  },
  {
    id: 2,
    date: initialDate,
    mealType: 'Lunch',
    food: foods[0],
  },
  {
    id: 3,
    date: initialDate,
    mealType: 'Lunch',
    food: foods[2],
  },
  {
    id: 4,
    date: initialDate,
    mealType: 'Lunch',
    food: foods[5],
  },
]

export default function MealPlanner() {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [plannedMeals, setPlannedMeals] =
    useState<PlannedMeal[]>(initialMeals)

  const [showFoodModal, setShowFoodModal] = useState(false)
  const [selectedMealType, setSelectedMealType] =
    useState<MealType>('Lunch')

  const [search, setSearch] = useState('')
  const [notification, setNotification] = useState('')

  const selectedDateObject = new Date(`${selectedDate}T12:00:00`)
  const weekStart = startOfWeek(selectedDateObject)

  const weekDays = Array.from(
    { length: 7 },
    (_, index) => addDays(weekStart, index)
  )

  const dailyMeals = plannedMeals.filter(
    meal => meal.date === selectedDate
  )

  const totals = dailyMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.food.calories,
      sugar: acc.sugar + meal.food.sugar,
      sodium: acc.sodium + meal.food.sodium,
    }),
    { calories: 0, sugar: 0, sodium: 0 }
  )

  const filteredFoods = useMemo(
    () =>
      foods.filter(food =>
        food.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  )

  const openAddModal = (type: MealType) => {
    setSelectedMealType(type)
    setSearch('')
    setShowFoodModal(true)
  }

  const addFood = (food: Food) => {
    setPlannedMeals(previous => [
      ...previous,
      {
        id: Date.now() + Math.random(),
        date: selectedDate,
        mealType: selectedMealType,
        food,
      },
    ])

    setShowFoodModal(false)
    setNotification(`${food.name} added to your meal plan.`)
  }

  const removeFood = (id: number) => {
    setPlannedMeals(previous =>
      previous.filter(meal => meal.id !== id)
    )
    setNotification('Food removed from your meal plan.')
  }

  const changeWeek = (direction: number) => {
    const next = addDays(selectedDateObject, direction * 7)
    setSelectedDate(dateKey(next))
  }

  const selectedDateLabel = selectedDateObject.toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  )


return (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    style={{
      width: '100%',
      maxWidth: 1500,
      margin: '0 auto',
      paddingTop: 26,
      color: 'var(--text)',
      boxSizing: 'border-box',
    }}
  >

      <style>{`
        .planner-delete-button {
          transition:
            background-color 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .planner-delete-button:hover {
          background: #FDE8E7 !important;
          color: #C0392B !important;
          border-color: #E57373 !important;
          transform: translateY(-1px);
        }

        .planner-food-option:hover {
          border-color: var(--primary) !important;
          color: var(--primary) !important;
        }

        .planner-delete-button:focus-visible,
        .planner-food-option:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }

        @media (min-width: 1100px) {
          .planner-meal-grid {
            grid-template-columns:
              repeat(4, minmax(0, 1fr)) !important;
          }
        }

        @media (min-width: 650px) and (max-width: 1099px) {
          .planner-meal-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 649px) {
          .planner-meal-grid {
            grid-template-columns: 1fr !important;
          }

          .planner-week-grid {
            gap: 4px !important;
          }

          .planner-week-day {
            padding: 8px 2px !important;
          }
        }
      `}</style>

      {/* PAGE HEADING */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 13,
        }}
      >
        <div>
          <p
            style={{
              color: 'var(--primary)',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.2,
              margin: '0 0 5px',
            }}
          >
            PLAN AHEAD, EAT BETTER
          </p>

          <h2
            style={{
              fontSize: 24,
              margin: '0 0 5px',
            }}
          >
            A little planning goes a long way.
          </h2>

          <p style={{ ...muted, fontSize: 12, margin: 0 }}>
            Organize your meals and preview your daily nutrition.
          </p>
        </div>

        <span
          style={{
            ...button,
            borderRadius: 25,
            cursor: 'default',
            color: 'var(--muted)',
          }}
        >
          <CalendarDays size={14} />
          Demo Meal Planner
        </span>
      </div>

      {/* NUTRITION SUMMARY */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(min(100%, 175px), 1fr))',
          gap: 11,
          marginBottom: 12,
        }}
      >
        {[
          {
            label: 'Planned Foods',
            value: dailyMeals.length,
            unit: 'items',
            icon: Utensils,
          },
          {
            label: 'Planned Calories',
            value: formatNumber(totals.calories),
            unit: 'kcal',
            icon: Flame,
          },
          {
            label: 'Planned Sugar',
            value: formatNumber(totals.sugar, 1),
            unit: 'g',
            icon: Candy,
          },
          {
            label: 'Planned Sodium',
            value: formatNumber(totals.sodium),
            unit: 'mg',
            icon: Droplets,
          },
        ].map(item => {
          const Icon = item.icon

          return (
            <div
              key={item.label}
              style={{
                ...card,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
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

                <Icon size={16} color="var(--primary)" />
              </div>

              <strong
                style={{
                  fontSize: 24,
                  letterSpacing: '-0.4px',
                }}
              >
                {item.value}
              </strong>

              <span
                style={{
                  ...muted,
                  marginLeft: 5,
                }}
              >
                {item.unit}
              </span>
            </div>
          )
        })}
      </div>

      {/* WEEKLY CALENDAR */}
      <section
        style={{
          ...card,
          padding: '14px 17px',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div>
            <h3
              style={{
                margin: '0 0 3px',
                fontSize: 16,
              }}
            >
              Weekly Meal Calendar
            </h3>

            <p style={{ ...muted, margin: 0 }}>
              Choose a day to organize your meals.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 7 }}>
            <button
              type="button"
              onClick={() => changeWeek(-1)}
              style={{ ...button, padding: 8 }}
              aria-label="Previous week"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedDate(dateKey(new Date()))
              }
              style={button}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => changeWeek(1)}
              style={{ ...button, padding: 8 }}
              aria-label="Next week"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          className="planner-week-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: 8,
          }}
        >
          {weekDays.map(date => {
            const key = dateKey(date)
            const active = key === selectedDate
            const isToday = key === dateKey(new Date())

            const count = plannedMeals.filter(
              meal => meal.date === key
            ).length

            return (
              <button
                className="planner-week-day"
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                style={{
                  border: active
                    ? '1px solid #45634D'
                    : '1px solid var(--border)',
                  background: active
                    ? '#45634D'
                    : 'var(--bg)',
                  color: active
                    ? '#FFFFFF'
                    : 'var(--text)',
                  borderRadius: 12,
                  padding: '10px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.2s ease',
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    opacity: 0.85,
                  }}
                >
                  {date.toLocaleDateString('en-US', {
                    weekday: 'short',
                  })}
                </span>

                <strong style={{ fontSize: 19 }}>
                  {date.getDate()}
                </strong>

                <span
                  style={{
                    fontSize: 10,
                    opacity: 0.85,
                    textAlign: 'center',
                  }}
                >
                  {count > 0
                    ? `${count} planned`
                    : isToday
                    ? 'Today'
                    : '—'}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* DAILY MEAL PLAN */}
      <section
        style={{
          ...card,
          padding: '16px 18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 13,
          }}
        >
          <div>
            <h3
              style={{
                margin: '0 0 4px',
                fontSize: 18,
              }}
            >
              Your Daily Meal Plan
            </h3>

            <p style={{ ...muted, margin: 0 }}>
              <Clock3
                size={13}
                style={{
                  verticalAlign: 'middle',
                  marginRight: 6,
                }}
              />
              {selectedDateLabel}
            </p>
          </div>
        </div>

        <div
          className="planner-meal-grid"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
            gap: 13,
          }}
        >
          {mealTypes.map(type => {
            const items = dailyMeals.filter(
              meal => meal.mealType === type
            )

            return (
              <div
                key={type}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 16,
                  minHeight: 235,
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              >
                {/* MEAL CATEGORY */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 23 }}>
                    {mealIcons[type]}
                  </span>

                  <div>
                    <strong style={{ fontSize: 14 }}>
                      {type}
                    </strong>

                    <p
                      style={{
                        ...muted,
                        margin: '3px 0 0',
                      }}
                    >
                      {items.length} planned items
                    </p>
                  </div>
                </div>

                {/* PLANNED FOODS */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {items.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '15px 6px',
                        color: 'var(--muted)',
                        margin: 'auto 0',
                      }}
                    >
                      <Utensils
                        size={23}
                        style={{ marginBottom: 7 }}
                      />

                      <p
                        style={{
                          ...muted,
                          fontSize: 12,
                          margin: 0,
                        }}
                      >
                        No foods planned yet.
                      </p>
                    </div>
                  ) : (
                    items.map(meal => (
                      <motion.div
                        key={meal.id}
                        initial={{
                          opacity: 0,
                          scale: 0.97,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 11,
                          padding: '11px 12px',
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 23,
                            flexShrink: 0,
                          }}
                        >
                          {meal.food.emoji}
                        </span>

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <strong
                            style={{
                              display: 'block',
                              fontSize: 12,
                              marginBottom: 4,
                            }}
                          >
                            {meal.food.name}
                          </strong>

                          <span
                            style={{
                              ...muted,
                              fontSize: 11,
                            }}
                          >
                            {meal.food.calories} kcal ·{' '}
                            {meal.food.serving}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="planner-delete-button"
                          title="Remove food"
                          aria-label={`Remove ${meal.food.name}`}
                          onClick={() => removeFood(meal.id)}
                          style={{
                            ...button,
                            padding: 7,
                            flexShrink: 0,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* ADD FOOD BUTTON */}
                <button
                  type="button"
                  onClick={() => openAddModal(type)}
                  style={{
                    ...button,
                    marginTop: 12,
                    width: '100%',
                    padding: '10px 12px',
                    borderStyle: 'dashed',
                    color: 'var(--primary)',
                  }}
                >
                  <Plus size={15} />
                  Add Food
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* DEMO NOTICE */}
      <p
        style={{
          ...muted,
          margin: '9px 0 0',
          fontSize: 11,
        }}
      >
        <Info
          size={12}
          style={{
            verticalAlign: 'middle',
            marginRight: 6,
          }}
        />
        Nutrition values are illustrative estimates per listed serving.
        Planned meals do not count as consumed meals.
        This demo does not yet save plans to a database.
      </p>

      {/* ADD FOOD MODAL */}
      <AnimatePresence>
        {showFoodModal && (
          <motion.div
            key="food-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFoodModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(20,32,25,0.55)',
              zIndex: 100,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Add planned food"
              initial={{
                opacity: 0,
                y: 20,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 12,
                scale: 0.97,
              }}
              onClick={event => event.stopPropagation()}
              style={{
                ...card,
                width: '100%',
                maxWidth: 530,
                maxHeight: '85vh',
                overflowY: 'auto',
                padding: 23,
                color: 'var(--text)',
                boxSizing: 'border-box',
                boxShadow: '0 25px 70px rgba(0,0,0,0.18)',
              }}
            >
              {/* MODAL HEADER */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 17,
                }}
              >
                <div>
                  <p
                    style={{
                      color: 'var(--primary)',
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 1.2,
                      margin: '0 0 6px',
                    }}
                  >
                    PLAN YOUR MEAL
                  </p>

                  <h2
                    style={{
                      margin: '0 0 5px',
                      fontSize: 21,
                    }}
                  >
                    Add to {selectedMealType}
                  </h2>

                  <p style={{ ...muted, margin: 0 }}>
                    Select a food for your planned meal.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setShowFoodModal(false)}
                  style={{
                    ...button,
                    padding: 8,
                  }}
                >
                  <X size={17} />
                </button>
              </div>

              {/* FOOD SEARCH */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '0 12px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 11,
                  marginBottom: 13,
                }}
              >
                <Search
                  size={16}
                  color="var(--muted)"
                />

                <input
                  type="search"
                  value={search}
                  onChange={event =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search foods..."
                  style={{
                    flex: 1,
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: 'var(--text)',
                    padding: '12px 0',
                    fontSize: 12,
                  }}
                />
              </div>

              {/* AVAILABLE FOODS */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {filteredFoods.length === 0 && (
                  <p
                    style={{
                      ...muted,
                      textAlign: 'center',
                      padding: 20,
                    }}
                  >
                    No matching foods found.
                  </p>
                )}

                {filteredFoods.map(food => (
                  <button
                    key={food.id}
                    type="button"
                    className="planner-food-option"
                    onClick={() => addFood(food)}
                    style={{
                      ...button,
                      width: '100%',
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      padding: 11,
                      background: 'var(--bg)',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>
                      {food.emoji}
                    </span>

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <strong
                        style={{
                          display: 'block',
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        {food.name}
                      </strong>

                      <span
                        style={{
                          fontSize: 11,
                          opacity: 0.75,
                        }}
                      >
                        {food.serving} · {food.calories} kcal ·{' '}
                        {food.sugar} g sugar · {food.sodium} mg sodium
                      </span>
                    </div>

                    <Plus size={16} />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification}
            role="status"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            style={{
              position: 'fixed',
              right: 24,
              bottom: 24,
              zIndex: 110,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#45634D',
              color: '#FFFFFF',
              padding: '12px 15px',
              borderRadius: 12,
              boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
              fontSize: 12,
              fontWeight: 650,
            }}
          >
            <Check size={16} />
            {notification}

            <button
              type="button"
              onClick={() => setNotification('')}
              aria-label="Dismiss notification"
              style={{
                background: 'transparent',
                border: 0,
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
