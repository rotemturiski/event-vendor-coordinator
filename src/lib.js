// ──────────────────────────────────────────────────────────────────────────
//  Retreat OS · core logic
//  A retreat is managed across lifecycle stages. Each stage is its own screen.
//  Deliverable timing is stored as `daysBefore` the retreat start, so the whole
//  timeline recomputes automatically when the dates change.
// ──────────────────────────────────────────────────────────────────────────

// Three lifecycle phases. "Before" contains all the prep sub-stages.
export const PHASES = [
  {
    key: 'before', label: 'Before', iconName: 'ClipboardList', desc: 'Plan, vendors, guests & overview',
    sub: [
      { key: 'planning', label: 'Planning', iconName: 'Compass', desc: 'Define the retreat' },
      { key: 'vendors', label: 'Vendors', iconName: 'Handshake', desc: 'Coordination & AI reminders' },
      { key: 'participants', label: 'Participants', iconName: 'Users', desc: 'Registration & payments' },
      { key: 'agenda', label: 'Agenda', iconName: 'CalendarDays', desc: 'Build the daily schedule' },
      { key: 'control', label: 'Overview', iconName: 'LayoutDashboard', desc: 'Timeline, tasks & alerts' },
    ],
  },
  { key: 'during', label: 'During', iconName: 'Zap', desc: 'Check-in & issue handling' },
  {
    key: 'after', label: 'After', iconName: 'Sparkles', desc: 'Reviews, feedback, content & wrap-up',
    sub: [
      { key: 'reviews', label: 'Vendor reviews', iconName: 'Star', desc: 'Rate your vendors' },
      { key: 'feedback', label: 'Guest feedback', iconName: 'MessageSquare', desc: 'Survey & AI analysis' },
      { key: 'content', label: 'Content', iconName: 'FolderOpen', desc: 'Photos, videos & decks' },
      { key: 'closing', label: 'Wrap-up', iconName: 'CheckCircle2', desc: 'Payments & closing' },
    ],
  },
]

export const STAGE_LIST = PHASES.flatMap((p) => p.sub ? p.sub : [p])

export const CATEGORIES = [
  { key: 'venue', label: 'Lodging', iconName: 'Building2', color: 'emerald' },
  { key: 'flights', label: 'Flights', iconName: 'Plane', color: 'sky' },
  { key: 'transport', label: 'Transfers', iconName: 'Bus', color: 'teal' },
  { key: 'facilitator', label: 'Guides', iconName: 'HeartHandshake', color: 'violet' },
  { key: 'catering', label: 'Catering', iconName: 'UtensilsCrossed', color: 'amber' },
  { key: 'photo', label: 'Photo & Content', iconName: 'Camera', color: 'rose' },
  { key: 'av', label: 'Sound & Lighting', iconName: 'Lightbulb', color: 'orange' },
  { key: 'design', label: 'Design & Branding', iconName: 'Palette', color: 'stone' },
  { key: 'other', label: 'Other', iconName: 'Package', color: 'stone' },
]

// The four headline groups for a retreat (used by the Vendors breakdown).
export const VENDOR_GROUPS = ['venue', 'flights', 'transport', 'facilitator']

export const STATUS = {
  pending: { label: 'Pending', dot: 'bg-amber-400', tone: 'amber' },
  confirmed: { label: 'Confirmed', dot: 'bg-emerald-500', tone: 'emerald' },
  done: { label: 'Done', dot: 'bg-stone-400', tone: 'stone' },
}

export const PAY_STATUS = {
  unpaid: { label: 'Unpaid', tone: 'rose' },
  deposit: { label: 'Deposit', tone: 'amber' },
  paid: { label: 'Paid', tone: 'emerald' },
}

// ── Pre-retreat questionnaire ───────────────────────────────────────────────
// One shared schema (stored on the retreat) drives both the guest registration
// form and how each participant's answers are stored & displayed.
export const QUESTION_TYPES = {
  text: { label: 'Short text' },
  textarea: { label: 'Long text' },
  single: { label: 'Single choice' },
  multi: { label: 'Multiple choice' },
}

// Editable default template — the manager can add / edit / remove / reorder.
export function defaultQuestionnaire() {
  return [
    { id: 'allergies', label: 'Allergies or medical needs', type: 'text', options: [], required: false },
    { id: 'dietary', label: 'Dietary preference', type: 'single', options: ['No restrictions', 'Vegetarian', 'Vegan', 'Gluten-free', 'Kosher', 'Other'], required: true },
    { id: 'sleep', label: 'Sleep preference', type: 'single', options: ['No preference', 'Early riser', 'Night owl', 'Light sleeper — quiet room'], required: false },
    { id: 'expectations', label: 'What do you hope to get from this retreat?', type: 'textarea', options: [], required: false },
  ]
}

// Deposit counts as 30% of the registration price toward collected revenue.
export const DEPOSIT_PCT = 0.3
export function collectedFrom(participants = [], regPrice = 0) {
  const price = Number(regPrice) || 0
  return participants.reduce((s, p) => s + (p.pay === 'paid' ? price : p.pay === 'deposit' ? Math.round(price * DEPOSIT_PCT) : 0), 0)
}

// Flatten a participant's questionnaire answers into a short health/diet note,
// so existing views (check-in, roster) keep showing dietary info.
export function dietSummary(answers = {}, questionnaire = []) {
  const parts = []
  questionnaire.forEach((q) => {
    if (!/diet|allerg/i.test(q.label) && q.id !== 'dietary' && q.id !== 'allergies') return
    const v = answers[q.id]
    if (Array.isArray(v) ? v.length : v) parts.push(Array.isArray(v) ? v.join(', ') : v)
  })
  return parts.join(' · ')
}

// Agenda block kinds (shared by Planning / Overview / During).
export const AGENDA_KIND = {
  session: { label: 'Session', iconName: 'Flower2', tone: 'violet' },
  meal: { label: 'Meal', iconName: 'UtensilsCrossed', tone: 'amber' },
  activity: { label: 'Activity', iconName: 'Footprints', tone: 'sky' },
  logistics: { label: 'Logistics', iconName: 'Luggage', tone: 'stone' },
}

// ── Timeline tracks (the multi-track "video-editor" agenda) ─────────────────
// Every block carries an optional `track` (default 'main') + `dur` minutes
// (default 60). Three parallel lanes line up on one shared time axis.
export const TRACKS = [
  { key: 'main', label: 'Main', iconName: 'Compass', desc: 'Guest-facing schedule' },
  { key: 'shadow', label: 'Ops', iconName: 'Wrench', desc: 'Behind the scenes — staff & vendors' },
  { key: 'reminder', label: 'Reminders', iconName: 'Bell', desc: 'Notifications to send' },
]
export const DEFAULT_DUR = 60

export function timeToMin(t) {
  const [h, m] = String(t || '0:0').split(':').map((x) => parseInt(x, 10) || 0)
  return Math.max(0, Math.min(1439, h * 60 + m))
}
export function minToTime(m) {
  const x = Math.max(0, Math.min(1439, Math.round(m)))
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
}

// Derive (never store) the reminder bars for one day, from the day's own Main
// blocks plus any vendor deadline that lands on that calendar date.
export function autoReminders(dayBlocks = [], dayIndex = 0, retreat = {}) {
  const out = []
  const date = retreat.startDate ? addDays(retreat.startDate, dayIndex) : null
  const nights = Math.max(0, daysBetween(retreat.startDate, retreat.endDate) || 0)
  const lastDay = nights > 0 ? nights : 2 // 0-based index of the final day

  // 15 min before each Main session/activity
  dayBlocks
    .filter((b) => (b.track || 'main') === 'main' && (b.kind === 'session' || b.kind === 'activity'))
    .forEach((b) => {
      const start = timeToMin(b.t) - 15
      if (start >= 0) out.push({ id: `auto-pre-${b.t}-${b.label}`, t: minToTime(start), dur: 15, label: `Remind: ${b.label}`, kind: 'reminder', track: 'reminder', auto: true })
    })

  // evening "send tomorrow's plan" (every day except the last)
  if (dayIndex < lastDay) out.push({ id: 'auto-tomorrow', t: '21:00', dur: 30, label: 'Send tomorrow’s schedule to guests', kind: 'reminder', track: 'reminder', auto: true })

  // vendor deadlines that fall on this date
  if (date) {
    (retreat.vendors || []).forEach((v) => {
      if (deadlineFor(retreat.startDate, v.daysBefore) === date) {
        out.push({ id: `auto-vendor-${v.id}`, t: '09:00', dur: 30, label: `Follow up: ${v.deliverable} — ${v.name}`, kind: 'reminder', track: 'reminder', auto: true })
      }
    })
  }
  return out.sort((a, b) => timeToMin(a.t) - timeToMin(b.t))
}

export function catById(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[CATEGORIES.length - 1]
}

// ── date helpers ──────────────────────────────────────────────────────────
export function toISO(d) {
  const x = new Date(d)
  const tz = x.getTimezoneOffset() * 60000
  return new Date(x - tz).toISOString().slice(0, 10)
}
export function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toISO(d)
}
export function deadlineFor(startDate, daysBefore) {
  if (!startDate) return null
  return addDays(startDate, -daysBefore)
}
export function daysBetween(fromISO, toISODate) {
  if (!fromISO || !toISODate) return null
  const a = new Date(fromISO + 'T00:00:00')
  const b = new Date(toISODate + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function fmtDate(iso, withDay = false) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  const base = `${MONTHS[d.getMonth()]} ${d.getDate()}`
  return withDay ? `${DAYS[d.getDay()]}, ${base}, ${d.getFullYear()}` : `${base}, ${d.getFullYear()}`
}
export function fmtRange(start, end) {
  if (!start) return 'No date set'
  if (!end || end === start) return fmtDate(start)
  const a = new Date(start + 'T00:00:00')
  const b = new Date(end + 'T00:00:00')
  if (a.getMonth() === b.getMonth()) return `${MONTHS[b.getMonth()]} ${a.getDate()}–${b.getDate()}, ${b.getFullYear()}`
  return `${fmtDate(start)} – ${fmtDate(end)}`
}
export function fmtCountdown(days) {
  if (days == null) return { text: '—', tone: 'calm' }
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: 'overdue' }
  if (days === 0) return { text: 'Today', tone: 'urgent' }
  if (days === 1) return { text: 'Tomorrow', tone: 'urgent' }
  if (days <= 3) return { text: `in ${days} days`, tone: 'urgent' }
  if (days <= 7) return { text: `in ${days} days`, tone: 'soon' }
  return { text: `in ${days} days`, tone: 'calm' }
}
export function money(n) {
  return '$' + (Number(n) || 0).toLocaleString('en-US')
}

// ── CSV ───────────────────────────────────────────────────────────────────
const CSV_MAP = {
  name: ['name', 'vendor', 'שם'],
  category: ['category', 'קטגוריה'],
  contactName: ['contact', 'contactname', 'contact name', 'איש קשר'],
  phone: ['phone', 'טלפון'],
  email: ['email', 'אימייל'],
  deliverable: ['deliverable', 'task', 'משימה'],
  daysBefore: ['daysbefore', 'days before', 'days_before', 'ימים לפני'],
  price: ['price', 'cost', 'מחיר'],
}
function matchHeader(h) {
  const norm = h.trim().toLowerCase()
  for (const [field, aliases] of Object.entries(CSV_MAP)) {
    if (aliases.some((a) => a.toLowerCase() === norm)) return field
  }
  return null
}
const CATEGORY_GUESS = {
  hotel: 'venue', venue: 'venue', lodging: 'venue', villa: 'venue', estate: 'venue',
  catering: 'catering', food: 'catering', chef: 'catering',
  facilitator: 'facilitator', instructor: 'facilitator', teacher: 'facilitator', yoga: 'facilitator', guide: 'facilitator',
  transport: 'transport', shuttle: 'transport', bus: 'transport', transfer: 'transport', transfers: 'transport',
  flight: 'flights', flights: 'flights', air: 'flights', plane: 'flights', airline: 'flights',
  photo: 'photo', photographer: 'photo', video: 'photo',
  sound: 'av', lighting: 'av', av: 'av',
  design: 'design', flowers: 'design', branding: 'design',
}
function guessCategory(raw) {
  if (!raw) return 'other'
  const v = raw.trim().toLowerCase()
  if (CATEGORIES.some((c) => c.key === v)) return v
  for (const [word, key] of Object.entries(CATEGORY_GUESS)) if (v.includes(word)) return key
  return 'other'
}
export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length)
  if (!lines.length) return []
  const headers = splitCsvLine(lines[0]).map(matchHeader)
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const obj = {}
    headers.forEach((field, idx) => { if (field) obj[field] = (cells[idx] || '').trim() })
    if (!obj.name) continue
    rows.push({
      id: cryptoId(), name: obj.name, category: guessCategory(obj.category),
      contactName: obj.contactName || '', phone: obj.phone || '', email: obj.email || '',
      deliverable: obj.deliverable || 'Coordinate details', daysBefore: clampInt(obj.daysBefore, 14),
      price: clampInt(obj.price, 0), status: 'pending',
    })
  }
  return rows
}
function splitCsvLine(line) {
  const out = []; let cur = ''; let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++ } else inQ = !inQ }
    else if (c === ',' && !inQ) { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur); return out
}
function clampInt(v, fallback) {
  const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10)
  return Number.isFinite(n) ? n : fallback
}
export function cryptoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Math.abs(Math.sin(Date.now() * Math.random()) * 1e9).toFixed(0)
}
export const CSV_TEMPLATE =
  'name,category,contact,phone,email,deliverable,days before,price\n' +
  'Mountain Estate,venue,Rina,03-7654321,rina@estate.com,Sign contract & deposit,90,72000\n' +
  'Field Chef Co.,catering,Ethan,052-1234567,ethan@chef.com,Finalize 3-day menu,14,38000\n' +
  'Dana — Facilitator,facilitator,Dana Levi,054-9876543,dana@flow.com,Approve session schedule,21,9000'

// ── clean start: no demo data, the producer fills everything in ────────────
export function newRetreat() {
  return {
    id: cryptoId(),
    name: '', startDate: '', endDate: '', location: '', concept: '', audience: '', target: '', budget: '',
    vendors: [], participants: [], agenda: [], taskDone: {}, issues: [], feedback: [], senderName: '',
    ratings: {}, content: [], closing: {}, surveySent: false,
    createdAt: '',
  }
}

// derive the to-do list from vendors (each deliverable becomes a dated task) + staples
export function deriveTasks(vendors, retreat) {
  if (!retreat.startDate && vendors.length === 0) return []
  const fromVendors = vendors.map((v) => ({
    id: 'task-' + v.id,
    title: `${v.deliverable} — ${v.name}`,
    daysBefore: v.daysBefore,
    source: 'vendor',
    done: v.status === 'done',
  }))
  const staples = [
    { id: 'tk-rooming', title: 'Assign rooming list', daysBefore: 7, source: 'auto', done: false },
    { id: 'tk-remind', title: 'Send reminder + packing list to guests', daysBefore: 5, source: 'auto', done: false },
    { id: 'tk-kits', title: 'Prepare welcome kits', daysBefore: 3, source: 'auto', done: false },
    { id: 'tk-brief', title: 'Brief the production team', daysBefore: 1, source: 'auto', done: false },
  ]
  return [...fromVendors, ...staples]
    .map((t) => ({ ...t, deadline: deadlineFor(retreat.startDate, t.daysBefore) }))
    .sort((a, b) => b.daysBefore - a.daysBefore)
}

// ──────────────────────────────────────────────────────────────────────────
//  AI DRAFT GENERATOR (frontend stand-in; same signature as a real /api call)
//  Every draft references the real stored data: vendor, contact, deliverable,
//  computed deadline, and the retreat. Tone adapts to accumulated feedback.
// ──────────────────────────────────────────────────────────────────────────
export function generateDraft(vendor, retreat, channel, prefs) {
  const deadline = deadlineFor(retreat.startDate, vendor.daysBefore)
  const left = daysBetween(prefs.today || toISO(new Date()), deadline)
  const cd = fmtCountdown(left)
  const tone = prefs.tone || 'warm'
  const me = prefs.senderName || 'Rotem'
  const greet = vendor.contactName ? vendor.contactName.split(' ')[0] : vendor.name
  const dl = fmtDate(deadline)
  const ev = fmtRange(retreat.startDate, retreat.endDate)
  const name = retreat.name || 'the retreat'
  const lines = []

  if (tone === 'short') lines.push(`Hi ${greet},`)
  else if (tone === 'formal') lines.push(`Dear ${greet},`)
  else lines.push(`Hi ${greet}! 👋`)

  if (tone === 'short') {
    lines.push(`Reminder: "${vendor.deliverable}" is due ${dl} (${cd.text}). All set? Thanks!`)
  } else if (tone === 'formal') {
    lines.push(`I wanted to confirm we're on track for ${name} (${ev}).`)
    lines.push(`The deliverable "${vendor.deliverable}" is due by ${dl} (${cd.text}). I'd appreciate a status update.`)
    if (vendor.price) lines.push(`As a reminder, the agreed amount is ${money(vendor.price)}.`)
  } else {
    lines.push(`Just making sure we're aligned for ${name} (${ev}) 🌿`)
    lines.push(`We'd love to wrap up "${vendor.deliverable}" by ${dl} — that's ${cd.text}.`)
    lines.push(`Anything you need from us to move forward?`)
  }
  if (tone !== 'short') lines.push(tone === 'formal' ? `Best,\n${me}` : `Thanks so much,\n${me} 🙏`)
  return lines.join('\n')
}

export function tonePreference(feedback) {
  const score = { warm: 0, short: 0, formal: 0 }
  feedback.forEach((f) => { score[f.tone] = (score[f.tone] || 0) + (f.vote === 'up' ? 1 : -1) })
  let best = 'warm', max = -Infinity
  for (const t of Object.keys(score)) if (score[t] > max) { max = score[t]; best = t }
  return max > 0 ? best : 'warm'
}

// ──────────────────────────────────────────────────────────────────────────
//  FEEDBACK SUMMARIZER (frontend stand-in for an LLM /api/summarize call).
//  Groups the open-text guest responses into themes + an NPS read, all from
//  the real entered data. Same signature a real summarizer would expose.
// ──────────────────────────────────────────────────────────────────────────
const STOPWORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'was', 'were', 'is', 'are', 'be', 'to', 'of', 'in', 'on', 'for', 'it', 'we', 'i', 'they', 'with', 'at', 'so', 'very', 'really', 'too', 'more', 'all', 'my', 'our', 'your', 'that', 'this', 'had', 'have', 'has', 'would', 'could', 'about', 'just', 'not', 'no', 'as', 'me', 'us', 'them', 'than', 'then', 'there', 'their', 'been', 'much', 'some', 'lot'])
function topThemes(texts, n = 4) {
  const freq = {}
  texts.filter(Boolean).forEach((t) => {
    String(t).toLowerCase().split(/[^a-z']+/).forEach((w) => {
      if (w.length < 3 || STOPWORDS.has(w)) return
      freq[w] = (freq[w] || 0) + 1
    })
  })
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map(([word, count]) => ({ word, count }))
}

export function summarizeFeedback(responses = []) {
  const count = responses.length
  if (!count) return null
  const nps = responses.map((r) => Number(r.nps)).filter((n) => Number.isFinite(n))
  const promoters = nps.filter((n) => n >= 9).length
  const detractors = nps.filter((n) => n <= 6).length
  const npsScore = nps.length ? Math.round((promoters - detractors) / nps.length * 100) : null
  const avgNps = nps.length ? (nps.reduce((s, n) => s + n, 0) / nps.length).toFixed(1) : null
  const loved = topThemes(responses.map((r) => r.loved))
  const improve = topThemes(responses.map((r) => r.improve))

  let recommendation
  if (npsScore == null) recommendation = 'Add NPS scores to responses to gauge overall sentiment.'
  else if (npsScore >= 50) recommendation = `Strong NPS of ${npsScore}. ${loved[0] ? `Guests loved “${loved[0].word}” — lean into it next time.` : 'Keep the formula.'}`
  else if (npsScore >= 0) recommendation = `Mixed NPS of ${npsScore}. ${improve[0] ? `Prioritize fixing “${improve[0].word}” for next retreat.` : 'Gather more detail on what to improve.'}`
  else recommendation = `Low NPS of ${npsScore}. ${improve[0] ? `“${improve[0].word}” came up most — address it before re-booking vendors.` : 'Dig into the open feedback before the next retreat.'}`

  return { count, npsScore, avgNps, promoters, detractors, loved, improve, recommendation }
}

// Cross-retreat learning: aggregate past retreats + explicit accept/reject
// signals (planningMemory) into a profile that biases the planner next time.
export function learnedPlanningProfile(retreats = [], planningMemory = {}) {
  const past = (retreats || []).filter((r) => (r.vendors?.length || r.startDate))
  const catCount = {}
  const vendorCount = {}
  let budgetSum = 0, budgetN = 0, targetSum = 0, targetN = 0, nightsSum = 0, nightsN = 0
  past.forEach((r) => {
    (r.vendors || []).forEach((v) => {
      catCount[v.category] = (catCount[v.category] || 0) + 1
      const key = v.name?.trim().toLowerCase()
      if (key) {
        vendorCount[key] = vendorCount[key] || { name: v.name, category: v.category, count: 0 }
        vendorCount[key].count++
      }
    })
    if (r.budget) { budgetSum += Number(r.budget) || 0; budgetN++ }
    if (r.target) { targetSum += Number(r.target) || 0; targetN++ }
    if (r.startDate && r.endDate) { const n = daysBetween(r.startDate, r.endDate); if (n != null && n >= 0) { nightsSum += n; nightsN++ } }
  })
  // blend explicit accept signals
  const accepted = planningMemory?.acceptedByCategory || {}
  Object.entries(accepted).forEach(([cat, n]) => { catCount[cat] = (catCount[cat] || 0) + n })

  // Per-category bias the planner applies to its budget weights next time:
  // (1) accepted vendor suggestions nudge that category up; (2) revealed
  // preference — where past retreats actually spent vs. an even split.
  const biasByCategory = {}
  const bump = (cat, by) => { biasByCategory[cat] = (biasByCategory[cat] ?? 1) + by }
  Object.entries(accepted).forEach(([cat, n]) => bump(cat, Math.min(0.25, n * 0.05)))
  const spendCat = {}
  let grand = 0
  past.forEach((r) => (r.vendors || []).forEach((v) => {
    const p = Number(v.price) || 0; spendCat[v.category] = (spendCat[v.category] || 0) + p; grand += p
  }))
  if (grand > 0) {
    const even = 1 / Math.max(1, Object.keys(spendCat).length)
    Object.entries(spendCat).forEach(([cat, sum]) => bump(cat, Math.max(-0.15, Math.min(0.15, (sum / grand - even) * 0.4))))
  }

  return {
    retreatCount: past.length,
    topCategories: Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([k]) => k),
    commonVendors: Object.values(vendorCount).sort((a, b) => b.count - a.count).slice(0, 8),
    avgBudget: budgetN ? Math.round(budgetSum / budgetN) : null,
    avgTarget: targetN ? Math.round(targetSum / targetN) : null,
    avgNights: nightsN ? Math.round(nightsSum / nightsN) : null,
    signals: planningMemory?.signals || 0,
    biasByCategory,
  }
}

// ──────────────────────────────────────────────────────────────────────────
//  SMART PLANNER (frontend stand-in; same signature as a real /api/plan call)
//  planRetreat() reads the stored retreat (budget, dates, concept, audience,
//  headcount) and returns a budget split, vendor suggestions, a concept-aware
//  agenda, open decisions, and copilot insights — all referencing real data.
//  A `learningProfile` (aggregated from past retreats + accept/reject signals)
//  biases the defaults so the planner gets smarter with usage.
// ──────────────────────────────────────────────────────────────────────────

// Each profile carries: budget weights per category (sum ≈ 1), recommended
// vendors (category + default daysBefore + budget share + why), and agenda
// templates keyed by day-role (arrival / middle / closing).
export const CONCEPT_PROFILES = {
  wellness: {
    key: 'wellness', label: 'Wellness retreat', iconName: 'Flower2',
    keywords: ['yoga', 'wellness', 'meditation', 'mindful', 'nature', 'healing', 'spa', 'breath', 'reset', 'detox', 'silence'],
    weights: { venue: 0.34, catering: 0.28, facilitator: 0.16, transport: 0.08, photo: 0.05, av: 0.03, design: 0.03, other: 0.03 },
    recommend: [
      { category: 'venue', daysBefore: 90, share: 0.34, deliverable: 'Sign contract & pay deposit', why: 'A calm nature venue books out months ahead — lock dates first.' },
      { category: 'catering', daysBefore: 21, share: 0.28, deliverable: 'Finalize plant-forward menu', why: 'Wellness crowds expect fresh, dietary-friendly food — confirm the menu early.' },
      { category: 'facilitator', daysBefore: 30, share: 0.16, deliverable: 'Confirm sessions & schedule', why: 'Yoga / breathwork leads anchor the whole agenda.' },
      { category: 'transport', daysBefore: 14, share: 0.08, deliverable: 'Arrange shuttle from the city', why: 'Remote venues need a group shuttle so guests arrive together.' },
    ],
    day: {
      arrival: [
        { t: '15:00', label: 'Check-in & herbal welcome', kind: 'logistics' },
        { t: '17:00', label: 'Opening circle & intentions', kind: 'session' },
        { t: '18:30', label: 'Gentle evening yoga', kind: 'session' },
        { t: '19:30', label: 'Welcome dinner', kind: 'meal' },
      ],
      middle: [
        { t: '07:00', label: 'Sunrise yoga', kind: 'session' },
        { t: '08:30', label: 'Breakfast', kind: 'meal' },
        { t: '10:00', label: 'Workshop / breathwork', kind: 'session' },
        { t: '13:00', label: 'Lunch + free time', kind: 'meal' },
        { t: '16:00', label: 'Nature walk', kind: 'activity' },
        { t: '18:00', label: 'Meditation', kind: 'session' },
        { t: '19:30', label: 'Dinner', kind: 'meal' },
      ],
      closing: [
        { t: '07:30', label: 'Closing meditation', kind: 'session' },
        { t: '09:00', label: 'Breakfast', kind: 'meal' },
        { t: '10:30', label: 'Integration circle', kind: 'session' },
        { t: '11:30', label: 'Check-out', kind: 'logistics' },
      ],
    },
  },
  corporate: {
    key: 'corporate', label: 'Corporate offsite', iconName: 'Building2',
    keywords: ['corporate', 'offsite', 'founders', 'startup', 'team', 'company', 'leadership', 'strategy', 'kickoff', 'work', 'execs', 'sales', 'sprint'],
    weights: { venue: 0.30, catering: 0.24, facilitator: 0.14, av: 0.10, transport: 0.08, design: 0.06, photo: 0.05, other: 0.03 },
    recommend: [
      { category: 'venue', daysBefore: 75, share: 0.30, deliverable: 'Book venue + meeting rooms', why: 'You need reliable rooms with proper space for working sessions.' },
      { category: 'catering', daysBefore: 18, share: 0.24, deliverable: 'Confirm meals & coffee breaks', why: 'Productive offsites run on good food and steady caffeine.' },
      { category: 'av', daysBefore: 14, share: 0.10, deliverable: 'Set up screens, mics & wifi', why: 'Presentations and hybrid dial-ins fall apart without solid A/V.' },
      { category: 'facilitator', daysBefore: 21, share: 0.14, deliverable: 'Brief facilitator on agenda', why: 'A neutral facilitator keeps strategy sessions on track.' },
    ],
    day: {
      arrival: [
        { t: '14:00', label: 'Arrival & check-in', kind: 'logistics' },
        { t: '16:00', label: 'Kickoff & goals', kind: 'session' },
        { t: '18:00', label: 'Team activity', kind: 'activity' },
        { t: '19:30', label: 'Welcome dinner', kind: 'meal' },
      ],
      middle: [
        { t: '08:00', label: 'Breakfast', kind: 'meal' },
        { t: '09:00', label: 'Strategy workshop', kind: 'session' },
        { t: '11:00', label: 'Breakout sessions', kind: 'session' },
        { t: '13:00', label: 'Lunch', kind: 'meal' },
        { t: '14:30', label: 'Working sprints', kind: 'session' },
        { t: '17:00', label: 'Team-building activity', kind: 'activity' },
        { t: '19:30', label: 'Dinner', kind: 'meal' },
      ],
      closing: [
        { t: '08:00', label: 'Breakfast', kind: 'meal' },
        { t: '09:00', label: 'Decisions & next steps', kind: 'session' },
        { t: '10:30', label: 'Wrap-up & commitments', kind: 'session' },
        { t: '11:30', label: 'Check-out', kind: 'logistics' },
      ],
    },
  },
  celebration: {
    key: 'celebration', label: 'Celebration', iconName: 'Sparkles',
    keywords: ['wedding', 'bar mitzvah', 'bat mitzvah', 'anniversary', 'birthday', 'family', 'celebration', 'party', 'gala', 'reunion'],
    weights: { venue: 0.30, catering: 0.30, photo: 0.12, design: 0.10, av: 0.07, transport: 0.05, facilitator: 0.03, other: 0.03 },
    recommend: [
      { category: 'venue', daysBefore: 120, share: 0.30, deliverable: 'Reserve venue & sign contract', why: 'Celebration venues book a season ahead — secure the date early.' },
      { category: 'catering', daysBefore: 30, share: 0.30, deliverable: 'Finalize menu & headcount', why: 'Food is half the experience — lock the menu and final numbers.' },
      { category: 'photo', daysBefore: 45, share: 0.12, deliverable: 'Book photographer & shot list', why: 'Great photographers get booked fast for celebrations.' },
      { category: 'design', daysBefore: 30, share: 0.10, deliverable: 'Approve décor & flowers', why: 'Décor and flowers set the mood — approve the look in advance.' },
    ],
    day: {
      arrival: [
        { t: '16:00', label: 'Guest arrival & welcome', kind: 'logistics' },
        { t: '17:00', label: 'Reception & drinks', kind: 'activity' },
        { t: '19:00', label: 'Dinner & toasts', kind: 'meal' },
        { t: '21:00', label: 'Music & dancing', kind: 'activity' },
      ],
      middle: [
        { t: '09:00', label: 'Brunch', kind: 'meal' },
        { t: '11:00', label: 'Group activity', kind: 'activity' },
        { t: '13:00', label: 'Lunch', kind: 'meal' },
        { t: '16:00', label: 'Free time', kind: 'activity' },
        { t: '19:00', label: 'Celebration dinner', kind: 'meal' },
        { t: '21:00', label: 'Party', kind: 'activity' },
      ],
      closing: [
        { t: '10:00', label: 'Farewell brunch', kind: 'meal' },
        { t: '11:30', label: 'Group photo', kind: 'activity' },
        { t: '12:30', label: 'Check-out & goodbyes', kind: 'logistics' },
      ],
    },
  },
  adventure: {
    key: 'adventure', label: 'Adventure trip', iconName: 'Footprints',
    keywords: ['hiking', 'adventure', 'outdoor', 'trek', 'sport', 'ski', 'surf', 'camping', 'climb', 'desert', 'expedition', 'active'],
    weights: { venue: 0.26, catering: 0.22, facilitator: 0.16, transport: 0.16, photo: 0.07, other: 0.05, av: 0.04, design: 0.04 },
    recommend: [
      { category: 'venue', daysBefore: 75, share: 0.26, deliverable: 'Book lodging near the trails', why: 'Base camps near the action sell out in peak season.' },
      { category: 'transport', daysBefore: 21, share: 0.16, deliverable: 'Arrange 4x4 / shuttle logistics', why: 'Reaching trailheads and remote sites needs reliable transport.' },
      { category: 'facilitator', daysBefore: 30, share: 0.16, deliverable: 'Confirm certified guides', why: 'Safety on active routes depends on licensed guides.' },
      { category: 'catering', daysBefore: 14, share: 0.22, deliverable: 'Plan trail meals & energy food', why: 'Active days burn energy — plan hearty, portable meals.' },
    ],
    day: {
      arrival: [
        { t: '15:00', label: 'Arrival & gear check', kind: 'logistics' },
        { t: '17:00', label: 'Route briefing', kind: 'session' },
        { t: '19:00', label: 'Dinner', kind: 'meal' },
      ],
      middle: [
        { t: '06:30', label: 'Breakfast', kind: 'meal' },
        { t: '07:30', label: 'Trail / main activity', kind: 'activity' },
        { t: '13:00', label: 'Packed lunch on route', kind: 'meal' },
        { t: '16:00', label: 'Return & rest', kind: 'logistics' },
        { t: '19:30', label: 'Dinner & stories', kind: 'meal' },
      ],
      closing: [
        { t: '07:00', label: 'Breakfast', kind: 'meal' },
        { t: '08:30', label: 'Final short hike', kind: 'activity' },
        { t: '11:00', label: 'Pack up & check-out', kind: 'logistics' },
      ],
    },
  },
  default: {
    key: 'default', label: 'General retreat', iconName: 'Compass',
    keywords: [],
    weights: { venue: 0.32, catering: 0.26, facilitator: 0.12, transport: 0.10, photo: 0.06, av: 0.05, design: 0.05, other: 0.04 },
    recommend: [
      { category: 'venue', daysBefore: 90, share: 0.32, deliverable: 'Sign contract & pay deposit', why: 'The venue anchors everything — confirm it first.' },
      { category: 'catering', daysBefore: 21, share: 0.26, deliverable: 'Finalize menu', why: 'Food shapes the whole experience — lock it in early.' },
      { category: 'facilitator', daysBefore: 30, share: 0.12, deliverable: 'Confirm program & schedule', why: 'Your program leads define the days.' },
      { category: 'transport', daysBefore: 14, share: 0.10, deliverable: 'Arrange group transport', why: 'Getting everyone there together avoids day-one chaos.' },
    ],
    day: {
      arrival: [
        { t: '15:00', label: 'Check-in & welcome', kind: 'logistics' },
        { t: '17:00', label: 'Opening session', kind: 'session' },
        { t: '19:30', label: 'Welcome dinner', kind: 'meal' },
      ],
      middle: [
        { t: '08:00', label: 'Morning session', kind: 'session' },
        { t: '09:30', label: 'Breakfast', kind: 'meal' },
        { t: '11:00', label: 'Workshop', kind: 'session' },
        { t: '13:00', label: 'Lunch + free time', kind: 'meal' },
        { t: '17:00', label: 'Activity', kind: 'activity' },
        { t: '20:00', label: 'Dinner', kind: 'meal' },
      ],
      closing: [
        { t: '08:00', label: 'Closing session', kind: 'session' },
        { t: '09:30', label: 'Breakfast', kind: 'meal' },
        { t: '11:30', label: 'Check-out', kind: 'logistics' },
      ],
    },
  },
}

// Scan concept + audience + name for profile keywords. Returns the best match
// with a rough confidence; falls back to `default` when nothing matches.
export function detectProfile(retreat) {
  const hay = `${retreat.concept || ''} ${retreat.audience || ''} ${retreat.name || ''}`.toLowerCase()
  let best = CONCEPT_PROFILES.default, hits = 0
  for (const p of Object.values(CONCEPT_PROFILES)) {
    if (p.key === 'default') continue
    const n = p.keywords.reduce((acc, k) => acc + (hay.includes(k) ? 1 : 0), 0)
    if (n > hits) { hits = n; best = p }
  }
  return { key: best.key, profile: best, confidence: hits === 0 ? 'low' : hits === 1 ? 'medium' : 'high' }
}

// Merge the base profile weights with learned bias (per-category multipliers),
// then renormalize so the split always sums to 1.
function mergeWeights(base, bias) {
  const out = {}
  let sum = 0
  for (const k of Object.keys(base)) {
    out[k] = base[k] * (bias?.[k] ?? 1)
    sum += out[k]
  }
  for (const k of Object.keys(out)) out[k] = sum > 0 ? out[k] / sum : base[k]
  return out
}

// The main seam. Pure: same retreat + profile → same plan.
export function planRetreat(retreat, learningProfile = {}) {
  const det = detectProfile(retreat)
  const profile = det.profile
  const weights = mergeWeights(profile.weights, learningProfile.biasByCategory)
  const total = Number(retreat.budget) || 0
  const heads = Number(retreat.target) || 0
  const nights = Math.max(0, daysBetween(retreat.startDate, retreat.endDate) || 0)

  // — budget split —
  const budget = Object.keys(weights)
    .map((catKey) => {
      const cat = catById(catKey)
      const pct = Math.round(weights[catKey] * 100)
      const amount = Math.round(total * weights[catKey])
      const perPerson = heads > 0 ? Math.round(amount / heads) : null
      let tone = 'stone', note = ''
      if (total > 0 && heads > 0) {
        if (catKey === 'catering' && perPerson < 45 * Math.max(1, nights)) {
          tone = 'amber'; note = `~${money(perPerson)}/person looks tight for ${nights || 1} night(s).`
        } else if (catKey === 'venue' && perPerson < 120) {
          tone = 'amber'; note = `~${money(perPerson)}/person is lean for lodging.`
        }
      }
      return { catKey, label: cat.label, color: cat.color, pct, amount, perPerson, tone, note }
    })
    .filter((r) => r.pct > 0)
    .sort((a, b) => b.amount - a.amount)

  // — vendor suggestions (skip categories already covered) —
  const have = new Set((retreat.vendors || []).map((v) => v.category))
  const vendorSuggestions = profile.recommend
    .filter((r) => !have.has(r.category))
    .map((r) => ({
      id: 'sug-' + r.category,
      category: r.category,
      label: catById(r.category).label,
      deliverable: r.deliverable,
      daysBefore: r.daysBefore,
      estPrice: total > 0 ? Math.round(total * r.share) : 0,
      why: r.why,
    }))

  // — concept-aware agenda —
  const totalDays = nights > 0 ? nights + 1 : 3
  const agenda = Array.from({ length: totalDays }, (_, i) => {
    const n = i + 1
    const role = i === 0 ? 'arrival' : i === totalDays - 1 ? 'closing' : 'middle'
    const titleByRole = {
      arrival: `Day ${n} · Arrival & opening`,
      middle: `Day ${n} · ${profile.label.replace(' retreat', '').replace(' offsite', '')} core`,
      closing: `Day ${n} · Closing & farewell`,
    }
    return { day: n, title: titleByRole[role], blocks: profile.day[role].map((b) => ({ ...b })) }
  })

  // — open decisions (computed from real state) —
  const openDecisions = [
    { id: 'd-dates', label: 'Set the retreat dates', done: !!retreat.startDate && !!retreat.endDate, hint: 'Dates drive every deadline.', jumpTo: null },
    { id: 'd-budget', label: 'Set a total budget', done: total > 0, hint: 'Unlocks the budget breakdown.', jumpTo: null },
    { id: 'd-heads', label: 'Set target participants', done: heads > 0, hint: 'Used for per-person costs.', jumpTo: null },
    { id: 'd-concept', label: 'Define the concept', done: !!(retreat.concept || '').trim(), hint: 'Lets the planner tailor everything.', jumpTo: null },
    { id: 'd-agenda', label: 'Build the agenda', done: (retreat.agenda || []).length > 0, hint: 'Draft the daily flow.', jumpTo: null },
    { id: 'd-venue', label: 'Add the venue / lodging', done: have.has('venue'), hint: 'The first and biggest booking.', jumpTo: 'vendors' },
    { id: 'd-catering', label: 'Add catering', done: have.has('catering'), hint: 'Lock the menu and numbers.', jumpTo: 'vendors' },
  ]

  // — copilot insights referencing the real numbers —
  const insights = []
  if (det.key !== 'default') insights.push(`This reads like a ${profile.label.toLowerCase()} — I've tailored the budget, agenda and vendor list to match.`)
  else insights.push(`Add a concept (e.g. "yoga", "offsite", "wedding") and I'll tailor the whole plan to it.`)
  if (total > 0 && heads > 0) insights.push(`That's about ${money(Math.round(total / heads))} per person across ${heads} guests.`)
  const tight = budget.find((b) => b.tone === 'amber')
  if (tight) insights.push(`Heads up: ${tight.label} ${tight.note}`)
  if (vendorSuggestions.length) insights.push(`You're missing ${vendorSuggestions.length} key vendor${vendorSuggestions.length > 1 ? 's' : ''} — I've suggested ${vendorSuggestions.map((v) => v.label.toLowerCase()).slice(0, 3).join(', ')}.`)
  const remaining = openDecisions.filter((d) => !d.done).length
  if (remaining) insights.push(`${remaining} decision${remaining > 1 ? 's' : ''} still open — see the checklist below.`)

  return { profileKey: det.key, profileLabel: profile.label, confidence: det.confidence, budget, vendorSuggestions, agenda, openDecisions, insights }
}
