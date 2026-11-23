import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  LockKeyhole,
} from 'lucide-react'
import AuthSplit from './AuthSplit'
import { resetPassword } from '../services/recovery'

type ResetPasswordProps = {
  email: string
  /** One-time token from the code step */
  token: string
  onComplete?: () => void
  onBack?: () => void
}

export default function ResetPassword({ email, token, onComplete, onBack }: ResetPasswordProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)

  const rules = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Both passwords match', ok: password !== '' && password === confirmPassword },
  ]

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    setError('')

    if (!password || !confirmPassword) {
      setError('Please complete both password fields.')
      return
    }

    if (password.length < 8) {
      setError('Your password must contain at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }

    setSaving(true)

    try {
      await resetPassword(email, token, password)
      setPassword('')
      setConfirmPassword('')
      setCompleted(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to change your password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthSplit
      step={3}
      heroTitle={
        completed ? (
          <>
            You're all
            <br />
            set.
          </>
        ) : (
          <>
            A fresh
            <br />
            start.
          </>
        )
      }
      heroText={
        completed
          ? 'Sign in with your new password and keep tracking your meals.'
          : 'Pick a password you have not used before, at least 8 characters long.'
      }
    >
      {!completed ? (
        <>
          <button className="auth-back" type="button" onClick={onBack} disabled={!onBack || saving}>
            <ArrowLeft size={14} />
            Start over
          </button>

          <div className="auth-icon">
            <LockKeyhole size={26} />
          </div>

          <p className="auth-eyebrow">ACCOUNT RECOVERY</p>
          <h2 className="auth-heading">Create new password</h2>
          <p className="auth-subtitle">
            Choose a new password for <strong>{email}</strong>.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="auth-label" htmlFor="new-password">
              New password
            </label>
            <div className="auth-field">
              <LockKeyhole className="auth-field-icon" size={16} />
              <input
                id="new-password"
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={saving}
                autoFocus
              />
              <button
                className="auth-eye"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <label className="auth-label" htmlFor="confirm-new-password">
              Confirm new password
            </label>
            <div className="auth-field">
              <LockKeyhole className="auth-field-icon" size={16} />
              <input
                id="confirm-new-password"
                className="auth-input"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={saving}
              />
              <button
                className="auth-eye"
                type="button"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirm((value) => !value)}
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <ul className="auth-rules">
              {rules.map((rule) => (
                <li key={rule.label} className={rule.ok ? 'ok' : ''}>
                  {rule.ok ? <Check size={13} /> : <Circle size={11} />}
                  {rule.label}
                </li>
              ))}
            </ul>

            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key={error}
                  role="alert"
                  className="auth-alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              className="auth-submit"
              type="submit"
              disabled={saving}
              whileHover={saving ? {} : { scale: 1.01 }}
              whileTap={saving ? {} : { scale: 0.985 }}
            >
              {saving ? 'Saving…' : 'Reset Password'}
              {!saving && <ArrowRight size={17} />}
            </motion.button>
          </form>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div className="auth-icon">
            <CheckCircle2 size={26} />
          </div>

          <p className="auth-eyebrow">ACCOUNT RECOVERY</p>
          <h2 className="auth-heading">Password changed!</h2>
          <p className="auth-subtitle">
            Your SustansyaBox password was updated. You can now sign in with your new
            password.
          </p>

          <motion.button
            className="auth-submit"
            type="button"
            onClick={onComplete}
            disabled={!onComplete}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
          >
            Return to Sign In
            <ArrowRight size={17} />
          </motion.button>
        </motion.div>
      )}
    </AuthSplit>
  )
}