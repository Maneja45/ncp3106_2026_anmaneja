
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
import type { ProfileData } from '../types/profile'

type UserProfileProps = {
  onBack?: () => void
  profile: ProfileData
  onSave: (updatedProfile: ProfileData) => void
}

export default function UserProfile({
  onBack,
  profile,
  onSave,
}: UserProfileProps) {
  const [draft, setDraft] = useState<ProfileData>({ ...profile })
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const inputStyle: CSSProperties = {
    width: '100%',
    minWidth: 0,
    height: 42,
    padding: '0 12px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: editing ? 'var(--bg)' : 'var(--surface)',
    color: 'var(--text)',
    fontSize: 13,
    outlineColor: 'var(--primary)',
    opacity: editing ? 1 : 0.85,
    boxSizing: 'border-box',
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    color: 'var(--muted)',
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 7,
  }

  const cardStyle: CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 18,
    padding: '22px 25px',
    boxSizing: 'border-box',
  }

  const updateField = (field: keyof ProfileData, value: string) => {
    setDraft(previous => ({
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

    onSave({
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sb-settings-content"
      style={{
        width: '100%',
        maxWidth: 1050,
        margin: '0 auto',
        padding: '2px 0 4px',
        color: 'var(--text)',
        boxSizing: 'border-box',
      }}
    >
     
<style>{`
  .sb-settings-content .settings-fields-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px 16px;
  }

  .sb-settings-content .settings-goals-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .sb-settings-content .settings-card {
    margin-bottom: 12px;
  }

  .sb-settings-content .settings-header {
    margin-bottom: 14px;
  }

  .sb-settings-content .settings-card-description {
    margin-bottom: 13px;
  }

  .sb-settings-content input:disabled {
    cursor: default;
  }

  .sb-settings-content input:not(:disabled):focus {
    border-color: var(--primary) !important;
  }

  .sb-settings-content .settings-button {
    transition:
      transform 0.2s ease,
      filter 0.2s ease;
  }

  .sb-settings-content .settings-button:hover {
    transform: translateY(-1px);
    filter: brightness(1.07);
  }

  @media (min-width: 1000px) and (max-height: 850px) {
    .sb-settings-content {
      padding-top: 0 !important;
      padding-bottom: 2px !important;
    }

    .sb-settings-content .settings-header {
      margin-bottom: 10px;
    }

    .sb-settings-content .settings-card {
      margin-bottom: 9px;
      padding: 14px 20px !important;
    }

    .sb-settings-content .settings-card-description {
      margin-bottom: 10px;
    }

    .sb-settings-content .settings-fields-grid {
      gap: 9px 14px;
    }
  }

  @media (max-width: 900px) {
    .sb-settings-content .settings-fields-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 600px) {
    .sb-settings-content .settings-fields-grid,
    .sb-settings-content .settings-goals-grid {
      grid-template-columns: 1fr;
    }
  }
`}</style>


      {/* PAGE HEADER */}
      <div
        className="settings-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.4,
              color: 'var(--muted)',
              margin: '0 0 5px',
            }}
          >
            ACCOUNT SETTINGS
          </p>

          <h1
            style={{
              fontSize: 27,
              margin: '0 0 5px',
              letterSpacing: '-0.8px',
            }}
          >
            My Profile
          </h1>

          <p
            style={{
              color: 'var(--muted)',
              margin: 0,
              fontSize: 12,
            }}
          >
            Manage your personal information and nutrition preferences.
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="settings-button"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 11,
              padding: '10px 14px',
              background: 'var(--surface)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            Back to Dashboard
          </button>
        )}
      </div>

      {/* PROFILE SUMMARY */}
      <div
        className="settings-card"
        style={{
          ...cardStyle,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 15,
        }}
      >
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 16,
            background: '#DAD7CD',
            color: '#344E41',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <UserRound size={29} />
        </div>

        <div style={{ flex: 1, minWidth: 180 }}>
          <h2
            style={{
              margin: '0 0 4px',
              fontSize: 18,
            }}
          >
            {profile.fullName}
          </h2>

          <p
            style={{
              color: 'var(--muted)',
              margin: 0,
              fontSize: 12,
            }}
          >
            {profile.email}
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="settings-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: 0,
              borderRadius: 11,
              padding: '10px 15px',
              background: '#45634D',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <Pencil size={15} />
            Edit Profile
          </button>
        )}
      </div>

      <form onSubmit={handleSave} noValidate>
        {/* PERSONAL INFORMATION */}
        <section
          className="settings-card"
          style={cardStyle}
        >
          <h2
            style={{
              fontSize: 17,
              margin: '0 0 5px',
            }}
          >
            Personal Information
          </h2>

          <p
            className="settings-card-description"
            style={{
              color: 'var(--muted)',
              fontSize: 12,
              lineHeight: 1.5,
              marginTop: 0,
            }}
          >
            Your basic information and body measurements.
          </p>

          <div className="settings-fields-grid">
            {fields.map(field => {
              const Icon = field.icon

              return (
                <div
                  key={field.key}
                  style={{ minWidth: 0 }}
                >
                  <label
                    htmlFor={`profile-${field.key}`}
                    style={labelStyle}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon size={13} />
                      {field.label}
                    </span>
                  </label>

                  <input
                    id={`profile-${field.key}`}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={draft[field.key]}
                    disabled={!editing}
                    onChange={event =>
                      updateField(field.key, event.target.value)
                    }
                    style={inputStyle}
                  />
                </div>
              )
            })}
          </div>
        </section>

        {/* DAILY NUTRITION GOALS */}
        <section
          className="settings-card"
          style={cardStyle}
        >
          <h2
            style={{
              fontSize: 17,
              margin: '0 0 5px',
            }}
          >
            Daily Nutrition Goals
          </h2>

          <p
            className="settings-card-description"
            style={{
              color: 'var(--muted)',
              fontSize: 12,
              lineHeight: 1.5,
              marginTop: 0,
            }}
          >
            Customize the targets displayed in your nutrition tracker.
            These values are examples, not personalized medical
            recommendations.
          </p>

          <div className="settings-goals-grid">
            {nutritionFields.map(field => {
              const Icon = field.icon

              return (
                <div
                  key={field.key}
                  style={{ minWidth: 0 }}
                >
                  <label
                    htmlFor={`goal-${field.key}`}
                    style={labelStyle}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon size={13} />
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
                      onChange={event =>
                        updateField(field.key, event.target.value)
                      }
                      style={{
                        ...inputStyle,
                        paddingRight: 47,
                      }}
                    />

                    <span
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 11,
                        color: 'var(--muted)',
                        pointerEvents: 'none',
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

        {/* ACCOUNT SECURITY */}
        <section
          className="settings-card"
          style={{
            ...cardStyle,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <ShieldCheck
            size={20}
            style={{
              color: 'var(--primary)',
              flexShrink: 0,
              marginTop: 2,
            }}
          />

          <div>
            <h2
              style={{
                fontSize: 16,
                margin: '0 0 5px',
              }}
            >
              Account Security
            </h2>

            <p
              style={{
                color: 'var(--muted)',
                fontSize: 12,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Password changes, email verification, and secure account
              management will be connected when the backend is implemented.
            </p>
          </div>
        </section>

        {/* VALIDATION MESSAGE */}
        {error && (
          <p
            role="alert"
            style={{
              color: '#B45342',
              fontSize: 12,
              margin: '8px 0',
            }}
          >
            {error}
          </p>
        )}

        {/* SUCCESS MESSAGE */}
        {saved && (
          <p
            role="status"
            style={{
              color: 'var(--primary)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: '8px 0',
            }}
          >
            <CheckCircle2 size={16} />
            Profile changes saved in this browser demo.
          </p>
        )}

        {/* SAVE / CANCEL */}
        {editing && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={cancelEditing}
              className="settings-button"
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontWeight: 700,
                fontSize: 12,
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
                gap: 8,
                padding: '10px 16px',
                borderRadius: 10,
                border: 0,
                background: '#45634D',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <Save size={15} />
              Save Changes
            </motion.button>
          </div>
        )}
      </form>
    </motion.div>
  )
}
