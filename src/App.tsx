
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Moon, Sun, Candy, Droplets } from 'lucide-react'

import Sidebar from './components/Sidebar'
import CalorieRing from './components/CalorieRing'
import NutritionCard from './components/NutritionCard'
import SmartLunchboxOverview from './components/SmartLunchboxOverview'
import SmartLunchbox from './SmartLunchbox'
import MealHistory from './components/MealHistory'
import MealPlanner from './components/MealPlanner'
import Recipes from './components/Recipes'
import NutritionReports from './components/NutritionReports'
import OpeningAnimation from './components/OpeningAnimation'
import Login from './components/Login'
import Register from './components/Register'
import EmailVerification from './components/EmailVerification'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import UserProfile from './components/UserProfile'
import AboutUsPreview from './components/AboutUsPreview'
import NotificationBell from './components/NotificationBell'

import { initialProfile, type ProfileData } from './types/profile'
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
  | 'About Us'
  | 'Settings'

const PROFILE_STORAGE_KEY = 'sustansyabox_profile'

const dashboardPages: DashboardPage[] = [
  'Smart Lunchbox',
  'Dashboard',
  'Meal History',
  'Meal Planner',
  'Recipes',
  'Nutrition Reports',
  'About Us',
  'Settings',
]

// These are temporary frontend preview values.
// Replace them with actual meal records when the backend is connected.
const PREVIEW_NUTRITION = {
  calories: 1250,
  sugar: 28,
  sodium: 1400,
}

function loadProfile(): ProfileData {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY)

    if (stored) {
      const parsed: unknown = JSON.parse(stored)

      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        const values = parsed as Record<string, unknown>
        const result = { ...initialProfile }

        for (
          const key of Object.keys(initialProfile) as
            (keyof ProfileData)[]
        ) {
          if (typeof values[key] === 'string') {
            result[key] = values[key]
          }
        }

        return result
      }
    }
  } catch {
    // Use default profile.
  }

  return { ...initialProfile }
}

function App() {
  // PROFILE
  const [profile, setProfile] =
    useState<ProfileData>(loadProfile)

  // AUTHENTICATION
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authPage, setAuthPage] =
    useState<AuthPage>('login')
  const [pendingEmail, setPendingEmail] = useState('')

  // APPEARANCE
  const [darkMode, setDarkMode] = useState(false)
  const [showOpening, setShowOpening] = useState(false)

  // NAVIGATION
  // Smart Lunchbox remains the first page.
  const [activePage, setActivePage] =
    useState<DashboardPage>('Smart Lunchbox')

  // PROFILE STORAGE
  useEffect(() => {
    try {
      localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(profile)
      )
    } catch {
      // Browser storage may be unavailable.
    }
  }, [profile])

  const handleSaveProfile = (updatedProfile: ProfileData) => {
    setProfile(updatedProfile)
  }

  // NUTRITION GOALS
  // These values are shared by the dashboard and notification bell.
  const calorieGoal = Number(profile.calories)
  const sugarGoal = Number(profile.sugar)
  const sodiumGoal = Number(profile.sodium)

  // THEME
  const toggleTheme = () => {
    const nextMode = !darkMode

    setDarkMode(nextMode)

    document.documentElement.setAttribute(
      'data-theme',
      nextMode ? 'dark' : 'light'
    )
  }

  // AUTHENTICATION HANDLERS
  const handleLogin = (
    email: string,
    password: string
  ) => {
    if (!email || !password) return

    setActivePage('Smart Lunchbox')
    setShowOpening(true)
    setIsLoggedIn(true)
  }

  const handleRegister = (data: { email: string }) => {
    setPendingEmail(data.email)
    setAuthPage('register-verify')
  }

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
    if (dashboardPages.includes(page as DashboardPage)) {
      setActivePage(page as DashboardPage)
    }
  }

  // AUTHENTICATION SCREENS
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

  // MAIN APPLICATION
  return (
    <div className="app sustansya-app-shell">
      <style>{`
        /* =====================================
           SUSTANSYABOX TYPOGRAPHY SYSTEM
           ===================================== */

        .sustansya-app-shell {
          font-family: 'DM Sans', sans-serif;
        }

        .sustansya-app-shell button,
        .sustansya-app-shell input,
        .sustansya-app-shell select,
        .sustansya-app-shell textarea {
          font-family: 'DM Sans', sans-serif;
        }

        .sustansya-app-shell .sb-page-title,
        .sustansya-app-shell .sb-dashboard-welcome h1,
        .sustansya-app-shell .sb-section-heading {
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 700;
          letter-spacing: -0.6px;
        }

        .sustansya-app-shell .sb-page-eyebrow {
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
        }

        .sustansya-app-shell .sb-dashboard-welcome p {
          font-family: 'DM Sans', sans-serif;
        }

        /* =====================================
           APPLICATION SHELL
           ===================================== */

        .sustansya-app-shell,
        .sustansya-app-shell * {
          box-sizing: border-box;
        }

        .sustansya-app-shell {
          display: flex;
          width: 100%;
          height: 100dvh;
          min-height: 0;
          overflow: hidden;
        }

        .sustansya-workspace {
          flex: 1;
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          padding: 12px 22px;
          overflow: hidden;
        }

        .sustansya-content {
          flex: 1;
          min-width: 0;
          min-height: 0;
        }

        .sustansya-content.dashboard-active {
          overflow: hidden;
        }

        .sustansya-content.other-page-active {
          overflow-x: hidden;
          overflow-y: auto;
        }

        /* =====================================
           HEADER
           ===================================== */

        .sb-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
          margin-bottom: 9px;
        }

        .sb-dashboard-page-header {
          padding-top: 12px;
          margin-bottom: 22px;
        }

        .sb-page-eyebrow {
          margin: 0 0 2px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.4px;
          color: var(--muted);
        }

        .sb-page-title {
          margin: 0;
          font-size: clamp(25px, 2.15vw, 31px);
          font-weight: 700;
          line-height: 1.15;
          color: var(--text);
        }

        /* =====================================
           WELCOME HEADER
           ===================================== */

        .sb-dashboard-welcome {
          margin: 0;
          padding: 0;
          min-height: 0;
        }

        .sb-dashboard-welcome h1 {
          margin: 0 0 5px;
          font-size: clamp(23px, 2.1vw, 31px);
          font-weight: 700;
          line-height: 1.2;
          color: var(--primary);
        }

        .sb-dashboard-welcome p {
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
          color: var(--muted);
        }

        /* =====================================
           HEADER BUTTONS
           ===================================== */

        .sb-theme-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          background: var(--surface);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .sb-theme-button:hover {
          transform: rotate(12deg);
        }

        .sb-header-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          flex-shrink: 0;
        }

        /* =====================================
           DASHBOARD LAYOUT
           ===================================== */

        .sb-dashboard {
          height: 100%;
          min-height: 0;
          min-width: 0;
          display: grid;
          grid-template-rows:
            minmax(280px, calc(40% + 20px))
            minmax(0, 1fr);
          gap: 20px;
          overflow: hidden;
        }

        /* =====================================
           TODAY'S NUTRITION
           ===================================== */

        .sb-nutrition {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          gap: 12px;
        }

        .sb-section-heading {
          margin: 0;
          font-size: clamp(17px, 1.35vw, 20px);
          font-weight: 700;
          line-height: 1.2;
          color: var(--text);
          flex-shrink: 0;
        }

        .sb-nutrition-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);
          gap: 14px;
          flex: 1;
          min-width: 0;
          min-height: 0;
        }

        /* =====================================
           CALORIE CARD
           ===================================== */

        .sb-calorie-area {
          display: flex;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
        }

        .sb-calorie-area > * {
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
        }

        /* =====================================
           SUGAR AND SODIUM
           ===================================== */

        .sb-nutrients-area {
          display: grid;
          grid-template-rows:
            minmax(0, 1fr)
            minmax(0, 1fr);
          gap: 12px;
          min-width: 0;
          min-height: 0;
        }

        .sb-nutrients-area > * {
          height: 100%;
          min-height: 0;
          min-width: 0;
          overflow: hidden;
          padding: 12px 18px !important;
        }

        .sb-nutrients-area p,
        .sb-nutrients-area small {
          line-height: 1.3;
        }

        /* =====================================
           SMART LUNCHBOX
           ===================================== */

        .sb-lunchbox-area {
          min-height: 0;
          min-width: 0;
          overflow: hidden;
        }

        .sb-lunchbox-scale {
          zoom: 0.62;
          width: 100%;
        }

        /* =====================================
           LARGE SCREENS
           ===================================== */

        @media (min-height: 1000px) {
          .sb-dashboard {
            grid-template-rows:
              minmax(315px, calc(40% + 20px))
              minmax(0, 1fr);
          }

          .sb-lunchbox-scale {
            zoom: 0.73;
          }
        }

        /* =====================================
           SHORT SCREENS
           ===================================== */

        @media (max-height: 800px) {
          .sustansya-workspace {
            padding: 9px 18px;
          }

          .sb-page-header {
            margin-bottom: 10px;
          }

          .sb-dashboard-page-header {
            margin-bottom: 12px;
          }

          .sb-dashboard {
            grid-template-rows:
              minmax(235px, calc(40% + 20px))
              minmax(0, 1fr);
            gap: 12px;
          }

          .sb-nutrition {
            gap: 8px;
          }

          .sb-nutrition-grid {
            gap: 10px;
          }

          .sb-nutrients-area {
            gap: 8px;
          }

          .sb-nutrients-area > * {
            padding: 8px 14px !important;
          }

          .sb-lunchbox-scale {
            zoom: 0.54;
          }
        }

        /* =====================================
           VERY SHORT SCREENS
           ===================================== */

        @media (max-height: 650px) {
          .sb-dashboard {
            grid-template-rows:
              minmax(210px, calc(40% + 20px))
              minmax(0, 1fr);
          }

          .sb-lunchbox-scale {
            zoom: 0.46;
          }
        }

        /* =====================================
           NARROW SCREENS
           ===================================== */

        @media (max-width: 900px) {
          .sustansya-workspace {
            padding: 14px;
          }

          .sustansya-content.dashboard-active {
            overflow-y: auto;
          }

          .sb-dashboard-page-header {
            margin-bottom: 18px;
          }

          .sb-dashboard {
            display: flex;
            flex-direction: column;
            height: auto;
            min-height: 100%;
            gap: 16px;
            overflow: visible;
          }

          .sb-nutrition-grid {
            grid-template-columns: 1fr;
          }

          .sb-calorie-area {
            min-height: 280px;
          }

          .sb-nutrients-area {
            min-height: 240px;
          }

          .sb-lunchbox-area {
            overflow: visible;
          }

          .sb-lunchbox-scale {
            zoom: 1;
          }

          .sb-nutrients-area > * {
            padding: 18px !important;
          }

          .sb-header-actions {
            gap: 8px;
          }
        }

        /* =====================================
           BALANCED NUTRITION CARD HEIGHTS
           ===================================== */

        .sb-dashboard {
          grid-template-rows: minmax(0, 48fr) minmax(0, 52fr);
          gap: 14px;
        }

        .sb-nutrition {
          gap: 9px;
        }

        .sb-nutrition-grid {
          gap: 14px;
        }

        .sb-calorie-area > * {
          height: 100%;
          min-height: 0;
          padding-bottom: 12px;
        }

        .sb-nutrients-area {
          grid-template-rows: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .sb-nutrients-area > * {
          min-height: 0;
          height: 100%;
          padding: 12px 18px !important;
          overflow: visible;
        }

        /* Shorter desktop screens */
        @media (max-height: 800px) and (min-width: 901px) {
          .sb-dashboard {
            grid-template-rows: minmax(0, 50fr) minmax(0, 50fr);
          }

          .sb-nutrients-area > * {
            padding: 10px 14px !important;
          }

          .sb-lunchbox-scale {
            zoom: 0.72;
          }
        }

        /* Mobile layout */
        @media (max-width: 900px) {
          .sb-dashboard {
            display: flex;
            flex-direction: column;
          }

          .sb-calorie-area > *,
          .sb-nutrients-area > * {
            height: auto;
          }
        }
      `}</style>

      {/* OPENING ANIMATION */}
      <AnimatePresence>
        {showOpening && (
          <OpeningAnimation
            onComplete={() => setShowOpening(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
      />

      {/* MAIN WORKSPACE */}
      <main className="sustansya-workspace">
        <header
          className={`sb-page-header ${
            activePage === 'Dashboard'
              ? 'sb-dashboard-page-header'
              : ''
          }`}
        >
          <div>
            {activePage === 'Dashboard' ? (
              <div className="sb-dashboard-welcome">
                <h1 style={{ color: '#243D32' }}>
                  Welcome to SustansyaBox!
                </h1>
                <p>
                  Monitor your meals, track your nutrition, and stay connected
                  to your smart lunchbox.
                </p>
              </div>
            ) : (
              <h1 className="sb-page-title">
                {activePage}
              </h1>
            )}
          </div>

          {/* HEADER BUTTONS */}
          <div className="sb-header-actions">

            {/* NUTRITION NOTIFICATIONS */}
            <NotificationBell
              caloriesConsumed={PREVIEW_NUTRITION.calories}
              caloriesGoal={calorieGoal}
              sugarConsumed={PREVIEW_NUTRITION.sugar}
              sugarGoal={sugarGoal}
              sodiumConsumed={PREVIEW_NUTRITION.sodium}
              sodiumGoal={sodiumGoal}
            />

            {/* LIGHT / DARK MODE */}
            <button
              type="button"
              className="sb-theme-button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div
          className={`sustansya-content ${
            activePage === 'Dashboard'
              ? 'dashboard-active'
              : 'other-page-active'
          }`}
        >
          {/* DASHBOARD */}
          {activePage === 'Dashboard' && (
            <div className="sb-dashboard">
              {/* TODAY'S NUTRITION */}
              <section className="sb-nutrition">
                <h2 className="sb-section-heading">
                  Today's Nutrition
                </h2>

                <div className="sb-nutrition-grid">
                  <div className="sb-calorie-area">
                    <CalorieRing
                      consumed={PREVIEW_NUTRITION.calories}
                      goal={calorieGoal}
                    />
                  </div>

                  <div className="sb-nutrients-area">
                    <NutritionCard
                      title="Sugar Intake"
                      consumed={PREVIEW_NUTRITION.sugar}
                      goal={sugarGoal}
                      unit="g"
                      icon={Candy}
                      color="#C58A63"
                    />

                    <NutritionCard
                      title="Sodium Intake"
                      consumed={PREVIEW_NUTRITION.sodium}
                      goal={sodiumGoal}
                      unit="mg"
                      icon={Droplets}
                      color="#83A9A0"
                    />
                  </div>
                </div>
              </section>

              {/* SMART LUNCHBOX OVERVIEW */}
              <section className="sb-lunchbox-area">
                <div className="sb-lunchbox-scale">
                  <SmartLunchboxOverview />
                </div>
              </section>
            </div>
          )}

          {/* SETTINGS */}
          {activePage === 'Settings' && (
            <UserProfile
              profile={profile}
              onSave={handleSaveProfile}
              onBack={() =>
                setActivePage('Smart Lunchbox')
              }
            />
          )}

          {/* SMART LUNCHBOX */}
          {activePage === 'Smart Lunchbox' && (
            <SmartLunchbox />
          )}

          {/* MEAL HISTORY */}
          {activePage === 'Meal History' && (
            <MealHistory />
          )}

          {/* MEAL PLANNER */}
          {activePage === 'Meal Planner' && (
            <MealPlanner />
          )}

          {/* RECIPES */}
          {activePage === 'Recipes' && (
            <Recipes />
          )}

          {/* NUTRITION REPORTS */}
          {activePage === 'Nutrition Reports' && (
            <NutritionReports />
          )}

          {/* ABOUT US */}
          {activePage === 'About Us' && (
            <AboutUsPreview />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
