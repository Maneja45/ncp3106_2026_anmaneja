
import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react'

type ResetPasswordProps = {
  onComplete?: () => void
  onBack?: () => void
}

export default function ResetPassword({
  onComplete,
  onBack,
}: ResetPasswordProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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

    // Frontend demo only. No password is actually changed.
    setCompleted(true)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 50,
    border: '1px solid var(--border)',
    borderRadius: 12,
    background: 'var(--bg)',
    color: 'var(--text)',
    padding: '0 48px 0 44px',
    fontSize: 14,
    outlineColor: 'var(--primary)',
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
        initial={{ opacity: 0, y: 24 }}
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
        {!completed ? (
          <>
            <button
              type="button"
              onClick={onBack}
              disabled={!onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: 0,
                background: 'transparent',
                color: 'var(--primary)',
                fontWeight: 700,
                marginBottom: 30,
                cursor: onBack ? 'pointer' : 'default',
              }}
            >
              <ArrowLeft size={17} />
              Back to verification
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
              <LockKeyhole size={30} />
            </div>

            <p
              style={{
                color: 'var(--primary)',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              ACCOUNT RECOVERY
            </p>

            <h1
              style={{
                fontSize: 32,
                letterSpacing: '-1px',
                margin: '12px 0',
              }}
            >
              Create new password
            </h1>

            <p
              style={{
                color: 'var(--muted)',
                fontSize: 14,
                lineHeight: 1.8,
                marginBottom: 30,
              }}
            >
              Choose a new password for your SustansyaBox account.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <label
                htmlFor="new-password"
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 9,
                }}
              >
                New password
              </label>

              <div style={{ position: 'relative', marginBottom: 20 }}>
                <LockKeyhole
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 15,
                    top: 16,
                    color: 'var(--muted)',
                  }}
                />

                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  style={inputStyle}
                />

                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    border: 0,
                    background: 'transparent',
                    color: 'var(--muted)',
                    padding: 4,
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>

              <label
                htmlFor="confirm-new-password"
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 9,
                }}
              >
                Confirm new password
              </label>

              <div style={{ position: 'relative', marginBottom: 24 }}>
                <LockKeyhole
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 15,
                    top: 16,
                    color: 'var(--muted)',
                  }}
                />

                <input
                  id="confirm-new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  style={inputStyle}
                />

                <button
                  type="button"
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    border: 0,
                    background: 'transparent',
                    color: 'var(--muted)',
                    padding: 4,
                    cursor: 'pointer',
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
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
                Reset Password
                <ArrowRight size={18} />
              </motion.button>
            </form>

            <p
              style={{
                color: 'var(--muted)',
                fontSize: 12,
                lineHeight: 1.7,
                textAlign: 'center',
                marginTop: 24,
              }}
            >
              Demo mode — your password will not actually change.
            </p>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center' }}
          >
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: 22,
                background: '#DAD7CD',
                color: '#344E41',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 24px',
              }}
            >
              <CheckCircle2 size={34} />
            </div>

            <h1 style={{ fontSize: 29, marginBottom: 12 }}>
              Demo reset complete!
            </h1>

            <p
              style={{
                color: 'var(--muted)',
                lineHeight: 1.8,
                fontSize: 14,
                marginBottom: 30,
              }}
            >
              You've completed the password reset preview.
              No account password was changed.
            </p>

            <button
              type="button"
              onClick={onComplete}
              disabled={!onComplete}
              style={{
                width: '100%',
                height: 50,
                border: 0,
                borderRadius: 12,
                background: '#45634D',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: onComplete ? 'pointer' : 'default',
              }}
            >
              Return to Sign In
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
