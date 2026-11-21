
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? 'http://localhost/sustansyabox-api'
    : '/sustansyabox-api')

export interface DatabaseStatus {
  success: boolean
  message: string
  database?: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  age: number
  height: number
  weight: number
}

export interface RegisterResponse {
  success: boolean
  message: string
  userId?: number
}

export async function testDatabaseConnection():
  Promise<DatabaseStatus> {
  const response = await fetch(
    `${API_BASE_URL}/test.php`
  )

  if (!response.ok) {
    throw new Error('Database connection failed.')
  }

  return (await response.json()) as DatabaseStatus
}

export async function registerUser(
  data: RegisterRequest
): Promise<RegisterResponse> {
  const response = await fetch(
    `${API_BASE_URL}/register.php`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  )

  const result =
    (await response.json()) as RegisterResponse

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || 'Registration failed.'
    )
  }

  return result
}

export interface GoogleRegisterRequest {
  credential: string
  age: number
  height: number
  weight: number
}

export interface GoogleRegisterResponse {
  success: boolean
  message?: string
  user?: {
    user_id: number
    full_name: string
    email: string
    age: number | null
    height: number | null
    weight: number | null
  }
}

export async function registerGoogleUser(
  data: GoogleRegisterRequest
): Promise<GoogleRegisterResponse> {
  const response = await fetch(
    `${API_BASE_URL}/google_register.php`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    }
  )

  const contentType =
    response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new Error(
      'The Google registration server did not return JSON. Check your PHP file and API URL.'
    )
  }

  const result: GoogleRegisterResponse =
    await response.json()

  if (
    !response.ok ||
    result.success !== true ||
    !result.user
  ) {
    throw new Error(
      result.message ||
        'Unable to create your Google account.'
    )
  }

  return result
}
