import { useMemo, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Velaris from '../ui/velaris'
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
  Leaf,
} from 'lucide-react'
import { registerUser, registerGoogleUser, type GoogleRegisterResponse } from '../services/api'
import {
  ACTIVITY_LEVELS,
  isValidInput,
  personalTargets,
  type ActivityLevel,
  type Sex,
} from '../services/nutrition'
export type RegistrationData = {
  fullName: string
  email: string
  password: string
  age: number
  height: number
  weight: number
  sex: Sex
  activityLevel: ActivityLevel
}
type RegisterProps = {
  onRegister?: (data: RegistrationData) => void
  onBackToLogin?: () => void
  googleCredential?: string | null
  onGoogleRegistered?: (user: NonNullable<GoogleRegisterResponse['user']>) => void
}
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}
export default function Register({
  onRegister,
  onBackToLogin,
  googleCredential,
  onGoogleRegistered,
}: RegisterProps) {
  const isGoogleRegistration = Boolean(googleCredential)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [sex, setSex] = useState<Sex | ''>('')
  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>('sedentary')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Live preview of the daily targets (FAO/WHO/UNU + WHO)
  const targets = useMemo(() => {
    const input = {
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      sex: sex || undefined,
      activity: activityLevel,
    }
    return isValidInput(input) && input.age >= 13
      ? personalTargets(input)
      : null
  }, [age, height, weight, sex, activityLevel])

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault()
    if (isSubmitting) return
    setError('')
    setSuccess('')
    const name = fullName.trim()
    const userEmail = email.trim().toLowerCase()
    const userAge = Number(age)
    const userHeight = Number(height)
    const userWeight = Number(weight)
    if (!age || !height || !weight) {
      setError('Please complete all required profile fields.')
      return
    }
    if (!isGoogleRegistration) {
      if (!name || !userEmail || !password || !confirmPassword) {
        setError('Please complete all required fields.')
        return
      }
      if (name.length < 2 || name.length > 100) {
        setError('Please enter a valid full name.')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail) || userEmail.length > 150) {
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
    }
    if (
      !Number.isInteger(userAge) ||
      userAge < 13 ||
      userAge > 120
    ) {
      setError('Please enter a valid age between 13 and 120.')
      return
    }
    if (
      !Number.isFinite(userHeight) ||
      userHeight < 80 ||
      userHeight > 250
    ) {
      setError('Please enter a valid height in centimeters.')
      return
    }
    if (
      !Number.isFinite(userWeight) ||
      userWeight < 15 ||
      userWeight > 400
    ) {
      setError('Please enter a valid weight in kilograms.')
      return
    }
    if (!sex) {
      setError('Please choose your sex so we can estimate your daily calories.')
      return
    }
    setIsSubmitting(true)
    try {
      if (isGoogleRegistration && googleCredential) {
        const result = await registerGoogleUser({
          credential: googleCredential,
          age: userAge,
          height: userHeight,
          weight: userWeight,
          sex,
          activityLevel,
        })
        if (!result.user) throw new Error('Google registration did not return an account.')
        setSuccess('Google account created successfully!')
        onGoogleRegistered?.(result.user)
      } else {
        const registrationData: RegistrationData = {
          fullName: name,
          email: userEmail,
          password,
          age: userAge,
          height: userHeight,
          weight: userWeight,
          sex,
          activityLevel,
        }
        await registerUser(registrationData)
        setSuccess('Account created successfully! You can now sign in.')
        setPassword('')
        setConfirmPassword('')
        onRegister?.(registrationData)
      }
    } catch (caughtError: unknown) {
      if (caughtError instanceof TypeError) {
        setError(
          'Cannot connect to the server. Make sure Apache and MySQL are running in XAMPP.'
        )
      } else if (caughtError instanceof Error) {
        setError(caughtError.message)
      } else {
        setError(
          'Something went wrong while creating your account.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="register-page">
      <style>{`
        .register-page,
        .register-page * {
          box-sizing: border-box;
        }
        .register-page {
          --reg-cream: #f8f8f3;
          --reg-ink: #1c362b;
          --reg-green: #45634d;
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          min-height: 100dvh;
          background: var(--reg-cream);
          color: var(--reg-ink);
          font-family: 'DM Sans', 'Inter', sans-serif;
          overflow: hidden;
        }
        .register-page button,
        .register-page input {
          font: inherit;
        }
        .register-hero {
          position: relative;
          isolation: isolate;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(30px, 4.5vw, 70px);
          color: #f7f8f3;
          background:
            radial-gradient(
              ellipse at 43% 42%,
              #315a46 0%,
              #1b362a 46%,
              #0d1b15 100%
            );
          overflow: hidden;
          min-height: 100dvh;
        }
        /* Same animated Velaris background as the Login page. */
        .register-velaris-bg {
          position: absolute !important;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .register-hero > :not(.register-velaris-bg) {
          position: relative;
          z-index: 1;
        }
        .register-hero::before {
          display: none;
        }
        .register-hero::before {
          content: '';
          position: absolute;
          z-index: -1;
          inset: -15%;
          background:
            radial-gradient(
              ellipse at 35% 44%,
              rgba(147,189,150,.35),
              transparent 37%
            ),
            radial-gradient(
              ellipse at 13% 85%,
              rgba(160,184,149,.17),
              transparent 35%
            ),
            radial-gradient(
              ellipse at 85% 18%,
              rgba(71,118,91,.18),
              transparent 35%
            );
          filter: blur(30px);
          animation: register-glow 11s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .register-hero::after {
          content: '';
          position: absolute;
          z-index: -1;
          inset: 0;
          background:
            linear-gradient(
              120deg,
              rgba(255,255,255,.025),
              transparent 50%
            );
          pointer-events: none;
        }
        @keyframes register-glow {
          from {
            transform: translate(-3%, 1%) scale(1);
            opacity: .7;
          }
          to {
            transform: translate(5%, -3%) scale(1.15);
            opacity: 1;
          }
        }
        .register-logo {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -.8px;
        }
        .register-hero-copy {
          max-width: 560px;
          margin: auto 0;
          padding: 35px 0;
        }
        .register-leaf {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.07);
          backdrop-filter: blur(10px);
          margin-bottom: 26px;
        }
        .register-hero-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 700;
          font-size: clamp(42px, 4.4vw, 69px);
          line-height: 1.07;
          letter-spacing: -2.2px;
          margin: 0 0 22px;
        }
        .register-hero-description {
          max-width: 440px;
          font-size: 14px;
          line-height: 1.9;
          color: rgba(247,248,243,.81);
          margin: 0;
        }
        .register-hero-footer {
          font-size: 11px;
          color: rgba(247,248,243,.65);
        }
        .register-form-side {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px clamp(20px, 4vw, 70px);
          min-width: 0;
          max-height: 100dvh;
          overflow-y: auto;
          background: var(--reg-cream);
        }
        .register-form-inner {
          width: 100%;
          max-width: 410px;
        }
        .register-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 0;
          background: none;
          color: #355b43;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          padding: 0;
          margin-bottom: 21px;
        }
        .register-back:disabled,
        .register-signin:disabled {
          opacity: .45;
          cursor: not-allowed;
        }
        .register-eyebrow {
          color: #45634d;
          font-size: 10px;
          letter-spacing: 2px;
          font-weight: 800;
          margin: 0 0 9px;
        }
        .register-heading {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(26px, 2.2vw, 34px);
          letter-spacing: -.9px;
          line-height: 1.2;
          margin: 0 0 10px;
        }
        .register-subtitle {
          color: #7b8980;
          font-size: 12px;
          margin: 0 0 22px;
          line-height: 1.6;
        }
        .register-field {
          margin-bottom: 12px;
        }
        .register-label {
          display: block;
          font-size: 11px;
          font-weight: 750;
          margin-bottom: 7px;
        }
        .register-input-wrap {
          position: relative;
        }
        .register-input-icon {
          position: absolute;
          top: 50%;
          left: 13px;
          transform: translateY(-50%);
          color: #819588;
          pointer-events: none;
        }
        .register-input {
          width: 100%;
          height: 43px;
          padding: 0 13px 0 39px;
          border: 1px solid #dfe6dd;
          border-radius: 11px;
          background: #fff;
          color: #1c362b;
          outline: none;
          font-size: 12px;
          transition:
            border-color .2s,
            box-shadow .2s,
            transform .2s;
        }
        .register-input::placeholder {
          color: #96a09a;
        }
        .register-input:focus {
          border-color: #6e9976;
          box-shadow: 0 0 0 4px rgba(110,153,118,.12);
        }
        .register-input:disabled {
          opacity: .65;
          cursor: not-allowed;
        }
        .register-password-toggle {
          position: absolute;
          right: 11px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: 0;
          color: #829488;
          cursor: pointer;
          display: grid;
          place-items: center;
          padding: 5px;
        }
        .register-password-toggle:disabled {
          cursor: not-allowed;
          opacity: .5;
        }
        .register-personal {
          border-top: 1px solid #dfe6dd;
          padding-top: 15px;
          margin-top: 17px;
        }
        .register-personal h3 {
          font-size: 13px;
          margin: 0 0 5px;
        }
        .register-personal p {
          color: #849087;
          font-size: 11px;
          line-height: 1.5;
          margin: 0 0 13px;
        }
        .register-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .register-metrics .register-input {
          padding-left: 34px;
        }
        .register-metrics .register-input-icon {
          left: 10px;
        }
        .register-choices {
          display: grid;
          grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr);
          gap: 10px;
          margin-top: 10px;
        }
        .register-segment {
          display: flex;
          gap: 4px;
          padding: 3px;
          border: 1px solid #dfe6dd;
          border-radius: 11px;
          background: #fff;
        }
        .register-segment button {
          flex: 1;
          min-width: 0;
          height: 35px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #5d6f63;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          white-space: nowrap;
          transition: background .2s, color .2s;
        }
        .register-segment button:hover:not(:disabled) {
          background: #f0f4ee;
        }
        .register-segment button.on {
          background: #45634d;
          color: #fff;
        }
        .register-segment button:disabled {
          cursor: not-allowed;
        }
        .register-segment button:focus-visible {
          outline: 2px solid #6e9976;
          outline-offset: 1px;
        }
        .register-hint {
          margin: 6px 0 0;
          font-size: 10.5px;
          color: #849087;
        }
        .register-targets {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 12px;
          padding: 10px;
          border-radius: 12px;
          background: #eef4ec;
          border: 1px solid #d9e6d6;
        }
        .register-targets-title {
          grid-column: 1 / -1;
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #45634d;
        }
        .register-targets-title span {
          font-weight: 600;
          letter-spacing: 0;
          text-transform: none;
          color: #7b8980;
        }
        .register-target strong {
          display: block;
          font-size: 16px;
          font-weight: 800;
          color: #1c362b;
          font-variant-numeric: tabular-nums;
        }
        .register-target small {
          font-size: 10px;
          color: #6c7d71;
        }
        .register-targets-empty {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px dashed #d4ddd2;
          font-size: 10.5px;
          color: #849087;
        }
        .register-error {
          background: #fff0ed;
          border: 1px solid #f2d0ca;
          color: #a33e35;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 11px;
          margin: 14px 0;
        }
        .register-success {
          background: #edf7ef;
          border: 1px solid #bddac3;
          color: #2f6541;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 11px;
          margin: 14px 0;
        }
        .register-submit {
          width: 100%;
          height: 46px;
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: none;
          border-radius: 10px;
          background: #45634d;
          color: white;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(69,99,77,.12);
          transition:
            background .2s,
            box-shadow .2s;
        }
        .register-submit:hover:not(:disabled) {
          background: #36543f;
          box-shadow: 0 10px 24px rgba(69,99,77,.22);
        }
        .register-submit:disabled {
          opacity: .7;
          cursor: wait;
        }
        .register-bottom {
          text-align: center;
          color: #87938a;
          font-size: 11px;
          margin: 17px 0 0;
        }
        .register-signin {
          background: none;
          border: 0;
          padding: 0 0 0 5px;
          color: #355b43;
          font-weight: 800;
          cursor: pointer;
        }
        @media (max-height: 760px) and (min-width: 801px) {
          .register-form-side {
            padding-top: 14px;
            padding-bottom: 14px;
          }
          .register-back {
            margin-bottom: 10px;
          }
          .register-subtitle {
            margin-bottom: 12px;
          }
          .register-field {
            margin-bottom: 8px;
          }
          .register-input {
            height: 38px;
          }
          .register-personal {
            margin-top: 10px;
            padding-top: 10px;
          }
          .register-submit {
            margin-top: 11px;
          }
        }
        @media (max-width: 800px) {
          .register-page {
            grid-template-columns: 1fr;
            overflow: visible;
          }
          .register-hero {
            min-height: 300px;
            padding: 28px;
          }
          .register-hero-copy {
            padding: 35px 0;
          }
          .register-hero-title {
            font-size: clamp(37px, 7vw, 54px);
          }
          .register-form-side {
            padding: 35px 20px 45px;
          }
        }
        @media (max-width: 400px) {
          .register-metrics {
            gap: 6px;
          }
          .register-metrics .register-input {
            font-size: 11px;
            padding-left: 29px;
            padding-right: 5px;
          }
          .register-metrics .register-input-icon {
            left: 8px;
            width: 14px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .register-hero::before {
            animation: none;
          }
          .register-page *,
          .register-page *::before {
            transition: none !important;
          }
        }
      `}</style>
      <aside className="register-hero">
        <Velaris
          bg="#14251C"
          colors={["#45634D", "#78947A", "#253F30", "#101E16"]}
          speed={1.1}
          grain={0.18}
          height="100%"
          className="register-velaris-bg"
        >
          <span aria-hidden="true" />
        </Velaris>
        <motion.div
          className="register-logo"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          SustansyaBox.
        </motion.div>
        <div className="register-hero-copy">
          <motion.div
            className="register-leaf"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Leaf size={24} strokeWidth={1.7} />
          </motion.div>
          <motion.h1
            className="register-hero-title"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.75, delay: 0.23 }}
          >
            A healthier you
            <br />
            starts here.
          </motion.h1>
          <motion.p
            className="register-hero-description"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.75, delay: 0.36 }}
          >
            Create your account, personalize your nutrition
            goals, and make every meal count with SustansyaBox.
          </motion.p>
        </div>
        <motion.div
          className="register-hero-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Smart Nutrition for a Healthier You
        </motion.div>
      </aside>
      <main className="register-form-side">
        <motion.div
          className="register-form-inner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.12 }}
        >
          <button
            className="register-back"
            type="button"
            onClick={onBackToLogin}
            disabled={!onBackToLogin || isSubmitting}
          >
            <ArrowLeft size={14} />
            Back to Sign In
          </button>
          <p className="register-eyebrow">GET STARTED</p>
          <h2 className="register-heading">
            {isGoogleRegistration ? 'Complete your Google profile' : 'Create your account'}
          </h2>
          <p className="register-subtitle">
            {isGoogleRegistration
              ? 'Your name and email will come securely from Google. Complete the details below to finish signing up.'
              : 'Tell us a little about yourself to get started.'}
          </p>
          <form onSubmit={handleSubmit} noValidate>
            {!isGoogleRegistration && (
              <>
            <div className="register-field">
              <label
                className="register-label"
                htmlFor="register-name"
              >
                Full name
              </label>
              <div className="register-input-wrap">
                <UserRound
                  className="register-input-icon"
                  size={16}
                />
                <input
                  id="register-name"
                  className="register-input"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="register-field">
              <label
                className="register-label"
                htmlFor="register-email"
              >
                Email address
              </label>
              <div className="register-input-wrap">
                <Mail
                  className="register-input-icon"
                  size={16}
                />
                <input
                  id="register-email"
                  className="register-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="register-field">
              <label
                className="register-label"
                htmlFor="register-password"
              >
                Password
              </label>
              <div className="register-input-wrap">
                <LockKeyhole
                  className="register-input-icon"
                  size={16}
                />
                <input
                  id="register-password"
                  className="register-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  style={{ paddingRight: 42 }}
                  disabled={isSubmitting}
                />
                <button
                  className="register-password-toggle"
                  type="button"
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>
            <div className="register-field">
              <label
                className="register-label"
                htmlFor="register-confirm"
              >
                Confirm password
              </label>
              <div className="register-input-wrap">
                <LockKeyhole
                  className="register-input-icon"
                  size={16}
                />
                <input
                  id="register-confirm"
                  className="register-input"
                  type={
                    showConfirmPassword ? 'text' : 'password'
                  }
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  style={{ paddingRight: 42 }}
                  disabled={isSubmitting}
                />
                <button
                  className="register-password-toggle"
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>
              </>
            )}
            <section className="register-personal">
              <h3>Personal information</h3>
              <p>
                We use this to estimate your daily calories and
                your sugar and sodium limits (FAO/WHO references).
              </p>
              <div className="register-metrics">
                <div>
                  <label
                    className="register-label"
                    htmlFor="register-age"
                  >
                    Age
                  </label>
                  <div className="register-input-wrap">
                    <CalendarDays
                      className="register-input-icon"
                      size={16}
                    />
                    <input
                      id="register-age"
                      className="register-input"
                      type="number"
                      min="13"
                      max="120"
                      step="1"
                      placeholder="Years"
                      value={age}
                      onChange={(event) =>
                        setAge(event.target.value)
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="register-label"
                    htmlFor="register-height"
                  >
                    Height
                  </label>
                  <div className="register-input-wrap">
                    <Ruler
                      className="register-input-icon"
                      size={16}
                    />
                    <input
                      id="register-height"
                      className="register-input"
                      type="number"
                      min="80"
                      max="250"
                      step="0.1"
                      placeholder="cm"
                      value={height}
                      onChange={(event) =>
                        setHeight(event.target.value)
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="register-label"
                    htmlFor="register-weight"
                  >
                    Weight
                  </label>
                  <div className="register-input-wrap">
                    <Scale
                      className="register-input-icon"
                      size={16}
                    />
                    <input
                      id="register-weight"
                      className="register-input"
                      type="number"
                      min="15"
                      max="400"
                      step="0.1"
                      placeholder="kg"
                      value={weight}
                      onChange={(event) =>
                        setWeight(event.target.value)
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="register-choices">
                <div>
                  <span className="register-label" id="register-sex-label">
                    Sex
                  </span>
                  <div
                    className="register-segment"
                    role="radiogroup"
                    aria-labelledby="register-sex-label"
                  >
                    {(['female', 'male'] as Sex[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={sex === option}
                        className={sex === option ? 'on' : ''}
                        onClick={() => setSex(option)}
                        disabled={isSubmitting}
                      >
                        {option === 'female' ? 'Female' : 'Male'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="register-label" id="register-activity-label">
                    Activity level
                  </span>
                  <div
                    className="register-segment"
                    role="radiogroup"
                    aria-labelledby="register-activity-label"
                  >
                    {(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={activityLevel === option}
                        className={activityLevel === option ? 'on' : ''}
                        title={ACTIVITY_LEVELS[option].hint}
                        onClick={() => setActivityLevel(option)}
                        disabled={isSubmitting}
                      >
                        {ACTIVITY_LEVELS[option].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <p className="register-hint">
                {ACTIVITY_LEVELS[activityLevel].label}:{' '}
                {ACTIVITY_LEVELS[activityLevel].hint.toLowerCase()}.
              </p>

              {targets ? (
                <div className="register-targets" aria-live="polite">
                  <div className="register-targets-title">
                    Your daily targets
                    <span>
                      {targets.bmi !== null
                        ? `BMI ${targets.bmi} · ${targets.bmiLabel}`
                        : 'WHO-based'}
                    </span>
                  </div>
                  <div className="register-target">
                    <strong>{targets.calories.toLocaleString()}</strong>
                    <small>kcal / day</small>
                  </div>
                  <div className="register-target">
                    <strong>&lt; {targets.sugar} g</strong>
                    <small>sugar limit</small>
                  </div>
                  <div className="register-target">
                    <strong>&lt; {targets.sodium.toLocaleString()} mg</strong>
                    <small>sodium limit</small>
                  </div>
                </div>
              ) : (
                <p className="register-targets-empty">
                  Fill in your age, height, weight, and sex to see
                  your daily calorie, sugar, and sodium targets.
                </p>
              )}
            </section>
            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  role="alert"
                  className="register-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  key={`error-${error}`}
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  role="status"
                  className="register-success"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  key="registration-success"
                >
                  {success}
                </motion.p>
              )}
            </AnimatePresence>
            <motion.button
              className="register-submit"
              type="submit"
              disabled={isSubmitting || Boolean(success)}
              whileHover={
                isSubmitting ? {} : { scale: 1.012 }
              }
              whileTap={
                isSubmitting ? {} : { scale: 0.985 }
              }
            >
              {isSubmitting
                ? (isGoogleRegistration ? 'Creating Google Account...' : 'Creating Account...')
                : success
                  ? 'Account Created'
                  : (isGoogleRegistration ? 'Complete Google Registration' : 'Create Account')}
              {!isSubmitting && <ArrowRight size={17} />}
            </motion.button>
          </form>
          <p className="register-bottom">
            Already have an account?
            <button
              className="register-signin"
              type="button"
              onClick={onBackToLogin}
              disabled={!onBackToLogin || isSubmitting}
            >
              Sign In
            </button>
          </p>
        </motion.div>
      </main>
    </div>
  )
}