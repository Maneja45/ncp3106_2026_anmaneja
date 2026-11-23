import { API_BASE_URL } from './api'

// ============================================
// SustansyaBox — password recovery (email code)
// ============================================

type RecoveryResult = {
  success: boolean
  message?: string
  token?: string
}

async function post(path: string, body: Record<string, string>): Promise<RecoveryResult> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Cannot connect to the server. Make sure Apache and MySQL are running in XAMPP.')
  }

  if (!(response.headers.get('content-type') ?? '').includes('application/json')) {
    throw new Error(`The server did not answer correctly. Check ${path} in XAMPP.`)
  }

  const result = (await response.json()) as RecoveryResult

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Something went wrong. Please try again.')
  }

  return result
}

/** Emails a 6-digit code to the address (if it has an account). */
export async function requestResetCode(email: string): Promise<string> {
  const result = await post('forgot_password.php', { email })
  return result.message ?? 'We sent a 6-digit code to your email.'
}

/** Checks the code and returns a one-time reset token. */
export async function verifyResetCode(email: string, code: string): Promise<string> {
  const result = await post('verify_reset_code.php', { email, code })
  if (!result.token) throw new Error('The code could not be verified.')
  return result.token
}

/** Saves the new password. */
export async function resetPassword(email: string, token: string, password: string): Promise<string> {
  const result = await post('reset_password.php', { email, token, password })
  return result.message ?? 'Your password has been changed.'
}