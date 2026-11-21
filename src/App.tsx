import {
  useCallback,
  useEffect,
  useState,
} from 'react'

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
// ESP32 CONNECTION SETTINGS
// ============================================

const ESP32_URL = 'http://bitewise.local/weight'

const ESP32_POLL_INTERVAL = 500

const ESP32_RECONNECT_INTERVAL = 300

const ESP32_REQUEST_TIMEOUT = 1500

const ESP32_MAX_FAILURES = 3

type ESP32Response = {
  weight: number | null
  ready: boolean
}

type ESP32State = {
  connected: boolean
  weight: number | null
  ready: boolean
}

const INITIAL_ESP32_STATE: ESP32State = {
  connected: false,
  weight: null,
  ready: false,
}

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
  profileRequired?: boolean
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
        const values =
          parsed as Record<string, unknown>

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
    // Use default profile.
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
// GOOGLE LOGIN API
// ============================================

async function loginWithGoogleBackend(
  credential: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/google_login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ credential }),
  })

  if (!(response.headers.get('content-type') ?? '').includes('application/json')) {
    throw new Error('Google login server is not configured correctly.')
  }

  const result: LoginResponse = await response.json()
  if (result.profileRequired === true) {
    return result
  }
  if (!response.ok || result.success !== true || !result.user) {
    throw new Error(result.message || 'Unable to sign in with Google.')
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
    useState<boolean>(false)

  const [authPage, setAuthPage] =
    useState<AuthPage>('login')

  const [pendingEmail, setPendingEmail] =
    useState<string>('')

  const [loginError, setLoginError] =
    useState<string>('')

  const [loginLoading, setLoginLoading] =
    useState<boolean>(false)

  const [registeredMessage, setRegisteredMessage] =
    useState<string>('')

  // Keep a new user's Google token in memory only until registration.
  const [pendingGoogleCredential, setPendingGoogleCredential] =
    useState<string | null>(null)

  // ==========================================
  // APPEARANCE
  // ==========================================

  const [darkMode, setDarkMode] =
    useState<boolean>(false)

  const [showOpening, setShowOpening] =
    useState<boolean>(false)

  // ==========================================
  // STABLE OPENING ANIMATION CALLBACK
  // ==========================================

  const handleOpeningComplete =
    useCallback((): void => {
      setShowOpening(false)
    }, [])

  // ==========================================
  // ACTUAL ESP32 CONNECTION STATE
  // ==========================================

  const [esp32, setEsp32] =
    useState<ESP32State>(
      INITIAL_ESP32_STATE
    )

  const deviceConnected =
    esp32.connected

  const deviceInitializing =
    esp32.connected && !esp32.ready

  // Battery monitoring is not yet implemented.

  const batteryPercentage: number | null =
    null

  // ==========================================
  // AUTOMATIC ESP32 CONNECTION
  // ==========================================

  useEffect(() => {

    // Prevent the opening animation from
    // being interrupted by sensor updates.

    if (!isLoggedIn || showOpening) {
      return
    }

    let active = true
    let requestInProgress = false
    let isConnected = false
    let failedRequests = 0

    let pollTimer:
      ReturnType<typeof setTimeout> | undefined

    let controller:
      AbortController | undefined

    // ========================================
    // UPDATE DEVICE STATE
    // ========================================

    const updateDeviceState = (
      next: ESP32State
    ): void => {
      if (!active) return

      setEsp32((previous) => {

        // Avoid unnecessary React renders.

        if (
          previous.connected === next.connected &&
          previous.ready === next.ready &&
          previous.weight === next.weight
        ) {
          return previous
        }

        return next
      })
    }

    // ========================================
    // CHECK ESP32 CONNECTION
    // ========================================

    const checkESP32 =
      async (): Promise<void> => {

        if (!active || requestInProgress) {
          return
        }

        requestInProgress = true

        clearTimeout(pollTimer)

        const requestController =
          new AbortController()

        controller = requestController

        const requestTimeout = setTimeout(() => {
          requestController.abort()
        }, ESP32_REQUEST_TIMEOUT)

        try {

          // Prevent cached weight responses.

          const requestURL =
            `${ESP32_URL}?t=${Date.now()}`

          const response = await fetch(
            requestURL,
            {
              method: 'GET',
              cache: 'no-store',
              signal: requestController.signal,
            }
          )

          if (!response.ok) {
            throw new Error(
              'ESP32 is unavailable'
            )
          }

          const data: ESP32Response =
            await response.json()

          if (
            !data ||
            typeof data.ready !== 'boolean'
          ) {
            throw new Error(
              'Invalid ESP32 response'
            )
          }

          if (!active) return

          // ==================================
          // CONNECTION SUCCESSFUL
          // ==================================

          if (!isConnected) {
            console.info(
              '[BiteWise] ESP32 connected successfully.'
            )
          }

          isConnected = true
          failedRequests = 0

          // Weight can temporarily be null
          // during initialization or TARE.

          const weight =
            typeof data.weight === 'number' &&
            Number.isFinite(data.weight)
              ? data.weight
              : null

          const sensorReady =
            data.ready && weight !== null

          updateDeviceState({
            connected: true,
            ready: sensorReady,
            weight: sensorReady ? weight : null,
          })

        } catch {

          if (!active) return

          failedRequests += 1
          isConnected = false

          // ==================================
          // TEMPORARY CONNECTION FAILURE
          // ==================================

          if (
            failedRequests >= ESP32_MAX_FAILURES
          ) {

            updateDeviceState({
              connected: false,
              ready: false,
              weight: null,
            })

            if (
              failedRequests === ESP32_MAX_FAILURES
            ) {
              console.info(
                '[BiteWise] ESP32 offline. Automatically reconnecting...'
              )
            }

          } else {

            // Maintain connection status during
            // a brief interruption.

            setEsp32((previous) => {

              if (!previous.connected) {
                return previous
              }

              if (
                !previous.ready &&
                previous.weight === null
              ) {
                return previous
              }

              return {
                connected: true,
                ready: false,
                weight: null,
              }

            })

          }

        } finally {

          clearTimeout(requestTimeout)

          requestInProgress = false

          // ==================================
          // AUTOMATIC RECONNECTION
          // ==================================

          if (active) {
            pollTimer = setTimeout(
              () => {
                void checkESP32()
              },

              isConnected
                ? ESP32_POLL_INTERVAL
                : ESP32_RECONNECT_INTERVAL
            )
          }

        }
      }

    // ========================================
    // IMMEDIATE CONNECTION CHECK
    // ========================================

    const reconnectNow = (): void => {

      if (!active || requestInProgress) {
        return
      }

      clearTimeout(pollTimer)

      void checkESP32()
    }

    // ========================================
    // BROWSER VISIBILITY CHECK
    // ========================================

    const handleVisibilityChange = (): void => {

      if (
        document.visibilityState === 'visible'
      ) {
        reconnectNow()
      }

    }

    // ========================================
    // NETWORK EVENT LISTENERS
    // ========================================

    window.addEventListener(
      'online',
      reconnectNow
    )

    window.addEventListener(
      'focus',
      reconnectNow
    )

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    )

    // Start immediately after the opening
    // animation finishes.

    void checkESP32()

    // ========================================
    // CLEANUP
    // ========================================

    return () => {

      active = false

      clearTimeout(pollTimer)

      controller?.abort()

      window.removeEventListener(
        'online',
        reconnectNow
      )

      window.removeEventListener(
        'focus',
        reconnectNow
      )

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      )

    }

  }, [isLoggedIn, showOpening])

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
  ): void => {
    setProfile(updatedProfile)
  }

  // ==========================================
  // NUTRITION SETTINGS
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

  const toggleTheme = (): void => {
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

      if (!result.success) {
        throw new Error(
          'Unable to sign in.'
        )
      }

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

      setEsp32(INITIAL_ESP32_STATE)

      setActivePage('Smart Lunchbox')

      // Opening animation runs once
      // after successful login.

      setShowOpening(true)

      setIsLoggedIn(true)

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

  // ==========================================
  // GOOGLE AUTHENTICATION HANDLER
  // ==========================================

  const handleGoogleLogin = async (credential: string): Promise<void> => {
    if (loginLoading) return
    setLoginError('')
    setRegisteredMessage('')
    setLoginLoading(true)
    try {
      const result = await loginWithGoogleBackend(credential)
      if (result.profileRequired) {
        setPendingGoogleCredential(credential)
        setAuthPage('register')
        return
      }
      const user = result.user
      if (!user?.user_id || !user.email) {
        throw new Error('Google account verification failed.')
      }
      try {
        localStorage.removeItem(PROFILE_STORAGE_KEY)
      } catch {
        // Continue without browser storage.
      }
      setProfile({
        ...initialProfile,
        fullName: user.full_name ?? '',
        email: user.email,
        age: user.age != null ? String(user.age) : '',
        height: user.height != null ? String(user.height) : '',
        weight: user.weight != null ? String(user.weight) : '',
      })
      setMeals(sampleMeals)
      setEsp32(INITIAL_ESP32_STATE)
      setActivePage('Smart Lunchbox')
      setShowOpening(true)
      setIsLoggedIn(true)
      setPendingEmail('')
      setPendingGoogleCredential(null)
      setAuthPage('login')
    } catch (error: unknown) {
      setLoginError(error instanceof TypeError
        ? 'Cannot connect to the authentication server. Please check XAMPP.'
        : error instanceof Error ? error.message : 'Google Sign-In failed. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  // ==========================================
  // REGISTRATION
  // ==========================================

  const handleGoogleRegistered = (user: {
    user_id: number
    full_name: string
    email: string
    age: number | null
    height: number | null
    weight: number | null
  }): void => {
    if (!user.user_id || !user.email) return
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY)
    } catch {
      // Continue without browser storage.
    }
    setProfile({
      ...initialProfile,
      fullName: user.full_name,
      email: user.email,
      age: user.age != null ? String(user.age) : '',
      height: user.height != null ? String(user.height) : '',
      weight: user.weight != null ? String(user.weight) : '',
    })
    setMeals(sampleMeals)
    setEsp32(INITIAL_ESP32_STATE)
    setActivePage('Smart Lunchbox')
    setPendingGoogleCredential(null)
    setPendingEmail('')
    setLoginError('')
    setShowOpening(true)
    setIsLoggedIn(true)
    setAuthPage('login')
  }

  const handleRegister = (
    data: RegistrationData
  ): void => {

    setPendingEmail(data.email)
    setPendingGoogleCredential(null)

    setRegisteredMessage(
      'Your account has been created successfully. Please sign in.'
    )

    setLoginError('')

    setAuthPage('login')
  }

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  const handleForgotPassword = (
    email: string
  ): void => {

    setPendingEmail(email)

    setAuthPage('recovery-verify')
  }

  const handleRecoveryVerified =
    (): void => {
      setAuthPage('reset-password')
    }

  const handleResetComplete =
    (): void => {
      setPendingEmail('')
      setAuthPage('login')
    }

  // ==========================================
  // NAVIGATION HANDLER
  // ==========================================

  const handleNavigate = (
    page: string
  ): void => {

    if (
      dashboardPages.includes(
        page as DashboardPage
      )
    ) {
      setActivePage(
        page as DashboardPage
      )
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

            width:
              min(440px, calc(100% - 32px));

            padding: 13px 18px;

            border-radius: 12px;

            font-family: 'DM Sans', sans-serif;
            font-size: 13px;
            font-weight: 600;

            text-align: center;

            box-shadow:
              0 12px 35px rgba(0,0,0,.1);
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

            box-shadow:
              0 10px 30px rgba(0,0,0,.15);
          }

        `}</style>

        {/* SUCCESS MESSAGE */}

        {authPage === 'login' &&
          registeredMessage && (
            <div
              className="sb-auth-feedback success"
              role="status"
            >
              {registeredMessage}
            </div>
          )}

        {/* ERROR MESSAGE */}

        {authPage === 'login' &&
          loginError && (
            <div
              className="sb-auth-feedback error"
              role="alert"
            >
              {loginError}
            </div>
          )}

        {/* LOGIN LOADING */}

        {loginLoading && (
          <div
            className="sb-auth-loading"
            role="status"
          >
            Checking your account...
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* LOGIN PAGE */}

          {authPage === 'login' && (
            <motion.div
              key="login"
              initial={{
                opacity: 0,
                x: -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: 20,
              }}
              transition={{
                duration: 0.35,
              }}
              style={{
                minHeight: '100vh',
              }}
            >
              <Login
                onLogin={handleLogin}
                onGoogleLogin={handleGoogleLogin}

                onRegister={() => {
                  setLoginError('')
                  setRegisteredMessage('')
                  setPendingGoogleCredential(null)
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

          {/* REGISTER PAGE */}

          {authPage === 'register' && (
            <motion.div
              key="register"
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: -20,
              }}
              transition={{
                duration: 0.35,
              }}
              style={{
                minHeight: '100vh',
              }}
            >
              <Register
                onRegister={handleRegister}
                googleCredential={pendingGoogleCredential}
                onGoogleRegistered={handleGoogleRegistered}

                onBackToLogin={() => {
                  setAuthPage('login')
                  setPendingGoogleCredential(null)
                  setLoginError('')
                }}
              />
            </motion.div>
          )}

          {/* FORGOT PASSWORD PAGE */}

          {authPage === 'forgot-password' && (
            <motion.div
              key="forgot-password"
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: -20,
              }}
              transition={{
                duration: 0.35,
              }}
              style={{
                minHeight: '100vh',
              }}
            >
              <ForgotPassword
                onContinue={
                  handleForgotPassword
                }

                onBackToLogin={() =>
                  setAuthPage('login')
                }
              />
            </motion.div>
          )}

          {/* EMAIL VERIFICATION */}

          {authPage === 'recovery-verify' && (
            <motion.div
              key="recovery-verify"
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -20,
              }}
              transition={{
                duration: 0.35,
              }}
              style={{
                minHeight: '100vh',
              }}
            >
              <EmailVerification
                email={pendingEmail}

                onVerified={
                  handleRecoveryVerified
                }

                onBack={() =>
                  setAuthPage('forgot-password')
                }
              />
            </motion.div>
          )}

          {/* RESET PASSWORD PAGE */}

          {authPage === 'reset-password' && (
            <motion.div
              key="reset-password"
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: -20,
              }}
              transition={{
                duration: 0.35,
              }}
              style={{
                minHeight: '100vh',
              }}
            >
              <ResetPassword
                onComplete={
                  handleResetComplete
                }

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
          font-family:
            Georgia,
            'Times New Roman',
            serif;

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

          min-width: 0;
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

          min-height: 0;

          overflow: hidden;
        }

        /* SMART LUNCHBOX */

        .sustansya-content.smart-lunchbox-active {
          display: flex;
          flex-direction: column;

          flex: 1 1 0;

          width: 100%;
          height: 100%;

          min-width: 0;
          min-height: 0;

          overflow: hidden;
        }

        .sustansya-content.smart-lunchbox-active
        > .smart-page {
          display: flex;
          flex-direction: column;

          flex: 1 1 0;

          width: 100%;
          height: 100%;

          min-width: 0;
          min-height: 0;

          overflow: hidden;
        }

        /* OTHER PAGES */

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

          font-size:
            clamp(25px, 2.15vw, 31px);

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

          font-size:
            clamp(23px, 2.1vw, 31px);

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
           ACTUAL DEVICE STATUS
        ===================================== */

        .sb-device-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 6px;
          padding: 4px 0;

          background: transparent;
          border: none;

          cursor: default;

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

          font-size:
            clamp(17px, 1.35vw, 20px);

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
           NEW SMART LUNCHBOX FULL SCREEN
           SINGLE MAIN CONTAINER

           LEFT   : LUNCHBOX
           RIGHT  : NUTRITION AND DETAILS
        ===================================== */

        .sustansya-content.smart-lunchbox-active
        .smart-layout {
          width: 100%;

          flex: 1 1 0;

          min-width: 0;
          min-height: 0;

          display: grid;

          grid-template-columns:
            minmax(0, 55fr)
            minmax(0, 45fr);

          grid-template-rows:
            minmax(0, 1fr);

          gap: 14px;

          overflow: hidden;
        }

        /* =====================================
           LEFT SIDE: LARGE LUNCHBOX
        ===================================== */

        .sustansya-content.smart-lunchbox-active
        .smart-lunchbox-panel {
          grid-column: 1;
          grid-row: 1;

          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;
        }

        .sustansya-content.smart-lunchbox-active
        .smart-lunchbox-stage {
          flex: 1 1 0;

          width: 100%;

          min-width: 0;
          min-height: 0;
        }

        /* =====================================
           RIGHT SIDE
        ===================================== */

        .sustansya-content.smart-lunchbox-active
        .smart-right-column {
          grid-column: 2;
          grid-row: 1;

          display: grid;

          grid-template-columns:
            minmax(0, 1fr);

          grid-template-rows:
            minmax(0, 45fr)
            minmax(0, 55fr);

          min-width: 0;
          min-height: 0;

          gap: 12px;
        }

        /* =====================================
           TOP RIGHT: NUTRITION
        ===================================== */

        .sustansya-content.smart-lunchbox-active
        .smart-nutrition-panel {
          grid-column: 1;
          grid-row: 1;

          min-width: 0;
          min-height: 0;
        }

        /* =====================================
           BOTTOM RIGHT: COMPARTMENT DETAILS
        ===================================== */

        .sustansya-content.smart-lunchbox-active
        .smart-details-panel {
          grid-column: 1;
          grid-row: 2;

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

          .sustansya-content.smart-lunchbox-active
          .smart-layout {
            gap: 10px;
          }

          .sustansya-content.smart-lunchbox-active
          .smart-right-column {
            gap: 9px;
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

          .sb-header-actions {
            gap: 8px;
          }

        }

        /* =====================================
           SMART LUNCHBOX RESPONSIVE FALLBACK
        ===================================== */

        @media (max-width: 950px),
               (max-height: 560px) {

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

          .sustansya-content.smart-lunchbox-active
          .smart-layout {
            flex: none;

            display: grid;

            grid-template-columns:
              minmax(0, 1fr);

            grid-template-rows:
              auto auto;

            overflow: visible;
          }

          .sustansya-content.smart-lunchbox-active
          .smart-lunchbox-panel {
            grid-column: 1;
            grid-row: 1;

            min-height: 400px;
          }

          .sustansya-content.smart-lunchbox-active
          .smart-lunchbox-stage {
            min-height: 375px;
          }

          .sustansya-content.smart-lunchbox-active
          .smart-right-column {
            grid-column: 1;
            grid-row: 2;

            grid-template-columns:
              minmax(0, 1fr);

            grid-template-rows:
              auto auto;
          }

          .sustansya-content.smart-lunchbox-active
          .smart-nutrition-panel {
            min-height: 240px;
          }

          .sustansya-content.smart-lunchbox-active
          .smart-details-panel {
            min-height: 260px;
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

          .sustansya-content.smart-lunchbox-active
          .smart-layout {
            gap: 10px;
          }

          .sustansya-content.smart-lunchbox-active
          .smart-lunchbox-panel {
            min-height: 330px;
          }

          .sustansya-content.smart-lunchbox-active
          .smart-lunchbox-stage {
            min-height: 310px;
          }

        }

      `}</style>

      {/* =====================================
          OPENING ANIMATION
      ===================================== */}

      <AnimatePresence>

        {showOpening && (
          <OpeningAnimation
            key="sustansyabox-opening"
            onComplete={handleOpeningComplete}
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

        {/* ===================================
            PAGE HEADER
        =================================== */}

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

          {/* =================================
              HEADER ACTIONS
          ================================= */}

          <div className="sb-header-actions">

            {/* ===============================
                REAL ESP32 CONNECTION
            =============================== */}

            <div

              className={`sb-device-status ${
                deviceConnected
                  ? 'is-connected'
                  : ''
              }`}

              role="status"

              aria-live="polite"

              aria-label={`ESP32 ${
                deviceConnected
                  ? 'online'
                  : 'offline'
              }`}

              title={
                deviceInitializing
                  ? 'BiteWise connected. Sensor initializing.'
                  : deviceConnected
                    ? 'Connected to BiteWise ESP32'
                    : 'Automatically reconnecting to BiteWise ESP32'
              }

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

            </div>

            {/* ===============================
                CONNECTION SIGNAL BARS
            =============================== */}

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

            {/* ===============================
                BATTERY STATUS
            =============================== */}

            <svg

              className="sb-battery-icon"

              viewBox="0 0 40 24"

              role="img"

              aria-label={
                batteryPercentage === null
                  ? 'Battery unavailable'
                  : `Battery ${batteryPercentage}%`
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

            {/* ===============================
                NOTIFICATIONS
            =============================== */}

            <NotificationBell

              caloriesConsumed={
                PREVIEW_NUTRITION.calories
              }

              caloriesGoal={
                calorieGoal
              }

              sugarConsumed={
                PREVIEW_NUTRITION.sugar
              }

              sugarGoal={
                sugarGoal
              }

              sodiumConsumed={
                PREVIEW_NUTRITION.sodium
              }

              sodiumGoal={
                sodiumGoal
              }

            />

            {/* ===============================
                DARK MODE
            =============================== */}

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

        {/* ===================================
            PAGE CONTENT
        =================================== */}

        <div

          className={`sustansya-content ${
            isSmartLunchbox
              ? 'smart-lunchbox-active'
              : isFixedHeightPage
                ? 'dashboard-active'
                : 'other-page-active'
          }`}

        >

          {/* =================================
              DASHBOARD
          ================================= */}

          {activePage === 'Dashboard' && (

            <Dashboard

              calorieGoal={calorieGoal}

              sugarGoal={sugarGoal}

              sodiumGoal={sodiumGoal}

              meals={meals}

              deviceOnline={esp32.connected}

              liveWeight={esp32.weight}

            />

          )}

          {/* =================================
              SMART LUNCHBOX

              Uses the same real ESP32
              connection as the Dashboard.
          ================================= */}

          {activePage === 'Smart Lunchbox' && (

            <SmartLunchbox

              deviceOnline={esp32.connected}

              liveWeight={esp32.weight}

              sensorReady={esp32.ready}

            />

          )}

          {/* =================================
              MEAL HISTORY
          ================================= */}

          {activePage === 'Meal History' && (

            <MealHistory

              meals={meals}

              setMeals={setMeals}

            />

          )}

          {/* =================================
              MEAL PLANNER
          ================================= */}

          {activePage === 'Meal Planner' && (

            <MealPlanner />

          )}

          {/* =================================
              RECIPES
          ================================= */}

          {activePage === 'Recipes' && (

            <Recipes />

          )}

          {/* =================================
              NUTRITION REPORTS
          ================================= */}

          {activePage === 'Nutrition Reports' && (

            <NutritionReports />

          )}

          {/* =================================
              ABOUT US
          ================================= */}

          {activePage === 'About Us' && (

            <AboutUsPreview />

          )}

          {/* =================================
              SETTINGS
          ================================= */}

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