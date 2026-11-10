import Velaris from '../ui/velaris'
import { useState, type FormEvent } from 'react'

import { motion } from 'motion/react'

import {

  Eye,

  EyeOff,

  LockKeyhole,

  Mail,

  ArrowRight,

  Leaf,

} from 'lucide-react'



type LoginProps = {

  onLogin?: (email: string, password: string) => void

  onRegister?: () => void

  onForgotPassword?: () => void

}



export default function Login({

  onLogin,

  onRegister,

  onForgotPassword,

}: LoginProps) {

  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  const [rememberMe, setRememberMe] = useState(false)

  const [error, setError] = useState('')



  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {

    e.preventDefault()

    setError('')



    if (!email.trim() || !password) {

      setError('Please enter your email and password.')

      return

    }



    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

      setError('Please enter a valid email address.')

      return

    }



    if (onLogin) {

      onLogin(email.trim(), password)

    } else {

      setError(

        'Login is in preview mode. Authentication will be connected later.'

      )

    }

  }



  const inputStyle: React.CSSProperties = {

    width: '100%',

    height: 50,

    border: '1px solid var(--border)',

    borderRadius: 12,

    background: 'var(--surface)',

    color: 'var(--text)',

    padding: '0 14px 0 44px',

    outline: 'none',

    fontSize: 14,

  }



  return (

    <div

      style={{

        minHeight: '100vh',

        display: 'grid',

        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',

        background: 'var(--bg)',

        color: 'var(--text)',

      }}

    >

      {/* Left panel */}

      <div

        style={{

          background: '#344E41',
          position: 'relative',
          isolation: 'isolate',
          overflow: 'hidden',

          color: '#F7F8F3',

          padding: 'clamp(32px, 6vw, 80px)',

          display: 'flex',

          flexDirection: 'column',

          justifyContent: 'space-between',

          gap: 48,

          minHeight: 350,

        }}

      >
        <Velaris
          bg="#14251C"
          colors={['#45634D', '#78947A', '#253F30', '#101E16']}
          speed={1.1}
          grain={0.18}
          height="100%"
          overlay
          className="pointer-events-none absolute inset-0"
        />


        <div

          style={{

            position: 'relative',
            zIndex: 1,
            fontSize: 23,

            fontWeight: 800,

            letterSpacing: '-1px',

          }}

        >

          SustansyaBox.

        </div>



        <motion.div
          style={{ position: 'relative', zIndex: 1 }}

          initial={{ opacity: 0, y: 25 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.7 }}

        >

          <div

            style={{

              width: 56,

              height: 56,

              borderRadius: 18,

              background: 'rgba(255,255,255,0.12)',

              display: 'grid',

              placeItems: 'center',

              marginBottom: 24,

            }}

          >

            <Leaf size={28} color="#DAD7CD" />

          </div>



          <h1

            style={{

              fontSize: 'clamp(36px, 4vw, 62px)',

              lineHeight: 1.12,

              letterSpacing: '-2px',

              margin: '0 0 20px',

            }}

          >

            Eat smarter.

            <br />

            Live healthier.

          </h1>



          <p

            style={{

              color: '#DAD7CD',

              maxWidth: 420,

              fontSize: 16,

              lineHeight: 1.8,

            }}

          >

            Your nutrition journey starts here.

            Track your meals, understand your food,

            and make every bite count.

          </p>

        </motion.div>



        <p style={{ position: 'relative', zIndex: 1, fontSize: 12, opacity: 0.7 }}>

          Smart Nutrition for a Healthier You

        </p>

      </div>



      {/* Login panel */}

      <div

        style={{

          display: 'flex',

          justifyContent: 'center',

          alignItems: 'center',

          padding: '50px 24px',

        }}

      >

        <motion.div

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.6, delay: 0.15 }}

          style={{

            width: '100%',

            maxWidth: 420,

          }}

        >

          <p

            style={{

              fontSize: 12,

              fontWeight: 700,

              letterSpacing: 2,

              color: 'var(--primary)',

              marginBottom: 12,

            }}

          >

            WELCOME BACK

          </p>



          <h2

            style={{

              fontSize: 34,

              letterSpacing: '-1px',

              margin: '0 0 10px',

            }}

          >

            Sign in to your account

          </h2>



          <p

            style={{

              color: 'var(--muted)',

              fontSize: 14,

              marginBottom: 34,

              lineHeight: 1.6,

            }}

          >

            Enter your details to continue your nutrition journey.

          </p>



          <form onSubmit={handleSubmit} noValidate>

            <label

              htmlFor="login-email"

              style={{

                display: 'block',

                fontWeight: 600,

                fontSize: 13,

                marginBottom: 9,

              }}

            >

              Email address

            </label>



            <div style={{ position: 'relative', marginBottom: 22 }}>

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

                id="login-email"

                type="email"

                autoComplete="email"

                placeholder="you@example.com"

                value={email}

                onChange={(e) => setEmail(e.target.value)}

                style={inputStyle}

              />

            </div>



            <label

              htmlFor="login-password"

              style={{

                display: 'block',

                fontWeight: 600,

                fontSize: 13,

                marginBottom: 9,

              }}

            >

              Password

            </label>



            <div style={{ position: 'relative', marginBottom: 18 }}>

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

                id="login-password"

                type={showPassword ? 'text' : 'password'}

                autoComplete="current-password"

                placeholder="Enter your password"

                value={password}

                onChange={(e) => setPassword(e.target.value)}

                style={{

                  ...inputStyle,

                  paddingRight: 48,

                }}

              />



              <button

                type="button"

                aria-label={

                  showPassword ? 'Hide password' : 'Show password'

                }

                onClick={() => setShowPassword(!showPassword)}

                style={{

                  position: 'absolute',

                  right: 12,

                  top: 12,

                  background: 'transparent',

                  border: 0,

                  color: 'var(--muted)',

                  padding: 4,

                }}

              >

                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}

              </button>

            </div>



            <div

              style={{

                display: 'flex',

                alignItems: 'center',

                justifyContent: 'space-between',

                gap: 12,

                marginBottom: 26,

                fontSize: 13,

              }}

            >

              <label

                style={{

                  display: 'flex',

                  alignItems: 'center',

                  gap: 8,

                  cursor: 'pointer',

                }}

              >

                <input

                  type="checkbox"

                  checked={rememberMe}

                  onChange={(e) => setRememberMe(e.target.checked)}

                  style={{ accentColor: 'var(--primary)' }}

                />

                Remember me

              </label>



              <button

                type="button"

                onClick={onForgotPassword}

                disabled={!onForgotPassword}

                style={{

                  border: 0,

                  background: 'transparent',

                  color: 'var(--primary)',

                  fontWeight: 700,

                  cursor: onForgotPassword ? 'pointer' : 'default',

                  opacity: onForgotPassword ? 1 : 0.55,

                }}

              >

                Forgot password?

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

                justifyContent: 'center',

                alignItems: 'center',

                gap: 10,

              }}

            >

              Sign In <ArrowRight size={18} />

            </motion.button>

          </form>



          <p

            style={{

              marginTop: 30,

              textAlign: 'center',

              color: 'var(--muted)',

              fontSize: 14,

            }}

          >

            Don't have an account?{' '}

            <button

              type="button"

              onClick={onRegister}

              disabled={!onRegister}

              style={{

                border: 0,

                background: 'transparent',

                color: 'var(--primary)',

                fontWeight: 700,

                cursor: onRegister ? 'pointer' : 'default',

                opacity: onRegister ? 1 : 0.55,

              }}

            >

              Create an account

            </button>

          </p>

        </motion.div>

      </div>

    </div>

  )

}