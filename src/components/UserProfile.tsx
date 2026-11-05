
import { useState, type CSSProperties, type FormEvent } from 'react'
import { motion } from 'motion/react'
import {
  UserRound,
  Mail,
  CalendarDays,
  Ruler,
  Scale,
  Target,
  Candy,
  Droplets,
  Save,
  Pencil,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'

type ProfileData = {
  fullName: string
  email: string
  age: string
  height: string
  weight: string
  calories: string
  sugar: string
  sodium: string
}

const initialProfile: ProfileData = {
  fullName: 'Test User',
  email: 'test@gmail.com',
  age: '21',
  height: '165',
  weight: '55',
  calories: '2000',
  sugar: '50',
  sodium: '2300',
}

type UserProfileProps = {
  onBack?: () => void
}

export default function UserProfile({ onBack }: UserProfileProps) {
  const [profile, setProfile] = useState<ProfileData>(initialProfile)
  const [draft, setDraft] = useState<ProfileData>(initialProfile)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const inputStyle: CSSProperties = {
    width: '100%',
    minWidth: 0,
    height: 46,
    padding: '0 14px',
    borderRadius: 11,
    border: '1px solid var(--border)',
    background: editing ? 'var(--bg)' : 'var(--surface)',
    color: 'var(--text)',
    fontSize: 14,
    outlineColor: 'var(--primary)',
    opacity: editing ? 1 : 0.85,
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    color: 'var(--muted)',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 8,
  }

  const updateField = (field: keyof ProfileData, value: string) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }))
    setError('')
    setSaved(false)
  }

  const startEditing = () => {
    setDraft({ ...profile })
    setEditing(true)
    setSaved(false)
    setError('')
  }

  const cancelEditing = () => {
    setDraft({ ...profile })
    setEditing(false)
    setError('')
  }

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!draft.fullName.trim() || !draft.email.trim()) {
      setError('Name and email cannot be empty.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    const numericFields: {
      key: keyof ProfileData
      label: string
      min: number
      max: number
    }[] = [
      { key: 'age', label: 'Age', min: 13, max: 120 },
      { key: 'height', label: 'Height', min: 80, max: 250 },
      { key: 'weight', label: 'Weight', min: 15, max: 400 },
      { key: 'calories', label: 'Calories', min: 500, max: 10000 },
      { key: 'sugar', label: 'Sugar', min: 0, max: 500 },
      { key: 'sodium', label: 'Sodium', min: 0, max: 10000 },
    ]

    for (const field of numericFields) {
      const rawValue = draft[field.key].trim()
      const value = Number(rawValue)

      if (
        rawValue === '' ||
        !Number.isFinite(value) ||
        value < field.min ||
        value > field.max
      ) {
        setError(
          `${field.label} must be between ${field.min} and ${field.max}.`
        )
        return
      }

      if (field.key === 'age' && !Number.isInteger(value)) {
        setError('Age must be a whole number.')
        return
      }
    }

    // Frontend-only save. No database request is made.
    setProfile({
      ...draft,
      fullName: draft.fullName.trim(),
      email: draft.email.trim().toLowerCase(),
    })
    setEditing(false)
    setSaved(true)
  }

  const fields = [
    {
      key: 'fullName' as const,
      label: 'Full Name',
      icon: UserRound,
      type: 'text',
      placeholder: 'Your full name',
    },
    {
      key: 'email' as const,
      label: 'Email Address',
      icon: Mail,
      type: 'email',
      placeholder: 'you@example.com',
    },
    {
      key: 'age' as const,
      label: 'Age (years)',
      icon: CalendarDays,
      type: 'number',
      placeholder: 'Age',
    },
    {
      key: 'height' as const,
      label: 'Height (cm)',
      icon: Ruler,
      type: 'number',
      placeholder: 'Height',
    },
    {
      key: 'weight' as const,
      label: 'Weight (kg)',
      icon: Scale,
      type: 'number',
      placeholder: 'Weight',
    },
  ]

  const nutritionFields = [
    {
      key: 'calories' as const,
      label: 'Daily Calorie Goal',
      unit: 'kcal',
      icon: Target,
    },
    {
      key: 'sugar' as const,
      label: 'Daily Sugar Goal',
      unit: 'g',
      icon: Candy,
    },
    {
      key: 'sodium' as const,
      label: 'Daily Sodium Goal',
      unit: 'mg',
      icon: Droplets,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        width: '100%',
        maxWidth: 1050,
        margin: '0 auto',
        color: 'var(--text)',
      }}
    >
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 30,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: 'var(--muted)',
              margin: '0 0 8px',
            }}
          >
            ACCOUNT SETTINGS
          </p>
          <h1
            style={{
              fontSize: 32,
              margin: '0 0 8px',
              letterSpacing: '-1px',
            }}
          >
            My Profile
          </h1>
          <p
            style={{
              color: 'var(--muted)',
              margin: 0,
              fontSize: 14,
            }}
          >
            Manage your personal information and nutrition preferences.
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '11px 16px',
              background: 'var(--surface)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Back to Dashboard
          </button>
        )}
      </div>

      {/* Profile summary */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 26,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 18,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 20,
            background: '#DAD7CD',
            color: '#344E41',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <UserRound size={32} />
        </div>

        <div style={{ flex: 1, minWidth: 180 }}>
          <h2 style={{ margin: '0 0 5px', fontSize: 21 }}>
            {profile.fullName}
          </h2>
          <p
            style={{
              color: 'var(--muted)',
              margin: 0,
              fontSize: 13,
            }}
          >
            {profile.email}
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              border: 0,
              borderRadius: 12,
              padding: '12px 17px',
              background: '#45634D',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Pencil size={16} />
            Edit Profile
          </button>
        )}
      </div>

      <form onSubmit={handleSave} noValidate>
        {/* Personal information */}
        <section
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 'clamp(20px, 4vw, 30px)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 19, margin: '0 0 8px' }}>
            Personal Information
          </h2>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: 13,
              margin: '0 0 26px',
              lineHeight: 1.6,
            }}
          >
            Your basic information and body measurements.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
              gap: 20,
            }}
          >
            {fields.map((field) => {
              const Icon = field.icon

              return (
                <div key={field.key}>
                  <label htmlFor={`profile-${field.key}`} style={labelStyle}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                      }}
                    >
                      <Icon size={15} />
                      {field.label}
                    </span>
                  </label>

                  <input
                    id={`profile-${field.key}`}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={draft[field.key]}
                    disabled={!editing}
                    onChange={(event) =>
                      updateField(field.key, event.target.value)
                    }
                    style={inputStyle}
                  />
                </div>
              )
            })}
          </div>
        </section>

        {/* Nutrition goals */}
        <section
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 'clamp(20px, 4vw, 30px)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 19, margin: '0 0 8px' }}>
            Daily Nutrition Goals
          </h2>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: 13,
              lineHeight: 1.6,
              margin: '0 0 26px',
            }}
          >
            Customize the targets displayed in your nutrition tracker.
            These values are examples, not personalized medical recommendations.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
              gap: 20,
            }}
          >
            {nutritionFields.map((field) => {
              const Icon = field.icon

              return (
                <div key={field.key}>
                  <label htmlFor={`goal-${field.key}`} style={labelStyle}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                      }}
                    >
                      <Icon size={15} />
                      {field.label}
                    </span>
                  </label>

                  <div style={{ position: 'relative' }}>
                    <input
                      id={`goal-${field.key}`}
                      type="number"
                      min="0"
                      value={draft[field.key]}
                      disabled={!editing}
                      onChange={(event) =>
                        updateField(field.key, event.target.value)
                      }
                      style={{
                        ...inputStyle,
                        paddingRight: 54,
                      }}
                    />

                    <span
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: 15,
                        fontSize: 12,
                        color: 'var(--muted)',
                      }}
                    >
                      {field.unit}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Security information */}
        <section
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 25,
            marginBottom: 24,
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          <ShieldCheck
            size={23}
            style={{
              color: 'var(--primary)',
              flexShrink: 0,
            }}
          />
          <div>
            <h2 style={{ fontSize: 17, margin: '0 0 8px' }}>
              Account Security
            </h2>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: 13,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Password changes, email verification, and secure account
              management will be connected when the backend is implemented.
            </p>
          </div>
        </section>

        {/* Messages */}
        {error && (
          <p
            role="alert"
            style={{
              color: '#B45342',
              fontSize: 13,
              marginBottom: 18,
            }}
          >
            {error}
          </p>
        )}

        {saved && (
          <p
            role="status"
            style={{
              color: 'var(--primary)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 18,
            }}
          >
            <CheckCircle2 size={17} />
            Profile updated in this demo session.
          </p>
        )}

        {/* Save / cancel */}
        {editing && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={cancelEditing}
              style={{
                padding: '13px 22px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '13px 22px',
                borderRadius: 12,
                border: 0,
                background: '#45634D',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Save size={17} />
              Save Changes
            </motion.button>
          </div>
        )}
      </form>
    </motion.div>
  )
}
