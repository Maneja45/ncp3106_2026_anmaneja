import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from 'lucide-react'
import AuthSplit from './AuthSplit'
import { requestResetCode } from '../services/recovery'

type ForgotPasswordProps = {
  onContinue?: (email: string) => void
  onBackToLogin?: () => void
}

export default function ForgotPassword({ onContinue, onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending) return

    setError('')

    const cleanedEmail = email.trim().toLowerCase()

    if (!cleanedEmail) {
      setError('Please enter your email address.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setSending(true)

    try {
      await requestResetCode(cleanedEmail)
      onContinue?.(cleanedEmail)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to send the code.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthSplit
      step={1}
      heroTitle={
        <>
          Let's get you
          <br />
          back in.
        </>
      }
      heroText="We'll email a 6-digit code from sustansyabox.support@gmail.com so you can safely set a new password."
    >
      <button
        className="auth-back"
        type="button"
        onClick={onBackToLogin}
        disabled={!onBackToLogin || sending}
      >
        <ArrowLeft size={14} />
        Back to Sign In
      </button>

      <div className="auth-icon">
        <ShieldCheck size={26} />
      </div>

      <p className="auth-eyebrow">ACCOUNT RECOVERY</p>
      <h2 className="auth-heading">Forgot your password?</h2>
      <p className="auth-subtitle">
        No worries! Enter the email address of your SustansyaBox account and we'll
        send you a code.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <label className="auth-label" htmlFor="recovery-email">
          Email address
        </label>

        <div className="auth-field">
          <Mail className="auth-field-icon" size={16} />
          <input
            id="recovery-email"
            className="auth-input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={sending}
            autoFocus
          />
        </div>

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
          disabled={sending}
          whileHover={sending ? {} : { scale: 1.01 }}
          whileTap={sending ? {} : { scale: 0.985 }}
        >
          {sending ? 'Sending code…' : 'Send Code'}
          {!sending && <ArrowRight size={17} />}
        </motion.button>
      </form>

      <p className="auth-note">
        Signed up with Google? You can also just use “Continue with Google” on the
        sign-in page.
      </p>
    </AuthSplit>
  )
}