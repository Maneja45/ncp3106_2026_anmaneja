
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react'

type EmailVerificationProps = {
  email: string
  onVerified?: () => void
  onBack?: () => void
}

const DEMO_CODE = '123456'

export default function EmailVerification({
  email,
  onVerified,
  onBack,
}: EmailVerificationProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const updateDigit = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (!cleaned) {
      setDigits((prev) => prev.map((digit, i) => i === index ? '' : digit))
      setError('')
      return
    }

    const next = [...digits]
    next[index] = cleaned.slice(-1)
    setDigits(next)
    setError('')

    if (index < 5) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const next = Array(6).fill('')
    pasted.split('').forEach((digit, index) => {
      next[index] = digit
    })

    setDigits(next)
    setError('')
    inputs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleVerify = () => {
    const code = digits.join('')

    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }

    if (code !== DEMO_CODE) {
      setError('Incorrect demo code. Please try again.')
      return
    }

    setError('')
    setSuccess(true)
    onVerified?.()
  }

  const handleResend = () => {
    setDigits(Array(6).fill(''))
    setError('Demo code reset. Use 123456 to test verification.')
    inputs.current[0]?.focus()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: 470,
          padding: 'clamp(24px, 5vw, 42px)',
          borderRadius: 24,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 18px 55px rgba(0,0,0,0.06)',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 0,
            padding: 0,
            color: 'var(--primary)',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 32,
          }}
        >
          <ArrowLeft size={17} />
          Back to registration
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
          {success ? <ShieldCheck size={30} /> : <MailCheck size={30} />}
        </div>

        <p
          style={{
            color: 'var(--primary)',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          ACCOUNT VERIFICATION
        </p>

        <h1
          style={{
            fontSize: 32,
            letterSpacing: '-1px',
            margin: '12px 0',
          }}
        >
          {success ? 'Email verified!' : 'Verify your email'}
        </h1>

        <p
          style={{
            color: 'var(--muted)',
            fontSize: 14,
            lineHeight: 1.8,
            marginBottom: 30,
          }}
        >
          {success
            ? 'Demo verification completed successfully.'
            : <>Enter the 6-digit verification code for <strong style={{ color: 'var(--text)' }}>{email}</strong>.</>}
        </p>

        {!success && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                gap: 8,
                marginBottom: 24,
              }}
            >
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { inputs.current[index] = element }}
                  aria-label={`Verification digit ${index + 1}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  onChange={(event) => updateDigit(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={handlePaste}
                  style={{
                    width: '100%',
                    minWidth: 0,
                    height: 56,
                    textAlign: 'center',
                    fontSize: 22,
                    fontWeight: 700,
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    outlineColor: 'var(--primary)',
                  }}
                />
              ))}
            </div>

            {error && (
              <p
                role="status"
                style={{
                  color: error.startsWith('Demo') ? 'var(--muted)' : '#B45342',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {error}
              </p>
            )}

            <motion.button
              type="button"
              onClick={handleVerify}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                height: 52,
                background: '#45634D',
                color: 'white',
                border: 0,
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Verify Email
            </motion.button>

            <button
              type="button"
              onClick={handleResend}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                marginTop: 22,
                border: 0,
                background: 'transparent',
                color: 'var(--primary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={15} />
              Reset demo code
            </button>

            <p
              style={{
                marginTop: 26,
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: 12,
              }}
            >
              Preview mode — use code <strong>123456</strong>.
              No email is sent.
            </p>
          </>
        )}

        {success && (
          <button
            type="button"
            onClick={onVerified}
            style={{
              width: '100%',
              height: 50,
              border: 0,
              borderRadius: 12,
              background: '#45634D',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Continue to Sign In
          </button>
        )}
      </motion.div>
    </div>
  )
}
