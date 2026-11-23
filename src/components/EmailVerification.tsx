import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, MailCheck, RefreshCw } from 'lucide-react'
import AuthSplit from './AuthSplit'
import { requestResetCode, verifyResetCode } from '../services/recovery'

type EmailVerificationProps = {
  email: string
  /** Called with the one-time reset token after the code is correct. */
  onVerified?: (token: string) => void
  onBack?: () => void
}

const RESEND_SECONDS = 60

export default function EmailVerification({ email, onVerified, onBack }: EmailVerificationProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [checking, setChecking] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_SECONDS)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown before "Resend code" is allowed
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  const verify = async (code: string) => {
    if (checking) return

    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }

    setChecking(true)
    setError('')
    setInfo('')

    try {
      const token = await verifyResetCode(email, code)
      onVerified?.(token)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The code could not be verified.')
      setDigits(Array(6).fill(''))
      inputs.current[0]?.focus()
    } finally {
      setChecking(false)
    }
  }

  const setAll = (next: string[]) => {
    setDigits(next)
    setError('')
    if (next.every(Boolean)) void verify(next.join(''))
  }

  const updateDigit = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const next = [...digits]
    next[index] = cleaned.slice(-1)
    if (cleaned && index < 5) inputs.current[index + 1]?.focus()
    setAll(next)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < 5) inputs.current[index + 1]?.focus()
    if (event.key === 'Enter') void verify(digits.join(''))
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const next = Array(6).fill('')
    pasted.split('').forEach((digit, index) => {
      next[index] = digit
    })

    inputs.current[Math.min(pasted.length, 5)]?.focus()
    setAll(next)
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return

    setResending(true)
    setError('')
    setInfo('')

    try {
      await requestResetCode(email)
      setDigits(Array(6).fill(''))
      setInfo('A new code was sent. The old code no longer works.')
      setCooldown(RESEND_SECONDS)
      inputs.current[0]?.focus()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to send a new code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthSplit
      step={2}
      heroTitle={
        <>
          Check your
          <br />
          inbox.
        </>
      }
      heroText="The code expires in 10 minutes. Can't find it? Look in your Spam or Promotions folder."
    >
      <button className="auth-back" type="button" onClick={onBack} disabled={!onBack || checking}>
        <ArrowLeft size={14} />
        Use a different email
      </button>

      <div className="auth-icon">
        <MailCheck size={26} />
      </div>

      <p className="auth-eyebrow">ACCOUNT RECOVERY</p>
      <h2 className="auth-heading">Enter your code</h2>
      <p className="auth-subtitle">
        If an account uses <strong>{email}</strong>, we sent a 6-digit code to it.
      </p>

      <div className="auth-code" role="group" aria-label="6-digit code">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element
            }}
            className={digit ? 'filled' : ''}
            aria-label={`Digit ${index + 1}`}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            disabled={checking}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key={`e-${error}`}
            role="alert"
            className="auth-alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.p>
        )}
        {info && !error && (
          <motion.p
            key={`i-${info}`}
            role="status"
            className="auth-ok"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {info}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        className="auth-submit"
        type="button"
        onClick={() => void verify(digits.join(''))}
        disabled={checking}
        whileHover={checking ? {} : { scale: 1.01 }}
        whileTap={checking ? {} : { scale: 0.985 }}
      >
        {checking ? 'Checking…' : 'Verify Code'}
        {!checking && <ArrowRight size={17} />}
      </motion.button>

      <button
        className="auth-link"
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0 || resending}
      >
        <RefreshCw size={14} />
        {resending
          ? 'Sending…'
          : cooldown > 0
            ? `Resend code in ${cooldown}s`
            : 'Resend code'}
      </button>
    </AuthSplit>
  )
}