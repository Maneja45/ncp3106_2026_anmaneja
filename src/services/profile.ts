import { API_BASE_URL } from './api'
import { SessionExpiredError } from './meals'

// ============================================
// SustansyaBox — profile, password and sign out
// ============================================

export type SavedUser = {
  user_id: number
  full_name: string
  email: string
  age: number | string | null
  height: number | string | null
  weight: number | string | null
  sex: string | null
  activity_level: string | null
}

type Result = {
  success: boolean
  message?: string
  user?: SavedUser
}

async function post(path: string, body: Record<string, unknown>): Promise<Result> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Cannot connect to the server. Make sure Apache and MySQL are running in XAMPP.')
  }

  if (!(response.headers.get('content-type') ?? '').includes('application/json')) {
    throw new Error(`The server did not answer correctly. Check ${path} in XAMPP.`)
  }

  const result = (await response.json()) as Result

  if (response.status === 401) {
    throw new SessionExpiredError(result.message || 'Please sign in again.')
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Something went wrong. Please try again.')
  }

  return result
}

export async function updateProfile(data: {
  fullName: string
  age: number
  height: number
  weight: number
  sex: string
  activityLevel: string
}): Promise<SavedUser> {
  const result = await post('update_profile.php', data)
  if (!result.user) throw new Error('Your profile could not be saved.')
  return result.user
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await post('change_password.php', { currentPassword, newPassword })
}

/** Ends the server session. Never throws — signing out should always work. */
export async function logout(): Promise<void> {
  try {
    await post('logout.php', {})
  } catch {
    // Already signed out or server offline — the app still signs out locally.
  }
}