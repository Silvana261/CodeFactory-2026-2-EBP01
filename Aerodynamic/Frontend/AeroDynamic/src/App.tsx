import { useEffect, useState } from 'react'
import {
  createPricingRuleRequest,
  getAllPricingRulesRequest,
  getAllUsersRequest,
  loginRequest,
  registerUserRequest,
  type BackendRole,
  type PricingRuleResponse,
} from './api'

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Page =
  | 'login'
  | 'users-list'
  | 'register-user'
  | 'user-created'
  | 'pricing-rules'
  | 'create-rule'
  | 'rule-created'

type Role = 'admin' | 'analyst'

interface SessionUser {
  name: string
  email: string
  role: Role
}

interface ManagedUser {
  id: string
  name: string
  email: string
  role: 'analyst'
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

const OPERATORS = [
  { value: '≥', label: 'Mayor o igual que (≥)' },
  { value: '≤', label: 'Menor o igual que (≤)' },
  { value: '>', label: 'Mayor que (>)' },
  { value: '<', label: 'Menor que (<)' },
]

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function mapBackendRole(role: BackendRole): Role {
  if (role === 'ADMIN') return 'admin'
  if (role === 'PRICING_ANALYST') return 'analyst'
  throw new Error(`Rol no soportado: ${role}`)
}

function mapBackendVariable(variable: string): PricingRule['variable'] {
  const variables: Record<string, PricingRule['variable']> = {
    DEMAND: 'demand',
    AVAILABILITY: 'availability',
    TEMPORAL_CONTEXT: 'temporal',
    demand: 'demand',
    availability: 'availability',
    temporal: 'temporal',
  }
  return variables[variable] || 'demand'
}

function mapBackendRule(rule: PricingRuleResponse): PricingRule {
  const condition = rule.condition || ''
  const adjustment = rule.ajuste || ''
  const conditionValue = condition.match(/-?\d+(?:\.\d+)?/)?.[0] || ''
  const operatorMatch = condition.match(/>=|<=|>|<|GREATER_THAN_OR_EQUAL|LESS_THAN_OR_EQUAL|GREATER_THAN|LESS_THAN/)
  const operatorMap: Record<string, string> = {
    GREATER_THAN_OR_EQUAL: '≥',
    LESS_THAN_OR_EQUAL: '≤',
    GREATER_THAN: '>',
    LESS_THAN: '<',
  }
  const rawOperator = operatorMatch?.[0] || ''
  const adjustType = /DECREASE|DISMINUIR/i.test(adjustment) ? 'decrease' : 'increase'

  return {
    id: String(rule.id),
    name: rule.ruleName,
    variable: mapBackendVariable(rule.variable),
    operator: operatorMap[rawOperator] || rawOperator,
    conditionValue,
    adjustType,
    adjustValue: adjustment.match(/-?\d+(?:\.\d+)?/)?.[0] || '',
    status: rule.activa ? 'active' : 'inactive',
  }
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
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
  label, error, hint, required, children,
}: {
  label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#0D1B2A]">
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
  type = 'text', value, onChange, placeholder, disabled, hasError, className = '',
}: {
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  className?: string
}) {
  return (
    <input
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
  value, onChange, options, placeholder, disabled, hasError,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
}) {
  return (
    <div className="relative">
      <select
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

function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4 border-2' : 'w-6 h-6 border-2'
  return (
    <div className={`${s} border-white/30 border-t-white rounded-full animate-spin`} aria-label="Cargando" />
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
      label: 'Usuarios',
      page: 'users-list' as Page,
      related: ['register-user', 'user-created'] as Page[],
      icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    },
  ]
  const analystNav = [
    {
      label: 'Reglas de Pricing',
      page: 'pricing-rules' as Page,
      related: ['create-rule', 'rule-created'] as Page[],
      icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z',
    },
  ]
  const navItems = user.role === 'admin' ? adminNav : analystNav
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
            <p className="text-white text-sm font-bold tracking-wide">AirPricing</p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[#475569] text-[10px]">
              v1.0 · Sprint 1
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

function LoginPage({ onLogin }: { onLogin: (u: SessionUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successUser, setSuccessUser] = useState<SessionUser | null>(null)

  const isReady = email.trim() !== '' && password !== ''

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isReady || loading) return
    setError('')
    setLoading(true)
    loginRequest({ email: email.trim(), password })
      .then((response) => {
        const u: SessionUser = {
          name: response.name,
          email: response.email,
          role: mapBackendRole(response.role),
        }
        setSuccessUser(u)
        setLoading(false)
        onLogin(u)
      })
      .catch((requestError: unknown) => {
        setLoading(false)
        setError(requestError instanceof Error
          ? requestError.message
          : 'No fue posible iniciar sesión. Verifica tus datos e intenta nuevamente.')
      })
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

        </div>
      </div>
    </div>
  )
}

/* ─── Users List ─────────────────────────────────────────────────────────── */

function UsersList({ users, loading, error, onRegister }: {
  users: ManagedUser[]
  loading: boolean
  error: string
  onRegister: () => void
}) {
  return (
    <div>
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
        {error && <div className="p-5"><Alert type="error">{error}</Alert></div>}
        {loading && (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-[#64748B]">
            <div className="w-5 h-5 border-2 border-[#CBD5E1] border-t-[#1A56DB] rounded-full animate-spin" />
            Cargando usuarios...
          </div>
        )}
        {!loading && !error && (
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
                      Analista de Pricing
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
        )}
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setGeneralError('')
    setLoading(true)
    registerUserRequest({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'PRICING_ANALYST',
    })
      .then((response) => {
        setLoading(false)
        onSuccess({
          id: String(response.id),
          name: response.name,
          email: response.email,
          role: 'analyst',
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
        })
      })
      .catch((requestError: unknown) => {
        setLoading(false)
        setGeneralError(requestError instanceof Error
          ? requestError.message
          : 'No fue posible registrar el usuario.')
      })
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

/* ─── Pricing Rules ──────────────────────────────────────────────────────── */

function PricingRules({ rules, loading, error, onCreate }: {
  rules: PricingRule[]
  loading: boolean
  error: string
  onCreate: () => void
}) {
  return (
    <div>
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
        {error && <div className="p-5"><Alert type="error">{error}</Alert></div>}
        {loading && (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-[#64748B]">
            <div className="w-5 h-5 border-2 border-[#CBD5E1] border-t-[#1A56DB] rounded-full animate-spin" />
            Cargando reglas...
          </div>
        )}
        {!loading && !error && (
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
        )}
      </div>
    </div>
  )
}

/* ─── Create Rule ────────────────────────────────────────────────────────── */

function CreateRule({
  onCancel, onSuccess,
}: {
  onCancel: () => void
  onSuccess: (r: PricingRule) => void
}) {
  const [ruleName, setRuleName] = useState('')
  const [variable, setVariable] = useState('')
  const [operator, setOperator] = useState('')
  const [condVal, setCondVal] = useState('')
  const [adjustType, setAdjustType] = useState('')
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setGeneralError('')
    setLoading(true)
    const variableMap = {
      demand: 'DEMAND',
      availability: 'AVAILABILITY',
      temporal: 'TEMPORAL_CONTEXT',
    } as const
    const operatorMap = {
      '≥': 'GREATER_THAN_OR_EQUAL',
      '≤': 'LESS_THAN_OR_EQUAL',
      '>': 'GREATER_THAN',
      '<': 'LESS_THAN',
    } as const
    const adjustmentMap = {
      increase: 'INCREASE_VALUE',
      decrease: 'DECREASE_VALUE',
    } as const

    createPricingRuleRequest({
      ruleName: ruleName.trim(),
      bussinessVariable: variableMap[variable as keyof typeof variableMap],
      conditionOperator: operatorMap[operator as keyof typeof operatorMap],
      conditionValue: Number(condVal),
      adjustmentType: adjustmentMap[adjustType as keyof typeof adjustmentMap],
      adjustmentValue: Number(adjustVal),
    })
      .then((response) => {
        setLoading(false)
        onSuccess(mapBackendRule(response))
      })
      .catch((requestError: unknown) => {
        setLoading(false)
        setGeneralError(requestError instanceof Error
          ? requestError.message
          : 'No fue posible crear la regla.')
      })
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
                onChange={(v) => { setVariable(v); setOperator(''); clearErr('variable') }}
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
                  onChange={(v) => { setOperator(v); clearErr('operator') }}
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
                onChange={(v) => { setAdjustType(v); clearErr('adjustType') }}
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
  const [page, setPage] = useState<Page>('login')
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [rules, setRules] = useState<PricingRule[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [rulesLoading, setRulesLoading] = useState(false)
  const [rulesError, setRulesError] = useState('')
  const [newUser, setNewUser] = useState<ManagedUser | null>(null)
  const [newRule, setNewRule] = useState<PricingRule | null>(null)

  useEffect(() => {
    if (!currentUser || page !== 'users-list') return
    setUsersLoading(true)
    setUsersError('')
    getAllUsersRequest()
      .then((response) => {
        setUsers(response.map((user) => ({
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: 'analyst',
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
        })))
      })
      .catch((requestError: unknown) => {
        setUsersError(requestError instanceof Error ? requestError.message : 'No fue posible cargar los usuarios.')
      })
      .finally(() => setUsersLoading(false))
  }, [currentUser, page])

  useEffect(() => {
    if (!currentUser || page !== 'pricing-rules') return
    setRulesLoading(true)
    setRulesError('')
    getAllPricingRulesRequest()
      .then((response) => setRules(response.map(mapBackendRule)))
      .catch((requestError: unknown) => {
        setRulesError(requestError instanceof Error ? requestError.message : 'No fue posible cargar las reglas.')
      })
      .finally(() => setRulesLoading(false))
  }, [currentUser, page])

  function handleLogin(u: SessionUser) {
    setCurrentUser(u)
    setPage(u.role === 'admin' ? 'users-list' : 'pricing-rules')
  }

  function handleLogout() {
    setCurrentUser(null)
    setPage('login')
  }

  if (!currentUser || page === 'login') {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <AppLayout user={currentUser} page={page} setPage={setPage} onLogout={handleLogout}>
      {page === 'users-list' && (
        <UsersList
          users={users}
          loading={usersLoading}
          error={usersError}
          onRegister={() => setPage('register-user')}
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
    </AppLayout>
  )
}
