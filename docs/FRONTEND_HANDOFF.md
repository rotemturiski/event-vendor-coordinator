# Retreat OS — Frontend Handoff (UI + Design System)

> Purpose: give a backend developer everything needed to **port this app's UI and
> visual design into another React + Tailwind app** (which currently uses a
> different design). This document covers the **design system, component library,
> and screen-by-screen UI/UX**. It does **not** define a database schema or REST
> API contract — see "Out of scope" at the end for the suggested follow-up.

---

## 1. Overview & stack

| Thing | Value |
|---|---|
| Framework | React 18 (`react`, `react-dom` ^18.3.1) |
| Build tool | Vite 6 (`vite` ^6) + `@vitejs/plugin-react` |
| CSS | **Tailwind CSS v4**, CSS-first via the `@tailwindcss/vite` plugin — **there is no `tailwind.config.js`**. All theming lives in `src/index.css` inside an `@theme {}` block. |
| Icons | `lucide-react` |
| Font | **Inter** (Google Fonts, weights 400–900) |
| Language / dir | English, `lang="en"`, `dir="ltr"` |
| State | Plain React `useState` in `App.jsx`, persisted to `localStorage`. No router library, no Redux. |

### Install the same toolchain
```bash
npm i react react-dom lucide-react
npm i -D vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
```

`vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({ plugins: [react(), tailwindcss()] })
```

`index.html` `<head>` essentials:
```html
<html lang="en" dir="ltr">
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
```
Favicon is an inline Lucide "sprout" SVG with stroke `#5C6F57`.

The CSS entry (`src/index.css`) begins with `@import "tailwindcss";` followed by the `@theme` block in §2 and the global/motion CSS in §3.

> **Design philosophy:** calm, minimal "wellness" aesthetic. **Sage green** is the
> brand/primary; **warm sand/beige** is the neutral. Accents are kept
> near-monochrome: only a muted **clay** (warnings) and **dusty rose** (errors)
> beyond sage + sand.

---

## 2. Design tokens (`@theme` in `src/index.css`)

The whole palette is implemented by **overriding Tailwind's stock color ramps**, so
every utility class (`bg-emerald-700`, `text-stone-500`, `ring-amber-200`, …)
renders in the wellness palette **without changing any component class names**.
Paste this block verbatim into your `@theme {}`.

### 2.1 `emerald` → SAGE GREEN (brand / primary)
| Step | Hex | Common use |
|---|---|---|
| 50 | `#F3F6F1` | tints, chip bg, gradient start |
| 100 | `#E7EDE3` | light sage surfaces, sidebar bg |
| 200 | `#D2DDCC` | rings on sage surfaces |
| 300 | `#B7C4B2` | borders |
| 400 | `#A8BBA2` | — |
| 500 | `#8FA58B` | progress fills |
| 600 | `#74896F` | icon accents |
| **700** | **`#5C6F57`** | **primary buttons, headings, active icon tiles** |
| 800 | `#45533F` | primary hover, dark sage text |
| 900 | `#333F2F` | sidebar text |
| 950 | `#212A1E` | darkest |

### 2.2 `stone` → SAND / BEIGE (neutral)
| Step | Hex | Common use |
|---|---|---|
| 50 | `#FAF7F1` | — |
| 100 | `#F2ECE0` | chip bg, light fills (= app bg) |
| 200 | `#E8DFD3` | **default border / ring everywhere** |
| 300 | `#D8CBB8` | dividers |
| 400 | `#B7A98F` | **faint labels / meta text** |
| 500 | `#8F8167` | **muted body subtext** |
| 600 | `#6E614C` | — |
| 700 | `#564B3A` | — |
| 800 | `#41382B` | **ink / headings** |
| 900 | `#302921` | — |
| 950 | `#1F1A14` | — |

### 2.3 `amber` → CLAY (warnings, pending, deposit, meal, "soon")
50 `#F7F0E6` · 100 `#EFE2D0` · 200 `#E2CBAE` · 300 `#D2AE86` · 400 `#C29568` · 500 `#B07E4F` · 600 `#966743` · 700 `#7B5438` · 800 `#5F4230` · 900 `#4A3427` · 950 `#2A1D16`

### 2.4 `rose` → DUSTY ROSE (overdue, danger, unpaid)
50 `#F6ECEC` · 100 `#ECD8D8` · 200 `#DEBFBF` · 300 `#CC9E9E` · 400 `#B97E7E` · 500 `#A66363` · 600 `#8E5050` · 700 `#774040` · 800 `#5C3232` · 900 `#472828` · 950 `#281616`

### 2.5 Monochrome folds (reduce hue variety)
The remaining default hues are aliased so any leftover usage stays on-palette:
- `violet-*` → `stone-*` (sand)
- `sky-*` → `stone-*` (sand)
- `teal-*` → `emerald-*` (sage)
- `orange-*` → `amber-*` (clay)

```css
--color-violet-500: var(--color-stone-500);  /* …all 50–950 */
--color-sky-500:    var(--color-stone-500);
--color-teal-500:   var(--color-emerald-500);
--color-orange-500: var(--color-amber-500);
```

### 2.6 Semantic aliases, shadows, type scale
```css
--color-sand: #F2ECE0;                 /* app background */
--color-ink:   var(--color-stone-800); /* headings  #41382B */
--color-muted: var(--color-stone-500); /* subtext   #8F8167 */
--color-faint: var(--color-stone-400); /* labels    #B7A98F */
--color-brand-700: var(--color-emerald-700); /* primary action; brand-50/100/500/800/950 also aliased */

--shadow-card: 0 1px 2px rgba(41,37,36,.04), 0 8px 24px -12px rgba(41,37,36,.10);
--shadow-rail: 4px 0 24px -12px rgba(41,37,36,.18);  /* sidebar right edge */

--text-h1: 1.875rem;   /* 30px — page titles */
--text-h2: 1.0625rem;  /* 17px — section titles */
```
Global: `font-family: 'Inter', system-ui, sans-serif; letter-spacing: -0.011em;`
Body: `background: var(--color-sand); color: var(--color-stone-800);`

### 2.7 "One rule per concern" conventions (follow these everywhere)
| Concern | Rule |
|---|---|
| Card radius | `rounded-2xl` |
| Control radius (inputs, selects, buttons, chip-buttons) | `rounded-lg` |
| Pills / badges / avatars | `rounded-full`; tiny inner controls `rounded-md` |
| Heading weight | `font-semibold` (never `font-black`/`extrabold`) |
| Names / titles | `font-semibold`; emphasized rows `font-medium` |
| Label size | `text-xs` (no `text-[11px]`/`[10px]`) |
| Ring on light surfaces | `ring-1 ring-stone-200` |
| Shadow | the shared `.card` shadow only |
| Lucide stroke | `1.75`, set once in the `Icon` wrapper |

---

## 3. Global & motion CSS (paste after `@theme`)
```css
:root { font-family: 'Inter', system-ui, -apple-system, sans-serif; letter-spacing: -0.011em; }
* { -webkit-tap-highlight-color: transparent; }
body { margin: 0; background: var(--color-sand); min-height: 100vh; color: var(--color-stone-800); }

.card { box-shadow: var(--shadow-card); }

/* thin warm scrollbar — add class "nice-scroll" to scroll containers */
.nice-scroll { scrollbar-width: thin; scrollbar-color: #CFC6B8 transparent; }
.nice-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
.nice-scroll::-webkit-scrollbar-thumb { background: #CFC6B8; border-radius: 9999px; }
.nice-scroll::-webkit-scrollbar-track { background: transparent; }

@keyframes fade-up { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
.fade-up { animation: fade-up .4s cubic-bezier(.22,1,.36,1) both; }

@keyframes fade-in { from { opacity:0; } to { opacity:1; } }
.fade-in { animation: fade-in .5s ease both; }

/* checkbox / toggle confirm pop — used on the Check icon when an item flips done */
@keyframes pop-check { 0% { transform: scale(.6); opacity:0; } 60% { transform: scale(1.12); } 100% { transform: scale(1); opacity:1; } }
.pop-check { animation: pop-check .28s cubic-bezier(.34,1.56,.64,1) both; }

/* loading skeleton — apply to gray bars while AI/data loads */
@keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
.shimmer { background: linear-gradient(90deg,#ECE6DA 0%,#F4EFE6 50%,#ECE6DA 100%); background-size:800px 100%; animation: shimmer 1.2s infinite linear; }

@media (prefers-reduced-motion: reduce) {
  .fade-up, .fade-in, .pop-check, .shimmer { animation: none !important; }
  * { transition-duration: .01ms !important; }
}
```
Usage notes: add `fade-up` to cards/sections on mount (stagger lists with
`style={{ animationDelay: `${i*40}ms` }}`); `shimmer` to skeleton bars; `pop-check`
to the check icon when toggling done.

---

## 4. Icon system

Library: **`lucide-react`**. All icons go through one wrapper so size and stroke
are consistent. Icons are referenced **by string name** (data can carry an
`iconName`), resolved via an explicit map (keeps the bundle small + surfaces typos;
unknown name falls back to `Package`).

```jsx
import { /* …all used icons… */ Package } from 'lucide-react'
const ICONS = { /* name: Component, … */ }
const ICON_SIZE = { xs: 14, sm: 16, md: 18, lg: 20, xl: 24 }

export function Icon({ name, size = 'sm', className = '', strokeWidth = 1.75, ...rest }) {
  const Cmp = ICONS[name] || Package
  return <Cmp size={ICON_SIZE[size] || ICON_SIZE.sm} strokeWidth={strokeWidth} className={className} aria-hidden {...rest} />
}
```

**Icon names currently used** (put each in the `ICONS` map):
`Sprout, Compass, Handshake, Users, LayoutDashboard, Zap, Sparkles, Wand2, Brain,
Bell, CheckCircle2, Check, Wrench, DoorOpen, Calendar, CalendarDays, MapPin, Timer,
AlarmClock, User, Wallet, TrendingDown, UtensilsCrossed, Salad, Link2, Upload,
Download, MessageCircle, Mail, ThumbsUp, ThumbsDown, Star, Camera, Video, FileText,
CreditCard, Menu, X, Lightbulb, Inbox, Building2, HeartHandshake, Bus, Palette,
Package, Flower2, Footprints, Luggage, Loader2, Plus, PenLine, ClipboardList,
ChartNoAxesColumn, MessageSquare, FolderOpen, Receipt, ExternalLink, Send, Circle,
Plane, Search, ChevronUp, ChevronDown`

---

## 5. Component catalog (`src/components/ui.jsx`)

Every screen is built from these primitives. Class recipes are quoted verbatim —
copy `ui.jsx` directly, or recreate from these.

### Shared tone maps
```js
// Chip / Badge backgrounds (bg + text + ring)
CHIP_TONES = {
  stone:   'bg-stone-100 text-stone-600 ring-stone-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber:   'bg-amber-50 text-amber-700 ring-amber-200',
  rose:    'bg-rose-50 text-rose-700 ring-rose-200',
  orange:  'bg-orange-50 text-orange-700 ring-orange-200',
  violet:  'bg-violet-50 text-violet-700 ring-violet-200',
  sky:     'bg-sky-50 text-sky-700 ring-sky-200',
  teal:    'bg-teal-50 text-teal-700 ring-teal-200',
}
// Stat / category icon-tile backgrounds (bg + text, no ring)
TILE_TONES  = { stone:'bg-stone-100 text-stone-600', emerald:'bg-emerald-50 text-emerald-700', amber:'bg-amber-50 text-amber-700', rose:'bg-rose-50 text-rose-700', orange:'bg-orange-50 text-orange-700', violet:'bg-violet-50 text-violet-700', sky:'bg-sky-50 text-sky-700', teal:'bg-teal-50 text-teal-700' }
// Stat value text colors
VALUE_TONES = { stone:'text-stone-800', emerald:'text-emerald-700', amber:'text-amber-600', rose:'text-rose-600' }
```

### Chip / Badge — pills, status, tags, counts
Props: `{ tone='stone', icon, dot, children, as='span', className }`. `Badge` is an alias of `Chip`. Use `as="button"` for interactive cycle-chips (e.g. status toggles).
```jsx
<Tag className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 ring-1
  ${CHIP_TONES[tone]} ${as==='button' ? 'transition active:scale-[0.97]' : ''}`}>
  {dot && <span className={`size-2 rounded-full ${dot}`} />}
  {icon && <Icon name={icon} size="xs" />}
  {children}
</Tag>
```

### PageHeader — top of every stage
Props: `{ icon, title, subtitle, step, total, actions }`.
- Wrapper: `flex flex-wrap items-end justify-between gap-4 mb-6 fade-up`
- Icon tile: `size-10 shrink-0 grid place-items-center rounded-lg bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700` → `<Icon name size="lg" />`
- Step label (optional): `text-xs font-semibold text-emerald-700/70 tracking-wide mb-0.5` → "Step {step} of {total}"
- Title `h1`: `text-[length:var(--text-h1)] font-semibold text-stone-800 tracking-tight leading-tight`
- Subtitle: `text-stone-500 mt-1 text-sm`
- `actions` render on the right (usually a `Btn` or segmented control).

### Card — the universal container
Props: `{ children, className, pad=true, tone, ...rest }` (rest spreads to the div, e.g. `style`, `id`).
- Base: `rounded-2xl ring-1 card` + (`pad` ? `p-5` : ``)
- Default: `bg-white ring-stone-200`
- `tone="emerald"`: `bg-gradient-to-r from-emerald-50 to-white ring-emerald-200/70`
- `tone="violet"`: `bg-gradient-to-r from-violet-50/60 to-white ring-violet-200/60`

### SectionTitle — headings inside cards
Props: `{ icon, children, hint }`. Row `flex items-center justify-between mb-3`; `h2` `flex items-center gap-2 text-[length:var(--text-h2)] font-semibold text-stone-800` (icon `text-stone-400`); `hint` `text-xs text-stone-400` on the right.

### Btn
Props: `{ children, variant='primary', icon, loading, className, ...rest }`.
- Base: `inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-lg px-4 py-2.5 transition active:scale-[0.98] disabled:opacity-60`
- `primary`: `bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm`
- `soft`: `bg-emerald-50 text-emerald-800 hover:bg-emerald-100 ring-1 ring-emerald-200`
- `ghost`: `text-stone-600 hover:bg-stone-100 ring-1 ring-stone-200`
- `warm`: `bg-amber-500 text-white hover:bg-amber-600 shadow-sm`
- `loading` shows `<Icon name="Loader2" className="animate-spin" />` and disables; otherwise `icon` renders left of the label.

### Stat — KPI card
Props: `{ label, value, sub, icon, tone='stone', progress }`.
- Card: `bg-white rounded-2xl ring-1 ring-stone-200 card p-4`
- Top row: label `text-xs font-semibold text-stone-400 uppercase tracking-wide` + icon tile `size-7 grid place-items-center rounded-lg ${TILE_TONES[tone]}`
- Value: `mt-1.5 text-2xl font-semibold tabular-nums ${VALUE_TONES[tone]}`
- `sub`: `text-xs text-stone-400 mt-0.5`
- `progress` (0–100) → bar `mt-2 h-1 rounded-full bg-stone-100 overflow-hidden` with fill `h-full rounded-full bg-emerald-500 transition-[width] duration-500` and `style={{width:`${progress}%`}}`

### Empty — empty states
Props: `{ icon, children }`. Wrapper `text-center text-stone-400 text-sm py-12`; optional icon badge `inline-grid place-items-center size-12 rounded-2xl bg-stone-100 text-stone-400 mb-3` → `<Icon size="xl" />`.

### Label
`<div className="text-xs font-semibold text-stone-400 mb-1">`.

### Form controls — Input / Field / Textarea / Select / DateField
All share one field recipe (`FIELD`):
```
w-full text-sm bg-white rounded-lg px-3 py-2.5 ring-1 ring-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition
```
- `Input({ label, value, onChange, type='text', className, ...rest })` — `onChange` receives the **string value** (not the event). `Field` is an alias of `Input`.
- `Textarea({ label, value, onChange, rows=4, ... })` — adds `resize-none leading-relaxed`.
- `Select({ label, value, onChange, options, ... })` — `options: {value,label}[]`.
- `DateField({ label, value, onChange, min, ... })` — `type="date"`, ignores empty input.

---

## 6. App shell & navigation

### View router (`src/App.jsx`)
A single component switches between four top-level **views** (no router lib):
`landing → login → home → workspace`.
- State: `user` (`{name, email, planningMemory}` | null), `retreats` (array), `view`, `currentId`.
- Persistence: `localStorage` key **`retreatos.app.v1`** storing `{ user, retreats }` (view/currentId are transient).
- `createRetreat()` pushes a blank retreat and opens the workspace; `openRetreat(id)`, `deleteRetreat(id)`, `updateRetreat(id, updater)`.

### Workspace (`src/components/Workspace.jsx`)
The per-retreat shell = **Sidebar (left) + scrollable main (right)**. Layout:
`min-h-screen flex flex-col lg:flex-row`; main is `flex-1 min-w-0 h-screen overflow-y-auto nice-scroll` with content wrapped in `max-w-5xl mx-auto px-4 sm:px-8 py-7`. It holds a `stage` state and renders one stage component per `stage` key.

### Sidebar (`src/components/Sidebar.jsx`) — light-sage rail
- `aside`: `bg-emerald-100 text-emerald-900`, width `lg:w-72`, `lg:sticky lg:top-0 lg:h-screen`, plus `style={{boxShadow:'var(--shadow-rail)'}}`. On mobile it's a top bar + collapsible drawer (hamburger = `Menu` icon).
- **Brand**: emerald-700 tile with white `Sprout` icon + "Retreat OS".
- **Current-retreat card**: white card `ring-emerald-200` showing name, date range (`Calendar` icon), location (`MapPin`), and a clay "days to go" chip (`Timer`).
- **Phase navigation** — 3 phases; phases with sub-stages render a small uppercase header (`text-emerald-700/60`) and indent their children under a left border (`border-emerald-300/50`):
  - **Before**: Planning · Vendors · Participants · Agenda · Overview
  - **During**: (single stage)
  - **After**: Vendor reviews · Guest feedback · Content · Wrap-up
- **Nav item**: inactive `text-emerald-800 hover:bg-emerald-200/60` with white icon tile (`ring-emerald-200 text-emerald-700`); active `bg-white shadow-sm text-emerald-950` with emerald-700 white-icon tile. Sub-stages with measurable progress (vendors, participants, overview) show a `%` and a 2px track (`bg-emerald-900/10`, fill `bg-emerald-600`).
- Footer: "Back to all retreats" → `onExit()`.

The phase/stage structure is a data constant (`PHASES`) of `{ key, label, iconName, desc, sub? }`. Stage keys: `planning, vendors, participants, agenda, control, during, reviews, feedback, content, closing`.

---

## 7. Screen-by-screen UI/UX

All screens use the §5 primitives, the sage/sand palette, and `fade-up` on entry.

### Landing (`Landing.jsx`)
Marketing page. Top bar (Sprout brand + "Sign in"), centered hero (`Sparkles` "AI-powered" chip, large `font-semibold` headline with a sage accent line, subtext, primary "Get started — free →" button), then a 4-up feature grid (`Compass`, `Handshake`, `Users`, `LayoutDashboard`), each a white `rounded-2xl ring-stone-200 card` with an emerald icon tile. CTA → login (or home if already signed in).

### Login (`Login.jsx`)
Centered card (`max-w-sm`). Sprout tile, "Welcome back", **name + email** inputs (no password — demo auth), primary "Sign in". Submitting calls `onLogin({name, email})` (name falls back to "Retreat Producer"). "← Back" returns to landing.

### Home / "My retreats" (`Home.jsx`)
Sticky header (brand, "Hi, {name}", avatar initial, "Sign out"). Title row "My retreats" + "+ New retreat". Body is a 3-column responsive grid of retreat cards: a sage gradient banner (`from-emerald-500 to-emerald-700`) with the name + a "{n}d to go" pill, then date range (`Calendar`), location (`MapPin`), and two count chips (`Handshake` vendors, `Users` participants). Hover reveals "Open →" and "Delete". Empty state = a large dashed `Sprout` card "Create your first retreat".

### Stage: Planning (`stages/Planning.jsx`) — "Step 1 of 5"
Two-column canvas (`lg:grid-cols-[1fr_20rem]`). **Left:**
- **Retreat details** card — 8 fields: name, start/end (`DateField`), location, concept, audience, target, budget; below, a sage chip with the date range/nights and a clay `Lightbulb` chip ("changing dates auto-updates the timeline & deadlines").
- **Budget breakdown** card — only when budget > 0; a stacked horizontal bar + per-category rows (%, amount, per-person, optional clay warning note).
- **Suggested vendors** card — concept-tailored cards each with "Add" (adds vendor + records an accept signal) and dismiss.
- **Agenda** card — a short pointer to the dedicated Agenda step ("Open Agenda step →"); the actual builder lives in the Agenda stage.

**Right rail = "Maya", the AI manager** (a `tone="emerald"` card): a "Plan it for me" button (`Wand2`, brief `shimmer` "thinking", then seeds the agenda and jumps to the Agenda step) and live **insights** lines; below it an **Open decisions** checklist card with a progress bar (each item routes to the relevant field/stage).

### Stage: Vendors (`stages/Vendors.jsx`) — "Step 2 of 5"
Header has a 3-tab segmented control: **Manage · Find for me · Reminders**.
- **Manage** — a horizontal **category breakdown** chip strip (All + each category with counts; click to filter), then "New vendor" / "Import CSV" / "Download template", then a 2-col grid of vendor cards. Each card: category icon tile (tinted by category color), name, category, deliverable, contact + price, a **status cycle chip** (Pending→Confirmed→Done via `Chip as="button"`), and a deadline/countdown chip colored by urgency. Hover → edit (inline form) / remove.
- **Find for me** — concept-driven recommendations (an emerald banner explains it's based on Planning preferences). Each suggestion card: category, suggested deliverable, est. price chip, a `Lightbulb` "why" line, and Add / Skip (both feed the learning signal). Empty state when no gaps remain.
- **Reminders** — two-column "copilot": left = open reminders list; right = an AI-drafted message (`Textarea`) with a WhatsApp/Email channel toggle, Send/Copy, and 👍/👎 tone feedback (a violet `Brain` "learned tone" chip shows the current tone).

Categories (key → label, icon, tone color): `venue`→Lodging (Building2, emerald), `flights`→Flights (Plane, sky), `transport`→Transfers (Bus, teal), `facilitator`→Guides (HeartHandshake, violet), `catering`→Catering (UtensilsCrossed, amber), `photo`→Photo & Content (Camera, rose), `av`→Sound & Lighting (Lightbulb, orange), `design`→Design & Branding (Palette, stone), `other`→Other (Package, stone). The four "headline" groups are venue/flights/transport/facilitator.

### Stage: Participants (`stages/Participants.jsx`) — "Step 3 of 5"
Two tabs: **Roster** and **Questionnaire**.
- **Roster** — stat row (registered/target with progress, paid-in-full, collected est., cost/person), "Add participant" (inline/modal form), and a list. Each row: avatar initial, name, phone, a clay `Salad` dietary summary, a **payment cycle chip** (Unpaid→Deposit→Paid), hover edit/remove. "Registration page" button opens a preview modal of the public sign-up form (fields + sage "Register & pay deposit" button).
- **Questionnaire** — build the registration form: editable list of questions (label, type [short text / long text / single / multi], options, required), reorder/remove, plus a registration price field; live preview.

### Stage: Agenda (`stages/Agenda.jsx`) — "Step 4 of 5"
Dedicated schedule builder. A `tone="emerald"` "Draft my schedule" card with context chips (concept profile, # days, # vendors closed) and a "Suggest schedule" button (`Wand2`, `shimmer`, asks before overwriting). Below, the day-by-day editor: each day has an editable title and time-blocks (editable time, label, and a **kind** select: Session/Meal/Activity/Logistics, each with its icon + tone), add/remove block, add/remove day. "Next: Overview →".

### Stage: Overview (`stages/Pre.jsx`) — "Step 5 of 5"
Pre-event dashboard. Stat row (days to go, vendor spend vs budget, pending vendors, tasks done % with progress). **Left:** a vertical **timeline** grouped into buckets (Early 60+, A month out, Two weeks, A week, Final days, Event day) — each vendor shows a dot (status color), name, deliverable, and deadline; the retreat itself caps the bottom with a `Sprout` node. **Right:** an **Alerts** card (overdue / coming-up / over-budget, each with an icon) and a **To-do list** (auto-derived from vendor deliverables + 4 staple tasks; checkboxes use the `pop-check` animation). Empty state routes to Planning/Vendors.

### Stage: During (`stages/During.jsx`)
Live operations. Stat row (arrived/total with progress, open issues, program days). **Left = Check-in:** participant list, tap a row to toggle arrival (`Check` + `pop-check`); shows dietary note. **Right = Issues & team tasks:** an input + "+", quick-add chips (Room not ready, Food/dietary issue, Transport delay, AV glitch, Late arrival), and a checkable issue list (open = rose, done = stone, struck through).

### Stage: Vendor reviews (`stages/Reviews.jsx`) — After 1/4
Stat row (rated/total with progress, average score, vendor count). A vendor list where each row has a 1–5 **star rating** (`Star`, filled amber when selected). Ratings persist on the retreat.

### Stage: Guest feedback (`stages/Feedback.jsx`) — After 2/4
Stat row (invited, responses with progress, NPS). **Left:** "Send survey" action + a list of logged responses (guest, NPS chip, loved/improve lines, delete); "Log response" opens a form (guest, NPS 0–10, loved, improve). **Right (`tone="violet"`):** AI **feedback analysis** — empty until responses exist, then NPS + avg, "Loved" and "To improve" theme chips (top keywords), and a recommendation line.

### Stage: Content (`stages/Content.jsx`) — After 3/4
A media link library. Stat tiles for Photos / Videos / Decks & docs / Other (with counts). "Add link" form (title, URL, type). List rows: type icon tile, title, URL, "Open ↗" (`ExternalLink`), hover edit/remove. Empty state prompts to add albums/recordings/decks.

### Stage: Wrap-up (`stages/Closing.jsx`) — After 4/4
Stat row (final spend, gross margin, outstanding to vendors, checklist progress). **Left:** a closing **checklist** (Settle vendor payments, Issue & file invoices, Send feedback survey, Close & archive) with `pop-check` checkboxes. **Right:** a "Summary report" card (budget / spend / margin) with an **Export summary report** button that downloads a generated Markdown recap.

---

## 8. State & integration contract (light)

This is how the UI is wired so the backend can plug it into their own store/API.
The full DB schema and REST contract are intentionally **out of scope** (see below);
this section is only what's needed to mount the components.

- **`Workspace`** receives `retreat` (the current object) and **`onChange(updater)`**, where `updater: (retreat) => newRetreat`. Every edit is an immutable update routed through `onChange`.
- Stages never mutate directly — they call small **api objects / callbacks** passed down from `Workspace`. The map of action → field it changes:

| Callback / api | Mutates |
|---|---|
| `setRetreatValue(obj)` / field edits | top-level fields (name, dates, location, concept, audience, target, budget) |
| `setAgenda(days)` | `agenda` |
| `setSenderName(v)` | `senderName` |
| `setQuestionnaire(qs)` / `setRegPrice(n)` | `questionnaire` / `regPrice` |
| `vendorApi.add/update/remove/cycle` | `vendors[]` (cycle rotates status) |
| `participantApi.add/update/remove` | `participants[]` |
| `toggleTask(id)` | `taskDone{}` |
| `issueApi.add/toggle` | `issues[]` |
| `toggleArrived(id)` | `arrived{}` |
| `setRating(id, n)` | `ratings{}` |
| `sendSurvey()` | `surveySent` |
| `responseApi.add/remove` | `responses[]` |
| `toggleClosing(key)` | `closing{}` |
| `contentApi.add/update/remove` | `content[]` |
| `recordFeedback(tone, vote)` | `feedback[]` (drives reminder tone) |

- **Persistence today:** the entire `{ user, retreats }` blob is saved to `localStorage` (`retreatos.app.v1`) on every change. To back it with a server, replace `onChange`/`updateRetreat` with API calls (optimistic update + PATCH), keeping the same component props.
- There is a small **client-side "AI"/logic layer** in `src/lib.js` (planner, draft generator, feedback summary, learning profile) used by Planning/Vendors/Agenda/Feedback. It is pure and deterministic; it can stay client-side or move behind endpoints later — not required to render the UI.

---

## 9. Reproduction checklist (for the backend dev)

1. `npm i lucide-react` and the Tailwind v4 + Vite plugin deps (§1).
2. Add the Inter `<link>` + `lang="en" dir="ltr"` to your `index.html`.
3. In your CSS entry: `@import "tailwindcss";` then paste the entire `@theme {}` block (§2) and the global/motion CSS (§3).
4. Copy `src/components/ui.jsx` (the `Icon` map + all primitives) into your project. It has no app-specific imports — it's portable as-is.
5. Adopt the §2.7 conventions in any new markup.
6. Port screens one at a time. Each stage is a self-contained component that takes `retreat` + callbacks; wire those to your store. Start with one screen (e.g. **Vendors**) and confirm it renders identically to this app.
7. Reuse the phase/stage `PHASES` constant + `Sidebar.jsx` for the workspace shell.

**Verification:** with tokens + `ui.jsx` in place, a single screen should match
this app pixel-for-pixel. The reference app builds clean with `npm run build`.

---

## Out of scope (suggested follow-up doc)
This handoff is UI + design only. A separate **"Data model & API contract"** doc
should define: the full `retreat` JSON schema (vendors, participants, agenda,
questionnaire, responses, ratings, content, closing, etc.) and the proposed REST
endpoints — including turning the `src/lib.js` stand-ins (`planRetreat`,
`generateDraft`, `summarizeFeedback`, `learnedPlanningProfile`, `tonePreference`)
into real services, plus auth/multi-user and persistence. Ask if you'd like that next.
