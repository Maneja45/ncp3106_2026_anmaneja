
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Moon, Sun } from 'lucide-react'

import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import SmartLunchbox from './SmartLunchbox'
import MealHistory from './components/MealHistory'
import MealPlanner from './components/MealPlanner'
import Recipes from './components/Recipes'
import NutritionReports from './components/NutritionReports'
import OpeningAnimation from './components/OpeningAnimation'
import Login from './components/Login'
import Register, {
  type RegistrationData,
} from './components/Register'
import EmailVerification from './components/EmailVerification'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import UserProfile from './components/UserProfile'
import AboutUsPreview from './components/AboutUsPreview'
import NotificationBell from './components/NotificationBell'

import {
  initialProfile,
  type ProfileData,
} from './types/profile'

import {
  sampleMeals,
  type Meal,
} from './types/meals'

import { API_BASE_URL } from './services/api'

import './App.css'

// ============================================
// TYPES
// ============================================

type AuthPage =
  | 'login'
  | 'register'
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

type LoginResponse = {
  success: boolean
  message?: string
  user?: {
    user_id?: number
    full_name?: string
    email?: string
    age?: number | null
    height?: number | null
    weight?: number | null
  }
}

const PROFILE_STORAGE_KEY =
  'sustansyabox_profile'

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

const PREVIEW_NUTRITION = {
  calories: 1250,
  sugar: 28,
  sodium: 1400,
}

// ============================================
// PROFILE STORAGE
// ============================================

function loadProfile(): ProfileData {
  try {
    const stored = localStorage.getItem(
      PROFILE_STORAGE_KEY
    )

    if (stored) {
      const parsed: unknown = JSON.parse(stored)

      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        const values = parsed as Record<
          string,
          unknown
        >

        const result = { ...initialProfile }

        for (
          const key of Object.keys(
            initialProfile
          ) as (keyof ProfileData)[]
        ) {
          if (typeof values[key] === 'string') {
            result[key] = values[key]
          }
        }

        return result
      }
    }
  } catch {
    // Use default profile if storage is unavailable.
  }

  return { ...initialProfile }
}

// ============================================
// LOGIN API
// ============================================

async function loginWithBackend(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_BASE_URL}/login.php`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    }
  )

  const contentType =
    response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new Error(
      'The login server did not return JSON. Check your PHP login.php file.'
    )
  }

  const result: LoginResponse =
    await response.json()

  if (!response.ok || result.success !== true) {
    throw new Error(
      result.message ||
        'Incorrect email or password.'
    )
  }

  return result
}

// ============================================
// MAIN APPLICATION
// ============================================

function App() {
  // ==========================================
  // SHARED MEALS
  // ==========================================

  const [meals, setMeals] =
    useState<Meal[]>(sampleMeals)

  // ==========================================
  // USER PROFILE
  // ==========================================

  const [profile, setProfile] =
    useState<ProfileData>(loadProfile)

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  const [isLoggedIn, setIsLoggedIn] =
    useState(false)

  const [authPage, setAuthPage] =
    useState<AuthPage>('login')

  const [pendingEmail, setPendingEmail] =
    useState('')

  const [loginError, setLoginError] =
    useState('')

  const [loginLoading, setLoginLoading] =
    useState(false)

  const [registeredMessage, setRegisteredMessage] =
    useState('')

  // ==========================================
  // APPEARANCE
  // ==========================================

  const [darkMode, setDarkMode] =
    useState(false)

  const [showOpening, setShowOpening] =
    useState(false)

  // ==========================================
  // DEVICE PREVIEW
  // ==========================================

  const [
    deviceConnected,
    setDeviceConnected,
  ] = useState(false)

  const batteryPercentage: number | null =
    deviceConnected ? 85 : null

  // ==========================================
  // NAVIGATION
  // ==========================================

  const [activePage, setActivePage] =
    useState<DashboardPage>(
      'Smart Lunchbox'
    )

  const isDashboard =
    activePage === 'Dashboard'

  const isSmartLunchbox =
    activePage === 'Smart Lunchbox'

  const isFixedHeightPage =
    isDashboard || isSmartLunchbox

  // ==========================================
  // SAVE PROFILE PREFERENCES
  // ==========================================

  useEffect(() => {
    if (!isLoggedIn) return

    try {
      localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(profile)
      )
    } catch {
      // Storage might be disabled.
    }
  }, [profile, isLoggedIn])

  const handleSaveProfile = (
    updatedProfile: ProfileData
  ) => {
    setProfile(updatedProfile)
  }

  // ==========================================
  // NUTRITION GOALS
  // ==========================================

  const calorieGoal =
    Number(profile.calories)

  const sugarGoal =
    Number(profile.sugar)

  const sodiumGoal =
    Number(profile.sodium)

  // ==========================================
  // THEME
  // ==========================================

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      darkMode ? 'dark' : 'light'
    )
  }, [darkMode])

  const toggleTheme = () => {
    setDarkMode((previous) => !previous)
  }

  // ==========================================
  // AUTHENTICATION HANDLERS
  // ==========================================

  const handleLogin = async (
    email: string,
    password: string
  ): Promise<void> => {
    if (loginLoading) return

    setLoginError('')
    setRegisteredMessage('')

    if (!email.trim() || !password) {
      setLoginError(
        'Please enter your email and password.'
      )
      return
    }

    setLoginLoading(true)

    try {
      const result = await loginWithBackend(
        email,
        password
      )

      // Only the backend can confirm a valid login.
      if (!result.success) {
        throw new Error(
          'Unable to sign in.'
        )
      }

      // Clear any previous user's local profile.
      try {
        localStorage.removeItem(
          PROFILE_STORAGE_KEY
        )
      } catch {
        // Continue without browser storage.
      }

      const loggedInUser = result.user

      setProfile({
        ...initialProfile,
        fullName:
          loggedInUser?.full_name ||
          initialProfile.fullName,
        email:
          loggedInUser?.email ||
          email.trim().toLowerCase(),
        age:
          loggedInUser?.age != null
            ? String(loggedInUser.age)
            : initialProfile.age,
        height:
          loggedInUser?.height != null
            ? String(loggedInUser.height)
            : initialProfile.height,
        weight:
          loggedInUser?.weight != null
            ? String(loggedInUser.weight)
            : initialProfile.weight,
      })
      setMeals(sampleMeals)

      setActivePage('Smart Lunchbox')
      setIsLoggedIn(true)
      setShowOpening(true)
      setPendingEmail('')
      setAuthPage('login')
    } catch (error: unknown) {
      if (error instanceof TypeError) {
        setLoginError(
          'Cannot connect to XAMPP. Please check that Apache and MySQL are running.'
        )
      } else if (error instanceof Error) {
        setLoginError(error.message)
      } else {
        setLoginError(
          'Login failed. Please try again.'
        )
      }
    } finally {
      setLoginLoading(false)
    }
  }

  // Registration is already submitted to PHP
  // inside Register.tsx.
  //
  // This callback runs ONLY after registration
  // succeeds, so we do not save the password
  // or create the account a second time.

  const handleRegister = (
    data: RegistrationData
  ): void => {
    setPendingEmail(data.email)

    setRegisteredMessage(
      'Your account has been created successfully. Please sign in.'
    )

    setLoginError('')
    setAuthPage('login')
  }

  const handleForgotPassword = (
    email: string
  ): void => {
    setPendingEmail(email)
    setAuthPage('recovery-verify')
  }

  const handleRecoveryVerified = (): void => {
    setAuthPage('reset-password')
  }

  const handleResetComplete = (): void => {
    setPendingEmail('')
    setAuthPage('login')
  }

  // ==========================================
  // NAVIGATION
  // ==========================================

  const handleNavigate = (
    page: string
  ): void => {
    if (
      dashboardPages.includes(
        page as DashboardPage
      )
    ) {
      setActivePage(page as DashboardPage)
    }
  }

  // ==========================================
  // AUTHENTICATION SCREENS
  // ==========================================

  if (!isLoggedIn) {
    return (
      <>
        <style>{`
          .sb-auth-feedback {
            position: fixed;
            z-index: 9999;
            left: 50%;
            top: 14px;
            transform: translateX(-50%);
            width: min(440px, calc(100% - 32px));
            padding: 13px 18px;
            border-radius: 12px;
            font-family: 'DM Sans', sans-serif;
            font-size: 13px;
            font-weight: 600;
            text-align: center;
            box-shadow: 0 12px 35px rgba(0,0,0,.1);
          }

          .sb-auth-feedback.success {
            background: #eaf5ed;
            color: #285e3b;
            border: 1px solid #bcdac3;
          }

          .sb-auth-feedback.error {
            background: #fff0ed;
            color: #a33e35;
            border: 1px solid #f2d0ca;
          }

          .sb-auth-loading {
            position: fixed;
            z-index: 9998;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            padding: 11px 20px;
            border-radius: 30px;
            background: #284b39;
            color: white;
            font-family: 'DM Sans', sans-serif;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 10px 30px rgba(0,0,0,.15);
          }
        `}</style>

        {authPage === 'login' && registeredMessage && (
          <div
            className="sb-auth-feedback success"
            role="status"
          >
            {registeredMessage}
          </div>
        )}

        {authPage === 'login' && loginError && (
          <div
            className="sb-auth-feedback error"
            role="alert"
          >
            {loginError}
          </div>
        )}

        {loginLoading && (
          <div
            className="sb-auth-loading"
            role="status"
          >
            Checking your account...
          </div>
        )}

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
                onRegister={() => {
                  setLoginError('')
                  setRegisteredMessage('')
                  setAuthPage('register')
                }}
                onForgotPassword={() => {
                  setLoginError('')
                  setRegisteredMessage('')
                  setAuthPage('forgot-password')
                }}
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
                onBackToLogin={() => {
                  setAuthPage('login')
                  setLoginError('')
                }}
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
                onBackToLogin={() =>
                  setAuthPage('login')
                }
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
      </>
    )
  }

  // ==========================================
  // MAIN APPLICATION
  // ==========================================

  return (
    <div className="app sustansya-app-shell">
      <style>{`
        /* =====================================
           TYPOGRAPHY
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
          flex: 1 1 0;
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          padding: 12px 22px;
          overflow: hidden;
        }

        .sustansya-content {
          flex: 1 1 0;
          min-width: 0;
          min-height: 0;
        }

        /* =====================================
           PAGE SCROLL BEHAVIOR
           ===================================== */

        .sustansya-content.dashboard-active {
          height: 100%;
          overflow: hidden;
        }

        .sustansya-content.smart-lunchbox-active {
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sustansya-content.smart-lunchbox-active
        > .smart-page {
          flex: 1 1 0;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }

        .sustansya-content.other-page-active {
          overflow-x: hidden;
          overflow-y: auto;
        }

        /* =====================================
           PAGE HEADER
           ===================================== */

        .sb-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
          gap: 14px;
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
           DASHBOARD WELCOME HEADER
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
           HEADER ACTIONS
           ===================================== */

        .sb-header-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          flex-shrink: 0;
        }

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

        /* =====================================
           DEVICE STATUS
           ===================================== */

        .sb-device-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 4px 0;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--muted);
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          transition: color 0.2s ease;
        }

        .sb-device-status.is-connected {
          color: #4FAD73;
        }

        .sb-device-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #9CA3AF;
          flex-shrink: 0;
          transition: background 0.2s ease;
        }

        .sb-device-status.is-connected
        .sb-device-dot {
          background: #4FAD73;
        }

        .sb-signal-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          display: block;
        }

        .sb-battery-icon {
          width: 36px;
          height: 22px;
          flex-shrink: 0;
          display: block;
          color: var(--text);
        }

        /* =====================================
           DASHBOARD GRID
           ===================================== */

        .sb-dashboard {
          height: 100%;
          min-height: 0;
          min-width: 0;
          display: grid;
          grid-template-rows:
            minmax(0, 48fr)
            minmax(0, 52fr);
          gap: 14px;
          overflow: hidden;
        }

        /* =====================================
           DASHBOARD NUTRITION
           ===================================== */

        .sb-nutrition {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          gap: 9px;
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
          flex: 1 1 0;
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
          padding-bottom: 12px;
        }

        /* =====================================
           SUGAR AND SODIUM
           ===================================== */

        .sb-nutrients-area {
          display: grid;
          grid-template-rows:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
          min-height: 0;
        }

        .sb-nutrients-area > * {
          min-width: 0;
          min-height: 0;
          height: 100%;
          padding: 12px 18px !important;
          overflow: visible;
        }

        .sb-nutrients-area p,
        .sb-nutrients-area small {
          line-height: 1.3;
        }

        /* =====================================
           DASHBOARD LUNCHBOX PREVIEW
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
           SMART LUNCHBOX BENTO
           ===================================== */

        .smart-lunchbox-active .smart-layout {
          flex: 1 1 0;
          min-height: 0;
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          grid-template-rows:
            minmax(0, 1.15fr)
            minmax(0, 0.9fr);
          gap: 14px;
        }

        .smart-lunchbox-active
        .smart-lunchbox-panel {
          grid-column: 1 / -1;
          min-height: 0;
        }

        .smart-lunchbox-active
        .smart-nutrition-panel,
        .smart-lunchbox-active
        .smart-details-panel {
          min-width: 0;
          min-height: 0;
        }

        /* =====================================
           TALL DESKTOP SCREENS
           ===================================== */

        @media (min-height: 1000px) {
          .sb-lunchbox-scale {
            zoom: 0.73;
          }
        }

        /* =====================================
           SHORT DESKTOP SCREENS
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
              minmax(0, 50fr)
              minmax(0, 50fr);
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
            padding: 10px 14px !important;
          }

          .sb-lunchbox-scale {
            zoom: 0.72;
          }

          .smart-lunchbox-active .smart-layout {
            gap: 10px;
          }
        }

        /* =====================================
           VERY SHORT SCREENS
           ===================================== */

        @media (max-height: 650px) {
          .sb-lunchbox-scale {
            zoom: 0.46;
          }
        }

        /* =====================================
           TABLET AND SMALL SCREENS
           ===================================== */

        @media (max-width: 950px) {
          .sustansya-workspace {
            padding: 14px;
          }

          .sustansya-content.smart-lunchbox-active {
            height: auto;
            overflow-x: hidden;
            overflow-y: auto;
          }

          .sustansya-content.smart-lunchbox-active
          > .smart-page {
            height: auto;
            min-height: 0;
            flex: none;
            overflow: visible;
          }

          .smart-lunchbox-active .smart-layout {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: auto;
            flex: none;
          }

          .smart-lunchbox-active
          .smart-lunchbox-panel {
            grid-column: 1;
          }

          .sb-header-actions {
            gap: 8px;
          }
        }

        /* =====================================
           DASHBOARD MOBILE
           ===================================== */

        @media (max-width: 900px) {
          .sustansya-content.dashboard-active {
            overflow-y: auto;
            overflow-x: hidden;
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

          .sb-calorie-area > *,
          .sb-nutrients-area > * {
            height: auto;
          }

          .sb-nutrients-area > * {
            padding: 18px !important;
          }

          .sb-lunchbox-area {
            overflow: visible;
          }

          .sb-lunchbox-scale {
            zoom: 1;
          }
        }

        /* =====================================
           SMALL MOBILE
           ===================================== */

        @media (max-width: 600px) {
          .sustansya-workspace {
            padding: 10px;
          }

          .sb-page-header {
            gap: 8px;
            flex-wrap: wrap;
          }

          .sb-page-title {
            font-size: 23px;
          }

          .sb-header-actions {
            gap: 7px;
          }

          .sb-theme-button {
            width: 36px;
            height: 36px;
          }
        }
      `}</style>

      {/* =====================================
          OPENING ANIMATION
          ===================================== */}

      <AnimatePresence>
        {showOpening && (
          <OpeningAnimation
            onComplete={() =>
              setShowOpening(false)
            }
          />
        )}
      </AnimatePresence>

      {/* =====================================
          SIDEBAR
          ===================================== */}

      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
      />

      {/* =====================================
          MAIN WORKSPACE
          ===================================== */}

      <main className="sustansya-workspace">
        {/* =====================================
            PAGE HEADER
            ===================================== */}

        <header
          className={`sb-page-header ${
            isDashboard
              ? 'sb-dashboard-page-header'
              : ''
          }`}
        >
          <div>
            {isDashboard ? (
              <div className="sb-dashboard-welcome">
                <h1
                  style={{
                    color: darkMode
                      ? 'var(--text)'
                      : '#243D32',
                  }}
                >
                  Welcome to SustansyaBox!
                </h1>

                <p>
                  Monitor your meals, track your
                  nutrition, and stay connected
                  to your smart lunchbox.
                </p>
              </div>
            ) : (
              <h1 className="sb-page-title">
                {activePage}
              </h1>
            )}
          </div>

          {/* =====================================
              HEADER ACTIONS
              ===================================== */}

          <div className="sb-header-actions">
            {/* DEVICE CONNECTION PREVIEW */}

            <button
              type="button"
              className={`sb-device-status ${
                deviceConnected
                  ? 'is-connected'
                  : ''
              }`}
              onClick={() =>
                setDeviceConnected(
                  (connected) => !connected
                )
              }
              aria-label={`Device ${
                deviceConnected
                  ? 'online'
                  : 'offline'
              }. Toggle preview status`}
              title="Device connection preview — click to toggle"
            >
              <span
                className="sb-device-dot"
                aria-hidden="true"
              />

              <span>
                {deviceConnected
                  ? 'Online'
                  : 'Offline'}
              </span>
            </button>

            {/* SIGNAL BARS */}

            <svg
              className="sb-signal-icon"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              {[5, 8, 12, 16].map(
                (height, index) => (
                  <rect
                    key={index}
                    x={1 + index * 5}
                    y={18 - height}
                    width="3.4"
                    height={height}
                    rx="1"
                    fill={
                      deviceConnected
                        ? '#4FAD73'
                        : '#9CA3AF'
                    }
                  />
                )
              )}
            </svg>

            {/* BATTERY */}

            <svg
              className="sb-battery-icon"
              viewBox="0 0 40 24"
              role="img"
              aria-label={
                batteryPercentage === null
                  ? 'Battery unavailable'
                  : `Battery ${batteryPercentage}% (preview)`
              }
            >
              <rect
                x="1.5"
                y="4"
                width="33"
                height="16"
                rx="3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />

              <rect
                x="36"
                y="9"
                width="2.5"
                height="6"
                rx="1"
                fill="currentColor"
              />

              <text
                x="18"
                y="12.5"
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="currentColor"
              >
                {batteryPercentage === null
                  ? '—'
                  : `${batteryPercentage}%`}
              </text>
            </svg>

            {/* NOTIFICATIONS */}

            <NotificationBell
              caloriesConsumed={
                PREVIEW_NUTRITION.calories
              }
              caloriesGoal={calorieGoal}
              sugarConsumed={
                PREVIEW_NUTRITION.sugar
              }
              sugarGoal={sugarGoal}
              sodiumConsumed={
                PREVIEW_NUTRITION.sodium
              }
              sodiumGoal={sodiumGoal}
            />

            {/* DARK MODE */}

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

        {/* =====================================
            PAGE CONTENT
            ===================================== */}

        <div
          className={`sustansya-content ${
            isSmartLunchbox
              ? 'smart-lunchbox-active'
              : isFixedHeightPage
                ? 'dashboard-active'
                : 'other-page-active'
          }`}
        >
          {/* DASHBOARD */}

          {activePage === 'Dashboard' && (
            <Dashboard
              calorieGoal={calorieGoal}
              sugarGoal={sugarGoal}
              sodiumGoal={sodiumGoal}
              meals={meals}
            />
          )}

          {/* SMART LUNCHBOX */}

          {activePage === 'Smart Lunchbox' && (
            <SmartLunchbox />
          )}

          {/* MEAL HISTORY */}

          {activePage === 'Meal History' && (
            <MealHistory
              meals={meals}
              setMeals={setMeals}
            />
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
        </div>
      </main>
    </div>
  )
}

export default App
