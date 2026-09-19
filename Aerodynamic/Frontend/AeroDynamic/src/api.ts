const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export type BackendRole = 'ADMIN' | 'PRICING_ANALYST'

export interface LoginRequest {
  email: string
  password: string
}

export interface UserResponse {
  id: number
  name: string
  email: string
  role: BackendRole
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
}

export interface RegisterUserRequest {
  name: string
  email: string
  password: string
  role: BackendRole
}

export interface PricingRuleRequest {
  ruleName: string
  bussinessVariable: 'DEMAND' | 'AVAILABILITY' | 'TEMPORAL_CONTEXT'
  conditionOperator: 'GREATER_THAN_OR_EQUAL' | 'LESS_THAN_OR_EQUAL' | 'GREATER_THAN' | 'LESS_THAN'
  conditionValue: number
  adjustmentType: 'INCREASE_VALUE' | 'DECREASE_VALUE'
  adjustmentValue: number
  creatorUserId: number
}

export interface PricingRuleResponse {
  idRule: number
  ruleName: string
  bussinessVariable: string
  conditionOperator: string
  conditionValue: number
  adjustmentType: string
  adjustmentValue: number
  status: 'ACTIVE' | 'INACTIVE'
  creatorUserId: number
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  })

  if (!response.ok) {
    let message = `Error ${response.status}`
    try {
      const responseText = await response.text()
      if (responseText) {
        try {
          const body = JSON.parse(responseText) as { message?: string; error?: string }
          message = body.message || body.error || responseText
        } catch {
          message = responseText
        }
      }
    } catch {
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export function loginRequest(payload: LoginRequest): Promise<UserResponse> {
  return request<UserResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function registerUserRequest(payload: RegisterUserRequest): Promise<UserResponse> {
  return request<UserResponse>('/api/users/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getAllUsersRequest(): Promise<UserResponse[]> {
  return request<UserResponse[]>('/api/users')
}

export function createPricingRuleRequest(payload: PricingRuleRequest): Promise<PricingRuleResponse> {
  return request<PricingRuleResponse>('/api/pricing-rules', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getAllPricingRulesRequest(): Promise<PricingRuleResponse[]> {
  return request<PricingRuleResponse[]>('/api/pricing-rules')
}

export function getPricingRulesByStatusRequest(status: 'ACTIVE' | 'INACTIVE'): Promise<PricingRuleResponse[]> {
  return request<PricingRuleResponse[]>(`/api/pricing-rules/status/${status}`)
}
