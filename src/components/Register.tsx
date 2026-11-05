
import { useState, type FormEvent, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import {
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Ruler,
  Scale,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react'

export type RegistrationData = {
  fullName: string
  email: string
  password: string
  age: number
  height: number
  weight: number
}

type RegisterProps = {
  onRegister?: (data: RegistrationData) => void
  onBackToLogin?: () => void
}

export default function Register({
  onRegister,
  onBackToLogin,
}: RegisterProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  const inputStyle: CSSProperties = {
    width: '100%',
    height: 48,
    border: '1px solid var(--border)',
    borderRadius: 12,
    background: 'var(--surface)',
    color: 'var(--text)',
    padding: '0 14px 0 44px',
    outline: 'none',
    fontSize: 14,
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
    color: 'var(--text)',
  }

  const iconStyle: CSSProperties = {
    position: 'absolute',
    left: 14,
    top: 15,
    color: 'var(--muted)',
    pointerEvents: 'none',
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const name = fullName.trim()
    const userEmail = email.trim().toLowerCase()
    const userAge = Number(age)
    const userHeight = Number(height)
    const userWeight = Number(weight)

    if (
      !name ||
      !userEmail ||
      !password ||
      !confirmPassword ||
      !age ||
      !height ||
      !weight
    ) {
      setError('Please complete all required fields.')
      return
    }

    if (name.length < 2) {
      setError('Please enter your full name.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      setError('Please enter a valid email address.')
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

    if (!Number.isInteger(userAge) || userAge < 13 || userAge > 120) {
      setError('Please enter a valid age between 13 and 120.')
      return
    }

    if (!Number.isFinite(userHeight) || userHeight < 80 || userHeight > 250) {
      setError('Please enter a valid height in centimeters.')
      return
    }

    if (!Number.isFinite(userWeight) || userWeight < 15 || userWeight > 400) {
      setError('Please enter a valid weight in kilograms.')
      return
    }

    if (onRegister) {
      onRegister({
        fullName: name,
        email: userEmail,
        password,
        age: userAge,
        height: userHeight,
        weight: userWeight,
      })
    } else {
      setError('Registration is in preview mode. Account creation will be connected later.')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Left branding panel */}
      <div
        style={{
          background: '#344E41',
          color: '#F7F8F3',
          padding: 'clamp(32px, 6vw, 80px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 36,
          minHeight: 300,
        }}
      >
        <div
          style={{
            fontSize: 23,
            fontWeight: 800,
            letterSpacing: '-1px',
          }}
        >
          SustansyaBox.
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 99,
              padding: '9px 14px',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 28,
            }}
          >
            <CheckCircle2 size={16} />
            YOUR WELLNESS JOURNEY
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 4vw, 62px)',
              lineHeight: 1.12,
              letterSpacing: '-2px',
              margin: '0 0 20px',
            }}
          >
            A healthier you
            <br />
            starts here.
          </h1>

          <p
            style={{
              color: '#DAD7CD',
              maxWidth: 420,
              fontSize: 16,
              lineHeight: 1.8,
            }}
          >
            Create your account, personalize your nutrition goals,
            and make every meal count with SustansyaBox.
          </p>
        </motion.div>

        <p style={{ fontSize: 12, opacity: 0.7 }}>
          Smart Nutrition for a Healthier You
        </p>
      </div>

      {/* Registration form */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            width: '100%',
            maxWidth: 460,
          }}
        >
          <button
            type="button"
            onClick={onBackToLogin}
            disabled={!onBackToLogin}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 0,
              padding: 0,
              marginBottom: 28,
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: 13,
              opacity: onBackToLogin ? 1 : 0.55,
            }}
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </button>

          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 2,
              color: 'var(--primary)',
              margin: '0 0 12px',
            }}
          >
            GET STARTED
          </p>

          <h2
            style={{
              fontSize: 34,
              letterSpacing: '-1px',
              margin: '0 0 10px',
            }}
          >
            Create your account
          </h2>

          <p
            style={{
              color: 'var(--muted)',
              fontSize: 14,
              lineHeight: 1.6,
              margin: '0 0 28px',
            }}
          >
            Tell us a little about yourself to get started.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Full name */}
            <label htmlFor="register-name" style={labelStyle}>
              Full name
            </label>
            <div style={{ position: 'relative', marginBottom: 18 }}>
              <UserRound size={18} style={iconStyle} />
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Email */}
            <label htmlFor="register-email" style={labelStyle}>
              Email address
            </label>
            <div style={{ position: 'relative', marginBottom: 18 }}>
              <Mail size={18} style={iconStyle} />
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <label htmlFor="register-password" style={labelStyle}>
              Password
            </label>
            <div style={{ position: 'relative', marginBottom: 18 }}>
              <LockKeyhole size={18} style={iconStyle} />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: 48 }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 11,
                  border: 0,
                  background: 'transparent',
                  color: 'var(--muted)',
                  padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {/* Confirm password */}
            <label htmlFor="register-confirm" style={labelStyle}>
              Confirm password
            </label>
            <div style={{ position: 'relative', marginBottom: 22 }}>
              <LockKeyhole size={18} style={iconStyle} />
              <input
                id="register-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: 48 }}
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
                  top: 11,
                  border: 0,
                  background: 'transparent',
                  color: 'var(--muted)',
                  padding: 4,
                }}
              >
                {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {/* Personal information */}
            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: 22,
                marginBottom: 18,
              }}
            >
              <h3
                style={{
                  margin: '0 0 6px',
                  fontSize: 16,
                  color: 'var(--text)',
                }}
              >
                Personal information
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'var(--muted)',
                  lineHeight: 1.6,
                }}
              >
                This information will help personalize your nutrition goals.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <div>
                <label htmlFor="register-age" style={labelStyle}>
                  Age
                </label>
                <div style={{ position: 'relative' }}>
                  <CalendarDays size={17} style={iconStyle} />
                  <input
                    id="register-age"
                    type="number"
                    min="13"
                    max="120"
                    step="1"
                    placeholder="Years"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-height" style={labelStyle}>
                  Height
                </label>
                <div style={{ position: 'relative' }}>
                  <Ruler size={17} style={iconStyle} />
                  <input
                    id="register-height"
                    type="number"
                    min="80"
                    max="250"
                    step="0.1"
                    placeholder="cm"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-weight" style={labelStyle}>
                  Weight
                </label>
                <div style={{ position: 'relative' }}>
                  <Scale size={17} style={iconStyle} />
                  <input
                    id="register-weight"
                    type="number"
                    min="15"
                    max="400"
                    step="0.1"
                    placeholder="kg"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  color: '#B45342',
                  background: '#FCEAE5',
                  padding: '12px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  marginBottom: 18,
                }}
              >
                {error}
              </p>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 12,
                border: 0,
                background: '#45634D',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              Create Account <ArrowRight size={18} />
            </motion.button>
          </form>

          <p
            style={{
              marginTop: 26,
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: 14,
            }}
          >
            Already have an account?{' '}
            <button
              type="button"
              onClick={onBackToLogin}
              disabled={!onBackToLogin}
              style={{
                border: 0,
                background: 'transparent',
                color: 'var(--primary)',
                fontWeight: 700,
                opacity: onBackToLogin ? 1 : 0.55,
              }}
            >
              Sign In
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
