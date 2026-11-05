
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Moon, Sun, Candy, Droplets } from 'lucide-react'

import Sidebar from './components/Sidebar'
import CalorieRing from './components/CalorieRing'
import NutritionCard from './components/NutritionCard'
import SmartLunchboxOverview from './components/SmartLunchboxOverview'
import OpeningAnimation from './components/OpeningAnimation'
import Login from './components/Login'
import Register from './components/Register'
import EmailVerification from './components/EmailVerification'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import UserProfile from './components/UserProfile'

import './App.css'

type AuthPage =
  | 'login'
  | 'register'
  | 'register-verify'
  | 'forgot-password'
  | 'recovery-verify'
  | 'reset-password'

type DashboardPage =
  | 'Dashboard'
  | 'Smart Lunchbox'
  | 'Meal History'
  | 'Meal Planner'
  | 'Recipes'
  | 'Nutrition Reports'
  | 'Settings'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authPage, setAuthPage] = useState<AuthPage>('login')
  const [pendingEmail, setPendingEmail] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [showOpening, setShowOpening] = useState(false)

  // Sidebar navigation
  const [activePage, setActivePage] =
    useState<DashboardPage>('Dashboard')

  const toggleTheme = () => {
    const nextMode = !darkMode
    setDarkMode(nextMode)

    document.documentElement.setAttribute(
      'data-theme',
      nextMode ? 'dark' : 'light'
    )
  }

  // Frontend-only demo login
  const handleLogin = (email: string, password: string) => {
    if (!email || !password) return

    setActivePage('Dashboard')
    setShowOpening(true)
    setIsLoggedIn(true)
  }

  // Frontend-only registration
  const handleRegister = (data: { email: string }) => {
    setPendingEmail(data.email)
    setAuthPage('register-verify')
  }

  // Frontend-only password recovery
  const handleForgotPassword = (email: string) => {
    setPendingEmail(email)
    setAuthPage('recovery-verify')
  }

  const handleRegistrationVerified = () => {
    setPendingEmail('')
    setAuthPage('login')
  }

  const handleRecoveryVerified = () => {
    setAuthPage('reset-password')
  }

  const handleResetComplete = () => {
    setPendingEmail('')
    setAuthPage('login')
  }

  const handleNavigate = (page: string) => {
    const pages: DashboardPage[] = [
      'Dashboard',
      'Smart Lunchbox',
      'Meal History',
      'Meal Planner',
      'Recipes',
      'Nutrition Reports',
      'Settings',
    ]

    if (pages.includes(page as DashboardPage)) {
      setActivePage(page as DashboardPage)
    }
  }

  // Authentication pages
  if (!isLoggedIn) {
    return (
      <AnimatePresence mode="wait">
        {authPage === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.35 }}
            style={{ minHeight: '100vh' }}
          >
            <Login
              onLogin={handleLogin}
              onRegister={() => setAuthPage('register')}
              onForgotPassword={() =>
                setAuthPage('forgot-password')
              }
            />
          </motion.div>
        )}

        {authPage === 'register' && (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
            style={{ minHeight: '100vh' }}
          >
            <Register
              onRegister={handleRegister}
              onBackToLogin={() => setAuthPage('login')}
            />
          </motion.div>
        )}

        {authPage === 'register-verify' && (
          <motion.div
            key="register-verify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            style={{ minHeight: '100vh' }}
          >
            <EmailVerification
              email={pendingEmail}
              onVerified={handleRegistrationVerified}
              onBack={() => setAuthPage('register')}
            />
          </motion.div>
        )}

        {authPage === 'forgot-password' && (
          <motion.div
            key="forgot-password"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
            style={{ minHeight: '100vh' }}
          >
            <ForgotPassword
              onContinue={handleForgotPassword}
              onBackToLogin={() => setAuthPage('login')}
            />
          </motion.div>
        )}

        {authPage === 'recovery-verify' && (
          <motion.div
            key="recovery-verify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            style={{ minHeight: '100vh' }}
          >
            <EmailVerification
              email={pendingEmail}
              onVerified={handleRecoveryVerified}
              onBack={() =>
                setAuthPage('forgot-password')
              }
            />
          </motion.div>
        )}

        {authPage === 'reset-password' && (
          <motion.div
            key="reset-password"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
            style={{ minHeight: '100vh' }}
          >
            <ResetPassword
              onComplete={handleResetComplete}
              onBack={() =>
                setAuthPage('recovery-verify')
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Dashboard and sidebar pages
  return (
    <div
      className="app"
      style={{
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      <AnimatePresence>
        {showOpening && (
          <OpeningAnimation
            onComplete={() => setShowOpening(false)}
          />
        )}
      </AnimatePresence>

      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
      />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: '36px',
        }}
      >
        {/* Theme toggle */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: activePage === 'Dashboard' ? 0 : 30,
          }}
        >
          <div>
            <p
              style={{
                color: 'var(--muted)',
                margin: '0 0 8px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '1.5px',
              }}
            >
              OVERVIEW
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: 32,
                color: 'var(--text)',
              }}
            >
              {activePage}
            </h1>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {darkMode ? (
              <Sun size={22} />
            ) : (
              <Moon size={22} />
            )}
          </button>
        </header>

        {/* Dashboard */}
        {activePage === 'Dashboard' && (
          <>
            <section style={{ marginTop: 48 }}>
              <h2
                style={{
                  color: 'var(--primary)',
                  marginBottom: 10,
                }}
              >
                Welcome to SustansyaBox!
              </h2>

              <p
                style={{
                  color: 'var(--muted)',
                  margin: 0,
                }}
              >
                Monitor your meals, track your nutrition,
                and stay connected to your smart lunchbox.
              </p>
            </section>

            <section style={{ marginTop: 32 }}>
              <h2
                style={{
                  fontSize: 20,
                  color: 'var(--text)',
                  marginBottom: 20,
                }}
              >
                Today's Nutrition
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                  gap: 20,
                  alignItems: 'stretch',
                }}
              >
                <CalorieRing
                  consumed={1250}
                  goal={2000}
                />

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                  }}
                >
                  <NutritionCard
                    title="Sugar Intake"
                    consumed={28}
                    goal={50}
                    unit="g"
                    icon={Candy}
                    color="#C58A63"
                  />

                  <NutritionCard
                    title="Sodium Intake"
                    consumed={1400}
                    goal={2300}
                    unit="mg"
                    icon={Droplets}
                    color="#83A9A0"
                  />
                </div>
              </div>
            </section>

            <SmartLunchboxOverview />
          </>
        )}

        {/* User Profile */}
        {activePage === 'Settings' && (
          <UserProfile
            onBack={() => setActivePage('Dashboard')}
          />
        )}

        {/* Upcoming sections */}
        {activePage !== 'Dashboard' &&
          activePage !== 'Settings' && (
            <motion.section
              key={activePage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: 32,
                marginTop: 20,
              }}
            >
              <h2
                style={{
                  color: 'var(--primary)',
                  marginTop: 0,
                }}
              >
                {activePage}
              </h2>

              <p
                style={{
                  color: 'var(--muted)',
                  lineHeight: 1.8,
                  marginBottom: 0,
                }}
              >
                This section is coming soon.
                We'll build its features in the next steps.
              </p>
            </motion.section>
          )}
      </main>
    </div>
  )
}

export default App
