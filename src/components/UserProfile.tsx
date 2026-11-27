import { useMemo, useState, type FormEvent } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import {
  Activity,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  Pencil,
  Ruler,
  Scale,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import type { ProfileData } from '../types/profile'
import {
  ACTIVITY_LEVELS,
  NUTRITION_REFERENCE,
  isValidInput,
  personalTargets,
  type ActivityLevel,
  type Sex,
} from '../services/nutrition'

// ==========================================
// TYPES
// ==========================================

type Totals = { calories: number; sugar: number; sodium: number }

type UserProfileProps = {
  profile: ProfileData
  /** Saves to the database. Throw an Error to show a message. */
  onSave: (updated: ProfileData) => Promise<void>
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>
  onSignOut: () => void
  /** Today's intake (from saved meals) for the goal rings */
  today?: Totals
}

// ==========================================
// HELPERS
// ==========================================

const RING_R = 34
const RING_C = 2 * Math.PI * RING_R

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'SB'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function titleCase(name: string) {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function targetsFrom(data: ProfileData) {
  const input = {
    age: Number(data.age),
    height: Number(data.height),
    weight: Number(data.weight),
    sex: (data.sex || undefined) as Sex | undefined,
    activity: (data.activity || 'sedentary') as ActivityLevel,
  }
  return isValidInput(input) ? personalTargets(input) : null
}

function bmiOf(data: ProfileData) {
  const height = Number(data.height) / 100
  const weight = Number(data.weight)
  if (!height || !weight) return null
  return Math.round((weight / (height * height)) * 10) / 10
}

// WHO adult BMI categories
function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: 'Underweight', tone: 'under' }
  if (bmi < 25) return { label: 'Normal', tone: 'ok' }
  if (bmi < 30) return { label: 'Overweight', tone: 'near' }
  return { label: 'Obese', tone: 'over' }
}

// Position of the BMI marker on a 15–40 scale
const bmiPosition = (bmi: number) => Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100))

// ==========================================
// COMPONENT
// ==========================================

export default function UserProfile({
  profile,
  onSave,
  onChangePassword,
  onSignOut,
  today = { calories: 0, sugar: 0, sodium: 0 },
}: UserProfileProps) {
  const [draft, setDraft] = useState<ProfileData>({ ...profile })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Password form
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordDone, setPasswordDone] = useState(false)

  const view = editing ? draft : profile
  const targets = useMemo(() => targetsFrom(view), [view])
  const bmi = bmiOf(view)
  const category = bmi !== null && Number(view.age) >= 18 ? bmiCategory(bmi) : null

  const goals = targets
    ? { calories: targets.calories, sugar: targets.sugar, sodium: targets.sodium }
    : { ...NUTRITION_REFERENCE }

  const update = (field: keyof ProfileData, value: string) => {
    setDraft(previous => ({ ...previous, [field]: value }))
    setError('')
  }

  const startEditing = () => {
    setDraft({ ...profile, activity: profile.activity || 'sedentary' })
    setEditing(true)
    setError('')
    setNotice('')
  }

  const cancelEditing = () => {
    setEditing(false)
    setError('')
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    const name = draft.fullName.trim()
    const age = Number(draft.age)
    const height = Number(draft.height)
    const weight = Number(draft.weight)

    if (name.length < 2 || name.length > 100) return setError('Enter your full name.')
    if (!Number.isInteger(age) || age < 13 || age > 120) return setError('Age must be a whole number from 13 to 120.')
    if (!Number.isFinite(height) || height < 80 || height > 250) return setError('Height must be between 80 and 250 cm.')
    if (!Number.isFinite(weight) || weight < 15 || weight > 400) return setError('Weight must be between 15 and 400 kg.')
    if (draft.sex !== 'male' && draft.sex !== 'female') return setError('Choose your sex so we can estimate your calories.')

    const next = { ...draft, fullName: name }
    const computed = targetsFrom(next)

    setSaving(true)
    setError('')

    try {
      await onSave({
        ...next,
        calories: String(computed?.calories ?? NUTRITION_REFERENCE.calories),
        sugar: String(computed?.sugar ?? NUTRITION_REFERENCE.sugar),
        sodium: String(computed?.sodium ?? NUTRITION_REFERENCE.sodium),
      })
      setEditing(false)
      setNotice('Profile saved. Your daily targets were updated.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save your profile.')
    } finally {
      setSaving(false)
    }
  }

  const closePassword = () => {
    setPasswordOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setShowPasswords(false)
  }

  const submitPassword = async () => {
    if (passwordBusy) return

    if (!currentPassword) return setPasswordError('Enter your current password.')
    if (newPassword.length < 8) return setPasswordError('Your new password must contain at least 8 characters.')
    if (newPassword !== confirmPassword) return setPasswordError('Your new passwords do not match.')

    setPasswordBusy(true)
    setPasswordError('')

    try {
      await onChangePassword(currentPassword, newPassword)
      closePassword()
      setPasswordDone(true)
    } catch (caught) {
      setPasswordError(caught instanceof Error ? caught.message : 'Unable to change your password.')
    } finally {
      setPasswordBusy(false)
    }
  }

  const goalItems = [
    { key: 'calories' as const, label: 'Calories', unit: 'kcal', goal: goals.calories, value: today.calories, color: 'var(--up-cal)', limit: false },
    { key: 'sugar' as const, label: 'Sugar', unit: 'g', goal: goals.sugar, value: today.sugar, color: 'var(--up-sugar)', limit: true },
    { key: 'sodium' as const, label: 'Sodium', unit: 'mg', goal: goals.sodium, value: today.sodium, color: 'var(--up-sodium)', limit: true },
  ]

  const activity = ACTIVITY_LEVELS[(view.activity || 'sedentary') as ActivityLevel] ?? ACTIVITY_LEVELS.sedentary

  return (
    <MotionConfig reducedMotion="user">
      <form className="up-page" onSubmit={handleSave} noValidate>
        <style>{`
          /* ================= THEME ================= */
          .up-page {
            --up-text: var(--text, #203a2e);
            --up-muted: var(--muted, #6f8176);
            --up-border: var(--border, #e2eadc);
            --up-surface: var(--surface, #ffffff);
            --up-primary: var(--primary, #376b50);
            --up-ink: #1f3d2c;
            --up-glass: rgba(255, 255, 255, 0.86);
            --up-soft: #e9f1e8;
            --up-tile: #f6f7f3;
            --up-track: #e3eadf;
            --up-ok: #5f9a6c;
            --up-near: #c98a2b;
            --up-over: #c4544c;
            --up-under: #4f8fb0;
            --up-cal: #376b50;
            --up-sugar: #d98a3d;
            --up-sodium: #3f9e8f;
            --up-hero: linear-gradient(125deg, #244b34 0%, #376b50 58%, #4b7c5a 100%);
          }

          [data-theme="dark"] .up-page {
            --up-ink: #eef6e6;
            --up-glass: rgba(22, 36, 29, 0.82);
            --up-soft: #27412f;
            --up-tile: #22372b;
            --up-track: #2f4637;
            --up-ok: #8cc77a;
            --up-near: #e2b15f;
            --up-over: #ee8b80;
            --up-under: #8ac4e0;
            --up-cal: #a1d7ae;
            --up-sugar: #efb57a;
            --up-sodium: #7fd0c2;
            --up-hero: linear-gradient(125deg, #1b3a28 0%, #24452f 58%, #2e5438 100%);
          }

          /* ================= SHELL ================= */
          .up-page {
            width: 100%;
            height: 100%;
            min-height: 0;
            display: grid;
            grid-template-columns: repeat(12, minmax(0, 1fr));
            grid-template-rows: auto minmax(0, 1fr) minmax(0, 1fr);
            grid-template-areas:
              "hero hero hero hero hero hero hero hero hero hero hero hero"
              "body body body body body body body bmi bmi bmi bmi bmi"
              "goals goals goals goals goals goals goals goals sec sec sec sec";
            gap: 12px;
            padding: 2px;
            color: var(--up-text);
          }

          .up-page *, .up-page *::before, .up-page *::after { box-sizing: border-box; }
          .up-page button, .up-page input { font: inherit; }
          .up-page button { cursor: pointer; }
          .up-page button:focus-visible, .up-page input:focus-visible {
            outline: 2px solid var(--up-primary);
            outline-offset: 2px;
          }
          .up-num { font-family: 'Manrope', sans-serif; font-variant-numeric: tabular-nums; }

          .up-card {
            min-width: 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
            padding: 16px 18px;
            border-radius: 20px;
            border: 1px solid var(--up-border);
            background: var(--up-glass);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            box-shadow: 0 5px 17px rgba(30, 60, 40, 0.05);
            overflow: hidden;
          }

          .up-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 12px;
            flex-shrink: 0;
          }

          .up-head-left { display: flex; align-items: center; gap: 10px; min-width: 0; }

          .up-icon {
            width: 34px; height: 34px; flex-shrink: 0;
            display: grid; place-items: center;
            border-radius: 11px;
            background: var(--up-soft);
            color: var(--up-primary);
          }
          [data-theme="dark"] .up-icon { color: var(--up-cal); }

          .up-head h3 {
            margin: 0;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: clamp(14px, 1.2vw, 18px);
            font-weight: 700;
            letter-spacing: -0.3px;
            color: var(--up-ink);
          }
          .up-head p { margin: 2px 0 0; font-size: 11px; color: var(--up-muted); }

          .up-btn {
            display: inline-flex; align-items: center; justify-content: center; gap: 7px;
            padding: 9px 14px;
            border-radius: 11px;
            border: 1px solid var(--up-border);
            background: var(--up-surface);
            color: var(--up-text);
            font-size: 12px; font-weight: 700;
            white-space: nowrap;
            transition: transform .2s ease, filter .2s ease;
          }
          .up-btn:hover:not(:disabled) { transform: translateY(-1px); }
          .up-btn:disabled { opacity: .6; cursor: wait; }
          .up-btn.primary { background: #45634d; border-color: #45634d; color: #fff; }
          .up-btn.light { background: rgba(255,255,255,.95); border-color: transparent; color: #244b34; }
          .up-btn.ghost-light { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.25); color: #fff; }
          .up-btn.danger { color: var(--up-over); }

          /* ================= HERO ================= */
          .up-hero {
            grid-area: hero;
            position: relative;
            display: flex;
            align-items: center;
            gap: 18px;
            padding: 18px 22px;
            border-radius: 22px;
            background: var(--up-hero);
            color: #fff;
            overflow: hidden;
          }

          .up-hero::after {
            content: '';
            position: absolute;
            width: 260px; height: 260px;
            right: -70px; top: -150px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,.14);
            box-shadow: 0 0 0 22px rgba(255,255,255,.035), 0 0 0 48px rgba(255,255,255,.025);
            pointer-events: none;
          }

          .up-avatar {
            position: relative;
            width: 68px; height: 68px; flex-shrink: 0;
            display: grid; place-items: center;
            border-radius: 22px;
            background: linear-gradient(140deg, #cfe6a8, #8fbf88);
            color: #1f3d2c;
            font-size: 24px; font-weight: 800; letter-spacing: -0.5px;
            box-shadow: 0 8px 20px rgba(0,0,0,.18);
          }

          .up-avatar-dot {
            position: absolute; right: -3px; bottom: -3px;
            width: 18px; height: 18px;
            border-radius: 50%;
            border: 3px solid #2e5a3f;
            background: #45b879;
          }

          .up-hero-info { flex: 1; min-width: 0; position: relative; z-index: 1; }
          .up-hero-eyebrow { margin: 0 0 3px; font-size: 10px; font-weight: 800; letter-spacing: 1.4px; color: rgba(255,255,255,.7); }

          .up-hero-name {
            margin: 0;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: clamp(20px, 2vw, 28px);
            font-weight: 700; letter-spacing: -0.6px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }

          .up-hero-name-input {
            width: min(420px, 100%);
            padding: 6px 10px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,.35);
            background: rgba(255,255,255,.12);
            color: #fff;
            font-family: Georgia, 'Times New Roman', serif !important;
            font-size: 22px; font-weight: 700;
            outline: none;
          }

          .up-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
          .up-chip {
            display: inline-flex; align-items: center; gap: 5px;
            padding: 4px 10px;
            border-radius: 99px;
            background: rgba(255,255,255,.13);
            border: 1px solid rgba(255,255,255,.14);
            font-size: 11px; font-weight: 600;
            color: rgba(255,255,255,.9);
          }

          .up-hero-actions { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
          .up-hero-actions .row { display: flex; gap: 8px; }
          .up-msg { margin: 0; font-size: 11px; font-weight: 600; max-width: 280px; text-align: right; }
          .up-msg.err { color: #ffd2cc; }
          .up-msg.ok { color: #d6f3d0; }

          /* ================= BODY STATS ================= */
          .up-body { grid-area: body; }

          .up-tiles {
            flex: 1; min-height: 0;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            grid-template-rows: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .up-tile {
            min-width: 0; min-height: 0;
            display: flex; flex-direction: column; justify-content: center;
            padding: 10px 14px;
            border-radius: 14px;
            border: 1px solid var(--up-border);
            background: var(--up-tile);
          }
          .up-tile.wide { grid-column: span 2; }

          .up-tile label, .up-tile .lbl {
            display: flex; align-items: center; gap: 6px;
            font-size: 11px; font-weight: 700;
            color: var(--up-muted);
          }

          .up-tile strong {
            margin-top: 4px;
            font-size: clamp(18px, 1.7vw, 24px);
            font-weight: 800;
            color: var(--up-ink);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .up-tile strong small { margin-left: 3px; font-size: 12px; font-weight: 700; color: var(--up-muted); }
          .up-tile em { font-style: normal; font-size: 10.5px; color: var(--up-muted); margin-top: 2px; }

          .up-tile input {
            width: 100%; margin-top: 6px;
            height: 38px; padding: 0 10px;
            border-radius: 10px;
            border: 1px solid var(--up-border);
            background: var(--up-surface);
            color: var(--up-text);
            font-size: 15px; font-weight: 700;
            outline: none;
          }
          .up-tile input:focus { border-color: var(--up-primary); }

          .up-seg {
            display: flex; gap: 4px; margin-top: 6px;
            padding: 3px;
            border-radius: 11px;
            border: 1px solid var(--up-border);
            background: var(--up-surface);
          }
          .up-seg button {
            flex: 1; min-width: 0;
            height: 32px;
            border: 0; border-radius: 8px;
            background: transparent;
            color: var(--up-muted);
            font-size: 11.5px; font-weight: 700;
            white-space: nowrap;
          }
          .up-seg button.on { background: #45634d; color: #fff; }
          [data-theme="dark"] .up-seg button.on { background: var(--up-cal); color: #173c2a; }

          .up-missing { color: var(--up-near) !important; font-size: 14px !important; }

          /* ================= BMI ================= */
          .up-bmi { grid-area: bmi; }

          .up-bmi-main { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; }
          .up-bmi-value { display: flex; align-items: baseline; gap: 10px; }
          .up-bmi-value strong { font-size: clamp(34px, 3.2vw, 46px); font-weight: 800; color: var(--up-ink); letter-spacing: -1px; line-height: 1; }

          .up-pill {
            display: inline-flex; align-items: center;
            padding: 4px 10px; border-radius: 99px;
            font-size: 11px; font-weight: 800;
          }
          .up-pill.ok { color: var(--up-ok); background: color-mix(in srgb, var(--up-ok) 14%, transparent); }
          .up-pill.near { color: var(--up-near); background: color-mix(in srgb, var(--up-near) 16%, transparent); }
          .up-pill.over { color: var(--up-over); background: color-mix(in srgb, var(--up-over) 16%, transparent); }
          .up-pill.under { color: var(--up-under); background: color-mix(in srgb, var(--up-under) 16%, transparent); }
          .up-pill.info { color: var(--up-muted); background: var(--up-soft); }

          .up-gauge { position: relative; margin: 16px 0 6px; }
          .up-gauge-bar {
            display: grid;
            grid-template-columns: 14% 26% 20% 40%;
            height: 10px;
            border-radius: 99px;
            overflow: hidden;
          }
          .up-gauge-bar span:nth-child(1) { background: color-mix(in srgb, var(--up-under) 60%, transparent); }
          .up-gauge-bar span:nth-child(2) { background: color-mix(in srgb, var(--up-ok) 70%, transparent); }
          .up-gauge-bar span:nth-child(3) { background: color-mix(in srgb, var(--up-near) 65%, transparent); }
          .up-gauge-bar span:nth-child(4) { background: color-mix(in srgb, var(--up-over) 55%, transparent); }

          .up-marker {
            position: absolute; top: 50%;
            width: 18px; height: 18px;
            border-radius: 50%;
            border: 3px solid var(--up-surface);
            background: var(--up-ink);
            transform: translate(-50%, -50%);
            box-shadow: 0 2px 8px rgba(0,0,0,.2);
            transition: left .5s ease;
          }

          .up-gauge-labels { position: relative; height: 14px; font-size: 10px; color: var(--up-muted); }
          .up-gauge-labels span { position: absolute; transform: translateX(-50%); }
          .up-gauge-labels span:first-child { transform: none; }
          .up-gauge-labels span:last-child { transform: translateX(-100%); }
          .up-note { margin: 10px 0 0; font-size: 11px; line-height: 1.5; color: var(--up-muted); }

          /* ================= GOALS ================= */
          .up-goals { grid-area: goals; }

          .up-goal-grid {
            flex: 1; min-height: 0;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .up-goal {
            min-width: 0; min-height: 0;
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
            text-align: center;
            padding: 10px 14px;
            border-radius: 14px;
            border: 1px solid var(--up-border);
            background: var(--up-tile);
          }

          .up-ring { position: relative; width: clamp(76px, 7.5vw, 112px); aspect-ratio: 1; flex-shrink: 0; }
          .up-ring-arc { transition: stroke-dashoffset .9s ease-out; animation: upRingIn 1s ease-out; }
          @keyframes upRingIn { from { stroke-dashoffset: ${RING_C}; } }
          .up-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
          .up-ring-center { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
          .up-ring-center b { font-size: clamp(15px, 1.4vw, 20px); font-weight: 800; color: var(--up-ink); }
          .up-ring-center small { font-size: 9.5px; color: var(--up-muted); }

          .up-goal-info { min-width: 0; }
          .up-goal-info span { display: block; font-size: 11px; font-weight: 700; color: var(--up-muted); }
          .up-goal-info strong { display: block; margin-top: 2px; font-size: clamp(16px, 1.5vw, 21px); font-weight: 800; color: var(--up-ink); white-space: nowrap; }
          .up-goal-info strong small { font-size: 11px; color: var(--up-muted); margin-left: 2px; }
          .up-goal-info em { display: block; margin-top: 3px; font-style: normal; font-size: 10.5px; color: var(--up-muted); }

          .up-source { margin: 10px 0 0; display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--up-muted); flex-shrink: 0; }

          /* ================= SECURITY ================= */
          .up-sec { grid-area: sec; }

          .up-sec-rows { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 8px; }

          .up-sec-row {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 12px;
            border-radius: 14px;
            border: 1px solid var(--up-border);
            background: var(--up-tile);
          }
          .up-sec-row > svg { flex-shrink: 0; color: var(--up-primary); }
          [data-theme="dark"] .up-sec-row > svg { color: var(--up-cal); }
          .up-sec-row div { flex: 1; min-width: 0; }
          .up-sec-row strong { display: block; font-size: 12.5px; color: var(--up-ink); }
          .up-sec-row span { display: block; font-size: 10.5px; color: var(--up-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          .up-pw { display: flex; flex-direction: column; gap: 7px; }
          .up-pw-field { position: relative; }
          .up-pw-field input {
            width: 100%; height: 36px;
            padding: 0 36px 0 12px;
            border-radius: 10px;
            border: 1px solid var(--up-border);
            background: var(--up-surface);
            color: var(--up-text);
            font-size: 12.5px;
            outline: none;
          }
          .up-pw-field input:focus { border-color: var(--up-primary); }
          .up-pw-field button {
            position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
            border: 0; background: transparent; color: var(--up-muted);
            display: grid; place-items: center; padding: 4px;
          }
          .up-pw-error { margin: 0; font-size: 11px; line-height: 1.4; color: var(--up-over); }
          .up-pw-ok { margin: 0; font-size: 11px; color: var(--up-ok); display: flex; align-items: center; gap: 5px; }
          .up-pw-actions { display: flex; gap: 6px; }
          .up-pw-actions .up-btn { flex: 1; padding: 8px 10px; }

          /* ================= RESPONSIVE ================= */
          @media (max-height: 800px) {
            .up-page { gap: 9px; }
            .up-card { padding: 12px 14px; border-radius: 16px; }
            .up-head { margin-bottom: 8px; }
            .up-hero { padding: 12px 18px; }
            .up-avatar { width: 56px; height: 56px; font-size: 20px; border-radius: 18px; }
            .up-ring { width: 68px; height: 68px; }
            .up-head p { display: none; }
          }

          @media (max-width: 1100px) {
            .up-page {
              height: auto;
              grid-template-rows: auto;
              grid-template-areas:
                "hero hero hero hero hero hero hero hero hero hero hero hero"
                "body body body body body body body body body body body body"
                "bmi bmi bmi bmi bmi bmi sec sec sec sec sec sec"
                "goals goals goals goals goals goals goals goals goals goals goals goals";
            }
            .up-tiles { grid-template-rows: auto auto; }
          }

          @media (max-width: 700px) {
            .up-page { grid-template-columns: 1fr; grid-template-areas: "hero" "body" "bmi" "goals" "sec"; }
            .up-hero { flex-wrap: wrap; }
            .up-hero-actions { align-items: flex-start; }
            .up-tiles, .up-goal-grid { grid-template-columns: 1fr 1fr; }
          }

          /* ===== PHONE: profile card, goals, inputs ===== */
          @media (max-width: 700px) {
            .up-hero { gap: 14px; padding: 16px; }
            .up-avatar { width: 60px; height: 60px; font-size: 21px; border-radius: 19px; }
            .up-hero-name { white-space: normal; overflow-wrap: anywhere; }
            .up-hero-name-input { width: 100%; font-size: 18px; }
            .up-chip { max-width: 100%; min-width: 0; overflow-wrap: anywhere; word-break: break-all; }
            .up-hero-actions { width: 100%; align-items: stretch; }
            .up-hero-actions > .up-btn { width: 100%; padding: 11px 14px; }
            .up-hero-actions .row { width: 100%; }
            .up-hero-actions .row .up-btn { flex: 1; padding: 11px 10px; }
            .up-msg { max-width: none; text-align: left; }
            .up-tile input { font-size: 16px; }
            .up-pw-field input { font-size: 16px; }
            .up-seg button { padding: 0 4px; font-size: 11px; }
            .up-goal-grid { grid-template-columns: 1fr; }
            .up-goal { flex-direction: row; justify-content: flex-start; text-align: left; gap: 16px; padding: 12px 14px; }
            .up-ring { width: 84px; }
            .up-goal-info em { white-space: normal; }
          }
        `}</style>

        {/* ================= HERO ================= */}
        <motion.section
          className="up-hero"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="up-avatar" aria-hidden="true">
            {initials(view.fullName)}
            <span className="up-avatar-dot" />
          </div>

          <div className="up-hero-info">
            <p className="up-hero-eyebrow">MY PROFILE</p>

            {editing ? (
              <input
                className="up-hero-name-input"
                aria-label="Full name"
                value={draft.fullName}
                onChange={event => update('fullName', event.target.value)}
                autoFocus
              />
            ) : (
              <h2 className="up-hero-name">{titleCase(profile.fullName) || 'Your name'}</h2>
            )}

            <div className="up-chips">
              <span className="up-chip">
                <Mail size={12} /> {profile.email}
              </span>
              {targets && (
                <span className="up-chip up-num">
                  <Sparkles size={12} /> {targets.calories.toLocaleString()} kcal daily target
                </span>
              )}
            </div>
          </div>

          <div className="up-hero-actions">
            {editing ? (
              <div className="row">
                <button type="button" className="up-btn ghost-light" onClick={cancelEditing} disabled={saving}>
                  <X size={14} /> Cancel
                </button>
                <button type="submit" className="up-btn light" disabled={saving}>
                  <Check size={14} /> {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            ) : (
              <button type="button" className="up-btn light" onClick={startEditing}>
                <Pencil size={14} /> Edit profile
              </button>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.p key={`e-${error}`} role="alert" className="up-msg err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {error}
                </motion.p>
              )}
              {!error && notice && !editing && (
                <motion.p key={`n-${notice}`} role="status" className="up-msg ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {notice}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ================= BODY & ACTIVITY ================= */}
        <motion.section className="up-card up-body" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <div className="up-head">
            <div className="up-head-left">
              <span className="up-icon"><UserRound size={17} /></span>
              <div>
                <h3>Body &amp; Activity</h3>
                <p>Used to estimate your daily targets</p>
              </div>
            </div>
          </div>

          <div className="up-tiles">
            {[
              { key: 'age' as const, label: 'Age', unit: 'yrs', icon: CalendarDays, step: '1' },
              { key: 'height' as const, label: 'Height', unit: 'cm', icon: Ruler, step: '0.1' },
              { key: 'weight' as const, label: 'Weight', unit: 'kg', icon: Scale, step: '0.1' },
            ].map(field => {
              const Icon = field.icon
              return (
                <div className="up-tile" key={field.key}>
                  <label htmlFor={`up-${field.key}`}>
                    <Icon size={13} /> {field.label}
                  </label>
                  {editing ? (
                    <input
                      id={`up-${field.key}`}
                      className="up-num"
                      type="number"
                      step={field.step}
                      value={draft[field.key]}
                      onChange={event => update(field.key, event.target.value)}
                    />
                  ) : (
                    <strong className="up-num">
                      {profile[field.key] ? Number(profile[field.key]).toLocaleString() : '—'}
                      <small>{field.unit}</small>
                    </strong>
                  )}
                </div>
              )
            })}

            <div className="up-tile">
              <span className="lbl" id="up-sex-label"><UserRound size={13} /> Sex</span>
              {editing ? (
                <div className="up-seg" role="radiogroup" aria-labelledby="up-sex-label">
                  {(['female', 'male'] as Sex[]).map(option => (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={draft.sex === option}
                      className={draft.sex === option ? 'on' : ''}
                      onClick={() => update('sex', option)}
                    >
                      {option === 'female' ? 'Female' : 'Male'}
                    </button>
                  ))}
                </div>
              ) : profile.sex ? (
                <strong>{profile.sex === 'female' ? 'Female' : 'Male'}</strong>
              ) : (
                <strong className="up-missing">Not set — tap Edit</strong>
              )}
            </div>

            <div className="up-tile wide">
              <span className="lbl" id="up-activity-label"><Activity size={13} /> Activity level</span>
              {editing ? (
                <>
                  <div className="up-seg" role="radiogroup" aria-labelledby="up-activity-label">
                    {(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map(option => (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={draft.activity === option}
                        className={draft.activity === option ? 'on' : ''}
                        onClick={() => update('activity', option)}
                      >
                        {ACTIVITY_LEVELS[option].label}
                      </button>
                    ))}
                  </div>
                  <em>{activity.hint}</em>
                </>
              ) : (
                <>
                  <strong>{activity.label}</strong>
                  <em>{activity.hint}</em>
                </>
              )}
            </div>
          </div>
        </motion.section>

        {/* ================= BMI ================= */}
        <motion.section className="up-card up-bmi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div className="up-head">
            <div className="up-head-left">
              <span className="up-icon"><Scale size={17} /></span>
              <div>
                <h3>Body Mass Index</h3>
                <p>WHO adult categories</p>
              </div>
            </div>
          </div>

          <div className="up-bmi-main">
            {bmi !== null ? (
              <>
                <div className="up-bmi-value">
                  <strong className="up-num">{bmi.toFixed(1)}</strong>
                  {category ? (
                    <span className={`up-pill ${category.tone}`}>{category.label}</span>
                  ) : (
                    <span className="up-pill info">Under 18</span>
                  )}
                </div>

                <div className="up-gauge" aria-hidden="true">
                  <div className="up-gauge-bar">
                    <span /><span /><span /><span />
                  </div>
                  <span className="up-marker" style={{ left: `${bmiPosition(bmi)}%` }} />
                </div>
                <div className="up-gauge-labels up-num">
                  {[15, 18.5, 25, 30, 40].map(value => (
                    <span key={value} style={{ left: `${bmiPosition(value)}%` }}>{value}</span>
                  ))}
                </div>

                <p className="up-note">
                  {category
                    ? 'BMI is a quick screening number, not a diagnosis. It does not consider muscle or body shape.'
                    : 'For people under 18, BMI is read with age-based growth charts instead of adult categories.'}
                </p>
              </>
            ) : (
              <p className="up-note">Add your height and weight to see your BMI.</p>
            )}
          </div>
        </motion.section>

        {/* ================= DAILY TARGETS ================= */}
        <motion.section className="up-card up-goals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <div className="up-head">
            <div className="up-head-left">
              <span className="up-icon"><Sparkles size={17} /></span>
              <div>
                <h3>Daily Targets</h3>
                <p>{editing ? 'Updates as you edit' : 'Rings show what you ate today'}</p>
              </div>
            </div>
            {!targets && <span className="up-pill near">General reference</span>}
          </div>

          <div className="up-goal-grid">
            {goalItems.map(item => {
              const share = item.goal > 0 ? Math.min(1, item.value / item.goal) : 0
              const over = item.limit && item.value > item.goal
              return (
                <div className="up-goal" key={item.key}>
                  <div className="up-ring">
                    <svg viewBox="0 0 84 84" aria-hidden="true">
                      <circle cx="42" cy="42" r={RING_R} fill="none" stroke="var(--up-track)" strokeWidth="8" />
                      <circle
                        className="up-ring-arc"
                        cx="42" cy="42" r={RING_R}
                        fill="none"
                        stroke={over ? 'var(--up-over)' : item.color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={RING_C}
                        strokeDashoffset={RING_C * (1 - share)}
                      />
                    </svg>
                    <div className="up-ring-center">
                      <b className="up-num">{Math.round(share * 100)}%</b>
                      <small>today</small>
                    </div>
                  </div>

                  <div className="up-goal-info">
                    <span>{item.label} {item.limit ? 'limit' : 'target'}</span>
                    <strong className="up-num">
                      {item.limit ? '< ' : ''}{item.goal.toLocaleString()}<small>{item.unit}</small>
                    </strong>
                    <em className="up-num">
                      {Math.round(item.value).toLocaleString()} {item.unit} eaten today
                    </em>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="up-source">
            <ShieldCheck size={13} />
            {targets
              ? 'Calories: FAO/WHO/UNU energy needs. Sugar under 10% of calories and sodium under 2,000 mg (WHO).'
              : 'Set your sex in Edit profile to get targets made for you. Until then we use 2,000 kcal / 50 g / 2,000 mg.'}
          </p>
        </motion.section>

        {/* ================= SECURITY ================= */}
        <motion.section className="up-card up-sec" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="up-head">
            <div className="up-head-left">
              <span className="up-icon"><ShieldCheck size={17} /></span>
              <div>
                <h3>Account &amp; Security</h3>
                <p>Keep your account safe</p>
              </div>
            </div>
          </div>

          <div className="up-sec-rows">
            {passwordOpen ? (
              <div className="up-pw">
                {[
                  { label: 'Current password', value: currentPassword, set: setCurrentPassword, auto: 'current-password' },
                  { label: 'New password (8+ characters)', value: newPassword, set: setNewPassword, auto: 'new-password' },
                  { label: 'Confirm new password', value: confirmPassword, set: setConfirmPassword, auto: 'new-password' },
                ].map((field, index) => (
                  <div className="up-pw-field" key={field.label}>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      placeholder={field.label}
                      aria-label={field.label}
                      autoComplete={field.auto}
                      value={field.value}
                      onChange={event => {
                        field.set(event.target.value)
                        setPasswordError('')
                      }}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void submitPassword()
                        }
                      }}
                      autoFocus={index === 0}
                    />
                    {index === 0 && (
                      <button
                        type="button"
                        aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                        onClick={() => setShowPasswords(value => !value)}
                      >
                        {showPasswords ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    )}
                  </div>
                ))}

                {passwordError && <p className="up-pw-error" role="alert">{passwordError}</p>}

                <div className="up-pw-actions">
                  <button type="button" className="up-btn" onClick={closePassword} disabled={passwordBusy}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="up-btn primary"
                    disabled={passwordBusy}
                    onClick={() => void submitPassword()}
                  >
                    {passwordBusy ? 'Saving…' : 'Update'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="up-sec-row">
                  <KeyRound size={17} />
                  <div>
                    <strong>Password</strong>
                    {passwordDone ? (
                      <p className="up-pw-ok"><Check size={12} /> Password changed</p>
                    ) : (
                      <span>Change the password you sign in with</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="up-btn"
                    onClick={() => {
                      setPasswordDone(false)
                      setPasswordOpen(true)
                    }}
                  >
                    <LockKeyhole size={13} /> Change
                  </button>
                </div>

                <div className="up-sec-row">
                  <Mail size={17} />
                  <div>
                    <strong>Signed-in email</strong>
                    <span>{profile.email}</span>
                  </div>
                </div>

                <div className="up-sec-row">
                  <LogOut size={17} />
                  <div>
                    <strong>Sign out</strong>
                    <span>End this session on this device</span>
                  </div>
                  <button type="button" className="up-btn danger" onClick={onSignOut}>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.section>
      </form>
    </MotionConfig>
  )
}