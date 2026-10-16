import { useEffect, useState } from 'react'
import {
  ApiError,
  createFlightRequest,
  createPricingRuleRequest,
  getAllFlightsRequest,
  getAllPricingRulesRequest,
  getAllUsersRequest,
  getDynamicPriceRequest,
  getFlightEvaluationRequest,
  loginRequest,
  registerUserRequest,
  setUnauthorizedHandler,
  type AdjustmentType,
  type AppliedAdjustment,
  type BackendRole,
  type BusinessVariable,
  type ConditionOperator,
  type FlightEvaluationResponse,
  type FlightResponse,
  type PriceCalculationResponse,
  type PricingRuleResponse,
  type RuleEvaluationResult,
  type RuleStatus,
  type UserResponse,
} from './api'
import {
  clearSession,
  getSession,
  saveSession,
  type SessionUser,
} from './session'

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Page =
  | 'login'
  | 'session-expired'
  | 'admin-dashboard'
  | 'analyst-dashboard'
  | 'help'
  | 'help-topic'
  | 'flights-list'
  | 'register-flight'
  | 'flight-created'
  | 'evaluate-variables'
  | 'flight-evaluation'
  | 'calculate-price'
  | 'price-calculation'
  | 'users-list'
  | 'register-user'
  | 'user-created'
  | 'pricing-rules'
  | 'create-rule'
  | 'rule-created'

type Role = SessionUser['role']

interface ManagedUser {
  id: string
  name: string
  email: string
  role: Role
  status: 'active' | 'inactive'
  createdAt: string
}

interface PricingRule {
  id: string
  name: string
  variable: 'demand' | 'availability' | 'temporal'
  operator: string
  conditionValue: string
  adjustType: 'increase' | 'decrease'
  adjustValue: string
  status: 'active' | 'inactive'
}

interface PricingFlight {
  idFlight: string
  origin: string
  destination: string
  departureAt: string
  basePrice: string
  capacity: string
  availability: string
}

interface HelpTopic {
  id: string
  title: string
  description: string
  steps: string[]
  related?: string
  keywords: string
}

/* ─── Constants ──────────────────────────────────────────────────────────── */

const VAR_LABELS: Record<string, string> = {
  demand: 'Demanda',
  availability: 'Disponibilidad',
  temporal: 'Contexto temporal',
}

const VAR_UNITS: Record<string, string> = {
  demand: '%',
  availability: '%',
  temporal: ' días',
}

const ROLE_FROM_API: Record<BackendRole, Role> = {
  ADMIN: 'admin',
  PRICING_ANALYST: 'analyst',
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  analyst: 'Analista de Pricing',
}

type UiOperator = '≥' | '≤' | '>' | '<'

const VARIABLE_FROM_API: Record<BusinessVariable, PricingRule['variable']> = {
  DEMAND: 'demand',
  AVAILABILITY: 'availability',
  TEMPORAL_CONTEXT: 'temporal',
}

const VARIABLE_TO_API: Record<PricingRule['variable'], BusinessVariable> = {
  demand: 'DEMAND',
  availability: 'AVAILABILITY',
  temporal: 'TEMPORAL_CONTEXT',
}

const OPERATOR_FROM_API: Record<ConditionOperator, string> = {
  GREATER_THAN_OR_EQUAL: '≥',
  LESS_THAN_OR_EQUAL: '≤',
  GREATER_THAN: '>',
  LESS_THAN: '<',
}

const OPERATOR_TO_API: Record<UiOperator, ConditionOperator> = {
  '≥': 'GREATER_THAN_OR_EQUAL',
  '≤': 'LESS_THAN_OR_EQUAL',
  '>': 'GREATER_THAN',
  '<': 'LESS_THAN',
}

const ADJUSTMENT_FROM_API: Record<AdjustmentType, PricingRule['adjustType']> = {
  INCREASE_VALUE: 'increase',
  DECREASE_VALUE: 'decrease',
}

const ADJUSTMENT_TO_API: Record<PricingRule['adjustType'], AdjustmentType> = {
  increase: 'INCREASE_VALUE',
  decrease: 'DECREASE_VALUE',
}

const STATUS_FROM_API: Record<RuleStatus, PricingRule['status']> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

const USER_STATUS_FROM_API: Record<UserResponse['status'], ManagedUser['status']> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

function isUiVariable(value: string): value is PricingRule['variable'] {
  return Object.prototype.hasOwnProperty.call(VARIABLE_TO_API, value)
}

function isUiOperator(value: string): value is UiOperator {
  return Object.prototype.hasOwnProperty.call(OPERATOR_TO_API, value)
}

function isUiAdjustment(value: string): value is PricingRule['adjustType'] {
  return Object.prototype.hasOwnProperty.call(ADJUSTMENT_TO_API, value)
}

const OPERATORS = [
  { value: '≥', label: 'Mayor o igual que (≥)' },
  { value: '≤', label: 'Menor o igual que (≤)' },
  { value: '>', label: 'Mayor que (>)' },
  { value: '<', label: 'Menor que (<)' },
]

const AIRPORTS = [
  { value: 'BOG', label: 'BOG — Bogotá' },
  { value: 'MDE', label: 'MDE — Medellín' },
  { value: 'CLO', label: 'CLO — Cali' },
  { value: 'CTG', label: 'CTG — Cartagena' },
  { value: 'BAQ', label: 'BAQ — Barranquilla' },
]

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'login',
    title: 'Iniciar sesión',
    description: 'Cómo acceder a AeroDynamic con las credenciales corporativas asignadas.',
    steps: [
      'Abra la pantalla de inicio de sesión de AeroDynamic.',
      'Ingrese su correo electrónico corporativo.',
      'Ingrese su contraseña.',
      'Seleccione “Iniciar sesión”.',
      'Espere a que el sistema abra el panel correspondiente a su rol.',
    ],
    related: 'El panel y las opciones de navegación dependen del rol asignado a su cuenta.',
    keywords: 'acceso autenticación credenciales correo contraseña entrar',
  },
  {
    id: 'register-users',
    title: 'Registrar usuarios',
    description: 'Pasos para registrar un nuevo Analista de Pricing en la plataforma.',
    steps: [
      'Acceda a la sección “Usuarios” desde la navegación principal.',
      'Seleccione “Registrar usuario”.',
      'Ingrese el nombre completo y el correo electrónico corporativo.',
      'Defina una contraseña inicial que cumpla los requisitos indicados.',
      'Revise el rol asignado y seleccione “Registrar usuario”.',
      'Confirme los datos en la pantalla de registro exitoso.',
    ],
    related: 'Esta funcionalidad está disponible únicamente para el rol Administrador.',
    keywords: 'usuarios administrador analista alta crear cuenta registrar',
  },
  {
    id: 'define-rules',
    title: 'Definir reglas de pricing',
    description: 'Cómo configurar una condición y su ajuste de precio asociado.',
    steps: [
      'Acceda a la sección “Reglas de Pricing”.',
      'Seleccione “Crear regla”.',
      'Ingrese un nombre descriptivo para la regla.',
      'Seleccione la variable de negocio y configure la condición.',
      'Configure el tipo y el porcentaje de ajuste.',
      'Revise el resumen de la regla en lenguaje natural.',
      'Seleccione “Guardar regla”.',
    ],
    related: 'Las variables disponibles son Demanda, Disponibilidad y Contexto temporal.',
    keywords: 'regla crear condición variable ajuste porcentaje precio dinámico',
  },
  {
    id: 'review-rules',
    title: 'Consultar reglas de pricing',
    description: 'Cómo revisar las reglas configuradas y su estado actual.',
    steps: [
      'Acceda a la sección “Reglas de Pricing” desde la navegación principal.',
      'Revise la lista de reglas definidas.',
      'Consulte la variable, condición y ajuste de precio de cada regla.',
      'Verifique el indicador de estado para identificar si la regla está activa o inactiva.',
    ],
    related: 'La lista utiliza indicadores de texto y color para comunicar el estado de cada regla.',
    keywords: 'reglas consultar lista estado activa inactiva condición ajuste',
  },
  {
    id: 'register-flights',
    title: 'Registrar vuelo para pricing',
    description: 'Cómo registrar la información que utilizará el motor de pricing dinámico.',
    steps: [
      'Acceda a la sección “Vuelos para Pricing”.',
      'Seleccione “Registrar vuelo”.',
      'Ingrese el código, origen, destino y fecha y hora del vuelo.',
      'Ingrese el precio base y la capacidad total.',
      'Indique la disponibilidad actual del vuelo.',
      'Revise los datos y seleccione “Registrar vuelo”.',
    ],
    related: 'Esta funcionalidad está disponible únicamente para el rol Analista de Pricing. El registro no realiza reservas ni ventas.',
    keywords: 'vuelo registrar código origen destino fecha precio capacidad disponibilidad',
  },
  {
    id: 'evaluate-variables',
    title: 'Evaluar variables de pricing',
    description: 'Cómo consultar la demanda, disponibilidad y contexto temporal de un vuelo.',
    steps: [
      'Acceda a la sección “Evaluar variables”.',
      'Localice el vuelo que desea analizar.',
      'Seleccione “Evaluar variables” en la fila del vuelo.',
      'Espere mientras el sistema evalúa Demanda, Disponibilidad y Contexto temporal.',
      'Revise el valor actual, la condición configurada y el resultado de cada variable.',
      'Consulte las reglas activas que resultaron aplicables.',
    ],
    related: 'La evaluación muestra condiciones y reglas aplicables, pero no calcula el precio dinámico final.',
    keywords: 'evaluar variables demanda disponibilidad contexto temporal reglas aplicables vuelo',
  },
  {
    id: 'calculate-price',
    title: 'Calcular precio dinámico',
    description: 'Cómo consultar el precio resultante de aplicar las reglas activas a un vuelo.',
    steps: [
      'Acceda a la sección “Calcular precio”.',
      'Localice el vuelo que desea calcular.',
      'Seleccione “Calcular precio” en la fila del vuelo.',
      'Espere mientras el sistema identifica las reglas activas y aplicables.',
      'Revise el precio base y los ajustes asociados a cada regla.',
      'Consulte el precio dinámico resultante.',
    ],
    related: 'El cálculo utiliza el precio base almacenado. Las reglas inactivas se excluyen y, si no hay reglas aplicables, el precio no cambia.',
    keywords: 'calcular precio dinámico base ajustes aumento disminución reglas aplicables',
  },
  {
    id: 'access-roles',
    title: 'Control de acceso y roles',
    description: 'Cómo funcionan los permisos de Administrador y Analista de Pricing.',
    steps: [
      'Inicie sesión con sus credenciales corporativas.',
      'Consulte su nombre y rol en la parte inferior de la navegación.',
      'Utilice únicamente las opciones disponibles para su rol.',
      'Si intenta abrir una función restringida, el sistema mostrará “Acceso no autorizado”.',
      'Utilice “Ir a mi panel principal” para regresar a una sección autorizada.',
    ],
    related: 'AeroDynamic tiene dos roles: Administrador y Analista de Pricing. El Administrador gestiona usuarios y el Analista gestiona reglas y vuelos para pricing.',
    keywords: 'rol permisos administrador analista acceso autorizado restringido seguridad',
  },
]

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function fmtDate(d: string) {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : d)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function toManagedUser(user: UserResponse): ManagedUser {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: ROLE_FROM_API[user.role],
    status: USER_STATUS_FROM_API[user.status],
    createdAt: user.created_at,
  }
}

function toPricingRule(rule: PricingRuleResponse): PricingRule {
  const variable = VARIABLE_FROM_API[rule.bussinessVariable]
  return {
    id: String(rule.idRule),
    name: rule.ruleName,
    variable,
    operator: OPERATOR_FROM_API[rule.conditionOperator],
    conditionValue: String(rule.conditionValue),
    adjustType: ADJUSTMENT_FROM_API[rule.adjustmentType],
    adjustValue: String(rule.adjustmentValue),
    status: STATUS_FROM_API[rule.status],
  }
}

function toPricingFlight(flight: FlightResponse): PricingFlight {
  return {
    idFlight: flight.idFlight,
    origin: flight.origin,
    destination: flight.destination,
    departureAt: flight.departureAt,
    basePrice: String(flight.basePrice),
    capacity: String(flight.capacity),
    availability: String(flight.availability),
  }
}

function fmtDateTime(value: string) {
  return new Date(value).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtCurrency(value: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function buildSummary(r: {
  variable: string; operator: string; conditionValue: string
  adjustType: string; adjustValue: string
}) {
  const vl = (VAR_LABELS[r.variable] || r.variable).toLowerCase()
  const unit = VAR_UNITS[r.variable] || ''
  const adj = r.adjustType === 'increase' ? 'aumentar' : 'disminuir'
  return `Si la ${vl} es ${r.operator} ${r.conditionValue}${unit}, ${adj} el precio un ${r.adjustValue} %.`
}

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passRx = /^(?=.*[A-Z])(?=.*\d).{8,}$/
const IDLE_TIMEOUT_MS = 15 * 60 * 1000

/* ─── Shared UI atoms ────────────────────────────────────────────────────── */

function Btn({
  children, onClick, variant = 'primary', disabled = false, type = 'button', className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}) {
  const base =
    'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer'
  const vs = {
    primary:
      'bg-[#1A56DB] text-white hover:bg-[#1647BA] focus-visible:ring-[#1A56DB] disabled:opacity-50 disabled:cursor-not-allowed',
    secondary:
      'bg-white text-[#0D1B2A] border border-[#CBD5E1] hover:bg-[#F1F5F9] focus-visible:ring-[#1A56DB] disabled:opacity-50',
    ghost:
      'text-[#64748B] hover:text-[#0D1B2A] hover:bg-[#F1F5F9] focus-visible:ring-[#1A56DB]',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${vs[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

function Field({
  label, error, hint, required, htmlFor, children,
}: {
  label: string; error?: string; hint?: string; required?: boolean; htmlFor?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-[#0D1B2A]">
        {label}
        {required && (
          <span className="text-[#DC2626] ml-0.5" aria-label="obligatorio">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[#94A3B8]">{hint}</p>}
      {error && (
        <p className="text-xs text-[#DC2626] flex items-center gap-1" role="alert">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

function TextInput({
  type = 'text', value, onChange, placeholder, disabled, hasError, className = '', id,
}: {
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  className?: string
  id?: string
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2 text-sm bg-white border rounded-md text-[#0D1B2A]
        placeholder-[#94A3B8] transition-colors
        focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent
        disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed
        ${hasError ? 'border-[#DC2626] bg-red-50/30' : 'border-[#CBD5E1]'}
        ${className}`}
    />
  )
}

function SelectInput({
  value, onChange, options, placeholder, disabled, hasError, id,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  id?: string
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm bg-white border rounded-md text-[#0D1B2A]
          focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent
          disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed
          appearance-none pr-9 transition-colors
          ${hasError ? 'border-[#DC2626] bg-red-50/30' : 'border-[#CBD5E1]'}
          ${!value ? 'text-[#94A3B8]' : ''}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        fill="#64748B"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  )
}

function Badge({ status }: { status: 'active' | 'inactive' }) {
  return status === 'active' ? (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" aria-hidden="true" />
      Inactivo
    </span>
  )
}

function Alert({ type, children }: { type: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const map = {
    error: {
      cls: 'bg-red-50 border-red-200 text-red-800',
      d: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    },
    success: {
      cls: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      d: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    info: {
      cls: 'bg-blue-50 border-blue-200 text-blue-800',
      d: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
    },
  }
  const { cls, d } = map[type]
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-lg border text-sm ${cls}`} role="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 flex-shrink-0 mt-0.5">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      </svg>
      <span>{children}</span>
    </div>
  )
}

function Spinner({ size = 'sm', tone = 'light' }: { size?: 'sm' | 'md'; tone?: 'light' | 'dark' }) {
  const s = size === 'sm' ? 'w-4 h-4 border-2' : 'w-6 h-6 border-2'
  const color = tone === 'light'
    ? 'border-white/30 border-t-white'
    : 'border-[#1A56DB]/30 border-t-[#1A56DB]'
  return (
    <div className={`${s} ${color} rounded-full animate-spin`} aria-label="Cargando" />
  )
}

/* ─── Sidebar / Layout ───────────────────────────────────────────────────── */

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function PlaneLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  )
}

function Sidebar({
  user, page, setPage, onLogout,
}: {
  user: SessionUser; page: Page; setPage: (p: Page) => void; onLogout: () => void
}) {
  const adminNav = [
    {
      label: 'Panel principal',
      page: 'admin-dashboard' as Page,
      related: [] as Page[],
      icon: 'M3.75 3h6.5v7.25h-6.5V3zm10 0h6.5v4.25h-6.5V3zm0 8.25h6.5V21h-6.5v-9.75zM3.75 14h6.5v7h-6.5v-7z',
    },
    {
      label: 'Usuarios',
      page: 'users-list' as Page,
      related: ['register-user', 'user-created'] as Page[],
      icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    },
  ]
  const analystNav = [
    {
      label: 'Panel principal',
      page: 'analyst-dashboard' as Page,
      related: [] as Page[],
      icon: 'M3.75 3h6.5v7.25h-6.5V3zm10 0h6.5v4.25h-6.5V3zm0 8.25h6.5V21h-6.5v-9.75zM3.75 14h6.5v7h-6.5v-7z',
    },
    {
      label: 'Reglas de Pricing',
      page: 'pricing-rules' as Page,
      related: ['create-rule', 'rule-created'] as Page[],
      icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z',
    },
    {
      label: 'Vuelos para Pricing',
      page: 'flights-list' as Page,
      related: ['register-flight', 'flight-created'] as Page[],
      icon: 'M6 12h12M12 6v12m9-6a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Evaluar variables',
      page: 'evaluate-variables' as Page,
      related: ['flight-evaluation'] as Page[],
      icon: 'M3.75 13.5l3.75-3.75 3 3L16.5 6.75m0 0H12m4.5 0v4.5M4.5 19.5h15',
    },
    {
      label: 'Calcular precio',
      page: 'calculate-price' as Page,
      related: ['price-calculation'] as Page[],
      icon: 'M12 6v12m3-9.75H10.5a2.25 2.25 0 000 4.5h3a2.25 2.25 0 010 4.5H9M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ]
  const navItems = user.role === 'admin' ? adminNav : analystNav
  const isHelpActive = page === 'help' || page === 'help-topic'
  const initials = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[#0D1B2A] flex flex-col z-20 select-none">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1A56DB] rounded-lg flex items-center justify-center flex-shrink-0 text-white">
            <PlaneLogo />
          </div>
          <div>
            <p className="text-white text-sm font-bold tracking-wide">AeroDynamic</p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[#475569] text-[10px]">
              v1.1 · Control de acceso
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" role="navigation" aria-label="Navegación principal">
        <p className="px-3 pb-2 text-[10px] font-semibold text-[#475569] uppercase tracking-widest">
          {user.role === 'admin' ? 'Administración' : 'Análisis'}
        </p>
        {navItems.map((item) => {
          const isActive = page === item.page || item.related.includes(page)
          return (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
                ${isActive
                  ? 'bg-[#1A56DB] text-white'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/10'}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </button>
          )
        })}
        <p className="px-3 pt-6 pb-2 text-[10px] font-semibold text-[#475569] uppercase tracking-widest">
          Soporte
        </p>
        <button
          onClick={() => setPage('help')}
          aria-current={isHelpActive ? 'page' : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
            ${isHelpActive
              ? 'bg-[#1A56DB] text-white'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/10'}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a3.375 3.375 0 116.75 0c0 2.25-3.375 2.25-3.375 4.5m0 3.375h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Ayuda
        </button>
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1A56DB] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate">{user.name}</p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[#475569] text-[10px] truncate">
              {user.email}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full
            ${user.role === 'admin'
              ? 'bg-[#00C2D4]/15 text-[#00C2D4] border border-[#00C2D4]/25'
              : 'bg-[#1A56DB]/25 text-[#93C5FD] border border-[#1A56DB]/40'}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            {user.role === 'admin' ? (
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            )}
          </svg>
          {user.role === 'admin' ? 'Administrador' : 'Analista de Pricing'}
        </span>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#64748B] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

function AppLayout({
  user, page, setPage, onLogout, children,
}: {
  user: SessionUser; page: Page; setPage: (p: Page) => void; onLogout: () => void; children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#EEF2F7] flex">
      <Sidebar user={user} page={page} setPage={setPage} onLogout={onLogout} />
      <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
        <div className="max-w-5xl px-8 py-8">{children}</div>
      </main>
    </div>
  )
}

/* ─── Login Page ─────────────────────────────────────────────────────────── */

function LoginPage({
  onLogin, onProtectedAccess, notice,
}: {
  onLogin: (u: SessionUser) => void
  onProtectedAccess: () => void
  notice?: string
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successUser, setSuccessUser] = useState<SessionUser | null>(null)

  const isReady = email.trim() !== '' && password !== ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isReady || loading) return
    setError('')
    setLoading(true)
    try {
      const response = await loginRequest({ email: email.trim(), password })
      const user: SessionUser = {
        id: response.id,
        name: response.name,
        email: response.email,
        role: ROLE_FROM_API[response.role],
      }
      saveSession(response.token, user)
      setSuccessUser(user)
      onLogin(user)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No fue posible iniciar sesión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-[#0D1B2A] flex-col justify-between p-12 relative overflow-hidden">
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        {/* Glow blobs */}
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-[#1A56DB]/12 translate-x-1/3 translate-y-1/3 blur-2xl" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-[#00C2D4]/8 blur-xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1A56DB] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <PlaneLogo />
          </div>
          <div>
            <p className="text-white text-lg font-bold tracking-tight">AeroDynamic</p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[#475569] text-[10px]">
              Motor de Pricing Dinámico
            </p>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-8">
          {/* Plane illustration */}
          <svg
            viewBox="0 0 120 120"
            fill="none"
            className="w-36 h-36 text-[#1A56DB]/30"
          >
            <path
              d="M105 50L62 24V8c0-4-3.4-7.2-7.5-7.2S47 4 47 8v16L4 50v12l43-13.5V90l-10 7.5V111l17-5.5 17 5.5v-13.5L61 90V48.5L105 62V50z"
              fill="currentColor"
            />
            <circle cx="90" cy="90" r="20" fill="#00C2D4" fillOpacity="0.12" />
            <circle cx="90" cy="90" r="12" fill="#00C2D4" fillOpacity="0.1" />
          </svg>

          <div>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Precios inteligentes,<br />decisiones precisas.
            </h1>
            <p className="mt-3 text-[#64748B] text-sm leading-relaxed max-w-xs">
              Plataforma interna para la gestión de reglas de pricing dinámico. Acceso restringido a usuarios autorizados.
            </p>
          </div>

          <div className="flex gap-8">
            {([
              ['3 variables', 'Motor dinámico'],
              ['2 activas', 'Reglas configuradas'],
              ['3 usuarios', 'Acceso autorizado'],
            ] as const).map(([val, label]) => (
              <div key={label}>
                <p
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  className="text-[#00C2D4] text-sm font-bold"
                >
                  {val}
                </p>
                <p className="text-[#475569] text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[#334155] text-xs">
          © 2026 AeroDYNAMIC · Plataforma interna confidencial
        </p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#1A56DB] rounded-lg flex items-center justify-center text-white">
              <PlaneLogo />
            </div>
            <span className="font-bold text-[#0D1B2A]">AeroDynamic</span>
          </div>

          <h2 className="text-2xl font-bold text-[#0D1B2A] mb-1">Iniciar sesión</h2>
          <p className="text-sm text-[#64748B] mb-7">Accede con tus credenciales corporativas</p>

          {successUser ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#0D1B2A]">
                  Bienvenido, {successUser.name.split(' ')[0]}
                </p>
                <p className="text-sm text-[#64748B] mt-1">Redirigiendo a tu panel...</p>
              </div>
              <div className="flex justify-center pt-1">
                <div className="w-5 h-5 border-2 border-[#1A56DB] border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {notice && <Alert type="success">{notice}</Alert>}
              {error && <Alert type="error">{error}</Alert>}

              <Field label="Correo electrónico" required>
                <TextInput
                  type="email"
                  value={email}
                  onChange={(v) => { setEmail(v); setError('') }}
                  placeholder="usuario@airpricing.com"
                  disabled={loading}
                  hasError={!!error}
                />
              </Field>

              <Field label="Contraseña" required>
                <div className="relative">
                  <TextInput
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(v) => { setPassword(v); setError('') }}
                    placeholder="••••••••"
                    disabled={loading}
                    hasError={!!error}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0D1B2A] transition-colors"
                    aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </Field>

              <div className="flex justify-between items-center">
                <p className="text-xs text-[#94A3B8]">
                  <span className="text-[#DC2626]">*</span> Campos obligatorios
                </p>
                <button
                  type="button"
                  className="text-xs text-[#1A56DB] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] rounded"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={!isReady || loading}
                className="w-full py-2.5 text-sm font-semibold bg-[#1A56DB] text-white rounded-md
                  hover:bg-[#1647BA] transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] focus-visible:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {loading ? <><Spinner /> Verificando...</> : 'Iniciar sesión'}
              </button>
            </form>
          )}

          {import.meta.env.DEV && !successUser && (
            <button
              type="button"
              onClick={onProtectedAccess}
              className="w-full mt-4 text-xs text-[#64748B] hover:text-[#1A56DB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] rounded-md py-2 transition-colors"
            >
              Simular acceso directo a una sección protegida
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Role dashboards / security states ─────────────────────────────────── */

function RoleDashboard({
  user, usersCount, rulesCount, loading, error, onAuthorizedAccess, onRestrictedAccess, onExpire,
}: {
  user: SessionUser
  usersCount: number | null
  rulesCount: number | null
  loading: boolean
  error: string
  onAuthorizedAccess: () => void
  onRestrictedAccess: () => void
  onExpire: () => void
}) {
  const isAdmin = user.role === 'admin'
  const roleLabel = isAdmin ? 'Administrador' : 'Analista de Pricing'
  const authorizedTitle = isAdmin ? 'Gestión de usuarios' : 'Reglas de Pricing'
  const authorizedDescription = isAdmin
    ? 'Registra y consulta los analistas con acceso a la plataforma.'
    : 'Consulta y define reglas, y registra vuelos para el motor de pricing dinámico.'
  const authorizedCount = isAdmin
    ? usersCount === null ? '— usuarios registrados' : `${usersCount} usuarios registrados`
    : rulesCount === null ? '— reglas definidas' : `${rulesCount} reglas definidas`
  const restrictedName = isAdmin ? 'Registro de vuelos para pricing' : 'Gestión de usuarios'

  return (
    <div>
      {error && <Alert type="error">{error}</Alert>}
      <div className="mb-7">
        <p
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
          className="text-[10px] font-semibold text-[#1A56DB] uppercase tracking-widest mb-2"
        >
          AeroDynamic · Acceso según rol
        </p>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">
          Hola, {user.name.split(' ')[0]}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Estas son las funciones habilitadas para tu sesión.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-white rounded-xl border border-[#CBD5E1] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#1A56DB]/10 text-[#1A56DB] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={isAdmin ? 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z' : 'M9 12h6m-6 4h6M6.75 3.75h10.5A2.25 2.25 0 0119.5 6v12a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18V6a2.25 2.25 0 012.25-2.25z'} />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1A56DB] uppercase tracking-wider mb-1">
                  Función autorizada
                </p>
                <h2 className="text-lg font-bold text-[#0D1B2A]">{authorizedTitle}</h2>
                <p className="text-sm text-[#64748B] mt-1 max-w-md">{authorizedDescription}</p>
                <p
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  className="text-xs text-[#94A3B8] mt-3"
                >
                  {loading ? <span className="inline-flex items-center gap-2"><Spinner tone="dark" /> Cargando...</span> : authorizedCount}
                </p>
              </div>
            </div>
            <Btn onClick={onAuthorizedAccess}>
              Abrir funcionalidad
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3.25 10a.75.75 0 01.75-.75h10.19l-3.22-3.22a.75.75 0 111.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 11-1.06-1.06l3.22-3.22H4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
            </Btn>
          </div>
        </div>

        <div className="bg-[#0D1B2A] rounded-xl p-5 text-white shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-[#00C2D4]/15 text-[#00C2D4] flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m5.25-3.375c0 7.125-3.75 12-8.25 13.5-4.5-1.5-8.25-6.375-8.25-13.5C6.375 6.375 9 5.25 12 3c3 2.25 5.625 3.375 8.25 3.375z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-[#00C2D4] uppercase tracking-wider">Sesión activa</p>
          <p className="font-semibold mt-2">{user.name}</p>
          <p className="text-xs text-[#94A3B8] mt-1">{user.email}</p>
          <div className="border-t border-white/10 mt-4 pt-4">
            <p className="text-[10px] text-[#64748B] uppercase tracking-widest">Rol actual</p>
            <p className="text-sm font-medium mt-1">{roleLabel}</p>
          </div>
          {import.meta.env.DEV && <button
            type="button"
            onClick={onExpire}
            className="w-full mt-4 pt-3 border-t border-white/10 text-left text-[11px] text-[#94A3B8] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2D4] rounded transition-colors"
          >
            Simular periodo de inactividad
          </button>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-sm flex items-center justify-between gap-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 0h10.5A2.25 2.25 0 0119.5 12.75v6A2.25 2.25 0 0117.25 21H6.75a2.25 2.25 0 01-2.25-2.25v-6a2.25 2.25 0 012.25-2.25z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0D1B2A]">Control de acceso activo</p>
            <p className="text-xs text-[#64748B] mt-0.5">
              Tu rol no permite acceder a {restrictedName.toLowerCase()}. El contenido protegido no será mostrado.
            </p>
          </div>
        </div>
        {import.meta.env.DEV && (
          <Btn variant="secondary" onClick={onRestrictedAccess}>
            Probar acceso restringido
          </Btn>
        )}
      </div>
    </div>
  )
}

function AccessDenied({
  role, onBack, onDashboard,
}: {
  role: Role
  onBack: () => void
  onDashboard: () => void
}) {
  return (
    <div className="max-w-xl pt-12">
      <div className="bg-white rounded-xl border border-[#CBD5E1] p-8 shadow-sm">
        <div className="w-14 h-14 bg-red-50 text-[#DC2626] rounded-xl flex items-center justify-center mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m9.75 0H6.75a2.25 2.25 0 00-2.25 2.25v6A2.25 2.25 0 006.75 21h10.5a2.25 2.25 0 002.25-2.25v-6a2.25 2.25 0 00-2.25-2.25zM12 14.25v3" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-[#DC2626] uppercase tracking-widest mb-2">Error 403</p>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Acceso no autorizado</h1>
        <p className="text-sm text-[#64748B] leading-relaxed mt-3">
          El rol {role === 'admin' ? 'Administrador' : 'Analista de Pricing'} no tiene permiso para realizar esta operación.
          Por seguridad, no se ha mostrado información de la funcionalidad protegida.
        </p>
        <div className="flex gap-3 mt-7">
          <Btn variant="secondary" onClick={onBack}>Volver a la pantalla anterior</Btn>
          <Btn onClick={onDashboard}>Ir a mi panel principal</Btn>
        </div>
      </div>
    </div>
  )
}

function UnauthenticatedAccess({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[#EEF2F7] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#CBD5E1] p-8 shadow-sm text-center">
        <div className="w-14 h-14 bg-[#1A56DB]/10 text-[#1A56DB] rounded-xl flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A3.75 3.75 0 0012 1.5 3.75 3.75 0 008.25 5.25V9m-1.5 0h10.5a2.25 2.25 0 012.25 2.25v9A2.25 2.25 0 0117.25 22.5H6.75a2.25 2.25 0 01-2.25-2.25v-9A2.25 2.25 0 016.75 9z" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-[#1A56DB] uppercase tracking-widest mb-2">Sección protegida</p>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Autenticación requerida</h1>
        <p className="text-sm text-[#64748B] leading-relaxed mt-3 mb-7">
          Debes iniciar sesión con tus credenciales corporativas para acceder a esta sección de AeroDynamic.
        </p>
        <Btn onClick={onLogin} className="w-full justify-center">Volver al inicio de sesión</Btn>
      </div>
    </div>
  )
}

function LogoutConfirmation({
  onCancel, onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[#0D1B2A]/60 backdrop-blur-sm flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
      aria-describedby="logout-description"
    >
      <div className="w-full max-w-md bg-white rounded-xl border border-[#CBD5E1] shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-[#DC2626] flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </div>
          <h2 id="logout-title" className="text-xl font-bold text-[#0D1B2A]">Cerrar sesión</h2>
          <p id="logout-description" className="text-sm text-[#64748B] leading-relaxed mt-2">
            ¿Deseas finalizar la sesión actual? Para volver a acceder tendrás que autenticarte nuevamente.
          </p>
        </div>
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#F1F5F9] flex justify-end gap-3">
          <Btn variant="secondary" onClick={onCancel}>Cancelar</Btn>
          <Btn onClick={onConfirm} className="bg-[#DC2626] hover:bg-[#B91C1C] focus-visible:ring-[#DC2626]">
            Cerrar sesión
          </Btn>
        </div>
      </div>
    </div>
  )
}

function SessionExpired({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-[#1A56DB]/15 translate-x-1/3 translate-y-1/3 blur-2xl" />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl border border-white/10 p-8 shadow-2xl text-center">
        <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3.75 2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest mb-2">Sesión finalizada</p>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Sesión expirada</h1>
        <p className="text-sm text-[#64748B] leading-relaxed mt-3 mb-7">
          La sesión terminó porque se superó el periodo de inactividad configurado. Inicia sesión nuevamente para continuar.
        </p>
        <Btn onClick={onLogin} className="w-full justify-center">Iniciar sesión nuevamente</Btn>
        <p className="text-[10px] text-[#94A3B8] mt-4">
          El contenido protegido ya no está disponible.
        </p>
      </div>
    </div>
  )
}

/* ─── Help center ───────────────────────────────────────────────────────── */

function HelpCenter({ onSelectTopic }: { onSelectTopic: (topic: HelpTopic) => void }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase('es')
  const filteredTopics = HELP_TOPICS.filter((topic) =>
    `${topic.title} ${topic.description} ${topic.keywords}`
      .toLocaleLowerCase('es')
      .includes(normalizedQuery),
  )

  return (
    <div>
      <div className="mb-6">
        <p
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
          className="text-[10px] font-semibold text-[#1A56DB] uppercase tracking-widest mb-2"
        >
          Centro de ayuda
        </p>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Ayuda</h1>
        <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
          Encuentra instrucciones para utilizar las funcionalidades disponibles en AeroDynamic según tu rol.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-sm mb-6">
        <Field label="Buscar en la ayuda" htmlFor="help-search" hint="Busca por función, acción o concepto.">
          <div className="relative">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17l-3.5-3.5m1.5-5A6.5 6.5 0 112 8.5a6.5 6.5 0 0113 0z" />
            </svg>
            <TextInput
              id="help-search"
              type="search"
              value={query}
              onChange={setQuery}
              placeholder="Ej.: crear una regla"
              className="pl-10 pr-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda de ayuda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#0D1B2A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] rounded"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M4.22 4.22a.75.75 0 011.06 0L10 8.94l4.72-4.72a.75.75 0 111.06 1.06L11.06 10l4.72 4.72a.75.75 0 11-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 11-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 010-1.06z" />
                </svg>
              </button>
            )}
          </div>
        </Field>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#0D1B2A]">
          {normalizedQuery ? 'Resultados de búsqueda' : 'Temas disponibles'}
        </h2>
        <span
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
          className="text-[10px] text-[#94A3B8]"
          aria-live="polite"
        >
          {filteredTopics.length} {filteredTopics.length === 1 ? 'tema' : 'temas'}
        </span>
      </div>

      {filteredTopics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.map((topic, index) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => onSelectTopic(topic)}
              className="group text-left bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-sm hover:border-[#1A56DB] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] focus-visible:ring-offset-2 transition-all"
              aria-label={`Consultar ayuda: ${topic.title}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-[#EEF2F7] text-[#1A56DB] flex items-center justify-center flex-shrink-0 group-hover:bg-[#1A56DB] group-hover:text-white transition-colors">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-xs font-bold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#0D1B2A] group-hover:text-[#1A56DB] transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed mt-1.5">{topic.description}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1A56DB] mt-3">
                    Ver instrucciones
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M3.25 10a.75.75 0 01.75-.75h10.19l-3.22-3.22a.75.75 0 111.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 11-1.06-1.06l3.22-3.22H4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#CBD5E1] py-12 px-6 text-center shadow-sm" role="status">
          <div className="w-11 h-11 rounded-full bg-[#EEF2F7] text-[#64748B] flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-6.15a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0zM8 10.5h5" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-[#0D1B2A]">No encontramos temas de ayuda</h3>
          <p className="text-sm text-[#64748B] mt-1.5">
            No hay temas que coincidan con “{query.trim()}”. Modifica el término e intenta nuevamente.
          </p>
          <Btn variant="secondary" onClick={() => setQuery('')} className="mt-5">
            Modificar búsqueda
          </Btn>
        </div>
      )}
    </div>
  )
}

function HelpTopicDetails({ topic, onBack }: { topic: HelpTopic; onBack: () => void }) {
  return (
    <div className="max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-[#1A56DB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] rounded-md mb-5 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
        </svg>
        Volver al Centro de ayuda
      </button>

      <article className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm overflow-hidden">
        <header className="p-7 border-b border-[#F1F5F9]">
          <p
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            className="text-[10px] font-semibold text-[#1A56DB] uppercase tracking-widest mb-2"
          >
            Guía paso a paso
          </p>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">{topic.title}</h1>
          <p className="text-sm text-[#64748B] leading-relaxed mt-2">{topic.description}</p>
        </header>

        <div className="p-7">
          <h2 className="text-sm font-bold text-[#0D1B2A] mb-5">Instrucciones</h2>
          <ol className="space-y-5">
            {topic.steps.map((step, index) => (
              <li key={step} className="flex items-start gap-4">
                <span
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  className="w-7 h-7 rounded-full bg-[#1A56DB] text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <p className="text-sm text-[#334155] leading-relaxed pt-0.5">
                  <span className="sr-only">Paso {index + 1}: </span>
                  {step}
                </p>
              </li>
            ))}
          </ol>

          {topic.related && (
            <aside className="mt-7 bg-blue-50 border border-blue-200 rounded-lg p-4" aria-labelledby="related-info">
              <div className="flex items-start gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-[#1A56DB] flex-shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <div>
                  <h2 id="related-info" className="text-sm font-semibold text-blue-900">Información relacionada</h2>
                  <p className="text-sm text-blue-800 leading-relaxed mt-1">{topic.related}</p>
                </div>
              </div>
            </aside>
          )}

          <div className="mt-7 pt-6 border-t border-[#F1F5F9]">
            <Btn onClick={onBack}>Volver al Centro de ayuda</Btn>
          </div>
        </div>
      </article>
    </div>
  )
}

/* ─── Users List ─────────────────────────────────────────────────────────── */

function UsersList({
  users, loading, error, onRegister,
}: { users: ManagedUser[]; loading: boolean; error: string; onRegister: () => void }) {
  return (
    <div>
      {loading && <Alert type="info"><span className="inline-flex items-center gap-2"><Spinner tone="dark" /> Cargando usuarios...</span></Alert>}
      {error && <Alert type="error">{error}</Alert>}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#0D1B2A]">Gestión de usuarios</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Administra los usuarios con acceso a la plataforma
          </p>
        </div>
        <Btn onClick={onRegister}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Registrar usuario
        </Btn>
      </div>

      <div className="bg-white rounded-xl border border-[#CBD5E1] overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-[#F1F5F9] flex items-center justify-between">
          <p className="text-sm font-medium text-[#0D1B2A]">
            {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
          </p>
          <span
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            className="text-[10px] text-[#94A3B8]"
          >
            Rol disponible: Analista de Pricing
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label="Lista de usuarios">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Nombre', 'Correo electrónico', 'Rol', 'Estado', 'Fecha de registro'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-5 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider bg-[#F8FAFC]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  className={`hover:bg-[#F8FAFC] transition-colors ${i < users.length - 1 ? 'border-b border-[#F1F5F9]' : ''}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EEF2F7] border border-[#CBD5E1] flex items-center justify-center text-xs font-bold text-[#1A56DB] flex-shrink-0">
                        {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <span className="font-medium text-[#0D1B2A]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      className="text-[#64748B] text-xs"
                    >
                      {u.email}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge status={u.status} />
                  </td>
                  <td className="px-5 py-4">
                    <span
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      className="text-[#64748B] text-xs"
                    >
                      {fmtDate(u.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ─── Register User ──────────────────────────────────────────────────────── */

function RegisterUser({
  existingEmails, onCancel, onSuccess,
}: {
  existingEmails: string[]
  onCancel: () => void
  onSuccess: (u: ManagedUser) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')

  function clearErr(key: string) {
    setErrors((p) => { const n = { ...p }; delete n[key]; return n })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'El nombre completo es obligatorio.'
    if (!email.trim()) {
      e.email = 'El correo electrónico es obligatorio.'
    } else if (!emailRx.test(email.trim())) {
      e.email = 'El formato del correo electrónico no es válido.'
    } else if (existingEmails.map((x) => x.toLowerCase()).includes(email.trim().toLowerCase())) {
      e.email = 'Este correo electrónico ya se encuentra registrado en la plataforma.'
    }
    if (!password) {
      e.password = 'La contraseña es obligatoria.'
    } else if (!passRx.test(password)) {
      e.password = 'Debe tener al menos 8 caracteres, una letra mayúscula y un número.'
    }
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setGeneralError('')
    setLoading(true)
    try {
      const response = await registerUserRequest({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: 'PRICING_ANALYST',
      })
      onSuccess(toManagedUser(response))
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrors((current) => ({
          ...current,
          email: 'Este correo electrónico ya se encuentra registrado en la plataforma.',
        }))
      } else {
        setGeneralError(error instanceof Error ? error.message : 'No fue posible registrar el usuario.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onCancel}
          className="p-1.5 text-[#64748B] hover:text-[#0D1B2A] hover:bg-white rounded-lg transition-colors"
          aria-label="Volver a la lista de usuarios"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#0D1B2A]">Registrar usuario</h1>
          <p className="text-sm text-[#64748B]">Crea un nuevo acceso para un Analista de Pricing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-xl border border-[#CBD5E1] p-6 space-y-5 shadow-sm">
        {generalError && <Alert type="error">{generalError}</Alert>}

        <Field label="Nombre completo" required error={errors.name}>
          <TextInput
            value={name}
            onChange={(v) => { setName(v); clearErr('name') }}
            placeholder="Ej.: Ana Torres Gómez"
            disabled={loading}
            hasError={!!errors.name}
          />
        </Field>

        <Field label="Correo electrónico" required error={errors.email}>
          <TextInput
            type="email"
            value={email}
            onChange={(v) => { setEmail(v); clearErr('email') }}
            placeholder="usuario@airpricing.com"
            disabled={loading}
            hasError={!!errors.email}
          />
        </Field>

        <Field
          label="Contraseña inicial"
          required
          error={errors.password}
          hint="El usuario debe cambiarla en su primer inicio de sesión."
        >
          <div className="relative">
            <TextInput
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(v) => { setPassword(v); clearErr('password') }}
              placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
              disabled={loading}
              hasError={!!errors.password}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0D1B2A] transition-colors"
              aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <EyeIcon open={showPw} />
            </button>
          </div>
        </Field>

        <Field label="Rol asignado" required>
          <div className="flex items-center gap-3 px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Analista de Pricing
            </span>
            <span className="text-xs text-[#94A3B8]">Único rol disponible en Sprint 1</span>
          </div>
        </Field>

        <div className="pt-1 border-t border-[#F1F5F9]">
          <p className="text-xs text-[#94A3B8] mb-4">
            <span className="text-[#DC2626]">*</span> Todos los campos son obligatorios
          </p>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold bg-[#1A56DB] text-white rounded-md
                hover:bg-[#1647BA] transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] focus-visible:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? <><Spinner /> Registrando...</> : 'Registrar usuario'}
            </button>
            <Btn variant="secondary" onClick={onCancel} disabled={loading}>
              Cancelar
            </Btn>
          </div>
        </div>
      </form>
    </div>
  )
}

/* ─── User Created ───────────────────────────────────────────────────────── */

function UserCreated({ user, onBack }: { user: ManagedUser; onBack: () => void }) {
  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-xl border border-[#CBD5E1] p-8 shadow-sm">
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#0D1B2A]">Usuario registrado exitosamente</h2>
          <p className="text-sm text-[#64748B] mt-1">
            El usuario ha sido creado y puede acceder a la plataforma con las credenciales asignadas.
          </p>
        </div>

        <div className="bg-[#F8FAFC] rounded-lg border border-[#F1F5F9] p-4 mb-6">
          <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
            Datos del usuario creado
          </p>
          <div className="space-y-2.5">
            {(
              [
                ['Nombre completo', user.name, false],
                ['Correo electrónico', user.email, true],
                ['Rol asignado', 'Analista de Pricing', false],
                ['Estado', 'Activo', false],
                ['Fecha de registro', fmtDate(user.createdAt), true],
              ] as const
            ).map(([label, val, mono]) => (
              <div key={label} className="flex justify-between items-baseline gap-4 text-sm">
                <span className="text-[#64748B] flex-shrink-0">{label}</span>
                <span
                  style={mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}}
                  className={`font-medium text-[#0D1B2A] text-right ${mono ? 'text-xs' : ''}`}
                >
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Alert type="info">
          Recuerda informar al usuario que debe cambiar su contraseña en el primer inicio de sesión.
        </Alert>

        <div className="mt-5">
          <Btn onClick={onBack} className="w-full justify-center">
            Volver a la lista de usuarios
          </Btn>
        </div>
      </div>
    </div>
  )
}

/* ─── Flights for pricing ───────────────────────────────────────────────── */

function PricingFlights({
  flights, onRegister, onEvaluate, onCalculate,
}: {
  flights: PricingFlight[]
  onRegister: () => void
  onEvaluate: (flight: PricingFlight) => void
  onCalculate: (flight: PricingFlight) => void
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-5 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#0D1B2A]">Vuelos para Pricing</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Consulta y registra los vuelos utilizados por el motor de pricing dinámico
          </p>
        </div>
        <Btn onClick={onRegister}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Registrar vuelo
        </Btn>
      </div>

      <Alert type="info">
        Los datos de esta sección se utilizan únicamente como entrada del motor de pricing. No generan reservas ni ventas.
      </Alert>

      <div className="bg-white rounded-xl border border-[#CBD5E1] overflow-hidden shadow-sm mt-5">
        <div className="px-5 py-3.5 border-b border-[#F1F5F9] flex items-center justify-between">
          <p className="text-sm font-medium text-[#0D1B2A]">
            {flights.length} vuelo{flights.length !== 1 ? 's' : ''} registrado{flights.length !== 1 ? 's' : ''}
          </p>
          <span
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            className="text-[10px] text-[#94A3B8]"
          >
            Uso interno · Motor dinámico
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Vuelos registrados para pricing">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Código', 'Ruta', 'Fecha y hora', 'Precio base', 'Capacidad', 'Disponibilidad', 'Acción'].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-5 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider bg-[#F8FAFC]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flights.map((flight, index) => (
                <tr
                  key={flight.idFlight}
                  className={`hover:bg-[#F8FAFC] transition-colors ${index < flights.length - 1 ? 'border-b border-[#F1F5F9]' : ''}`}
                >
                  <td className="px-5 py-4">
                    <span
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      className="font-bold text-[#0D1B2A]"
                    >
                      {flight.idFlight}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 font-medium text-[#334155]">
                      {flight.origin}
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-[#94A3B8]" aria-hidden="true">
                        <path fillRule="evenodd" d="M3.25 10a.75.75 0 01.75-.75h10.19l-2.22-2.22a.75.75 0 111.06-1.06l3.5 3.5a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 11-1.06-1.06l2.22-2.22H4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                      </svg>
                      {flight.destination}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-[#64748B] whitespace-nowrap">
                    {fmtDateTime(flight.departureAt)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      className="text-xs text-[#64748B] whitespace-nowrap"
                    >
                      {fmtCurrency(flight.basePrice)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#64748B]">{flight.capacity}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {flight.availability} disponibles
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Btn
                        variant="secondary"
                        onClick={() => onEvaluate(flight)}
                        className="whitespace-nowrap"
                      >
                        Evaluar
                      </Btn>
                      <Btn
                        variant="secondary"
                        onClick={() => onCalculate(flight)}
                        className="whitespace-nowrap"
                      >
                        Calcular precio
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function RegisterFlight({
  existingCodes, onCancel, onSuccess,
}: {
  existingCodes: string[]
  onCancel: () => void
  onSuccess: (flight: PricingFlight) => void
}) {
  const [code, setCode] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [departureAt, setDepartureAt] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [capacity, setCapacity] = useState('')
  const [availability, setAvailability] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function clearError(field: string) {
    setErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function loadValidExample() {
    setCode('AD731')
    setOrigin('BOG')
    setDestination('CLO')
    setDepartureAt('2026-10-22T10:15')
    setBasePrice('315000')
    setCapacity('168')
    setAvailability('82')
    setErrors({})
  }

  function validate() {
    const nextErrors: Record<string, string> = {}
    const normalizedCode = code.trim().toUpperCase()

    if (!normalizedCode) {
      nextErrors.code = 'El código de vuelo es obligatorio.'
    } else if (existingCodes.some((existing) => existing.toUpperCase() === normalizedCode)) {
      nextErrors.code = `El código de vuelo ${normalizedCode} ya está registrado. Ingresa un código diferente.`
    }

    if (!origin) nextErrors.origin = 'El origen es obligatorio. Selecciona un aeropuerto.'
    if (!destination) nextErrors.destination = 'El destino es obligatorio. Selecciona un aeropuerto.'
    if (origin && destination && origin === destination) {
      nextErrors.destination = 'El destino debe ser diferente del origen.'
    }

    if (!departureAt) {
      nextErrors.departureAt = 'La fecha y hora del vuelo son obligatorias.'
    } else if (Number.isNaN(new Date(departureAt).getTime())) {
      nextErrors.departureAt = 'La fecha y hora del vuelo no son válidas.'
    }

    if (!basePrice.trim()) {
      nextErrors.basePrice = 'El precio base es obligatorio.'
    } else if (!Number.isFinite(Number(basePrice))) {
      nextErrors.basePrice = 'El precio base debe ser un valor numérico válido.'
    } else if (Number(basePrice) <= 0) {
      nextErrors.basePrice = 'El precio base debe ser mayor que 0.'
    }

    if (!capacity.trim()) {
      nextErrors.capacity = 'La capacidad es obligatoria.'
    } else if (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0) {
      nextErrors.capacity = 'La capacidad debe ser un número entero mayor que 0.'
    }

    if (!availability.trim()) {
      nextErrors.availability = 'La disponibilidad es obligatoria.'
    } else if (!Number.isInteger(Number(availability)) || Number(availability) < 0) {
      nextErrors.availability = 'La disponibilidad debe ser un número entero igual o mayor que 0.'
    } else if (
      Number.isInteger(Number(capacity))
      && Number(capacity) > 0
      && Number(availability) > Number(capacity)
    ) {
      nextErrors.availability = 'La disponibilidad no puede superar la capacidad del vuelo.'
    }

    return nextErrors
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      const response = await createFlightRequest({
        idFlight: code.trim().toUpperCase(),
        origin,
        destination,
        departureAt,
        basePrice: Number(basePrice),
        capacity: Number(capacity),
        availability: Number(availability),
      })
      onSuccess(toPricingFlight(response))
    } catch (error: unknown) {
      setErrors({ submit: error instanceof Error ? error.message : 'No fue posible registrar el vuelo.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-5 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-[#64748B] hover:text-[#0D1B2A] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] rounded-lg transition-colors"
            aria-label="Volver a Vuelos para Pricing"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0D1B2A]">Registrar vuelo</h1>
            <p className="text-sm text-[#64748B]">
              Ingresa la información requerida por el motor de pricing
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadValidExample}
          disabled={loading}
          className="text-xs font-medium text-[#1A56DB] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] rounded disabled:opacity-50"
        >
          Completar ejemplo válido
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {Object.keys(errors).length > 0 && (
          <Alert type="error">
            Revisa los campos señalados. Hay {Object.keys(errors).length} {Object.keys(errors).length === 1 ? 'dato que necesita' : 'datos que necesitan'} corrección.
          </Alert>
        )}

        <section className="bg-white rounded-xl border border-[#CBD5E1] p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-5">
            Identificación y ruta
          </h2>
          <div className="space-y-4">
            <Field label="Código de vuelo" htmlFor="flight-code" required error={errors.code} hint="Utiliza el código operacional interno, por ejemplo AD731.">
              <TextInput
                id="flight-code"
                value={code}
                onChange={(value) => { setCode(value.toUpperCase()); clearError('code') }}
                placeholder="Ej.: AD731"
                disabled={loading}
                hasError={!!errors.code}
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Origen" htmlFor="flight-origin" required error={errors.origin}>
                <SelectInput
                  id="flight-origin"
                  value={origin}
                  onChange={(value) => { setOrigin(value); clearError('origin'); clearError('destination') }}
                  options={AIRPORTS}
                  placeholder="Selecciona el origen..."
                  disabled={loading}
                  hasError={!!errors.origin}
                />
              </Field>
              <Field label="Destino" htmlFor="flight-destination" required error={errors.destination}>
                <SelectInput
                  id="flight-destination"
                  value={destination}
                  onChange={(value) => { setDestination(value); clearError('destination') }}
                  options={AIRPORTS}
                  placeholder="Selecciona el destino..."
                  disabled={loading}
                  hasError={!!errors.destination}
                />
              </Field>
            </div>
            <Field label="Fecha y hora del vuelo" htmlFor="flight-departure" required error={errors.departureAt}>
              <TextInput
                id="flight-departure"
                type="datetime-local"
                value={departureAt}
                onChange={(value) => { setDepartureAt(value); clearError('departureAt') }}
                disabled={loading}
                hasError={!!errors.departureAt}
              />
            </Field>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-[#CBD5E1] p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-5">
            Datos para pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Precio base" htmlFor="flight-price" required error={errors.basePrice} hint="Valor en pesos colombianos.">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B] pointer-events-none">$</span>
                <TextInput
                  id="flight-price"
                  type="number"
                  value={basePrice}
                  onChange={(value) => { setBasePrice(value); clearError('basePrice') }}
                  placeholder="285000"
                  disabled={loading}
                  hasError={!!errors.basePrice}
                  className="pl-7"
                />
              </div>
            </Field>
            <Field label="Capacidad" htmlFor="flight-capacity" required error={errors.capacity} hint="Total de plazas del vuelo.">
              <TextInput
                id="flight-capacity"
                type="number"
                value={capacity}
                onChange={(value) => { setCapacity(value); clearError('capacity'); clearError('availability') }}
                placeholder="180"
                disabled={loading}
                hasError={!!errors.capacity}
              />
            </Field>
            <Field label="Disponibilidad" htmlFor="flight-availability" required error={errors.availability} hint="Plazas disponibles actualmente.">
              <TextInput
                id="flight-availability"
                type="number"
                value={availability}
                onChange={(value) => { setAvailability(value); clearError('availability') }}
                placeholder="64"
                disabled={loading}
                hasError={!!errors.availability}
              />
            </Field>
          </div>
        </section>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-[#94A3B8]">
            <span className="text-[#DC2626]">*</span> Todos los campos son obligatorios
          </p>
          <div className="flex gap-3">
            <Btn variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Btn>
            <Btn type="submit" disabled={loading}>
              {loading ? <><Spinner /> Registrando vuelo...</> : 'Registrar vuelo'}
            </Btn>
          </div>
        </div>
      </form>
    </div>
  )
}

function FlightCreated({
  flight, onBack,
}: {
  flight: PricingFlight
  onBack: () => void
}) {
  const details = [
    ['Código de vuelo', flight.idFlight],
    ['Origen', AIRPORTS.find((airport) => airport.value === flight.origin)?.label || flight.origin],
    ['Destino', AIRPORTS.find((airport) => airport.value === flight.destination)?.label || flight.destination],
    ['Fecha y hora', fmtDateTime(flight.departureAt)],
    ['Precio base', fmtCurrency(flight.basePrice)],
    ['Capacidad', `${flight.capacity} plazas`],
    ['Disponibilidad', `${flight.availability} plazas`],
  ]

  return (
    <div className="max-w-xl">
      <div className="bg-white rounded-xl border border-[#CBD5E1] p-8 shadow-sm">
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#0D1B2A]">Vuelo registrado exitosamente</h1>
          <p className="text-sm text-[#64748B] mt-1">
            La información quedó disponible para el motor de pricing dinámico.
          </p>
        </div>

        <div className="bg-[#F8FAFC] rounded-lg border border-[#F1F5F9] p-5 mb-6">
          <h2 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-4">
            Información del vuelo registrado
          </h2>
          <dl className="space-y-3">
            {details.map(([label, value], index) => (
              <div key={label} className="flex justify-between items-baseline gap-5 text-sm">
                <dt className="text-[#64748B] flex-shrink-0">{label}</dt>
                <dd
                  style={index === 0 || index === 4 ? { fontFamily: "'JetBrains Mono', monospace" } : {}}
                  className="font-medium text-[#0D1B2A] text-right"
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <Alert type="info">
          Este registro contiene únicamente datos operacionales para pricing y no crea una reserva.
        </Alert>

        <Btn onClick={onBack} className="w-full justify-center mt-5">
          Volver a Vuelos para Pricing
        </Btn>
      </div>
    </div>
  )
}

function EvaluateVariablesList({
  flights, onEvaluate,
}: {
  flights: PricingFlight[]
  onEvaluate: (flight: PricingFlight) => void
}) {
  return (
    <div>
      <div className="mb-6">
        <p
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
          className="text-[10px] font-semibold text-[#1A56DB] uppercase tracking-widest mb-2"
        >
          Motor dinámico · Evaluación
        </p>
        <h1 className="text-xl font-bold text-[#0D1B2A]">Evaluar variables de pricing</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Selecciona un vuelo registrado para evaluar sus condiciones actuales
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#CBD5E1] overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-[#F1F5F9] flex items-center justify-between">
          <p className="text-sm font-medium text-[#0D1B2A]">
            Vuelos disponibles para evaluación
          </p>
          <span
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            className="text-[10px] text-[#94A3B8]"
          >
            {flights.length} {flights.length === 1 ? 'vuelo registrado' : 'vuelos registrados'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Vuelos disponibles para evaluar variables">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Código de vuelo', 'Origen', 'Destino', 'Fecha y hora', 'Precio base', 'Disponibilidad', 'Acción'].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider bg-[#F8FAFC] whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flights.map((flight, index) => (
                <tr
                  key={flight.idFlight}
                  className={`hover:bg-[#F8FAFC] transition-colors ${index < flights.length - 1 ? 'border-b border-[#F1F5F9]' : ''}`}
                >
                  <td className="px-4 py-4">
                    <span
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      className="font-bold text-[#0D1B2A]"
                    >
                      {flight.idFlight}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[#334155]">{flight.origin}</td>
                  <td className="px-4 py-4 text-[#334155]">{flight.destination}</td>
                  <td className="px-4 py-4 text-xs text-[#64748B] whitespace-nowrap">
                    {fmtDateTime(flight.departureAt)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      className="text-xs text-[#64748B] whitespace-nowrap"
                    >
                      {fmtCurrency(flight.basePrice)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[#64748B] whitespace-nowrap">
                    {flight.availability} de {flight.capacity}
                  </td>
                  <td className="px-4 py-4">
                    <Btn
                      variant="secondary"
                      onClick={() => onEvaluate(flight)}
                      className="whitespace-nowrap"
                    >
                      Evaluar variables
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#94A3B8] mt-4">
        La evaluación identifica reglas aplicables, pero no calcula el precio dinámico final.
      </p>
    </div>
  )
}

function FlightEvaluation({
  flight, rules, onBack,
}: {
  flight: PricingFlight
  rules: PricingRule[]
  onBack: () => void
}) {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')

  const [evaluation, setEvaluation] = useState<FlightEvaluationResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true
    setStatus('loading')
    setErrorMessage('')
    getFlightEvaluationRequest(flight.idFlight)
      .then((response) => {
        if (active) {
          setEvaluation(response)
          setStatus('ready')
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setStatus('error')
          setErrorMessage(error instanceof Error ? error.message : 'No fue posible evaluar las variables del vuelo.')
        }
      })

    return () => {
      active = false
    }
  }, [attempt, flight.idFlight])

  const variables: Array<{
    key: PricingRule['variable']
    title: string
    icon: string
  }> = [
    {
      key: 'demand',
      title: 'Demanda',
      icon: 'M3 17.25l5.25-5.25 3 3L18 8.25m0 0h-4.5m4.5 0v4.5',
    },
    {
      key: 'availability',
      title: 'Disponibilidad',
      icon: 'M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 4.5h13.5A1.5 1.5 0 0120.25 6v12a1.5 1.5 0 01-1.5 1.5H5.25A1.5 1.5 0 013.75 18V6a1.5 1.5 0 011.5-1.5z',
    },
    {
      key: 'temporal',
      title: 'Contexto temporal',
      icon: 'M12 6v6l3.75 2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ]

  const evaluationRows = evaluation?.evaluations ?? []
  const applicableRules = evaluationRows.filter((rule) => rule.met && rule.ruleActive)

  if (status === 'loading') {
    return (
      <div className="max-w-xl pt-12">
        <div className="bg-white rounded-xl border border-[#CBD5E1] p-10 shadow-sm text-center" role="status">
          <div className="w-12 h-12 border-2 border-[#1A56DB]/20 border-t-[#1A56DB] rounded-full animate-spin mx-auto mb-5" />
          <h1 className="text-lg font-bold text-[#0D1B2A]">Evaluando variables de pricing…</h1>
          <p className="text-sm text-[#64748B] mt-2">
            Estamos analizando las condiciones actuales del vuelo {flight.idFlight}.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="max-w-xl pt-12">
        <div className="bg-white rounded-xl border border-[#CBD5E1] p-8 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#DC2626] flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-1.5a9 9 0 11-18 0 9 9 0 0118 0zM12 16.5h.008v.008H12V16.5z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-[#DC2626] uppercase tracking-widest mb-2">Evaluación interrumpida</p>
          <h1 className="text-xl font-bold text-[#0D1B2A]">No fue posible evaluar las variables del vuelo</h1>
          <p className="text-sm text-[#64748B] leading-relaxed mt-2">
            {errorMessage || `Ocurrió un problema al evaluar el vuelo ${flight.idFlight}. Intenta nuevamente.`}
          </p>
          <div className="flex gap-3 mt-6">
            <Btn onClick={() => setAttempt((current) => current + 1)}>Intentar nuevamente</Btn>
            <Btn variant="secondary" onClick={onBack}>Volver a la lista de vuelos</Btn>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-[#1A56DB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] rounded-md mb-5 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
        </svg>
        Volver a la lista de vuelos
      </button>

      <div className="flex items-start justify-between gap-5 mb-6">
        <div>
          <p
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            className="text-[10px] font-semibold text-[#1A56DB] uppercase tracking-widest mb-2"
          >
            Evaluación completada
          </p>
          <h1 className="text-xl font-bold text-[#0D1B2A]">Evaluación de variables</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Resultado de las condiciones configuradas para el vuelo seleccionado
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.051l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.816a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
          Evaluación completada
        </span>
      </div>

      <section className="bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-sm mb-5" aria-labelledby="flight-information">
        <h2 id="flight-information" className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-4">
          Información del vuelo
        </h2>
        <dl className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            ['Código', flight.idFlight],
            ['Origen', flight.origin],
            ['Destino', flight.destination],
            ['Fecha y hora', fmtDateTime(flight.departureAt)],
            ['Precio base', fmtCurrency(flight.basePrice)],
          ].map(([label, value], index) => (
            <div key={label}>
              <dt className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">{label}</dt>
              <dd
                style={index === 0 || index === 4 ? { fontFamily: "'JetBrains Mono', monospace" } : {}}
                className="text-sm font-semibold text-[#0D1B2A] mt-1"
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="variables-heading">
        <h2 id="variables-heading" className="text-sm font-bold text-[#0D1B2A] mb-3">
          Variables evaluadas
        </h2>
        {evaluationRows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {evaluationRows.map((rule) => {
            const variableKey = VARIABLE_FROM_API[rule.variable]
            const variable = variables.find((item) => item.key === variableKey)
            const matched = rule.met
            const actualValue = rule.actualValue
            const currentLabel = actualValue === null || actualValue === undefined
              ? rule.note || 'No fue posible obtener el valor evaluado.'
              : variableKey === 'temporal'
                ? `${actualValue.toFixed(1)}${VAR_UNITS[variableKey]}`
                : `${actualValue.toFixed(actualValue % 1 === 0 ? 0 : 1)}%`
            const operatorText = OPERATOR_FROM_API[rule.operator] ?? rule.operator
            const expectedValue = rule.expectedValue
            const conditionText = expectedValue === null || expectedValue === undefined
              ? 'No fue posible cargar la condición.'
              : `${operatorText} ${expectedValue}${VAR_UNITS[variableKey]}`
            const statusLabel = rule.ruleActive ? null : 'Inactiva'
            const cardStatusClass = matched
              ? 'border-emerald-200 bg-emerald-50/30'
              : 'border-rose-200 bg-rose-50/30'

            return (
              <article key={rule.ruleId} className={`bg-white rounded-xl border ${cardStatusClass} p-5 shadow-sm`}>
                <div className="w-9 h-9 rounded-lg bg-[#EEF2F7] text-[#1A56DB] flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={variable?.icon ?? ''} />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#0D1B2A]">{variable?.title ?? rule.variable}</h3>
                <p className="text-xs text-[#64748B] mt-1">{rule.ruleName}</p>
                <dl className="space-y-3 mt-4">
                  <div>
                    <dt className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Valor actual</dt>
                    <dd className="text-sm font-medium text-[#0D1B2A] mt-0.5">{currentLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Condición configurada</dt>
                    <dd
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      className="text-sm font-medium text-[#0D1B2A] mt-0.5"
                    >
                      {conditionText}
                    </dd>
                  </div>
                </dl>
                <div className={`flex items-center gap-2 mt-4 pt-4 border-t border-[#F1F5F9] text-xs font-semibold ${matched ? 'text-emerald-700' : 'text-rose-700'}`}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                    {matched ? (
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.051l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.816a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7.47 7.47a.75.75 0 011.06 0L10 8.94l1.47-1.47a.75.75 0 111.06 1.06L11.06 10l1.47 1.47a.75.75 0 11-1.06 1.06L10 11.06l-1.47 1.47a.75.75 0 01-1.06-1.06L8.94 10 7.47 8.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                    )}
                  </svg>
                  Resultado: {matched ? 'Condición cumplida' : 'Condición no cumplida'}
                </div>
                {statusLabel && (
                  <span className="inline-flex mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                    {statusLabel}
                  </span>
                )}
              </article>
            )
          })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#CBD5E1] p-6 text-sm text-[#64748B]">
            El backend no devolvió reglas para evaluar este vuelo.
          </div>
        )}
      </section>

      <section className="mt-6" aria-labelledby="applicable-rules-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="applicable-rules-heading" className="text-sm font-bold text-[#0D1B2A]">Reglas aplicables</h2>
          <span
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            className="text-[10px] text-[#94A3B8]"
          >
            {applicableRules.length} {applicableRules.length === 1 ? 'regla activa' : 'reglas activas'}
          </span>
        </div>

        {applicableRules.length > 0 ? (
          <div className="space-y-3">
            {applicableRules.map((rule) => {
              const variableKey = VARIABLE_FROM_API[rule.variable]
              const operatorText = OPERATOR_FROM_API[rule.operator] ?? rule.operator
              const adjustmentType = rule.adjustmentType === 'INCREASE_VALUE' ? 'increase' : 'decrease'
              return (
                <article key={rule.ruleId} className="bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-sm flex items-center justify-between gap-5">
                  <div>
                    <h3 className="text-sm font-bold text-[#0D1B2A]">{rule.ruleName}</h3>
                    <p className="text-xs text-[#64748B] mt-1">
                      {VAR_LABELS[variableKey]}{' '}
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {rule.expectedValue === null
                          ? 'No fue posible cargar la condición.'
                          : `${operatorText} ${rule.expectedValue}${VAR_UNITS[variableKey]}`}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Ajuste</p>
                    <p
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      className={`text-sm font-bold mt-0.5 ${adjustmentType === 'increase' ? 'text-red-700' : 'text-emerald-700'}`}
                    >
                      {rule.adjustmentValue === null
                        ? 'No disponible'
                        : `${adjustmentType === 'increase' ? '+' : '−'}${rule.adjustmentValue}%`}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#CBD5E1] p-7 shadow-sm text-center" role="status">
            <div className="w-10 h-10 rounded-full bg-[#EEF2F7] text-[#64748B] flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m5.25-3.375c0 7.125-3.75 12-8.25 13.5-4.5-1.5-8.25-6.375-8.25-13.5C6.375 6.375 9 5.25 12 3c3 2.25 5.625 3.375 8.25 3.375z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#0D1B2A]">
              No hay reglas aplicables para las condiciones actuales del vuelo.
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Las reglas inactivas no se incluyen en este resultado.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

function CalculatePriceList({
  flights, onCalculate,
}: {
  flights: PricingFlight[]
  onCalculate: (flight: PricingFlight) => void
}) {
  return (
    <div>
      <div className="mb-6">
        <p
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
          className="text-[10px] font-semibold text-[#1A56DB] uppercase tracking-widest mb-2"
        >
          Motor dinámico · Cálculo
        </p>
        <h1 className="text-xl font-bold text-[#0D1B2A]">Calcular precio dinámico</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Selecciona un vuelo para calcular su precio a partir de las reglas activas
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#CBD5E1] overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-[#F1F5F9] flex items-center justify-between">
          <p className="text-sm font-medium text-[#0D1B2A]">Vuelos disponibles para cálculo</p>
          <span
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            className="text-[10px] text-[#94A3B8]"
          >
            {flights.length} {flights.length === 1 ? 'vuelo registrado' : 'vuelos registrados'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Vuelos disponibles para calcular precio dinámico">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Código de vuelo', 'Origen', 'Destino', 'Fecha y hora', 'Precio base', 'Disponibilidad', 'Acción'].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider bg-[#F8FAFC] whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flights.map((flight, index) => (
                <tr
                  key={flight.idFlight}
                  className={`hover:bg-[#F8FAFC] transition-colors ${index < flights.length - 1 ? 'border-b border-[#F1F5F9]' : ''}`}
                >
                  <td className="px-4 py-4">
                    <span
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      className="font-bold text-[#0D1B2A]"
                    >
                      {flight.idFlight}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[#334155]">{flight.origin}</td>
                  <td className="px-4 py-4 text-[#334155]">{flight.destination}</td>
                  <td className="px-4 py-4 text-xs text-[#64748B] whitespace-nowrap">
                    {fmtDateTime(flight.departureAt)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      className="text-xs text-[#64748B] whitespace-nowrap"
                    >
                      {fmtCurrency(flight.basePrice)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[#64748B] whitespace-nowrap">
                    {flight.availability} de {flight.capacity}
                  </td>
                  <td className="px-4 py-4">
                    <Btn
                      onClick={() => onCalculate(flight)}
                      className="whitespace-nowrap"
                    >
                      Calcular precio
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#94A3B8] mt-4">
        El cálculo es interno y no genera reservas, ventas ni transacciones.
      </p>
    </div>
  )
}

function DynamicPriceCalculation({
  flight, rules, onBack,
}: {
  flight: PricingFlight
  rules: PricingRule[]
  onBack: () => void
}) {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [calculation, setCalculation] = useState<PriceCalculationResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true
    setStatus('loading')
    setErrorMessage('')
    getDynamicPriceRequest(flight.idFlight)
      .then((response) => {
        if (active) {
          setCalculation(response)
          setStatus('ready')
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setStatus('error')
          setErrorMessage(error instanceof Error ? error.message : 'No fue posible calcular el precio dinámico.')
        }
      })

    return () => {
      active = false
    }
  }, [attempt, flight.idFlight])

  const basePrice = calculation?.basePrice ?? Number(flight.basePrice)
  const dynamicPrice = calculation?.dynamicPrice ?? basePrice
  const adjustments = calculation?.adjustments ?? []
  const totalAdjustment = basePrice > 0 && calculation
    ? ((dynamicPrice - basePrice) / basePrice) * 100
    : 0

  if (status === 'loading') {
    return (
      <div className="max-w-xl pt-12">
        <div className="bg-white rounded-xl border border-[#CBD5E1] p-10 shadow-sm text-center" role="status">
          <div className="w-12 h-12 border-2 border-[#1A56DB]/20 border-t-[#1A56DB] rounded-full animate-spin mx-auto mb-5" />
          <h1 className="text-lg font-bold text-[#0D1B2A]">Calculando precio dinámico…</h1>
          <p className="text-sm text-[#64748B] mt-2">
            Estamos verificando las reglas activas para el vuelo {flight.idFlight}.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="max-w-xl pt-12">
        <div className="bg-white rounded-xl border border-[#CBD5E1] p-8 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#DC2626] flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-1.5a9 9 0 11-18 0 9 9 0 0118 0zM12 16.5h.008v.008H12V16.5z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-[#DC2626] uppercase tracking-widest mb-2">Cálculo interrumpido</p>
          <h1 className="text-xl font-bold text-[#0D1B2A]">No fue posible calcular el precio dinámico</h1>
          <p className="text-sm text-[#64748B] leading-relaxed mt-2">
            {errorMessage || `No se completó el cálculo del vuelo ${flight.idFlight}. El precio base no fue modificado. Intenta nuevamente.`}
          </p>
          <div className="flex gap-3 mt-6">
            <Btn onClick={() => setAttempt((current) => current + 1)}>Intentar nuevamente</Btn>
            <Btn variant="secondary" onClick={onBack}>Volver a la lista de vuelos</Btn>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-[#1A56DB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] rounded-md mb-5 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
        </svg>
        Volver a la lista de vuelos
      </button>

      <div className="mb-6">
        <p
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
          className="text-[10px] font-semibold text-[#1A56DB] uppercase tracking-widest mb-2"
        >
          Cálculo completado
        </p>
        <h1 className="text-xl font-bold text-[#0D1B2A]">Cálculo del precio dinámico</h1>
        <p className="text-sm text-[#64748B] mt-1">
          {calculation?.message ?? 'Trazabilidad del precio base y las reglas aplicadas al vuelo'}
        </p>
      </div>

      <section className="bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-sm mb-5" aria-labelledby="calculation-flight-info">
        <h2 id="calculation-flight-info" className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-4">
          Información del vuelo
        </h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['Código', flight.idFlight],
            ['Origen', flight.origin],
            ['Destino', flight.destination],
            ['Fecha y hora', fmtDateTime(flight.departureAt)],
          ].map(([label, value], index) => (
            <div key={label}>
              <dt className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">{label}</dt>
              <dd
                style={index === 0 ? { fontFamily: "'JetBrains Mono', monospace" } : {}}
                className="text-sm font-semibold text-[#0D1B2A] mt-1"
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <section className="md:col-span-2" aria-labelledby="applied-adjustments-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="applied-adjustments-heading" className="text-sm font-bold text-[#0D1B2A]">
              Ajustes aplicados
            </h2>
            <span
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              className="text-[10px] text-[#94A3B8]"
            >
              {adjustments.length} {adjustments.length === 1 ? 'ajuste aplicado' : 'ajustes aplicados'}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mb-3">
            Los ajustes se aplican sucesivamente: cada uno parte del precio resultante del anterior.
          </p>

          {adjustments.length > 0 ? (
            <div className="space-y-3">
              {adjustments.map((adjustment, index) => {
                const direction = adjustment.adjustmentType === 'INCREASE_VALUE' ? 'increase' : 'decrease'
                const adjustmentValue = adjustment.percentage
                return (
                  <article key={`${adjustment.ruleId}-${index}`} className="bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#0D1B2A]">{adjustment.ruleName}</h3>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3" aria-hidden="true">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.051l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.816a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                            Ajuste aplicado
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-1.5">
                          {direction === 'increase' ? 'Aumento' : 'Disminución'}{' '}
                          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {direction === 'increase' ? '+' : '−'}{adjustmentValue}%
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Precio</p>
                        <p className="text-sm font-medium text-[#0D1B2A] mt-1">
                          {fmtCurrency(String(adjustment.priceBefore))} → {fmtCurrency(String(adjustment.priceAfter))}
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#CBD5E1] p-7 shadow-sm text-center" role="status">
              <div className="w-10 h-10 rounded-full bg-[#EEF2F7] text-[#64748B] flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#0D1B2A]">
                No se aplicaron ajustes al precio base.
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                El precio se mantiene igual al valor inicial de {flight.idFlight}.
              </p>
            </div>
          )}

        </section>

        <aside className="space-y-4" aria-labelledby="dynamic-price-heading">
          <div className="bg-white rounded-xl border border-[#CBD5E1] p-5 shadow-sm">
            <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest">
              Precio base almacenado
            </p>
            <p
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              className="text-2xl font-bold text-[#0D1B2A] mt-2"
            >
              {fmtCurrency(String(basePrice))}
            </p>
            <p className="text-xs text-[#64748B] mt-1">Punto de partida del cálculo</p>
          </div>

          <div className="bg-[#0D1B2A] rounded-xl p-5 shadow-sm text-white">
            <p className="text-[10px] font-semibold text-[#00C2D4] uppercase tracking-widest">
              Ajuste total
            </p>
            <p
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              className="text-xl font-bold mt-2"
            >
              {totalAdjustment > 0 ? '+' : totalAdjustment < 0 ? '−' : ''}{Math.abs(totalAdjustment).toFixed(2)}%
            </p>
            <div className="border-t border-white/10 mt-4 pt-4">
              <h2 id="dynamic-price-heading" className="text-xs text-[#94A3B8]">Precio dinámico</h2>
              <p
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                className="text-2xl font-bold text-white mt-1"
              >
                {fmtCurrency(String(dynamicPrice))}
              </p>
            </div>
            <p className="text-[10px] text-[#64748B] mt-3 leading-relaxed">
              {calculation?.message || 'Cálculo basado en el resultado del backend.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ─── Pricing Rules ──────────────────────────────────────────────────────── */

function PricingRules({
  rules, loading, error, onCreate,
}: { rules: PricingRule[]; loading: boolean; error: string; onCreate: () => void }) {
  return (
    <div>
      {loading && <Alert type="info"><span className="inline-flex items-center gap-2"><Spinner tone="dark" /> Cargando reglas...</span></Alert>}
      {error && <Alert type="error">{error}</Alert>}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#0D1B2A]">Reglas de Pricing</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Gestiona las reglas del motor de precios dinámico
          </p>
        </div>
        <Btn onClick={onCreate}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Crear regla
        </Btn>
      </div>

      <div className="bg-white rounded-xl border border-[#CBD5E1] overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-[#F1F5F9] flex items-center justify-between">
          <p className="text-sm font-medium text-[#0D1B2A]">
            {rules.length} regla{rules.length !== 1 ? 's' : ''} definida{rules.length !== 1 ? 's' : ''}
          </p>
          <span
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            className="text-[10px] text-[#94A3B8]"
          >
            Variables: Demanda · Disponibilidad · Contexto temporal
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label="Reglas de pricing">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Nombre', 'Variable', 'Condición', 'Ajuste de precio', 'Estado'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-5 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider bg-[#F8FAFC]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((r, i) => (
                <tr
                  key={r.id}
                  className={`hover:bg-[#F8FAFC] transition-colors ${i < rules.length - 1 ? 'border-b border-[#F1F5F9]' : ''}`}
                >
                  <td className="px-5 py-4 font-medium text-[#0D1B2A]">{r.name}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {VAR_LABELS[r.variable] || r.variable}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      className="text-xs text-[#64748B]"
                    >
                      {r.operator} {r.conditionValue}{VAR_UNITS[r.variable] || ''}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full
                        ${r.adjustType === 'increase'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}
                    >
                      {r.adjustType === 'increase' ? (
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M8 2a.75.75 0 01.75.75v8.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V2.75A.75.75 0 018 2z" clipRule="evenodd" transform="scale(1,-1) translate(0,-16)" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M8 14a.75.75 0 01-.75-.75V4.56L3.03 7.78A.75.75 0 011.97 6.72l4.5-4.5a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06L7.75 4.56v8.69A.75.75 0 018 14z" clipRule="evenodd" />
                        </svg>
                      )}
                      {r.adjustType === 'increase' ? 'Aumentar' : 'Disminuir'} {r.adjustValue}%
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ─── Create Rule ────────────────────────────────────────────────────────── */

function CreateRule({
  creatorUserId, onCancel, onSuccess,
}: {
  creatorUserId: number
  onCancel: () => void
  onSuccess: (r: PricingRule) => void
}) {
  const [ruleName, setRuleName] = useState('')
  const [variable, setVariable] = useState<PricingRule['variable'] | ''>('')
  const [operator, setOperator] = useState<UiOperator | ''>('')
  const [condVal, setCondVal] = useState('')
  const [adjustType, setAdjustType] = useState<PricingRule['adjustType'] | ''>('')
  const [adjustVal, setAdjustVal] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')

  function clearErr(key: string) {
    setErrors((p) => { const n = { ...p }; delete n[key]; return n })
  }

  const hasPreview = variable && operator && condVal && adjustType && adjustVal
  const preview = hasPreview
    ? buildSummary({ variable, operator, conditionValue: condVal, adjustType, adjustValue: adjustVal })
    : null

  function validate() {
    const e: Record<string, string> = {}
    if (!ruleName.trim()) e.ruleName = 'El nombre de la regla es obligatorio.'
    if (!variable) e.variable = 'Selecciona una variable de negocio.'
    if (!operator) e.operator = 'Selecciona un operador.'
    if (!condVal.trim()) {
      e.condVal = 'Introduce el valor de la condición.'
    } else if (isNaN(Number(condVal)) || Number(condVal) < 0) {
      e.condVal = 'El valor debe ser un número positivo.'
    }
    if (!adjustType) e.adjustType = 'Selecciona el tipo de ajuste.'
    if (!adjustVal.trim()) {
      e.adjustVal = 'Introduce el porcentaje de ajuste.'
    } else if (isNaN(Number(adjustVal)) || Number(adjustVal) <= 0 || Number(adjustVal) > 100) {
      e.adjustVal = 'El porcentaje debe estar entre 1 y 100.'
    }
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0 || !variable || !operator || !adjustType) {
      setErrors(errs)
      return
    }
    setErrors({})
    setGeneralError('')
    setLoading(true)
    try {
      const response = await createPricingRuleRequest({
        ruleName: ruleName.trim(),
        bussinessVariable: VARIABLE_TO_API[variable],
        conditionOperator: OPERATOR_TO_API[operator],
        conditionValue: Number(condVal),
        adjustmentType: ADJUSTMENT_TO_API[adjustType],
        adjustmentValue: Number(adjustVal),
        creatorUserId,
      })
      onSuccess(toPricingRule(response))
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'No fue posible guardar la regla.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onCancel}
          className="p-1.5 text-[#64748B] hover:text-[#0D1B2A] hover:bg-white rounded-lg transition-colors"
          aria-label="Volver a reglas de pricing"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#0D1B2A]">Definir regla de pricing dinámico</h1>
          <p className="text-sm text-[#64748B]">
            Configura la condición y el ajuste de precio para la nueva regla
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {generalError && <Alert type="error">{generalError}</Alert>}

        {/* Section 1 — Name */}
        <section className="bg-white rounded-xl border border-[#CBD5E1] p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-4">
            Identificación
          </h2>
          <Field label="Nombre de la regla" required error={errors.ruleName}>
            <TextInput
              value={ruleName}
              onChange={(v) => { setRuleName(v); clearErr('ruleName') }}
              placeholder="Ej.: Alta demanda temporada alta"
              disabled={loading}
              hasError={!!errors.ruleName}
            />
          </Field>
        </section>

        {/* Section 2 — Condition */}
        <section className="bg-white rounded-xl border border-[#CBD5E1] p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-4">
            Condición de activación
          </h2>
          <div className="space-y-4">
            <Field label="Variable de negocio" required error={errors.variable}>
              <SelectInput
                value={variable}
                onChange={(v) => {
                  setVariable(isUiVariable(v) ? v : '')
                  setOperator('')
                  clearErr('variable')
                }}
                placeholder="Selecciona una variable..."
                options={[
                  { value: 'demand', label: 'Demanda' },
                  { value: 'availability', label: 'Disponibilidad' },
                  { value: 'temporal', label: 'Contexto temporal' },
                ]}
                disabled={loading}
                hasError={!!errors.variable}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Operador / Condición" required error={errors.operator}>
                <SelectInput
                  value={operator}
                  onChange={(v) => {
                      setOperator(isUiOperator(v) ? v : '')
                      clearErr('operator')
                    }}
                  placeholder="Selecciona..."
                  options={OPERATORS}
                  disabled={loading || !variable}
                  hasError={!!errors.operator}
                />
              </Field>
              <Field
                label={`Valor${variable ? ` (${(VAR_UNITS[variable] || '').trim() || 'unidad'})` : ''}`}
                required
                error={errors.condVal}
              >
                <div className="relative">
                  <TextInput
                    type="number"
                    value={condVal}
                    onChange={(v) => { setCondVal(v); clearErr('condVal') }}
                    placeholder="Ej.: 80"
                    disabled={loading || !variable}
                    hasError={!!errors.condVal}
                    className="pr-10"
                  />
                  {variable && (
                    <span
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] pointer-events-none"
                    >
                      {VAR_UNITS[variable] || ''}
                    </span>
                  )}
                </div>
              </Field>
            </div>
          </div>
        </section>

        {/* Section 3 — Adjustment */}
        <section className="bg-white rounded-xl border border-[#CBD5E1] p-6 shadow-sm">
          <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-4">
            Ajuste de precio
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo de ajuste" required error={errors.adjustType}>
              <SelectInput
                value={adjustType}
                onChange={(v) => {
                  setAdjustType(isUiAdjustment(v) ? v : '')
                  clearErr('adjustType')
                }}
                placeholder="Selecciona..."
                options={[
                  { value: 'increase', label: 'Aumentar precio' },
                  { value: 'decrease', label: 'Disminuir precio' },
                ]}
                disabled={loading}
                hasError={!!errors.adjustType}
              />
            </Field>
            <Field label="Porcentaje de ajuste" required error={errors.adjustVal}>
              <div className="relative">
                <TextInput
                  type="number"
                  value={adjustVal}
                  onChange={(v) => { setAdjustVal(v); clearErr('adjustVal') }}
                  placeholder="Ej.: 15"
                  disabled={loading}
                  hasError={!!errors.adjustVal}
                  className="pr-8"
                />
                <span
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] pointer-events-none"
                >
                  %
                </span>
              </div>
            </Field>
          </div>
        </section>

        {/* Live preview */}
        {preview && (
          <div className="bg-[#EEF2F7] border border-[#CBD5E1] rounded-xl p-5">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 bg-[#1A56DB]/12 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg viewBox="0 0 20 20" fill="#1A56DB" className="w-4 h-4">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#1A56DB] uppercase tracking-widest mb-1.5">
                  Resumen de la regla
                </p>
                <p
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  className="text-sm text-[#0D1B2A] leading-relaxed"
                >
                  {preview}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold bg-[#1A56DB] text-white rounded-md
              hover:bg-[#1647BA] transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] focus-visible:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner /> Guardando regla...</> : 'Guardar regla'}
          </button>
          <Btn variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Btn>
        </div>
      </form>
    </div>
  )
}

/* ─── Rule Created ───────────────────────────────────────────────────────── */

function RuleCreated({
  rule, onBack, onCreateAnother,
}: {
  rule: PricingRule
  onBack: () => void
  onCreateAnother: () => void
}) {
  const summary = buildSummary(rule)
  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-xl border border-[#CBD5E1] p-8 shadow-sm">
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#0D1B2A]">Regla creada exitosamente</h2>
          <p className="text-sm text-[#64748B] mt-1">
            La regla ha sido activada en el motor de pricing dinámico.
          </p>
        </div>

        <div className="bg-[#F8FAFC] rounded-lg border border-[#F1F5F9] p-4 mb-4">
          <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
            Detalles de la regla
          </p>
          <div className="space-y-2.5">
            {(
              [
                ['Nombre', rule.name],
                ['Variable', VAR_LABELS[rule.variable] || rule.variable],
                ['Condición', `${rule.operator} ${rule.conditionValue}${VAR_UNITS[rule.variable] || ''}`],
                ['Ajuste', `${rule.adjustType === 'increase' ? 'Aumentar' : 'Disminuir'} ${rule.adjustValue}%`],
                ['Estado', 'Activo'],
              ] as const
            ).map(([label, val]) => (
              <div key={label} className="flex justify-between items-baseline gap-4 text-sm">
                <span className="text-[#64748B] flex-shrink-0">{label}</span>
                <span className="font-medium text-[#0D1B2A] text-right">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#EEF2F7] border border-[#CBD5E1] rounded-lg p-4 mb-6">
          <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-1.5">
            Regla en lenguaje natural
          </p>
          <p
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            className="text-sm text-[#0D1B2A] leading-relaxed"
          >
            {summary}
          </p>
        </div>

        <div className="flex gap-3">
          <Btn onClick={onBack} className="flex-1 justify-center">
            Ver reglas
          </Btn>
          <Btn variant="secondary" onClick={onCreateAnother} className="flex-1 justify-center">
            Crear otra regla
          </Btn>
        </div>
      </div>
    </div>
  )
}

/* ─── Root ───────────────────────────────────────────────────────────────── */

export default function App() {
  const [restoredSession] = useState(() => getSession())
  const [page, setPage] = useState<Page>(() => restoredSession
    ? restoredSession.user.role === 'admin' ? 'admin-dashboard' : 'analyst-dashboard'
    : 'login')
  const [previousPage, setPreviousPage] = useState<Page>('login')
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(restoredSession?.user ?? null)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [loginNotice, setLoginNotice] = useState('')
  const [selectedHelpTopic, setSelectedHelpTopic] = useState<HelpTopic | null>(null)
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [rules, setRules] = useState<PricingRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(false)
  const [rulesError, setRulesError] = useState('')
  const [usersCount, setUsersCount] = useState<number | null>(null)
  const [rulesCount, setRulesCount] = useState<number | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState('')
  const [flights, setFlights] = useState<PricingFlight[]>([])
  const [newUser, setNewUser] = useState<ManagedUser | null>(null)
  const [newRule, setNewRule] = useState<PricingRule | null>(null)
  const [newFlight, setNewFlight] = useState<PricingFlight | null>(null)
  const [evaluationFlight, setEvaluationFlight] = useState<PricingFlight | null>(null)
  const [evaluationReturnPage, setEvaluationReturnPage] = useState<Page>('evaluate-variables')
  const [calculationFlight, setCalculationFlight] = useState<PricingFlight | null>(null)
  const [calculationReturnPage, setCalculationReturnPage] = useState<Page>('calculate-price')

  function handleLogin(u: SessionUser) {
    setCurrentUser(u)
    setLoginNotice('')
    setPage(u.role === 'admin' ? 'admin-dashboard' : 'analyst-dashboard')
  }

  function handleLogout() {
    clearSession()
    setShowLogoutConfirmation(false)
    setCurrentUser(null)
    setLoginNotice('La sesión se cerró correctamente. Debes autenticarte para volver a acceder.')
    setPage('login')
  }

  function handleSessionExpired() {
    clearSession()
    setShowLogoutConfirmation(false)
    setCurrentUser(null)
    setPage('session-expired')
  }

  useEffect(() => {
    setUnauthorizedHandler(handleSessionExpired)
    return () => setUnauthorizedHandler(null)
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return

    let timeoutId = 0
    const expireIfIdle = () => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(handleSessionExpired, IDLE_TIMEOUT_MS)
    }
    const activityEvents: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll']
    activityEvents.forEach((event) => window.addEventListener(event, expireIfIdle))
    expireIfIdle()

    return () => {
      window.clearTimeout(timeoutId)
      activityEvents.forEach((event) => window.removeEventListener(event, expireIfIdle))
    }
  }, [currentUser])

  useEffect(() => {
    if (page !== 'users-list') return
    let active = true
    setUsersLoading(true)
    setUsersError('')
    getAllUsersRequest()
      .then((response) => {
        if (active) setUsers(response.map(toManagedUser))
      })
      .catch((error: unknown) => {
        if (active) setUsersError(error instanceof Error ? error.message : 'No fue posible cargar los usuarios.')
      })
      .finally(() => {
        if (active) setUsersLoading(false)
      })
    return () => { active = false }
  }, [page])

  useEffect(() => {
    if (page !== 'pricing-rules') return
    let active = true
    setRulesLoading(true)
    setRulesError('')
    getAllPricingRulesRequest()
      .then((response) => {
        if (active) setRules(response.map(toPricingRule))
      })
      .catch((error: unknown) => {
        if (active) setRulesError(error instanceof Error ? error.message : 'No fue posible cargar las reglas.')
      })
      .finally(() => {
        if (active) setRulesLoading(false)
      })
    return () => { active = false }
  }, [page])

  useEffect(() => {
    if (!['flights-list', 'evaluate-variables', 'calculate-price', 'register-flight'].includes(page)) return
    let active = true
    getAllFlightsRequest()
      .then((response) => {
        if (active) setFlights(response.map(toPricingFlight))
      })
      .catch((error: unknown) => {
        if (active) {
          console.error(error)
        }
      })
    return () => { active = false }
  }, [page])

  useEffect(() => {
    if (page !== 'admin-dashboard' && page !== 'analyst-dashboard') return
    let active = true
    setDashboardLoading(true)
    setDashboardError('')
    const loadCount = page === 'admin-dashboard'
      ? getAllUsersRequest().then((response) => {
          if (active) setUsersCount(response.length)
        })
      : getAllPricingRulesRequest().then((response) => {
          if (active) setRulesCount(response.length)
        })
    loadCount
      .catch((error: unknown) => {
        if (active) setDashboardError(error instanceof Error ? error.message : 'No fue posible cargar los datos del panel.')
      })
      .finally(() => {
        if (active) setDashboardLoading(false)
      })
    return () => { active = false }
  }, [page])

  function navigate(nextPage: Page) {
    setPreviousPage(page)
    setPage(nextPage)
  }

  if (page === 'session-expired') {
    return (
      <SessionExpired
        onLogin={() => {
          setLoginNotice('La sesión anterior expiró por inactividad. Ingresa tus credenciales nuevamente.')
          setPage('login')
        }}
      />
    )
  }

  if (!currentUser && page !== 'login') {
    return <UnauthenticatedAccess onLogin={() => setPage('login')} />
  }

  if (!currentUser || page === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        onProtectedAccess={() => setPage('pricing-rules')}
        notice={loginNotice}
      />
    )
  }

  const dashboardPage: Page = currentUser.role === 'admin' ? 'admin-dashboard' : 'analyst-dashboard'
  const adminPages: Page[] = ['admin-dashboard', 'help', 'help-topic', 'users-list', 'register-user', 'user-created']
  const analystPages: Page[] = [
    'analyst-dashboard',
    'help',
    'help-topic',
    'pricing-rules',
    'create-rule',
    'rule-created',
    'flights-list',
    'register-flight',
    'flight-created',
    'evaluate-variables',
    'flight-evaluation',
    'calculate-price',
    'price-calculation',
  ]
  const isAuthorized = (currentUser.role === 'admin' ? adminPages : analystPages).includes(page)

  return (
    <AppLayout
      user={currentUser}
      page={isAuthorized ? page : dashboardPage}
      setPage={navigate}
      onLogout={() => setShowLogoutConfirmation(true)}
    >
      {!isAuthorized && (
        <AccessDenied
          role={currentUser.role}
          onBack={() => setPage(
            (currentUser.role === 'admin' ? adminPages : analystPages).includes(previousPage)
              ? previousPage
              : dashboardPage,
          )}
          onDashboard={() => setPage(dashboardPage)}
        />
      )}
      {isAuthorized && (
        <>
          {page === 'admin-dashboard' && (
            <RoleDashboard
              user={currentUser}
              usersCount={usersCount}
              rulesCount={rulesCount}
              loading={dashboardLoading}
              error={dashboardError}
              onAuthorizedAccess={() => navigate('users-list')}
              onRestrictedAccess={() => navigate('register-flight')}
              onExpire={handleSessionExpired}
            />
          )}
          {page === 'analyst-dashboard' && (
            <RoleDashboard
              user={currentUser}
              usersCount={usersCount}
              rulesCount={rulesCount}
              loading={dashboardLoading}
              error={dashboardError}
              onAuthorizedAccess={() => navigate('pricing-rules')}
              onRestrictedAccess={() => navigate('users-list')}
              onExpire={handleSessionExpired}
            />
          )}
          {page === 'help' && (
            <HelpCenter
              onSelectTopic={(topic) => {
                setSelectedHelpTopic(topic)
                navigate('help-topic')
              }}
            />
          )}
          {page === 'help-topic' && selectedHelpTopic && (
            <HelpTopicDetails
              topic={selectedHelpTopic}
              onBack={() => navigate('help')}
            />
          )}
          {page === 'flights-list' && (
            <PricingFlights
              flights={flights}
              onRegister={() => navigate('register-flight')}
              onEvaluate={(flight) => {
                setEvaluationFlight(flight)
                setEvaluationReturnPage('flights-list')
                navigate('flight-evaluation')
              }}
              onCalculate={(flight) => {
                setCalculationFlight(flight)
                setCalculationReturnPage('flights-list')
                navigate('price-calculation')
              }}
            />
          )}
          {page === 'register-flight' && (
            <RegisterFlight
              existingCodes={flights.map((flight) => flight.idFlight)}
              onCancel={() => navigate('flights-list')}
              onSuccess={(flight) => {
                setFlights((current) => [...current, flight])
                setNewFlight(flight)
                setPage('flight-created')
              }}
            />
          )}
          {page === 'flight-created' && newFlight && (
            <FlightCreated
              flight={newFlight}
              onBack={() => navigate('flights-list')}
            />
          )}
          {page === 'evaluate-variables' && (
            <EvaluateVariablesList
              flights={flights}
              onEvaluate={(flight) => {
                setEvaluationFlight(flight)
                setEvaluationReturnPage('evaluate-variables')
                navigate('flight-evaluation')
              }}
            />
          )}
          {page === 'flight-evaluation' && evaluationFlight && (
            <FlightEvaluation
              key={evaluationFlight.id}
              flight={evaluationFlight}
              rules={rules}
              onBack={() => navigate(evaluationReturnPage)}
            />
          )}
          {page === 'calculate-price' && (
            <CalculatePriceList
              flights={flights}
              onCalculate={(flight) => {
                setCalculationFlight(flight)
                setCalculationReturnPage('calculate-price')
                navigate('price-calculation')
              }}
            />
          )}
          {page === 'price-calculation' && calculationFlight && (
            <DynamicPriceCalculation
              key={calculationFlight.id}
              flight={calculationFlight}
              rules={rules}
              onBack={() => navigate(calculationReturnPage)}
            />
          )}
          {page === 'users-list' && (
            <UsersList
              users={users}
              loading={usersLoading}
              error={usersError}
              onRegister={() => navigate('register-user')}
            />
          )}
          {page === 'register-user' && (
            <RegisterUser
              existingEmails={users.map((u) => u.email)}
              onCancel={() => setPage('users-list')}
              onSuccess={(u) => {
                setUsers((prev) => [...prev, u])
                setNewUser(u)
                setPage('user-created')
              }}
            />
          )}
          {page === 'user-created' && newUser && (
            <UserCreated user={newUser} onBack={() => setPage('users-list')} />
          )}
          {page === 'pricing-rules' && (
            <PricingRules
              rules={rules}
              loading={rulesLoading}
              error={rulesError}
              onCreate={() => setPage('create-rule')}
            />
          )}
          {page === 'create-rule' && (
            <CreateRule
              creatorUserId={currentUser.id}
              onCancel={() => setPage('pricing-rules')}
              onSuccess={(r) => {
                setRules((prev) => [...prev, r])
                setNewRule(r)
                setPage('rule-created')
              }}
            />
          )}
          {page === 'rule-created' && newRule && (
            <RuleCreated
              rule={newRule}
              onBack={() => setPage('pricing-rules')}
              onCreateAnother={() => setPage('create-rule')}
            />
          )}
        </>
      )}
      {showLogoutConfirmation && (
        <LogoutConfirmation
          onCancel={() => setShowLogoutConfirmation(false)}
          onConfirm={handleLogout}
        />
      )}
    </AppLayout>
  )
}
