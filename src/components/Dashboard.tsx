
import { useState } from 'react'
import { motion } from 'motion/react'
import {
  Activity,
  Cpu,
  Flame,
  Layers3,
  Leaf,
  Scale,
  TrendingUp,
  Utensils,
  WifiOff,
} from 'lucide-react'

import CalorieRing from './CalorieRing'
import { MiniChart } from '../ui/mini-chart'
import { type Meal, nutrition } from '../types/meals'

type DashboardProps = {
  calorieGoal: number
  sugarGoal: number
  sodiumGoal: number
  meals: Meal[]
}

const dateKey = (date: Date) =>
  [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')

const foodCategory = (compartment: number) => `Compartment ${compartment}`

const percent = (value: number, goal: number) =>
  goal > 0
    ? Math.round((value / goal) * 100)
    : 0

const cardAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

export default function Dashboard({
  calorieGoal,
  sugarGoal,
  sodiumGoal,
  meals,
}: DashboardProps) {
  const today = new Date()
  const todayKey = dateKey(today)
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const WEEK = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    const key = dateKey(date)
    return {
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
      date: key,
      calories: meals.filter(meal => meal.date === key).reduce((sum, meal) => sum + nutrition(meal).calories, 0),
    }
  })
  const [selectedDay, setSelectedDay] = useState((today.getDay() + 6) % 7)
  const todayMeals = meals.filter(meal => meal.date === todayKey)
  const totals = todayMeals.reduce((sum, meal) => {
    const value = nutrition(meal)
    return {
      calories: sum.calories + value.calories,
      sugar: sum.sugar + value.sugar,
      sodium: sum.sodium + value.sodium,
      weight: sum.weight + meal.weight,
    }
  }, { calories: 0, sugar: 0, sodium: 0, weight: 0 })
  const totalWeight = totals.weight
  const totalCalories = Math.round(totals.calories)
  const FOODS = [1, 2, 3].map(compartment => {
    const items = todayMeals.filter(meal => meal.compartment === compartment)
    const weight = items.reduce((sum, meal) => sum + meal.weight, 0)
    const calories = Math.round(items.reduce((sum, meal) => sum + nutrition(meal).calories, 0))
    return {
      name: items.length === 0 ? 'Empty' : items.map(meal => meal.food).join(', '),
      category: foodCategory(compartment),
      weight,
      calories,
      emoji: items[0]?.emoji ?? '🍽️',
    }
  })
  const maxCalories = Math.max(calorieGoal, ...WEEK.map(day => day.calories), 1)
  const chartMax = Math.max(500, Math.ceil(maxCalories / 500) * 500)
  const pointX = (index: number) => 45 + index * (560 / 6)
  const pointY = (calories: number) => 150 - (calories / chartMax) * 125
  const trendPoints = WEEK.map((day, index) => `${pointX(index)},${pointY(day.calories)}`)
  const trendLine = `M ${trendPoints.join(' L ')}`
  const trendArea = `${trendLine} L ${pointX(6)},150 L ${pointX(0)},150 Z`
  const highlighted = WEEK[selectedDay] ?? WEEK[0]

  const caloriePercent = percent(
    totals.calories,
    calorieGoal
  )

  const nutrients = [
    {
      label: 'Calories',
      value: Math.round(totals.calories).toLocaleString(),
      goal: calorieGoal.toLocaleString(),
      unit: 'kcal',
      percentage: caloriePercent,
      color: '#376B50',
    },
    {
      label: 'Sugar',
      value: Number(totals.sugar.toFixed(1)).toLocaleString(),
      goal: sugarGoal.toLocaleString(),
      unit: 'g',
      percentage: percent(totals.sugar, sugarGoal),
      color: '#E99B4B',
    },
    {
      label: 'Sodium',
      value: Math.round(totals.sodium).toLocaleString(),
      goal: sodiumGoal.toLocaleString(),
      unit: 'mg',
      percentage: percent(totals.sodium, sodiumGoal),
      color: '#4CB5A5',
    },
  ]

  return (
    <div className="sb-reference-dashboard">
      <style>{`
        /* MAIN DASHBOARD */

        .sb-reference-dashboard {
          width: 100%;
          height: 100%;
          min-height: 0;
          min-width: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          color: var(--text, #203a2e);
          font-family: inherit;
        }

        .sb-reference-dashboard * {
          box-sizing: border-box;
        }

        /* SIX-CARD BENTO GRID */

        .sb-reference-dashboard .ref-grid {
          display: grid;
          flex: 1;
          min-height: 0;
          min-width: 0;

          grid-template-columns:
            repeat(12, minmax(0, 1fr));

          grid-template-rows:
            minmax(0, 1.35fr)
            minmax(0, 0.9fr);

          grid-template-areas:
            "nutrition nutrition nutrition nutrition nutrition lunchbox lunchbox lunchbox right right right right"
            "trends trends trends trends trends trends trends summary summary summary summary summary";

          gap: 12px;
          padding: 2px;
        }

        .sb-reference-dashboard .ref-card {
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e9eee8);
          border-radius: 22px;
          padding: 17px;
          display: flex;
          flex-direction: column;
          box-shadow:
            0 5px 17px rgba(30, 60, 40, 0.05);
        }

        .sb-reference-dashboard .ref-nutrition {
          grid-area: nutrition;
        }

        .sb-reference-dashboard .ref-lunchbox {
          grid-area: lunchbox;
        }

        .sb-reference-dashboard .ref-right {
          grid-area: right;
          display: grid;
          grid-template-rows:
            minmax(0, 1.12fr)
            minmax(0, 0.88fr);
          gap: 12px;
          min-height: 0;
        }

        .sb-reference-dashboard .ref-trends {
          grid-area: trends;
        }

        .sb-reference-dashboard .ref-summary {
          grid-area: summary;
        }

        /* CARD HEADINGS */

        .sb-reference-dashboard .ref-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 13px;
          flex-shrink: 0;
        }

        .sb-reference-dashboard .ref-heading-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .sb-reference-dashboard .ref-heading-icon {
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #e9f1e8;
          color: #376b50;
        }

        .sb-reference-dashboard .ref-heading h3 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: clamp(13px, 1.15vw, 18px);
          font-weight: 700;
          letter-spacing: -0.3px;
          color: var(--text, #203a2e);
        }

        .sb-reference-dashboard .ref-heading p {
          margin: 3px 0 0;
          font-size: 10px;
          color: var(--muted, #819087);
        }

        .sb-reference-dashboard .ref-more {
          color: var(--muted, #819087);
          background: #f6f8f5;
          padding: 5px 8px;
          border-radius: 9px;
          font-size: 13px;
          flex-shrink: 0;
        }

        /* TODAY'S NUTRITION */

        .sb-reference-dashboard .ref-nutrition-body {
          display: grid;
          grid-template-columns:
            minmax(0, 1.05fr)
            minmax(0, 0.95fr);
          gap: 12px;
          flex: 1;
          min-height: 0;
          align-items: stretch;
        }

        .sb-reference-dashboard .ref-rings {
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .sb-reference-dashboard .ref-rings > * {
          width: 100%;
          height: 100%;
          min-height: 0;
          min-width: 0;
        }

        /* Hide the inner component's heading
           and legend: the reference uses
           nutrition values on the right. */

        .sb-reference-dashboard
        .ref-rings .sb-triple-ring {
          padding: 0;
          border: none;
          border-radius: 0;
          background: transparent;
        }

        .sb-reference-dashboard
        .ref-rings .sb-triple-ring-header,
        .sb-reference-dashboard
        .ref-rings .sb-triple-ring-legend {
          display: none;
        }

        .sb-reference-dashboard
        .ref-rings .sb-triple-ring-graphic {
          width: 100%;
          height: 100%;
          flex: 1;
          min-height: 0;
        }

        .sb-reference-dashboard .ref-nutrient-list {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 0;
          min-width: 0;
        }

        .sb-reference-dashboard .ref-nutrient {
          padding: 13px 0;
          border-bottom:
            1px solid var(--border, #edf0eb);
        }

        .sb-reference-dashboard .ref-nutrient:last-child {
          border-bottom: none;
        }

        .sb-reference-dashboard .ref-nutrient-top {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 5px;
        }

        .sb-reference-dashboard .ref-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .sb-reference-dashboard .ref-nutrient-label {
          font-size: 12px;
          font-weight: 700;
        }

        .sb-reference-dashboard .ref-nutrient-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 5px;
          padding-left: 17px;
        }

        .sb-reference-dashboard .ref-nutrient-value {
          min-width: 0;
          white-space: nowrap;
        }

        .sb-reference-dashboard .ref-nutrient-value strong {
          font-size: clamp(12px, 1.1vw, 17px);
          font-weight: 800;
        }

        .sb-reference-dashboard .ref-nutrient-value span {
          font-size: 10px;
          color: var(--muted, #819087);
        }

        .sb-reference-dashboard .ref-percent {
          background: #e9f1e8;
          color: #376b50;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        /* SMART LUNCHBOX */

        .sb-reference-dashboard .ref-food-list {
          display: grid;
          grid-template-rows:
            repeat(3, minmax(0, 1fr));
          flex: 1;
          min-height: 0;
          gap: 9px;
        }

        .sb-reference-dashboard .ref-food {
          min-width: 0;
          min-height: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f6f6f3;
          border-radius: 14px;
          padding: 9px 12px;
          overflow: hidden;
        }

        .sb-reference-dashboard .ref-food-emoji {
          width: 48px;
          flex-shrink: 0;
          font-size: clamp(24px, 2.5vw, 35px);
          text-align: center;
          line-height: 1;
        }

        .sb-reference-dashboard .ref-food-info {
          flex: 1;
          min-width: 0;
        }

        .sb-reference-dashboard .ref-food-info strong {
          display: block;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sb-reference-dashboard .ref-food-info span {
          display: block;
          margin-top: 4px;
          color: var(--muted, #819087);
          font-size: 10px;
        }

        .sb-reference-dashboard .ref-food-stats {
          text-align: right;
          flex-shrink: 0;
        }

        .sb-reference-dashboard .ref-food-stats strong {
          display: block;
          font-size: 12px;
        }

        .sb-reference-dashboard .ref-food-stats span {
          display: block;
          margin-top: 4px;
          color: var(--muted, #819087);
          font-size: 9px;
        }

        /* WEEKLY CALORIES */

        .sb-reference-dashboard .ref-weekly {
          padding: 13px;
        }

        .sb-reference-dashboard .ref-weekly
        .ref-heading {
          margin-bottom: 6px;
        }

        .sb-reference-dashboard .ref-weekly-chart {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns:
            repeat(7, minmax(0, 1fr));
          align-items: stretch;
          gap: 6px;
        }

        .sb-reference-dashboard .ref-weekly-day {
          border: 0;
          background: transparent;
          padding: 0;
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 5px;
          cursor: pointer;
          color: var(--muted, #819087);
          font-size: 9px;
        }

        .sb-reference-dashboard .ref-weekly-track {
          width: min(100%, 35px);
          flex: 1;
          min-height: 0;
          background: #f0f3ef;
          border-radius: 8px 8px 3px 3px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }

        .sb-reference-dashboard .ref-weekly-fill {
          width: 100%;
          background: #b6cbb9;
          border-radius: 8px 8px 3px 3px;
          transition:
            height 0.3s,
            background 0.2s;
        }

        .sb-reference-dashboard
        .ref-weekly-day[aria-pressed='true']
        .ref-weekly-fill {
          background: #376b50;
        }

        .sb-reference-dashboard
        .ref-weekly-day[aria-pressed='true'] {
          font-weight: 800;
          color: #376b50;
        }

        /* DARK DEVICE OVERVIEW */

        .sb-reference-dashboard .ref-device {
          background:
            linear-gradient(
              125deg,
              #244b34 0%,
              #376b50 60%,
              #234c35 100%
            );
          color: white;
          border: none;
          position: relative;
          padding: 14px;
        }

        .sb-reference-dashboard .ref-device::after {
          content: '';
          position: absolute;
          width: 150px;
          height: 150px;
          border: 1px solid
            rgba(255,255,255,0.13);
          border-radius: 50%;
          right: -65px;
          bottom: -100px;
          box-shadow:
            0 0 0 15px rgba(255,255,255,0.035),
            0 0 0 32px rgba(255,255,255,0.025);
          pointer-events: none;
        }

        .sb-reference-dashboard
        .ref-device .ref-heading {
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }

        .sb-reference-dashboard
        .ref-device .ref-heading h3 {
          color: white;
        }

        .sb-reference-dashboard
        .ref-device .ref-heading-icon {
          background: rgba(255,255,255,0.14);
          color: white;
        }

        .sb-reference-dashboard .ref-offline {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 9px;
          background: white;
          color: #31513c;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .sb-reference-dashboard .ref-offline-dot {
          width: 7px;
          height: 7px;
          background: #eba25b;
          border-radius: 50%;
        }

        .sb-reference-dashboard .ref-device-content {
          display: flex;
          align-items: center;
          flex: 1;
          min-height: 0;
          position: relative;
          z-index: 1;
          gap: 14px;
        }

        .sb-reference-dashboard .ref-device-visual {
          width: 40%;
          min-width: 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .sb-reference-dashboard .ref-device-box {
          width: clamp(55px, 7vw, 95px);
          height: clamp(45px, 5vw, 68px);
          background: #dce7d8;
          border: 5px solid #9cb8a4;
          border-radius: 18px;
          transform: rotate(-12deg);
          box-shadow:
            0 10px 18px rgba(0,0,0,0.18),
            inset 0 -10px 0 rgba(60,100,70,0.12);
          display: grid;
          place-items: center;
          color: #376b50;
        }

        .sb-reference-dashboard .ref-device-info {
          border-left: 1px solid
            rgba(255,255,255,0.25);
          padding-left: 15px;
          min-width: 0;
        }

        .sb-reference-dashboard .ref-device-info p {
          margin: 0 0 3px;
          font-size: 10px;
          color: rgba(255,255,255,0.8);
        }

        .sb-reference-dashboard .ref-device-info strong {
          display: block;
          font-size: clamp(18px, 2vw, 29px);
          letter-spacing: -0.5px;
        }

        .sb-reference-dashboard .ref-device-info span {
          display: block;
          margin-top: 4px;
          font-size: 9px;
          color: rgba(255,255,255,0.7);
        }

        /* NUTRITION TRENDS */

        .sb-reference-dashboard .ref-trends-chart {
          flex: 1;
          min-height: 0;
          min-width: 0;
          position: relative;
        }

        .sb-reference-dashboard .ref-trends-svg {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
        }

        .sb-reference-dashboard .ref-trends-value {
          position: absolute;
          top: 1px;
          left: 52%;
          transform: translateX(-50%);
          background: #376b50;
          color: white;
          padding: 5px 8px;
          border-radius: 7px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        /* MEAL SUMMARY */

        .sb-reference-dashboard .ref-summary-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 10px;
          flex: 1;
          min-height: 0;
        }

        .sb-reference-dashboard .ref-summary-tile {
          min-width: 0;
          min-height: 0;
          border-radius: 15px;
          background: #f6f6f3;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 8px;
          padding: 8px 5px;
        }

        .sb-reference-dashboard .ref-summary-tile svg {
          color: #376b50;
        }

        .sb-reference-dashboard .ref-summary-tile strong {
          font-size: clamp(15px, 1.7vw, 24px);
          font-weight: 800;
          white-space: nowrap;
        }

        .sb-reference-dashboard .ref-summary-tile small {
          color: var(--muted, #819087);
          font-size: 9px;
          line-height: 1.3;
        }

        /* SHORTER DESKTOP WINDOWS */

        @media (max-height: 800px) {
          .sb-reference-dashboard .ref-grid {
            gap: 9px;
          }

          .sb-reference-dashboard .ref-card {
            padding: 11px;
            border-radius: 17px;
          }

          .sb-reference-dashboard .ref-heading {
            margin-bottom: 8px;
          }

          .sb-reference-dashboard .ref-heading-icon {
            width: 29px;
            height: 29px;
          }

          .sb-reference-dashboard .ref-nutrient {
            padding: 8px 0;
          }

          .sb-reference-dashboard .ref-food {
            padding: 6px 8px;
          }

          .sb-reference-dashboard .ref-food-list {
            gap: 6px;
          }

          .sb-reference-dashboard .ref-summary-tile {
            gap: 5px;
          }
        }

        /* NARROW DESKTOP WINDOWS */

        @media (max-width: 1100px) {
          .sb-reference-dashboard .ref-grid {
            gap: 8px;
          }

          .sb-reference-dashboard .ref-card {
            padding: 10px;
          }

          .sb-reference-dashboard .ref-heading h3 {
            font-size: 12px;
          }

          .sb-reference-dashboard .ref-heading p {
            font-size: 9px;
          }

          .sb-reference-dashboard .ref-food-emoji {
            width: 30px;
          }

          .sb-reference-dashboard .ref-food {
            gap: 5px;
          }

          .sb-reference-dashboard .ref-nutrient {
            padding: 7px 0;
          }
        }

        /* COMPACT VIEW: NO PAGE SCROLL */

        @media (max-width: 760px) {
          .sb-reference-dashboard .ref-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            grid-template-rows:
              repeat(3, minmax(0, 1fr));
            grid-template-areas:
              "nutrition lunchbox"
              "right right"
              "trends summary";
            gap: 5px;
          }

          .sb-reference-dashboard .ref-right {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            grid-template-rows: minmax(0, 1fr);
            gap: 5px;
          }

          .sb-reference-dashboard .ref-card {
            padding: 7px;
            border-radius: 11px;
          }

          .sb-reference-dashboard .ref-heading {
            margin-bottom: 5px;
          }

          .sb-reference-dashboard .ref-heading p,
          .sb-reference-dashboard .ref-more {
            display: none;
          }

          .sb-reference-dashboard .ref-heading-icon {
            width: 23px;
            height: 23px;
          }

          .sb-reference-dashboard .ref-nutrition-body {
            gap: 4px;
          }

          .sb-reference-dashboard .ref-nutrient {
            padding: 3px 0;
          }

          .sb-reference-dashboard .ref-nutrient-label,
          .sb-reference-dashboard .ref-food-info strong {
            font-size: 9px;
          }

          .sb-reference-dashboard .ref-nutrient-value span,
          .sb-reference-dashboard .ref-food-info span {
            display: none;
          }

          .sb-reference-dashboard .ref-food {
            padding: 3px;
          }

          .sb-reference-dashboard .ref-food-emoji {
            width: 20px;
            font-size: 18px;
          }

          .sb-reference-dashboard .ref-food-stats span {
            display: none;
          }

          .sb-reference-dashboard .ref-summary-grid {
            gap: 4px;
          }

          .sb-reference-dashboard .ref-summary-tile {
            padding: 4px;
          }

          .sb-reference-dashboard .ref-summary-tile small {
            font-size: 8px;
          }
        }


        /* THEME-SAFE DASHBOARD COLORS */
        .sb-reference-dashboard .ref-food,
        .sb-reference-dashboard .ref-summary-tile {
          background: #f6f6f3;
          color: #203a2e;
        }
        .sb-reference-dashboard .ref-food-info strong,
        .sb-reference-dashboard .ref-food-stats strong,
        .sb-reference-dashboard .ref-summary-tile strong {
          color: #203a2e;
        }
        .sb-reference-dashboard .ref-food-info span,
        .sb-reference-dashboard .ref-food-stats span,
        .sb-reference-dashboard .ref-summary-tile small {
          color: #687a70;
        }
        .sb-reference-dashboard .ref-weekly-track {
          background: #f0f3ef;
        }
        .sb-reference-dashboard .ref-weekly-fill {
          background: #b6cbb9;
        }
        .sb-reference-dashboard .ref-weekly-day[aria-pressed='true'] .ref-weekly-fill {
          background: #376b50;
        }
        .sb-reference-dashboard .ref-trends-svg line[stroke='#edf0eb'] {
          stroke: #e5ebe4;
        }
        .sb-reference-dashboard .ref-trends-svg text {
          fill: #819087;
        }

        /* DARK MODE: matches App.tsx's html[data-theme='dark'] */
        html[data-theme='dark'] .sb-reference-dashboard .ref-food,
        html[data-theme='dark'] .sb-reference-dashboard .ref-summary-tile {
          background: #2b4437;
          border: 1px solid rgba(202, 228, 205, 0.1);
          color: #f0f6ef;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-food-info strong,
        html[data-theme='dark'] .sb-reference-dashboard .ref-food-stats strong,
        html[data-theme='dark'] .sb-reference-dashboard .ref-summary-tile strong {
          color: #f3f8f1;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-food-info span,
        html[data-theme='dark'] .sb-reference-dashboard .ref-food-stats span,
        html[data-theme='dark'] .sb-reference-dashboard .ref-summary-tile small {
          color: #b5cbbd;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-summary-tile svg {
          color: #a2d0ae;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-heading-icon {
          background: #dcebe0;
          color: #376b50;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-more {
          background: #345240;
          color: #e1efe2;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-weekly-track {
          background: #345041;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-weekly-fill {
          background: #81aa8d;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-weekly-day[aria-pressed='true'] .ref-weekly-fill {
          background: #b6dec0;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-weekly-day[aria-pressed='true'] {
          color: #c6e9cd;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-percent {
          background: #dcebe0;
          color: #27523b;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-trends-svg line[stroke='#edf0eb'] {
          stroke: #476253;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-trends-svg text {
          fill: #b5cbbd;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-trends-svg path[stroke='#376b50'] {
          stroke: #a1d7ae;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-trends-svg circle[fill='#376b50'] {
          fill: #a1d7ae;
          stroke: #20392c;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-trends-value {
          background: #b6dec0;
          color: #20392c;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-device .ref-heading-icon {
          background: rgba(255,255,255,0.14);
          color: white;
        }
        html[data-theme='dark'] .sb-reference-dashboard .ref-device .ref-offline {
          background: #f6f8f5;
          color: #31513c;
        }
      `}</style>

      <div className="ref-grid">
        {/* 1. TODAY'S NUTRITION */}
        <motion.section
          {...cardAnimation}
          className="ref-card ref-nutrition"
        >
          <div className="ref-heading">
            <div className="ref-heading-left">
              <span className="ref-heading-icon">
                <Leaf size={19} />
              </span>

              <div>
                <h3>Today's Nutrition</h3>
                <p>Your daily nutrition progress</p>
              </div>
            </div>

            <span className="ref-more">•••</span>
          </div>

          <div className="ref-nutrition-body">
            <div className="ref-rings">
              <CalorieRing
                consumed={totals.calories}
                goal={calorieGoal}
                sugarConsumed={totals.sugar}
                sugarGoal={sugarGoal}
                sodiumConsumed={totals.sodium}
                sodiumGoal={sodiumGoal}
              />
            </div>

            <div className="ref-nutrient-list">
              {nutrients.map((item) => (
                <div
                  className="ref-nutrient"
                  key={item.label}
                >
                  <div className="ref-nutrient-top">
                    <span
                      className="ref-dot"
                      style={{
                        background: item.color,
                      }}
                    />

                    <span className="ref-nutrient-label">
                      {item.label}
                    </span>
                  </div>

                  <div className="ref-nutrient-bottom">
                    <div className="ref-nutrient-value">
                      <strong>{item.value}</strong>
                      <span>
                        {' / '}
                        {item.goal} {item.unit}
                      </span>
                    </div>

                    <span className="ref-percent">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 2. SMART LUNCHBOX */}
        <motion.section
          {...cardAnimation}
          transition={{
            duration: 0.4,
            delay: 0.05,
          }}
          className="ref-card ref-lunchbox"
        >
          <div className="ref-heading">
            <div className="ref-heading-left">
              <span className="ref-heading-icon">
                <Layers3 size={19} />
              </span>

              <div>
                <h3>Smart Lunchbox</h3>
                <p>Food in each compartment</p>
              </div>
            </div>

            <span className="ref-more">•••</span>
          </div>

          <div className="ref-food-list">
            {FOODS.map((food) => (
              <div
                className="ref-food"
                key={food.name}
              >
                <span
                  className="ref-food-emoji"
                  role="img"
                  aria-label={food.name}
                >
                  {food.emoji}
                </span>

                <div className="ref-food-info">
                  <strong>{food.name}</strong>
                  <span>{food.category}</span>
                </div>

                <div className="ref-food-stats">
                  <strong>{food.weight} g</strong>
                  <span>{food.calories} kcal</span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* TOP-RIGHT STACK */}
        <div className="ref-right">
          {/* 3. WEEKLY CALORIES */}
          <motion.section
            {...cardAnimation}
            transition={{
              duration: 0.4,
              delay: 0.1,
            }}
            className="ref-card ref-weekly"
          >
            <div className="ref-heading">
              <div className="ref-heading-left">
                <span className="ref-heading-icon">
                  <Activity size={18} />
                </span>

                <div>
                  <h3>Weekly Calories</h3>
                  <p>Recorded meals this week</p>
                </div>
              </div>

              <span className="ref-more">
                This Week
              </span>
            </div>

            <MiniChart
              data={WEEK.map(day => ({ label: day.day, value: day.calories }))}
              selectedIndex={selectedDay}
              onSelect={setSelectedDay}
            />
          </motion.section>

          {/* 4. DEVICE OVERVIEW */}
          <motion.section
            {...cardAnimation}
            transition={{
              duration: 0.4,
              delay: 0.15,
            }}
            className="ref-card ref-device"
          >
            <div className="ref-heading">
              <div className="ref-heading-left">
                <span className="ref-heading-icon">
                  <Cpu size={18} />
                </span>

                <div>
                  <h3>Device Overview</h3>
                </div>
              </div>

              <span className="ref-offline">
                <span className="ref-offline-dot" />
                Offline
              </span>
            </div>

            <div className="ref-device-content">
              <div className="ref-device-visual">
                <div className="ref-device-box">
                  <Utensils size={26} />
                </div>
              </div>

              <div className="ref-device-info">
                <p>Total Weight</p>
                <strong>{totalWeight} g</strong>
                <span>Based on today’s meals</span>
                <span>
                  <WifiOff
                    size={10}
                    style={{
                      verticalAlign: 'middle',
                      marginRight: 4,
                    }}
                  />
                  Meal History data
                </span>
              </div>
            </div>
          </motion.section>
        </div>

        {/* 5. NUTRITION TRENDS */}
        <motion.section
          {...cardAnimation}
          transition={{
            duration: 0.4,
            delay: 0.2,
          }}
          className="ref-card ref-trends"
        >
          <div className="ref-heading">
            <div className="ref-heading-left">
              <span className="ref-heading-icon">
                <TrendingUp size={19} />
              </span>

              <div>
                <h3>Nutrition Trends</h3>
                <p>
                  Your daily calorie intake this week
                </p>
              </div>
            </div>

            <span className="ref-more">
              Calories
            </span>
          </div>

          <div className="ref-trends-chart">
            <span className="ref-trends-value">
              {Math.round(highlighted.calories).toLocaleString()} kcal
            </span>

            <svg
              className="ref-trends-svg"
              viewBox="0 0 620 175"
              preserveAspectRatio="none"
              role="img"
              aria-label="Weekly calorie trend from Meal History"
            >
              <defs>
                <linearGradient
                  id="sb-trend-gradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#376b50"
                    stopOpacity="0.75"
                  />
                  <stop
                    offset="100%"
                    stopColor="#a9c9ae"
                    stopOpacity="0.2"
                  />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              {[25, 65, 105, 145].map((y) => (
                <line
                  key={y}
                  x1="40"
                  y1={y}
                  x2="610"
                  y2={y}
                  stroke="#edf0eb"
                  strokeWidth="1"
                />
              ))}

              {/* Y-axis labels */}
              {[0, 1, 2, 3].map(index => {
                const value = chartMax - (index * chartMax) / 3
                return (
                  <text key={index} x="33" y={29 + index * 40} textAnchor="end" fontSize="11" fill="#8b958d">
                    {Math.round(value).toLocaleString()}
                  </text>
                )
              })}

              {/* Filled area and trend line */}
              <path d={trendArea} fill="url(#sb-trend-gradient)" />
              <path d={trendLine} fill="none" stroke="#376b50" strokeWidth="2" strokeLinejoin="round" />
              <line
                x1={pointX(selectedDay)} y1={pointY(highlighted.calories)}
                x2={pointX(selectedDay)} y2="150"
                stroke="#376b50" strokeDasharray="3 4" strokeOpacity="0.5"
              />
              <circle
                cx={pointX(selectedDay)} cy={pointY(highlighted.calories)}
                r="6" fill="#376b50" stroke="white" strokeWidth="3"
              />

              {/* Day labels */}
              {WEEK.map((item, index) => (
                <text
                  key={item.day}
                  x={pointX(index)}
                  y="170"
                  fontSize="11"
                  textAnchor="middle"
                  fill="#8b958d"
                >
                  {item.day}
                </text>
              ))}
            </svg>
          </div>
        </motion.section>

        {/* 6. MEAL SUMMARY */}
        <motion.section
          {...cardAnimation}
          transition={{
            duration: 0.4,
            delay: 0.25,
          }}
          className="ref-card ref-summary"
        >
          <div className="ref-heading">
            <div className="ref-heading-left">
              <span className="ref-heading-icon">
                <Utensils size={19} />
              </span>

              <div>
                <h3>Meal Summary</h3>
                <p>
                  Today's total meal information
                </p>
              </div>
            </div>

            <span className="ref-more">•••</span>
          </div>

          <div className="ref-summary-grid">
            <div className="ref-summary-tile">
              <Flame size={25} />

              <strong>
                {totalCalories} kcal
              </strong>

              <small>
                Total Meal Calories
              </small>
            </div>

            <div className="ref-summary-tile">
              <Scale size={25} />

              <strong>
                {totalWeight} g
              </strong>

              <small>
                Total Weight
              </small>
            </div>

            <div className="ref-summary-tile">
              <Layers3 size={25} />

              <strong>
                {FOODS.filter(food => food.weight > 0).length}
              </strong>

              <small>
                Compartments
              </small>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
