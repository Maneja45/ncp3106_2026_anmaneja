
import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from 'lucide-react'

type ForgotPasswordProps = {
  onContinue?: (email: string) => void
  onBackToLogin?: () => void
}

export default function ForgotPassword({
  onContinue,
  onBackToLogin,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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

    if (onContinue) {
      onContinue(cleanedEmail)
    } else {
      setError('Password recovery is currently in preview mode.')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: 460,
          padding: 'clamp(24px, 5vw, 42px)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          boxShadow: '0 18px 55px rgba(0,0,0,0.06)',
        }}
      >
        <button
          type="button"
          onClick={onBackToLogin}
          disabled={!onBackToLogin}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 0,
            color: 'var(--primary)',
            fontWeight: 700,
            marginBottom: 32,
            cursor: onBackToLogin ? 'pointer' : 'default',
          }}
        >
          <ArrowLeft size={17} />
          Back to Sign In
        </button>

        <div
          style={{
            width: 66,
            height: 66,
            borderRadius: 20,
            background: '#DAD7CD',
            color: '#344E41',
            display: 'grid',
            placeItems: 'center',
            marginBottom: 26,
          }}
        >
          <ShieldCheck size={30} />
        </div>

        <p
          style={{
            color: 'var(--primary)',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 2,
            marginBottom: 12,
          }}
        >
          ACCOUNT RECOVERY
        </p>

        <h1
          style={{
            fontSize: 32,
            letterSpacing: '-1px',
            margin: '0 0 12px',
          }}
        >
          Forgot your password?
        </h1>

        <p
          style={{
            color: 'var(--muted)',
            fontSize: 14,
            lineHeight: 1.8,
            marginBottom: 30,
          }}
        >
          No worries! Enter the email address associated with your
          SustansyaBox account to start resetting your password.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label
            htmlFor="recovery-email"
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 9,
            }}
          >
            Email address
          </label>

          <div
            style={{
              position: 'relative',
              marginBottom: 22,
            }}
          >
            <Mail
              size={18}
              style={{
                position: 'absolute',
                left: 15,
                top: 16,
                color: 'var(--muted)',
              }}
            />

            <input
              id="recovery-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{
                width: '100%',
                height: 50,
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'var(--bg)',
                color: 'var(--text)',
                padding: '0 14px 0 44px',
                outline: 'none',
                fontSize: 14,
              }}
            />
          </div>

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

          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              height: 52,
              border: 0,
              borderRadius: 12,
              background: '#45634D',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            Continue
            <ArrowRight size={18} />
          </motion.button>
        </form>

        <p
          style={{
            marginTop: 26,
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--muted)',
            lineHeight: 1.7,
          }}
        >
          Password recovery is currently in demo mode.
          No email will be sent yet.
        </p>
      </motion.div>
    </div>
  )
}
