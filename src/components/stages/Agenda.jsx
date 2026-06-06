import { useMemo, useState } from 'react'
import {
  AGENDA_KIND, TRACKS, DEFAULT_DUR, planRetreat, daysBetween, timeToMin, minToTime, autoReminders,
} from '../../lib.js'
import { PageHeader, Card, SectionTitle, Btn, Chip, Icon, Empty, Field, Select } from '../ui.jsx'

const KIND_OPTIONS = Object.entries(AGENDA_KIND).map(([value, k]) => ({ value, label: k.label }))
const TRACK_OPTIONS = TRACKS.map((t) => ({ value: t.key, label: t.label }))
const PX_PER_HOUR = 92
const ROW_H = 30 // px per packed sub-row inside a lane

// Bar look — Main bars by kind (the 4 real hues), Ops/Reminder by track.
const KIND_BAR = {
  session: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  meal: 'bg-amber-100 text-amber-800 ring-amber-300',
  activity: 'bg-rose-100 text-rose-800 ring-rose-300',
  logistics: 'bg-stone-100 text-stone-700 ring-stone-300',
}
const barClass = (b) => {
  if (b.auto) return 'bg-amber-50 text-amber-600 ring-amber-200 border border-dashed border-amber-300'
  if (b.track === 'reminder') return 'bg-amber-100 text-amber-800 ring-amber-300'
  if (b.track === 'shadow') return 'bg-white text-stone-600 ring-stone-300'
  return KIND_BAR[b.kind] || KIND_BAR.logistics
}

// Greedy lane packing so overlapping bars stack into sub-rows.
function pack(items) {
  const rowEnds = []
  const placed = items
    .map((b) => ({ ...b, _s: timeToMin(b.t), _e: timeToMin(b.t) + (Number(b.dur) || DEFAULT_DUR) }))
    .sort((a, c) => a._s - c._s)
    .map((b) => {
      let r = rowEnds.findIndex((end) => end <= b._s)
      if (r === -1) { r = rowEnds.length; rowEnds.push(b._e) } else rowEnds[r] = b._e
      return { ...b, _row: r }
    })
  return { placed, rows: Math.max(1, rowEnds.length) }
}

export default function Agenda({ retreat, agenda, setAgenda, learningProfile = {}, onGo }) {
  const [thinking, setThinking] = useState(false)
  const [view, setView] = useState('timeline') // timeline | list
  const [activeDay, setActiveDay] = useState(0)
  const [editing, setEditing] = useState(null) // { di, bi }
  const nights = Math.max(0, daysBetween(retreat.startDate, retreat.endDate) || 0)

  const plan = useMemo(() => planRetreat(retreat, learningProfile), [
    retreat.concept, retreat.startDate, retreat.endDate, retreat.vendors, learningProfile,
  ])
  const confirmedVendors = (retreat.vendors || []).filter((v) => v.status !== 'pending')

  const suggest = () => {
    if (agenda.length > 0 && !confirm('Replace the current agenda with a fresh AI draft?')) return
    setThinking(true)
    setTimeout(() => { setAgenda(plan.agenda); setThinking(false); setActiveDay(0) }, 1000)
  }

  // ── mutations (blocks now carry track + dur) ──
  const addDay = () => { setAgenda([...agenda, { day: agenda.length + 1, title: `Day ${agenda.length + 1}`, blocks: [] }]); setActiveDay(agenda.length) }
  const delDay = (di) => { setAgenda(agenda.filter((_, i) => i !== di).map((d, i) => ({ ...d, day: i + 1 }))); setEditing(null); setActiveDay((a) => Math.max(0, Math.min(a, agenda.length - 2))) }
  const updDay = (di, patch) => setAgenda(agenda.map((d, i) => i === di ? { ...d, ...patch } : d))
  const updBlock = (di, bi, patch) => setAgenda(agenda.map((d, i) => i === di ? { ...d, blocks: d.blocks.map((b, j) => j === bi ? { ...b, ...patch } : b) } : d))
  const delBlock = (di, bi) => { setAgenda(agenda.map((d, i) => i === di ? { ...d, blocks: d.blocks.filter((_, j) => j !== bi) } : d)); setEditing(null) }
  const addBlock = (di, track) => {
    const defaults = {
      main: { t: '09:00', label: 'New session', kind: 'session' },
      shadow: { t: '08:30', label: 'Setup', kind: 'logistics' },
      reminder: { t: '08:00', label: 'Send reminder', kind: 'logistics' },
    }[track]
    const block = { ...defaults, track, dur: track === 'reminder' ? 15 : 60 }
    const day = agenda[di]
    setAgenda(agenda.map((d, i) => i === di ? { ...d, blocks: [...d.blocks, block] } : d))
    setEditing({ di, bi: day.blocks.length })
  }

  return (
    <div>
      <PageHeader step={4} total={5} icon="CalendarDays" title="Agenda"
        subtitle="A multi-track timeline — main schedule, ops, and reminders lined up on one axis."
        actions={
          <div className="flex items-center gap-1 bg-white rounded-lg ring-1 ring-stone-200 p-1">
            {[['timeline', 'Timeline', 'Film'], ['list', 'List', 'ClipboardList']].map(([k, l, ic]) => (
              <button key={k} onClick={() => setView(k)}
                className={`flex items-center gap-1.5 text-sm font-semibold rounded-md px-3 py-1.5 transition ${view === k ? 'bg-emerald-700 text-white' : 'text-stone-500'}`}>
                <Icon name={ic} size="xs" /> {l}
              </button>
            ))}
          </div>
        } />

      {/* AI draft context */}
      <Card tone="emerald" className="mb-4 fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="size-9 shrink-0 grid place-items-center rounded-lg bg-emerald-700 text-white"><Icon name="Sparkles" size="md" /></span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-stone-800">Draft my schedule</div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Chip tone="emerald" icon="Compass">{plan.profileLabel}</Chip>
              <Chip tone="stone" icon="CalendarDays">{nights > 0 ? `${nights + 1} days` : 'Set dates'}</Chip>
              <Chip tone="stone" icon="Handshake">{confirmedVendors.length} vendors closed</Chip>
            </div>
          </div>
          <Btn icon="Wand2" loading={thinking} onClick={suggest}>{thinking ? 'Drafting…' : agenda.length ? 'Re-suggest' : 'Suggest schedule'}</Btn>
        </div>
        {thinking && <div className="mt-3 space-y-2"><div className="h-3 rounded shimmer w-2/3" /><div className="h-3 rounded shimmer w-full" /></div>}
      </Card>

      {agenda.length === 0 ? (
        <Card className="fade-up"><Empty icon="CalendarDays">No schedule yet — hit “Suggest schedule” or add a day, then arrange the tracks.</Empty>
          <div className="flex justify-center"><Btn icon="Plus" onClick={addDay}>Add a day</Btn></div>
        </Card>
      ) : view === 'list' ? (
        <ListView agenda={agenda} addDay={addDay} delDay={delDay} updDay={updDay} updBlock={updBlock} delBlock={delBlock} addBlock={addBlock} />
      ) : (
        <TimelineView
          agenda={agenda} retreat={retreat} activeDay={Math.min(activeDay, agenda.length - 1)} setActiveDay={setActiveDay}
          addDay={addDay} delDay={delDay} updDay={updDay} addBlock={addBlock}
          editing={editing} setEditing={setEditing} updBlock={updBlock} delBlock={delBlock}
        />
      )}
    </div>
  )
}

// ── TIMELINE ────────────────────────────────────────────────────────────────
function TimelineView({ agenda, retreat, activeDay, setActiveDay, addDay, delDay, updDay, addBlock, editing, setEditing, updBlock, delBlock }) {
  const day = agenda[activeDay]
  const di = activeDay
  const autos = useMemo(() => autoReminders(day.blocks, di, retreat), [day.blocks, di, retreat])

  // shared time range across all bars
  const all = [...day.blocks, ...autos]
  const starts = all.map((b) => timeToMin(b.t))
  const ends = all.map((b) => timeToMin(b.t) + (Number(b.dur) || DEFAULT_DUR))
  let rangeStart = all.length ? Math.floor(Math.min(...starts) / 60) * 60 : 8 * 60
  let rangeEnd = all.length ? Math.ceil(Math.max(...ends) / 60) * 60 : 20 * 60
  if (rangeEnd - rangeStart < 240) rangeEnd = rangeStart + 240
  const span = rangeEnd - rangeStart
  const width = (span / 60) * PX_PER_HOUR
  const ticks = []
  for (let m = rangeStart; m <= rangeEnd; m += 60) ticks.push(m)

  const editBlock = editing && editing.di === di ? day.blocks[editing.bi] : null

  return (
    <div className="fade-up">
      {/* day tabs */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto nice-scroll pb-1">
        {agenda.map((d, i) => (
          <button key={i} onClick={() => { setActiveDay(i); setEditing(null) }}
            className={`shrink-0 flex items-center gap-2 text-sm font-semibold rounded-lg px-3 py-1.5 ring-1 transition ${i === activeDay ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white text-stone-600 ring-stone-200 hover:ring-stone-300'}`}>
            <span className={`size-5 grid place-items-center rounded text-xs ${i === activeDay ? 'bg-white/20' : 'bg-stone-100'}`}>{d.day}</span>
            Day {d.day}
          </button>
        ))}
        <button onClick={addDay} className="shrink-0 size-8 grid place-items-center rounded-lg ring-1 ring-stone-200 text-stone-500 hover:text-emerald-700 hover:ring-emerald-300 transition" title="Add day"><Icon name="Plus" size="sm" /></button>
      </div>

      <Card pad={false} className="overflow-hidden">
        {/* day title */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100">
          <span className="size-7 shrink-0 grid place-items-center rounded-lg bg-emerald-700 text-white text-sm font-semibold">{day.day}</span>
          <input value={day.title} onChange={(e) => updDay(di, { title: e.target.value })}
            className="flex-1 font-semibold text-stone-800 text-sm bg-transparent outline-none rounded px-1 -mx-1 hover:bg-stone-50 focus:bg-stone-50 transition" />
          <button onClick={() => delDay(di)} className="text-stone-300 hover:text-rose-500 transition" title="Remove day"><Icon name="X" size="sm" /></button>
        </div>

        {/* scrollable timeline */}
        <div className="overflow-x-auto nice-scroll">
          <div className="min-w-full" style={{ width: 132 + width }}>
            {/* ruler */}
            <div className="flex border-b border-stone-100 bg-stone-50/60">
              <div className="w-[132px] shrink-0 px-3 py-2 text-xs font-semibold text-stone-400 flex items-center gap-1.5"><Icon name="Clock" size="xs" /> Track</div>
              <div className="relative" style={{ width }}>
                {ticks.map((m) => (
                  <div key={m} className="absolute top-0 bottom-0 border-l border-stone-200" style={{ left: `${((m - rangeStart) / span) * 100}%` }}>
                    <span className="absolute top-1.5 left-1 text-[10px] font-semibold text-stone-400 tabular-nums">{minToTime(m)}</span>
                  </div>
                ))}
                <div className="py-2 text-transparent text-xs select-none">.</div>
              </div>
            </div>

            {/* lanes */}
            {TRACKS.map((track) => {
              const blocks = day.blocks
                .map((b, bi) => ({ ...b, track: b.track || 'main', _bi: bi }))
                .filter((b) => b.track === track.key)
              const items = track.key === 'reminder' ? [...blocks, ...autos] : blocks
              const { placed, rows } = pack(items)
              const laneH = rows * ROW_H + 12
              return (
                <div key={track.key} className="flex border-b border-stone-100 last:border-0">
                  {/* label + add */}
                  <div className="w-[132px] shrink-0 px-3 py-2 flex items-center gap-1.5 border-r border-stone-100">
                    <Icon name={track.iconName} size="sm" className="text-stone-400" />
                    <span className="text-xs font-semibold text-stone-600 flex-1">{track.label}</span>
                    <button onClick={() => addBlock(di, track.key)} className="text-stone-300 hover:text-emerald-700 transition" title={`Add to ${track.label}`}><Icon name="Plus" size="xs" /></button>
                  </div>
                  {/* lane */}
                  <div className="relative" style={{ width, height: laneH }}>
                    {ticks.map((m) => <div key={m} className="absolute top-0 bottom-0 border-l border-stone-100" style={{ left: `${((m - rangeStart) / span) * 100}%` }} />)}
                    {items.length === 0 && <div className="absolute inset-0 grid place-items-center text-[11px] text-stone-300">— empty —</div>}
                    {placed.map((b, idx) => {
                      const left = ((b._s - rangeStart) / span) * 100
                      const w = Math.max(2.5, ((Number(b.dur) || DEFAULT_DUR) / span) * 100)
                      const isEditing = !b.auto && editing && editing.di === di && editing.bi === b._bi
                      return (
                        <button key={b.id || `b-${b._bi}-${idx}`} disabled={b.auto}
                          onClick={() => !b.auto && setEditing({ di, bi: b._bi })}
                          title={`${b.t} · ${b.label}${b.auto ? ' (auto)' : ''}`}
                          className={`absolute rounded-md ring-1 px-2 text-[11px] font-medium leading-tight flex items-center gap-1 overflow-hidden text-left transition ${barClass(b)} ${b.auto ? 'cursor-default' : 'hover:brightness-95 cursor-pointer'} ${isEditing ? 'ring-2 ring-emerald-500 z-20' : ''}`}
                          style={{ left: `${left}%`, width: `${w}%`, top: b._row * ROW_H + 6, height: ROW_H - 6 }}>
                          {b.auto && <Icon name="Bell" size="xs" className="shrink-0" />}
                          <span className="truncate">{b.t} {b.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-stone-400">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-amber-50 border border-dashed border-amber-300" /> Auto reminder (from your data)</span>
        <span className="flex items-center gap-1.5"><Icon name="Sparkles" size="xs" className="text-emerald-600" /> Click any bar to edit · use + on a lane to add</span>
      </div>

      {/* inline editor */}
      {editBlock && (
        <Card className="mt-4 fade-up">
          <SectionTitle icon="PenLine" hint={`Day ${day.day}`}>Edit block</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field className="col-span-2" label="Label" value={editBlock.label} onChange={(v) => updBlock(di, editing.bi, { label: v })} />
            <div>
              <div className="text-xs font-semibold text-stone-400 mb-1">Start</div>
              <input type="time" value={editBlock.t} onChange={(e) => updBlock(di, editing.bi, { t: e.target.value })}
                className="w-full text-sm bg-white rounded-lg px-3 py-2.5 ring-1 ring-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition" />
            </div>
            <Field label="Duration (min)" type="number" value={editBlock.dur ?? DEFAULT_DUR} onChange={(v) => updBlock(di, editing.bi, { dur: parseInt(v) || 0 })} />
            <Select label="Track" value={editBlock.track || 'main'} onChange={(v) => updBlock(di, editing.bi, { track: v })} options={TRACK_OPTIONS} />
            {editBlock.track !== 'reminder' && (
              <Select label="Type" value={editBlock.kind || 'session'} onChange={(v) => updBlock(di, editing.bi, { kind: v })} options={KIND_OPTIONS} />
            )}
          </div>
          <div className="flex justify-between mt-4">
            <Btn variant="ghost" icon="X" onClick={() => delBlock(di, editing.bi)}>Delete</Btn>
            <Btn icon="Check" onClick={() => setEditing(null)}>Done</Btn>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── LIST (fallback editor) ──────────────────────────────────────────────────
function ListView({ agenda, addDay, delDay, updDay, updBlock, delBlock, addBlock }) {
  return (
    <Card className="fade-up">
      <SectionTitle icon="ClipboardList" hint="Click any field to edit">Daily schedule</SectionTitle>
      <div className="space-y-6">
        {agenda.map((d, di) => (
          <div key={di} className="group/day">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-7 shrink-0 grid place-items-center rounded-lg bg-emerald-700 text-white text-sm font-semibold">{d.day}</span>
              <input value={d.title} onChange={(e) => updDay(di, { title: e.target.value })}
                className="flex-1 font-semibold text-stone-700 text-sm bg-transparent outline-none rounded px-1 -mx-1 hover:bg-stone-50 focus:bg-stone-50 transition" />
              <button onClick={() => delDay(di)} className="opacity-0 group-hover/day:opacity-100 text-stone-300 hover:text-rose-500 transition" title="Remove day"><Icon name="X" size="sm" /></button>
            </div>
            <div className="space-y-1.5 pl-9">
              {d.blocks.map((b, bi) => {
                const k = AGENDA_KIND[b.kind] || AGENDA_KIND.session
                const track = b.track || 'main'
                return (
                  <div key={bi} className="group flex items-center gap-2 rounded-lg bg-stone-50 ring-1 ring-stone-200 px-2.5 py-2 hover:ring-stone-300 transition">
                    <Icon name={TRACKS.find((t) => t.key === track)?.iconName || k.iconName} size="sm" className="text-stone-400 shrink-0" />
                    <input value={b.t} onChange={(e) => updBlock(di, bi, { t: e.target.value })}
                      className="w-14 text-xs font-semibold text-stone-500 bg-white rounded-md px-2 py-1 ring-1 ring-stone-200 outline-none text-center" />
                    <input value={b.label} onChange={(e) => updBlock(di, bi, { label: e.target.value })}
                      className="flex-1 text-sm bg-transparent outline-none font-medium text-stone-700 min-w-0" />
                    <select value={track} onChange={(e) => updBlock(di, bi, { track: e.target.value })}
                      className="text-xs font-semibold text-stone-500 bg-white rounded-md px-2 py-1 ring-1 ring-stone-200 outline-none">
                      {TRACK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button onClick={() => delBlock(di, bi)} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 transition"><Icon name="X" size="sm" /></button>
                  </div>
                )
              })}
              <button onClick={() => addBlock(di, 'main')} className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 mt-1"><Icon name="Plus" size="xs" /> Add block</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addDay} className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900"><Icon name="Plus" size="sm" /> Add day</button>
    </Card>
  )
}
