import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  UserRound, Mail, LockKeyhole, Eye, EyeOff, ArrowRight,
  ArrowLeft, Ruler, Scale, CalendarDays, Leaf,
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

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

export default function Register({ onRegister, onBackToLogin }: RegisterProps) {
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const name = fullName.trim()
    const userEmail = email.trim().toLowerCase()
    const userAge = Number(age)
    const userHeight = Number(height)
    const userWeight = Number(weight)

    if (!name || !userEmail || !password || !confirmPassword || !age || !height || !weight) {
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
      onRegister({ fullName: name, email: userEmail, password, age: userAge, height: userHeight, weight: userWeight })
    } else {
      setError('Registration is in preview mode. Account creation will be connected later.')
    }
  }

  return (
    <div className="register-page">
      <style>{`
        .register-page, .register-page * { box-sizing: border-box; }
        .register-page { --reg-cream: #f8f8f3; --reg-ink: #1c362b; --reg-green: #45634d; display: grid; grid-template-columns: 1fr 1fr; width: 100%; min-height: 100dvh; background: var(--reg-cream); color: var(--reg-ink); font-family: 'DM Sans', 'Inter', sans-serif; overflow: hidden; }
        .register-page button, .register-page input { font: inherit; }
        .register-hero { position: relative; isolation: isolate; display: flex; flex-direction: column; justify-content: space-between; padding: clamp(30px, 4.5vw, 70px); color: #f7f8f3; background: radial-gradient(ellipse at 43% 42%, #315a46 0%, #1b362a 46%, #0d1b15 100%); overflow: hidden; min-height: 100dvh; }
        .register-hero::before { content: ''; position: absolute; z-index: -1; inset: -15%; background: radial-gradient(ellipse at 35% 44%, rgba(147,189,150,.35), transparent 37%), radial-gradient(ellipse at 13% 85%, rgba(160,184,149,.17), transparent 35%), radial-gradient(ellipse at 85% 18%, rgba(71,118,91,.18), transparent 35%); filter: blur(30px); animation: register-glow 11s ease-in-out infinite alternate; pointer-events: none; }
        .register-hero::after { content: ''; position: absolute; z-index: -1; inset: 0; background: linear-gradient(120deg, rgba(255,255,255,.025), transparent 50%); pointer-events: none; }
        @keyframes register-glow { from { transform: translate(-3%, 1%) scale(1); opacity: .7; } to { transform: translate(5%, -3%) scale(1.15); opacity: 1; } }
        .register-logo { font-size: 20px; font-weight: 800; letter-spacing: -.8px; }
        .register-hero-copy { max-width: 560px; margin: auto 0; padding: 35px 0; }
        .register-leaf { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 15px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.07); backdrop-filter: blur(10px); margin-bottom: 26px; }
        .register-hero-title { font-family: Georgia, 'Times New Roman', serif; font-weight: 700; font-size: clamp(42px, 4.4vw, 69px); line-height: 1.07; letter-spacing: -2.2px; margin: 0 0 22px; }
        .register-hero-description { max-width: 440px; font-size: 14px; line-height: 1.9; color: rgba(247,248,243,.81); margin: 0; }
        .register-hero-footer { font-size: 11px; color: rgba(247,248,243,.65); }
        .register-form-side { display: flex; align-items: center; justify-content: center; padding: 30px clamp(20px, 4vw, 70px); min-width: 0; background: var(--reg-cream); }
        .register-form-inner { width: 100%; max-width: 410px; }
        .register-back { display: inline-flex; align-items: center; gap: 8px; border: 0; background: none; color: #355b43; font-size: 11px; font-weight: 750; cursor: pointer; padding: 0; margin-bottom: 21px; }
        .register-back:disabled, .register-signin:disabled { opacity: .45; cursor: not-allowed; }
        .register-eyebrow { color: #45634d; font-size: 10px; letter-spacing: 2px; font-weight: 800; margin: 0 0 9px; }
        .register-heading { font-family: Georgia, 'Times New Roman', serif; font-size: clamp(26px, 2.2vw, 34px); letter-spacing: -.9px; line-height: 1.2; margin: 0 0 10px; }
        .register-subtitle { color: #7b8980; font-size: 12px; margin: 0 0 22px; line-height: 1.6; }
        .register-field { margin-bottom: 12px; }
        .register-label { display: block; font-size: 11px; font-weight: 750; margin-bottom: 7px; }
        .register-input-wrap { position: relative; }
        .register-input-icon { position: absolute; top: 50%; left: 13px; transform: translateY(-50%); color: #819588; pointer-events: none; }
        .register-input { width: 100%; height: 43px; padding: 0 13px 0 39px; border: 1px solid #dfe6dd; border-radius: 11px; background: #fff; color: #1c362b; outline: none; font-size: 12px; transition: border-color .2s, box-shadow .2s, transform .2s; }
        .register-input::placeholder { color: #96a09a; }
        .register-input:focus { border-color: #6e9976; box-shadow: 0 0 0 4px rgba(110,153,118,.12); }
        .register-password-toggle { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); background: transparent; border: 0; color: #829488; cursor: pointer; display: grid; place-items: center; padding: 5px; }
        .register-personal { border-top: 1px solid #dfe6dd; padding-top: 15px; margin-top: 17px; }
        .register-personal h3 { font-size: 13px; margin: 0 0 5px; }
        .register-personal p { color: #849087; font-size: 11px; line-height: 1.5; margin: 0 0 13px; }
        .register-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .register-metrics .register-input { padding-left: 34px; }
        .register-metrics .register-input-icon { left: 10px; }
        .register-error { background: #fff0ed; border: 1px solid #f2d0ca; color: #a33e35; border-radius: 10px; padding: 10px 12px; font-size: 11px; margin: 14px 0; }
        .register-submit { width: 100%; height: 46px; margin-top: 18px; display: flex; align-items: center; justify-content: center; gap: 10px; border: none; border-radius: 10px; background: #45634d; color: white; font-size: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 6px 18px rgba(69,99,77,.12); transition: background .2s, box-shadow .2s; }
        .register-submit:hover { background: #36543f; box-shadow: 0 10px 24px rgba(69,99,77,.22); }
        .register-bottom { text-align: center; color: #87938a; font-size: 11px; margin: 17px 0 0; }
        .register-signin { background: none; border: 0; padding: 0 0 0 5px; color: #355b43; font-weight: 800; cursor: pointer; }
        @media (max-height: 760px) and (min-width: 801px) { .register-form-side { padding-top: 14px; padding-bottom: 14px; } .register-back { margin-bottom: 10px; } .register-subtitle { margin-bottom: 12px; } .register-field { margin-bottom: 8px; } .register-input { height: 38px; } .register-personal { margin-top: 10px; padding-top: 10px; } .register-submit { margin-top: 11px; } }
        @media (max-width: 800px) { .register-page { grid-template-columns: 1fr; overflow: visible; } .register-hero { min-height: 300px; padding: 28px; } .register-hero-copy { padding: 35px 0; } .register-hero-title { font-size: clamp(37px, 7vw, 54px); } .register-form-side { padding: 35px 20px 45px; } }
        @media (max-width: 400px) { .register-metrics { gap: 6px; } .register-metrics .register-input { font-size: 11px; padding-left: 29px; padding-right: 5px; } .register-metrics .register-input-icon { left: 8px; width: 14px; } }
        @media (prefers-reduced-motion: reduce) { .register-hero::before { animation: none; } .register-page *, .register-page *::before { transition: none !important; } }
      `}</style>

      <aside className="register-hero">
        <motion.div className="register-logo" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
          SustansyaBox.
        </motion.div>
        <div className="register-hero-copy">
          <motion.div className="register-leaf" initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6, delay: .15 }}>
            <Leaf size={24} strokeWidth={1.7} />
          </motion.div>
          <motion.h1 className="register-hero-title" variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: .75, delay: .23 }}>
            A healthier you<br />starts here.
          </motion.h1>
          <motion.p className="register-hero-description" variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: .75, delay: .36 }}>
            Create your account, personalize your nutrition goals, and make every meal count with SustansyaBox.
          </motion.p>
        </div>
        <motion.div className="register-hero-footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .8, delay: .6 }}>
          Smart Nutrition for a Healthier You
        </motion.div>
      </aside>

      <main className="register-form-side">
        <motion.div className="register-form-inner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .12 }}>
          <button className="register-back" type="button" onClick={onBackToLogin} disabled={!onBackToLogin}>
            <ArrowLeft size={14} /> Back to Sign In
          </button>
          <p className="register-eyebrow">GET STARTED</p>
          <h2 className="register-heading">Create your account</h2>
          <p className="register-subtitle">Tell us a little about yourself to get started.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="register-field">
              <label className="register-label" htmlFor="register-name">Full name</label>
              <div className="register-input-wrap">
                <UserRound className="register-input-icon" size={16} />
                <input id="register-name" className="register-input" type="text" autoComplete="name" placeholder="Enter your full name" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
            </div>
            <div className="register-field">
              <label className="register-label" htmlFor="register-email">Email address</label>
              <div className="register-input-wrap">
                <Mail className="register-input-icon" size={16} />
                <input id="register-email" className="register-input" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="register-field">
              <label className="register-label" htmlFor="register-password">Password</label>
              <div className="register-input-wrap">
                <LockKeyhole className="register-input-icon" size={16} />
                <input id="register-password" className="register-input" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 42 }} />
                <button className="register-password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div className="register-field">
              <label className="register-label" htmlFor="register-confirm">Confirm password</label>
              <div className="register-input-wrap">
                <LockKeyhole className="register-input-icon" size={16} />
                <input id="register-confirm" className="register-input" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ paddingRight: 42 }} />
                <button className="register-password-toggle" type="button" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} onClick={() => setShowConfirmPassword(v => !v)}>
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <section className="register-personal">
              <h3>Personal information</h3>
              <p>This information will help personalize your nutrition goals.</p>
              <div className="register-metrics">
                <div>
                  <label className="register-label" htmlFor="register-age">Age</label>
                  <div className="register-input-wrap">
                    <CalendarDays className="register-input-icon" size={16} />
                    <input id="register-age" className="register-input" type="number" min="13" max="120" step="1" placeholder="Years" value={age} onChange={e => setAge(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="register-label" htmlFor="register-height">Height</label>
                  <div className="register-input-wrap">
                    <Ruler className="register-input-icon" size={16} />
                    <input id="register-height" className="register-input" type="number" min="80" max="250" step="0.1" placeholder="cm" value={height} onChange={e => setHeight(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="register-label" htmlFor="register-weight">Weight</label>
                  <div className="register-input-wrap">
                    <Scale className="register-input-icon" size={16} />
                    <input id="register-weight" className="register-input" type="number" min="15" max="400" step="0.1" placeholder="kg" value={weight} onChange={e => setWeight(e.target.value)} />
                  </div>
                </div>
              </div>
            </section>

            <AnimatePresence mode="wait">
              {error && (
                <motion.p role="alert" className="register-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} key={error}>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
            <motion.button className="register-submit" type="submit" whileHover={{ scale: 1.012 }} whileTap={{ scale: .985 }}>
              Create Account <ArrowRight size={17} />
            </motion.button>
          </form>
          <p className="register-bottom">
            Already have an account?
            <button className="register-signin" type="button" onClick={onBackToLogin} disabled={!onBackToLogin}>Sign In</button>
          </p>
        </motion.div>
      </main>
    </div>
  )
}
