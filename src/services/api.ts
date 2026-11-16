
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
