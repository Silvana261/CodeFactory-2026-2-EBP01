import { clearSession, getSession } from './session'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export type BackendRole = 'ADMIN' | 'PRICING_ANALYST'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  id: number
  name: string
  email: string
  role: BackendRole
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

export interface MessageResponse {
  message: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface VerifyResetCodeRequest {
  email: string
  code: string
}

export interface ResetPasswordRequest {
  email: string
  code: string
  newPassword: string
}

export type BusinessVariable = 'DEMAND' | 'AVAILABILITY' | 'TEMPORAL_CONTEXT'
export type ConditionOperator =
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN_OR_EQUAL'
  | 'GREATER_THAN'
  | 'LESS_THAN'
export type AdjustmentType = 'INCREASE_VALUE' | 'DECREASE_VALUE'
export type RuleStatus = 'ACTIVE' | 'INACTIVE'

export interface PricingRuleRequest {
  ruleName: string
  bussinessVariable: BusinessVariable
  conditionOperator: ConditionOperator
  conditionValue: number
  adjustmentType: AdjustmentType
  adjustmentValue: number
  creatorUserId: number
}

export interface PricingRuleResponse {
  idRule: number
  ruleName: string
  bussinessVariable: BusinessVariable
  conditionOperator: ConditionOperator
  conditionValue: number
  adjustmentType: AdjustmentType
  adjustmentValue: number
  status: RuleStatus
  creatorUserId: number
}

export interface FlightRequest {
  idFlight: string
  origin: City
  destination: City
  departureAt: string
  basePrice: number
  capacity: number
  availability: number
}

export type City = 'BOG' | 'MDE' | 'CLO' | 'CTG' | 'BAQ'

export interface FlightUpdateRequest {
  origin: City
  destination: City
  departureAt: string
  basePrice: number
  capacity: number
  availability: number
}

export interface FlightResponse {
  idFlight: string
  origin: City
  destination: City
  departureAt: string
  basePrice: number
  capacity: number
  availability: number
}

export interface RuleEvaluationResult {
  ruleId: number
  ruleName: string
  variable: BusinessVariable
  actualValue: number | null
  operator: ConditionOperator
  expectedValue: number | null
  met: boolean
  ruleActive: boolean
  adjustmentType: AdjustmentType | null
  adjustmentValue: number | null
  note: string | null
}

export interface FlightEvaluationResponse {
  flightId: string
  evaluations: RuleEvaluationResult[]
  applicableRuleIds: number[]
  message: string
}

export interface AppliedAdjustment {
  ruleId: number
  ruleName: string
  adjustmentType: string
  percentage: number
  priceBefore: number
  priceAfter: number
}

export interface PriceCalculationResponse {
  flightId: string
  basePrice: number
  adjustments: AppliedAdjustment[]
  dynamicPrice: number
  adjustmentsApplied: boolean
  message: string
}

export interface PriceChangeSummaryResponse {
  id: string
  basePrice: number
  dynamicPrice: number
  changedAt: string
}

export interface PriceHistoryPageResponse {
  flightId: string
  content: PriceChangeSummaryResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  message: string | null
}

export interface PriceEvolutionPoint {
  changedAt: string
  basePrice: number
  dynamicPrice: number
}

export interface PriceEvolutionResponse {
  flightId: string
  chartAvailable: boolean
  points: PriceEvolutionPoint[]
  message: string | null
}

export interface PriceChangeRuleResponse {
  ruleId: number
  ruleName: string
  adjustmentType: string
  percentage: number
  priceBefore: number
  priceAfter: number
}

export interface PriceChangeResponse {
  id: string
  flightId: string
  basePrice: number
  dynamicPrice: number
  changedAt: string
  appliedRules: PriceChangeRuleResponse[]
}

export interface PricingReportResponse {
  filters: {
    flightId: string | null
    from: string | null
    to: string | null
  }
  hasData: boolean
  message: string | null
  indicators: {
    flightsAnalyzed: number
    priceChanges: number
    averageVariationPercent: number
  }
  priceComparison: {
    title: string
    xAxisLabel: string
    yAxisLabel: string
    available: boolean
    message: string | null
    points: Array<{
      date: string
      averageBasePrice: number
      averageDynamicPrice: number
      changes: number
    }>
  }
  variableImpact: {
    title: string
    xAxisLabel: string
    yAxisLabel: string
    available: boolean
    message: string | null
    items: Array<{
      variable: string
      rulesApplied: number
      totalAdjustment: number
      averageAdjustment: number
    }>
  }
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Los datos ingresados no son válidos.',
  401: 'Correo electrónico o contraseña incorrectos.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'El recurso ya existe o hay un conflicto con los datos.',
  500: 'Ocurrió un error en el servidor. Intenta más tarde.',
}

// Frases genéricas que Spring Boot devuelve por defecto y que NO queremos mostrar tal cual
const GENERIC_REASON_PHRASES = new Set([
  'unauthorized', 'bad request', 'forbidden', 'not found',
  'internal server error', 'conflict',
])

type UnauthorizedHandler = () => void
let unauthorizedHandler: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = getSession()?.token
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let backendMessage = ''
    const responseText = await response.text()
    if (responseText) {
      try {
        const body = JSON.parse(responseText) as { message?: string; error?: string }
        backendMessage = body.message || body.error || ''
      } catch {
        backendMessage = responseText
      }
    }

    if (response.status === 401 && path !== '/api/auth/login') {
      clearSession()
      unauthorizedHandler?.()
      throw new ApiError('La sesión ha vencido. Inicia sesión nuevamente.', response.status)
    }

    if (response.status === 401 && path === '/api/auth/login') {
      throw new ApiError(HTTP_ERROR_MESSAGES[401], response.status)
    }

    if (response.status === 403) {
      throw new ApiError('No tienes permisos para realizar esta acción.', response.status)
    }

    const isGeneric =
      !backendMessage || GENERIC_REASON_PHRASES.has(backendMessage.trim().toLowerCase())

    const friendlyFallback = HTTP_ERROR_MESSAGES[response.status]
      || 'No fue posible completar la solicitud. Intenta nuevamente.'

    const message = isGeneric ? friendlyFallback : backendMessage
    throw new ApiError(message, response.status)
  }

  return response.json() as Promise<T>
}

export function loginRequest(payload: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function forgotPasswordRequest(payload: ForgotPasswordRequest): Promise<MessageResponse> {
  return request<MessageResponse>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function verifyResetCodeRequest(payload: VerifyResetCodeRequest): Promise<MessageResponse> {
  return request<MessageResponse>('/api/auth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function resetPasswordRequest(payload: ResetPasswordRequest): Promise<MessageResponse> {
  return request<MessageResponse>('/api/auth/reset-password', {
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

export function createFlightRequest(payload: FlightRequest): Promise<FlightResponse> {
  return request<FlightResponse>('/api/flights', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getAllFlightsRequest(): Promise<FlightResponse[]> {
  return request<FlightResponse[]>('/api/flights')
}

export function getFlightRequest(idFlight: string): Promise<FlightResponse> {
  return request<FlightResponse>(`/api/flights/${encodeURIComponent(idFlight)}`)
}

export function updateFlightRequest(
  idFlight: string,
  payload: FlightUpdateRequest,
): Promise<FlightResponse> {
  return request<FlightResponse>(`/api/flights/${encodeURIComponent(idFlight)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function updatePricingRuleRequest(
  id: number,
  payload: PricingRuleRequest,
): Promise<PricingRuleResponse> {
  return request<PricingRuleResponse>(`/api/pricing-rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function updatePricingRuleStatusRequest(
  id: number,
  status: RuleStatus,
): Promise<PricingRuleResponse> {
  return request<PricingRuleResponse>(
    `/api/pricing-rules/${id}/status?status=${status}`,
    { method: 'PATCH' },
  )
}

export function getFlightEvaluationRequest(flightId: string): Promise<FlightEvaluationResponse> {
  return request<FlightEvaluationResponse>(`/api/pricing-rules/evaluate/${flightId}`)
}

export function getDynamicPriceRequest(flightId: string): Promise<PriceCalculationResponse> {
  return request<PriceCalculationResponse>(`/api/flights/${flightId}/dynamic-price`)
}

export interface PriceHistoryRequestParams {
  from?: string
  to?: string
  page?: number
  size?: number
}

function buildQuery(params: {
  from?: string
  to?: string
  page?: number
  size?: number
  flightId?: string
}): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export function getPriceHistoryRequest(
  flightId: string,
  params: PriceHistoryRequestParams = {},
): Promise<PriceHistoryPageResponse> {
  const query = buildQuery(params)
  return request<PriceHistoryPageResponse>(
    `/api/flights/${encodeURIComponent(flightId)}/price-history${query}`,
  )
}

export function getPriceHistoryEvolutionRequest(
  flightId: string,
  params: Pick<PriceHistoryRequestParams, 'from' | 'to'> = {},
): Promise<PriceEvolutionResponse> {
  const query = buildQuery(params)
  return request<PriceEvolutionResponse>(
    `/api/flights/${encodeURIComponent(flightId)}/price-history/evolution${query}`,
  )
}

export function getPriceChangeRequest(id: string): Promise<PriceChangeResponse> {
  return request<PriceChangeResponse>(`/api/price-changes/${encodeURIComponent(id)}`)
}

export interface PricingReportRequestParams {
  flightId?: string
  from?: string
  to?: string
}

export function getPricingReportRequest(
  params: PricingReportRequestParams = {},
): Promise<PricingReportResponse> {
  return request<PricingReportResponse>(`/api/reports/pricing${buildQuery(params)}`)
}
