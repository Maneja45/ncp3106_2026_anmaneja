
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  BatteryFull, Check, CheckCircle2, CircleHelp, Cpu,
  Droplets, Info, Plus, RefreshCcw, Scale, Search,
  Signal, UtensilsCrossed, Wifi, X,
} from 'lucide-react'

type Food = {
  id: string
  name: string
  category: string
  calories: number
  sugar: number
  sodium: number
  emoji: string
}

type Compartment = {
  id: number
  food: Food | null
  weight: number
}

const foods: Food[] = [
  { id: 'rice', name: 'White Rice', category: 'Rice & Grains', calories: 130, sugar: 0.1, sodium: 1, emoji: '🍚' },
  { id: 'brown-rice', name: 'Brown Rice', category: 'Rice & Grains', calories: 123, sugar: 0.4, sodium: 4, emoji: '🍚' },
  { id: 'adobo', name: 'Chicken Adobo', category: 'Filipino Dishes', calories: 190, sugar: 1.5, sodium: 600, emoji: '🍗' },
  { id: 'tinola', name: 'Chicken Tinola', category: 'Filipino Dishes', calories: 85, sugar: 0.8, sodium: 280, emoji: '🍲' },
  { id: 'sinigang', name: 'Sinigang', category: 'Filipino Dishes', calories: 75, sugar: 1.2, sodium: 350, emoji: '🥣' },
  { id: 'egg', name: 'Boiled Egg', category: 'Protein', calories: 155, sugar: 1.1, sodium: 124, emoji: '🥚' },
  { id: 'broccoli', name: 'Steamed Broccoli', category: 'Vegetables', calories: 35, sugar: 1.4, sodium: 33, emoji: '🥦' },
  { id: 'carrots', name: 'Steamed Carrots', category: 'Vegetables', calories: 35, sugar: 3.5, sodium: 58, emoji: '🥕' },
  { id: 'banana', name: 'Banana', category: 'Fruits', calories: 89, sugar: 12.2, sodium: 1, emoji: '🍌' },
  { id: 'apple', name: 'Apple', category: 'Fruits', calories: 52, sugar: 10.4, sodium: 1, emoji: '🍎' },
]

const emptyCompartments = (): Compartment[] => [
  { id: 1, food: null, weight: 0 },
  { id: 2, food: null, weight: 0 },
  { id: 3, food: null, weight: 0 },
]

const nutritionFor = (food: Food, weight: number) => ({
  calories: food.calories * weight / 100,
  sugar: food.sugar * weight / 100,
  sodium: food.sodium * weight / 100,
})

const fmt = (value: number, decimals = 0) =>
  value.toLocaleString(undefined, { maximumFractionDigits: decimals })

export default function SmartLunchbox() {
  const [compartments, setCompartments] = useState<Compartment[]>(emptyCompartments)
  const [selectedCompartment, setSelectedCompartment] = useState<number | null>(null)
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [search, setSearch] = useState('')
  const [demoWeight, setDemoWeight] = useState(150)
  const [demoConnected, setDemoConnected] = useState(false)
  const [notification, setNotification] = useState('')

  const filledCount = compartments.filter(c => c.food !== null).length

  const totals = compartments.reduce(
    (sum, c) => {
      if (!c.food) return sum
      const n = nutritionFor(c.food, c.weight)
      return {
        calories: sum.calories + n.calories,
        sugar: sum.sugar + n.sugar,
        sodium: sum.sodium + n.sodium,
        weight: sum.weight + c.weight,
      }
    },
    { calories: 0, sugar: 0, sodium: 0, weight: 0 }
  )

  const openPicker = (id: number) => {
    const current = compartments.find(c => c.id === id)
    setSelectedCompartment(id)
    setSelectedFood(current?.food ?? null)
    setDemoWeight(current?.weight || 150)
    setSearch('')
    setNotification('')
  }

  const closePicker = () => {
    setSelectedCompartment(null)
    setSelectedFood(null)
  }

  const saveFood = () => {
    if (selectedCompartment === null || !selectedFood) return

    setCompartments(previous => previous.map(c =>
      c.id === selectedCompartment
        ? { ...c, food: selectedFood, weight: demoWeight }
        : c
    ))

    closePicker()
    setNotification('Demo food selection saved successfully.')
  }

  const clearCompartment = (id: number) => {
    setCompartments(previous => previous.map(c =>
      c.id === id ? { ...c, food: null, weight: 0 } : c
    ))
    setNotification(`Compartment ${id} cleared.`)
  }

  const clearAll = () => {
    setCompartments(emptyCompartments())
    setNotification('Lunchbox preview cleared.')
  }

  const filteredFoods = foods.filter(food =>
    `${food.name} ${food.category}`.toLowerCase().includes(search.toLowerCase())
  )

  const selectedNutrition = selectedFood
    ? nutritionFor(selectedFood, demoWeight)
    : null

  const statuses = [
    { title: 'Connection', value: demoConnected ? 'Demo Online' : 'Offline', description: 'Connection preview', icon: Signal },
    { title: 'Battery', value: demoConnected ? '85%' : '—', description: 'Sample battery reading', icon: BatteryFull },
    { title: 'Weight Sensor', value: demoConnected ? 'Ready (Demo)' : 'Unavailable', description: 'HX711 + load cell', icon: Scale },
    { title: 'Compartments', value: `${filledCount} / 3`, description: 'Foods selected', icon: UtensilsCrossed },
  ]

  return (
  <motion.div
  className="smart-page"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{
    duration: 0.28,
    ease: 'easeOut',
  }}
>
      <style>{`
        .smart-page, .smart-page * { box-sizing: border-box; }
        .smart-page {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          color: var(--text);
          display: flex;
          flex-direction: column;
          gap: 11px;
          min-width: 0;
        }
        .smart-page button { font-family: inherit; }
        .smart-header, .smart-device, .smart-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
          
          .smart-header {
          margin-top: 14px;
          } 

        .smart-eyebrow {
          color: var(--primary);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
          margin: 0 0 4px;
        }
        .smart-title {
          font-size: clamp(20px, 2vw, 25px);
          margin: 0 0 4px;
          line-height: 1.2;
        }
        .smart-muted {
          color: var(--muted);
          font-size: 11px;
          line-height: 1.4;
          margin: 0;
        }
        .smart-badge {
          padding: 8px 12px;
          border-radius: 30px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--muted);
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }
        .smart-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 17px;
          min-width: 0;
        }
        
         .smart-device {
         padding: 11px 15px;
         margin-top: 5px;
         }

        .smart-device-info {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }
        .smart-device-icon {
          width: 37px;
          height: 37px;
          flex-shrink: 0;
          border-radius: 12px;
          background: #E6EBDD;
          color: #45634D;
          display: grid;
          place-items: center;
        }
        .smart-device-title {
          font-size: 13px;
          font-weight: 750;
          margin: 0 0 3px;
        }
        .smart-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          padding: 9px 12px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: transform .2s, opacity .2s;
        }
        .smart-button:hover { transform: translateY(-1px); }
        .smart-button-primary {
          background: #45634D;
          color: white;
          border-color: #45634D;
        }
        .smart-status-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 11px;
        }
        .smart-status-card { padding: 11px 13px; }
        .smart-status-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 6px;
        }
        .smart-status-name {
          color: var(--muted);
          font-size: 11px;
          font-weight: 650;
        }
        .smart-status-value {
          font-size: 17px;
          font-weight: 800;
          margin-bottom: 3px;
        }

        /* BALANCED MAIN LAYOUT */
       .smart-main-grid {
       display: grid;
       grid-template-columns: 1.35fr 1fr;
       gap: 12px;
       margin-top: 18px;
       }

        .smart-panel {
          padding: 14px;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .smart-panel-title {
          font-size: 15px;
          font-weight: 750;
          margin: 0 0 4px;
        }
        .smart-panel-subtitle {
          font-size: 11px;
          color: var(--muted);
          margin: 0 0 11px;
        }

        /* CENTERED, PROPORTIONAL LUNCHBOX */
        .smart-lunchbox-stage {
          flex: 1;
          min-height: 205px;
          padding: 12px;
          background: #E9EBDD;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .smart-lunchbox-shell {
          width: 100%;
          max-width: 570px;
          height: 205px;
          padding: 9px;
          background: #A8B99C;
          border: 6px solid #81967A;
          border-radius: 22px;
          box-shadow: 0 9px 20px rgba(52,78,65,.12);
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          grid-template-rows: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .smart-compartment-button {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          min-width: 0;
          padding: 8px;
          border: 2px solid #D7DFCF;
          border-radius: 14px;
          background: #F8F5EB;
          color: #344E41;
          cursor: pointer;
        }
        .smart-compartment-number {
          position: absolute;
          top: 7px;
          left: 9px;
          font-size: 9px;
          font-weight: 800;
          opacity: .65;
        }
        .smart-compartment-emoji { font-size: 30px; line-height: 1.2; }
        .smart-compartment-name {
          font-size: 11px;
          font-weight: 800;
          text-align: center;
          overflow-wrap: anywhere;
        }
        .smart-compartment-weight { font-size: 10px; opacity: .7; }
        .smart-info-line {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          color: var(--muted);
          font-size: 10px;
          line-height: 1.4;
          margin-top: 9px;
        }

        /* NUTRITION PANEL */
        .smart-calorie-box {
          background: var(--bg);
          border-radius: 13px;
          padding: 12px;
          text-align: center;
          margin-bottom: 8px;
        }
        .smart-calorie-label {
          color: var(--muted);
          font-size: 10px;
          font-weight: 750;
          letter-spacing: .7px;
          margin: 0 0 3px;
        }
        .smart-calorie-value {
          font-size: clamp(27px, 3vw, 36px);
          font-weight: 850;
          color: var(--primary);
          letter-spacing: -1px;
          line-height: 1.2;
        }
        .smart-calorie-unit {
          font-size: 12px;
          font-weight: 600;
          margin-left: 5px;
        }
        .smart-nutrition-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 9px 1px;
          border-bottom: 1px solid var(--border);
        }
        .smart-nutrition-name {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted);
          font-size: 11px;
        }
        .smart-nutrition-value { font-size: 12px; font-weight: 750; }
        .smart-nutrition-footer {
          margin-top: auto;
          padding-top: 9px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

      /* COMPARTMENT DETAILS: SLIGHTLY LOWER AND ROOMIER */
        .smart-details-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 15px;
      }
        .smart-section-title {
          margin: 0;
          font-size: 15px;
          font-weight: 750;
        }
        .smart-details-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 11px;
        }
        .smart-detail-card { padding: 13px; min-width: 0; }
        .smart-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 7px;
          margin-bottom: 10px;
        }
        .smart-detail-name { font-size: 12px; font-weight: 750; }
        .smart-detail-badge {
          background: var(--bg);
          border-radius: 20px;
          padding: 4px 8px;
          color: var(--muted);
          font-size: 10px;
          font-weight: 700;
        }
        .smart-detail-food {
          background: var(--bg);
          border-radius: 12px;
          padding: 10px;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 4px;
          text-align: center;
          margin-bottom: 10px;
        }
        .smart-detail-emoji { font-size: 24px; line-height: 1.2; }
        .smart-detail-food-name { font-size: 11px; font-weight: 750; }
        .smart-detail-food-meta { color: var(--muted); font-size: 10px; }
        .smart-detail-actions { display: flex; gap: 7px; }
        .smart-detail-actions .smart-button {
          flex: 1;
          min-width: 0;
          padding: 8px;
          font-size: 10px;
        }
        .smart-help {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
        }
        .smart-help-title {
          font-size: 11px;
          font-weight: 750;
          margin: 0 0 3px;
        }
        .smart-help-text {
          color: var(--muted);
          font-size: 10px;
          line-height: 1.4;
          margin: 0;
        }

        /* FOOD SELECTION POPUP */
        .smart-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(20,32,25,.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .smart-modal {
          width: 100%;
          max-width: 560px;
          max-height: 90dvh;
          overflow-y: auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 22px;
          color: var(--text);
          box-shadow: 0 25px 80px rgba(0,0,0,.2);
        }
        .smart-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 15px;
        }
        .smart-modal-label {
          color: var(--primary);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          margin: 0 0 6px;
        }
        .smart-modal-title { font-size: 21px; margin: 0 0 6px; }
        .smart-sensor-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 13px;
          background: var(--bg);
          margin-bottom: 12px;
        }
        .smart-simulator {
          padding: 12px;
          border: 1px dashed var(--border);
          border-radius: 12px;
          margin-bottom: 13px;
        }
        .smart-search-box {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 12px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg);
          margin-bottom: 12px;
        }
        .smart-search-input {
          flex: 1;
          min-width: 0;
          padding: 12px 0;
          border: none;
          outline: none;
          background: transparent;
          color: var(--text);
          font-size: 12px;
        }
        .smart-food-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          max-height: 185px;
          overflow-y: auto;
          margin-bottom: 12px;
        }
        .smart-food-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          padding: 9px 11px;
          border: 1px solid var(--border);
          border-radius: 11px;
          background: var(--surface);
          color: var(--text);
          cursor: pointer;
        }
        .smart-food-option.selected {
          border: 2px solid #81967A;
          background: var(--bg);
        }
        .smart-selected-nutrition {
          background: var(--bg);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 13px;
        }
        .smart-modal-actions { display: flex; gap: 9px; }
        .smart-modal-actions .smart-button { flex: 1; }
        .smart-toast {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 110;
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 350px;
          padding: 13px 15px;
          border-radius: 13px;
          background: #45634D;
          color: white;
          box-shadow: 0 12px 35px rgba(0,0,0,.15);
          font-size: 12px;
          font-weight: 650;
        }

        /* COMPACT DESKTOP HEIGHT */
        @media (min-width: 1100px) and (max-height: 850px) {
          .smart-page { gap: 8px; }
          .smart-device { padding: 9px 13px; }
          .smart-status-card { padding: 9px 12px; }
          .smart-status-top { margin-bottom: 4px; }
          .smart-status-value { font-size: 16px; }
          .smart-panel { padding: 12px; }
          .smart-panel-subtitle { margin-bottom: 8px; }
          .smart-lunchbox-stage { min-height: 170px; padding: 9px; }
          .smart-lunchbox-shell { height: 170px; }
          .smart-calorie-box { padding: 9px; margin-bottom: 5px; }
          .smart-nutrition-row { padding: 7px 1px; }
          .smart-nutrition-footer { padding-top: 7px; gap: 5px; }
          .smart-details-section {  margin-top: 15px;}
          .smart-detail-card { padding: 10px; }
          .smart-detail-header { margin-bottom: 7px; }
          .smart-detail-food {
            min-height: 66px;
            padding: 7px;
            margin-bottom: 7px;
          }
          .smart-help { padding: 8px 12px; }
        }

        @media (max-width: 1099px) {
          .smart-status-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 750px) {
          .smart-main-grid { grid-template-columns: 1fr; }
          .smart-details-grid { grid-template-columns: 1fr; }
          .smart-device { flex-wrap: wrap; }
          .smart-badge { display: none; }
          .smart-lunchbox-stage { min-height: 220px; }
          .smart-lunchbox-shell { height: 220px; }
        }
        @media (max-width: 420px) {
          .smart-status-grid { gap: 8px; }
          .smart-status-card { padding: 10px; }
          .smart-status-value { font-size: 15px; }
          .smart-modal { padding: 15px; }
        }
      `}</style>

      {/* PAGE HEADER */}
      <header className="smart-header">
        <div>
          <p className="smart-eyebrow">YOUR SMART LUNCHBOX</p>
          <h2 className="smart-title">Your lunch, at a glance.</h2>
          <p className="smart-muted">
            Explore your three food compartments and preview their nutrition.
          </p>
        </div>
        <span className="smart-badge">Frontend Preview</span>
      </header>

      {/* DEVICE CONNECTION */}
      <section className="smart-card smart-device">
        <div className="smart-device-info">
          <div className="smart-device-icon">
            <Cpu size={20} />
          </div>
          <div>
            <h3 className="smart-device-title">SustansyaBox Device</h3>
            <p className="smart-muted">
              {demoConnected
                ? 'Simulated connection active'
                : 'No physical device connected'}
            </p>
          </div>
        </div>
        <button
          type="button"
          className={`smart-button ${demoConnected ? '' : 'smart-button-primary'}`}
          onClick={() => setDemoConnected(v => !v)}
        >
          {demoConnected
            ? <><CheckCircle2 size={14} /> Demo Connected</>
            : <><Wifi size={14} /> Preview Connection</>}
        </button>
      </section>

      {/* STATUS CARDS */}
      <section className="smart-status-grid">
        {statuses.map(status => {
          const Icon = status.icon
          return (
            <div className="smart-card smart-status-card" key={status.title}>
              <div className="smart-status-top">
                <span className="smart-status-name">{status.title}</span>
                <Icon size={16} color="var(--primary)" />
              </div>
              <div className="smart-status-value">{status.value}</div>
              <p className="smart-muted">{status.description}</p>
            </div>
          )
        })}
      </section>

      {/* LUNCHBOX + NUTRITION */}
      <div className="smart-main-grid">
        <section className="smart-card smart-panel">
          <h3 className="smart-panel-title">Lunchbox Compartments</h3>
          <p className="smart-panel-subtitle">
            Select a compartment to preview its food and weight.
          </p>

          <div className="smart-lunchbox-stage">
            <div className="smart-lunchbox-shell">
              {compartments.map(compartment => (
                <motion.button
                  key={compartment.id}
                  type="button"
                  className="smart-compartment-button"
                  style={{
                    gridRow: compartment.id === 1 ? 'span 2' : undefined,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openPicker(compartment.id)}
                >
                  <span className="smart-compartment-number">
                    {String(compartment.id).padStart(2, '0')}
                  </span>

                  {compartment.food ? (
                    <>
                      <span
                        className="smart-compartment-emoji"
                        style={{ fontSize: compartment.id === 1 ? 40 : 28 }}
                      >
                        {compartment.food.emoji}
                      </span>
                      <span className="smart-compartment-name">
                        {compartment.food.name}
                      </span>
                      <span className="smart-compartment-weight">
                        {compartment.weight} g
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus size={compartment.id === 1 ? 27 : 21} color="#81967A" />
                      <span className="smart-compartment-name">Add Food</span>
                      <span className="smart-compartment-weight">
                        Compartment {compartment.id}
                      </span>
                    </>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="smart-info-line">
            <Info size={13} style={{ flexShrink: 0 }} />
            <span>
              Visual preview only. Actual sensor readings will be connected later.
            </span>
          </div>
        </section>

        <section className="smart-card smart-panel">
          <h3 className="smart-panel-title">Lunchbox Nutrition</h3>
          <p className="smart-panel-subtitle">
            Estimated nutrition for your selected foods.
          </p>

          <div className="smart-calorie-box">
            <p className="smart-calorie-label">TOTAL CALORIES</p>
            <div className="smart-calorie-value">
              {fmt(totals.calories)}
              <span className="smart-calorie-unit">kcal</span>
            </div>
            <p className="smart-muted">
              {fmt(totals.weight)} g of selected food
            </p>
          </div>

          {[
            { label: 'Sugar', value: `${fmt(totals.sugar, 1)} g`, icon: Droplets },
            { label: 'Sodium', value: `${fmt(totals.sodium)} mg`, icon: Scale },
            { label: 'Food Compartments', value: `${filledCount} of 3 filled`, icon: UtensilsCrossed },
          ].map(item => {
            const Icon = item.icon
            return (
              <div className="smart-nutrition-row" key={item.label}>
                <span className="smart-nutrition-name">
                  <Icon size={14} /> {item.label}
                </span>
                <strong className="smart-nutrition-value">{item.value}</strong>
              </div>
            )
          })}

          <div className="smart-nutrition-footer">
            <button
              type="button"
              className="smart-button"
              style={{ alignSelf: 'flex-start' }}
              onClick={clearAll}
            >
              <RefreshCcw size={13} /> Clear Preview
            </button>
            <p className="smart-muted" style={{ fontSize: 10 }}>
              Illustrative estimates per 100 g. Actual values vary by preparation.
            </p>
          </div>
        </section>
      </div>

      {/* COMPARTMENT DETAILS */}
      <section className="smart-details-section">
        <div className="smart-section-heading">
          <h3 className="smart-section-title">Compartment Details</h3>
          <span className="smart-muted">
            Manage each compartment separately.
          </span>
        </div>

        <div className="smart-details-grid">
          {compartments.map(compartment => {
            const nutrition = compartment.food
              ? nutritionFor(compartment.food, compartment.weight)
              : null

            return (
              <div className="smart-card smart-detail-card" key={compartment.id}>
                <div className="smart-detail-header">
                  <strong className="smart-detail-name">
                    Compartment {compartment.id}
                  </strong>
                  <span className="smart-detail-badge">
                    {compartment.food ? 'Filled' : 'Empty'}
                  </span>
                </div>

                <div className="smart-detail-food">
                  <span className="smart-detail-emoji">
                    {compartment.food?.emoji ?? '🍱'}
                  </span>
                  <strong className="smart-detail-food-name">
                    {compartment.food?.name ?? 'No food selected'}
                  </strong>
                  <span className="smart-detail-food-meta">
                    {compartment.food
                      ? `${compartment.weight} g · ${fmt(nutrition?.calories ?? 0)} kcal`
                      : 'Waiting for food'}
                  </span>
                </div>

                <div className="smart-detail-actions">
                  <button
                    type="button"
                    className="smart-button smart-button-primary"
                    onClick={() => openPicker(compartment.id)}
                  >
                    <Plus size={13} />
                    {compartment.food ? 'Change Food' : 'Select Food'}
                  </button>

                  {compartment.food && (
                    <button
                      type="button"
                      className="smart-button"
                      onClick={() => clearCompartment(compartment.id)}
                    >
                      <X size={13} /> Clear
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="smart-card smart-help">
        <CircleHelp size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
        <div>
          <h3 className="smart-help-title">How will SustansyaBox work?</h3>
          <p className="smart-help-text">
            The weight sensor will detect food, prompt you to identify it,
            and calculate its calories, sugar, and sodium automatically.
            Currently using simulated readings for frontend testing.
          </p>
        </div>
      </section>

      {/* NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className="smart-toast"
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <CheckCircle2 size={17} />
            <span style={{ flex: 1 }}>{notification}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setNotification('')}
              style={{
                background: 'transparent',
                border: 0,
                color: 'white',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOD SELECTION POPUP */}
      <AnimatePresence>
        {selectedCompartment !== null && (
          <motion.div
            className="smart-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePicker}
          >
            <motion.div
              className="smart-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Select food"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              onClick={event => event.stopPropagation()}
            >
              <div className="smart-modal-header">
                <div>
                  <p className="smart-modal-label">
                    COMPARTMENT {selectedCompartment}
                  </p>
                  <h2 className="smart-modal-title">
                    What food did you add?
                  </h2>
                  <p className="smart-muted">
                    Choose the food detected by your lunchbox.
                  </p>
                </div>
                <button
                  type="button"
                  className="smart-button"
                  aria-label="Close food selection"
                  onClick={closePicker}
                  style={{ padding: 8 }}
                >
                  <X size={17} />
                </button>
              </div>

              <div className="smart-sensor-preview">
                <Scale size={20} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                  <p className="smart-muted">Sample sensor reading</p>
                  <strong style={{ fontSize: 21 }}>{demoWeight} g</strong>
                </div>
                <span className="smart-muted" style={{ fontWeight: 750 }}>
                  DEMO DATA
                </span>
              </div>

              <div className="smart-simulator">
                <label
                  htmlFor="demo-weight"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 750,
                    marginBottom: 8,
                  }}
                >
                  Developer preview: simulated weight
                </label>
                <input
                  id="demo-weight"
                  type="range"
                  min="25"
                  max="500"
                  step="5"
                  value={demoWeight}
                  onChange={event => setDemoWeight(Number(event.target.value))}
                  style={{ width: '100%', accentColor: '#45634D' }}
                />
                <p className="smart-muted" style={{ fontSize: 10, marginTop: 5 }}>
                  For frontend testing only. Users will not manually enter food weight.
                </p>
              </div>

              <div className="smart-search-box">
                <Search size={16} color="var(--muted)" />
                <input
                  className="smart-search-input"
                  type="search"
                  placeholder="Search foods or Filipino dishes..."
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                />
              </div>

              <div className="smart-food-list">
                {filteredFoods.map(food => {
                  const isSelected = selectedFood?.id === food.id
                  return (
                    <button
                      key={food.id}
                      type="button"
                      className={`smart-food-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedFood(food)}
                    >
                      <span style={{ fontSize: 24 }}>{food.emoji}</span>
                      <span style={{ flex: 1 }}>
                        <strong
                          style={{
                            display: 'block',
                            fontSize: 12,
                            marginBottom: 3,
                          }}
                        >
                          {food.name}
                        </strong>
                        <span className="smart-muted">
                          {food.category} · {food.calories} kcal / 100 g
                        </span>
                      </span>
                      {isSelected && <Check size={17} color="var(--primary)" />}
                    </button>
                  )
                })}

                {filteredFoods.length === 0 && (
                  <p className="smart-muted" style={{ textAlign: 'center', padding: 16 }}>
                    No matching food found.
                  </p>
                )}
              </div>

              {selectedFood && selectedNutrition && (
                <div className="smart-selected-nutrition">
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 750,
                      margin: '0 0 11px',
                    }}
                  >
                    Estimated nutrition for {demoWeight} g
                  </p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 10,
                      textAlign: 'center',
                    }}
                  >
                    {[
                      { label: 'Calories', value: fmt(selectedNutrition.calories), unit: 'kcal' },
                      { label: 'Sugar', value: fmt(selectedNutrition.sugar, 1), unit: 'g' },
                      { label: 'Sodium', value: fmt(selectedNutrition.sodium), unit: 'mg' },
                    ].map(item => (
                      <div key={item.label}>
                        <strong
                          style={{
                            display: 'block',
                            fontSize: 18,
                            marginBottom: 4,
                          }}
                        >
                          {item.value}
                        </strong>
                        <span className="smart-muted">
                          {item.unit} {item.label.toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="smart-modal-actions">
                <button type="button" className="smart-button" onClick={closePicker}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="smart-button smart-button-primary"
                  disabled={!selectedFood}
                  onClick={saveFood}
                  style={{
                    opacity: selectedFood ? 1 : 0.5,
                    cursor: selectedFood ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Check size={15} /> Confirm Food
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
