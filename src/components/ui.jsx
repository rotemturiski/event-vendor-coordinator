// Shared, calm UI primitives used across all stages.
import {
  Sprout, Compass, Handshake, Users, LayoutDashboard, Zap, Sparkles, Wand2, Brain,
  Bell, CheckCircle2, Check, Wrench, DoorOpen, Calendar, CalendarDays, MapPin, Timer,
  AlarmClock, User, Wallet, TrendingDown, UtensilsCrossed, Salad, Link2, Upload, Download,
  MessageCircle, Mail, ThumbsUp, ThumbsDown, Star, Camera, Video, FileText, CreditCard,
  Menu, X, Lightbulb, Inbox, Building2, HeartHandshake, Bus, Palette, Package, Flower2,
  Footprints, Luggage, Loader2, Plus, PenLine, ClipboardList, ChartNoAxesColumn,
  MessageSquare, FolderOpen, Receipt, ExternalLink, Send, Circle, Plane, Search,
  ChevronUp, ChevronDown, Film, Clock,
} from 'lucide-react'

// Explicit name → component map (keeps the bundle small, surfaces typos).
const ICONS = {
  Sprout, Compass, Handshake, Users, LayoutDashboard, Zap, Sparkles, Wand2, Brain,
  Bell, CheckCircle2, Check, Wrench, DoorOpen, Calendar, CalendarDays, MapPin, Timer,
  AlarmClock, User, Wallet, TrendingDown, UtensilsCrossed, Salad, Link2, Upload, Download,
  MessageCircle, Mail, ThumbsUp, ThumbsDown, Star, Camera, Video, FileText, CreditCard,
  Menu, X, Lightbulb, Inbox, Building2, HeartHandshake, Bus, Palette, Package, Flower2,
  Footprints, Luggage, Loader2, Plus, PenLine, ClipboardList, ChartNoAxesColumn,
  MessageSquare, FolderOpen, Receipt, ExternalLink, Send, Circle, Plane, Search,
  ChevronUp, ChevronDown, Film, Clock,
}
const ICON_SIZE = { xs: 14, sm: 16, md: 18, lg: 20, xl: 24 }

export function Icon({ name, size = 'sm', className = '', strokeWidth = 1.75, ...rest }) {
  const Cmp = ICONS[name] || Package
  return <Cmp size={ICON_SIZE[size] || ICON_SIZE.sm} strokeWidth={strokeWidth} className={className} aria-hidden {...rest} />
}

// ── tones shared by Chip, Stat icon tiles, etc. ───────────────────────────
export const CHIP_TONES = {
  stone: 'bg-stone-100 text-stone-600 ring-stone-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
}
export const TILE_TONES = {
  stone: 'bg-stone-100 text-stone-600', emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700',
  orange: 'bg-orange-50 text-orange-700', violet: 'bg-violet-50 text-violet-700',
  sky: 'bg-sky-50 text-sky-700', teal: 'bg-teal-50 text-teal-700',
}
const VALUE_TONES = { stone: 'text-stone-800', emerald: 'text-emerald-700', amber: 'text-amber-600', rose: 'text-rose-600' }

export function Chip({ tone = 'stone', icon, dot, children, as = 'span', className = '', ...rest }) {
  const Tag = as
  return (
    <Tag className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 ring-1 ${CHIP_TONES[tone]} ${as === 'button' ? 'transition active:scale-[0.97]' : ''} ${className}`} {...rest}>
      {dot && <span className={`size-2 rounded-full ${dot}`} />}
      {icon && <Icon name={icon} size="xs" />}
      {children}
    </Tag>
  )
}
export const Badge = Chip

// ── page + section headers ────────────────────────────────────────────────
export function PageHeader({ icon, title, subtitle, step, total, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6 fade-up">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="size-10 shrink-0 grid place-items-center rounded-lg bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700">
            <Icon name={icon} size="lg" />
          </span>
        )}
        <div>
          {step != null && <div className="text-xs font-semibold text-emerald-700/70 tracking-wide mb-0.5">Step {step} of {total}</div>}
          <h1 className="text-[length:var(--text-h1)] font-semibold text-stone-800 tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-stone-500 mt-1 text-sm">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ children, className = '', pad = true, tone, ...rest }) {
  const tones = { emerald: 'bg-gradient-to-r from-emerald-50 to-white ring-emerald-200/70', violet: 'bg-gradient-to-r from-violet-50/60 to-white ring-violet-200/60' }
  return (
    <div className={`rounded-2xl ring-1 card ${tone ? tones[tone] : 'bg-white ring-stone-200'} ${pad ? 'p-5' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function SectionTitle({ icon, children, hint }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="flex items-center gap-2 text-[length:var(--text-h2)] font-semibold text-stone-800">
        {icon && <Icon name={icon} size="sm" className="text-stone-400" />} {children}
      </h2>
      {hint && <span className="text-xs text-stone-400">{hint}</span>}
    </div>
  )
}

export function Btn({ children, variant = 'primary', icon, loading, className = '', ...rest }) {
  const styles = {
    primary: 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm',
    soft: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 ring-1 ring-emerald-200',
    ghost: 'text-stone-600 hover:bg-stone-100 ring-1 ring-stone-200',
    warm: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm',
  }
  return (
    <button disabled={loading} className={`inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-lg px-4 py-2.5 transition active:scale-[0.98] disabled:opacity-60 ${styles[variant]} ${className}`} {...rest}>
      {loading ? <Icon name="Loader2" size="sm" className="animate-spin" /> : icon && <Icon name={icon} size="sm" />}
      {children}
    </button>
  )
}

export function Stat({ label, value, sub, icon, tone = 'stone', progress }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-stone-200 card p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{label}</div>
        {icon && <span className={`size-7 grid place-items-center rounded-lg ${TILE_TONES[tone] || TILE_TONES.stone}`}><Icon name={icon} size="xs" /></span>}
      </div>
      <div className={`mt-1.5 text-2xl font-semibold tabular-nums ${VALUE_TONES[tone] || VALUE_TONES.stone}`}>{value}</div>
      {sub && <div className="text-xs text-stone-400 mt-0.5">{sub}</div>}
      {progress != null && (
        <div className="mt-2 h-1 rounded-full bg-stone-100 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      )}
    </div>
  )
}

export function Empty({ icon, children }) {
  return (
    <div className="text-center text-stone-400 text-sm py-12">
      {icon && <span className="inline-grid place-items-center size-12 rounded-2xl bg-stone-100 text-stone-400 mb-3"><Icon name={icon} size="xl" /></span>}
      <div>{children}</div>
    </div>
  )
}

export function Label({ children }) {
  return <div className="text-xs font-semibold text-stone-400 mb-1">{children}</div>
}

const FIELD = 'w-full text-sm bg-white rounded-lg px-3 py-2.5 ring-1 ring-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition'

export function Input({ label, value, onChange, className = '', type = 'text', ...rest }) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD} {...rest} />
    </div>
  )
}
// back-compat alias for existing call sites
export const Field = Input

export function Textarea({ label, value, onChange, rows = 4, className = '', ...rest }) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={`${FIELD} resize-none leading-relaxed`} {...rest} />
    </div>
  )
}

export function Select({ label, value, onChange, options, className = '', ...rest }) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={FIELD} {...rest}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function DateField({ label, value, onChange, min, className = '', ...rest }) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      <input type="date" value={value} min={min} onChange={(e) => e.target.value && onChange(e.target.value)} className={FIELD} {...rest} />
    </div>
  )
}
