import { useMemo, useState } from 'react'
import { AGENDA_KIND, planRetreat, fmtRange, daysBetween, catById } from '../../lib.js'
import { PageHeader, Card, SectionTitle, Btn, Chip, Icon, Empty } from '../ui.jsx'

const KIND_OPTIONS = Object.entries(AGENDA_KIND).map(([value, k]) => ({ value, label: k.label }))

export default function Agenda({ retreat, agenda, setAgenda, learningProfile = {}, onGo }) {
  const [thinking, setThinking] = useState(false)
  const nights = Math.max(0, daysBetween(retreat.startDate, retreat.endDate) || 0)

  // Concept- and date-aware draft, biased by past retreats.
  const plan = useMemo(() => planRetreat(retreat, learningProfile), [
    retreat.concept, retreat.startDate, retreat.endDate, retreat.vendors, learningProfile,
  ])
  const confirmedVendors = (retreat.vendors || []).filter((v) => v.status !== 'pending')

  const suggest = () => {
    if (agenda.length > 0 && !confirm('Replace the current agenda with a fresh AI draft?')) return
    setThinking(true)
    setTimeout(() => { setAgenda(plan.agenda); setThinking(false) }, 1000)
  }

  const addDay = () => setAgenda([...agenda, { day: agenda.length + 1, title: `Day ${agenda.length + 1}`, blocks: [{ t: '09:00', label: 'New block', kind: 'session' }] }])
  const delDay = (di) => setAgenda(agenda.filter((_, i) => i !== di).map((d, i) => ({ ...d, day: i + 1 })))
  const updDay = (di, patch) => setAgenda(agenda.map((d, i) => i === di ? { ...d, ...patch } : d))
  const addBlock = (di) => setAgenda(agenda.map((d, i) => i === di ? { ...d, blocks: [...d.blocks, { t: '12:00', label: 'New block', kind: 'session' }] } : d))
  const updBlock = (di, bi, patch) => setAgenda(agenda.map((d, i) => i === di ? { ...d, blocks: d.blocks.map((b, j) => j === bi ? { ...b, ...patch } : b) } : d))
  const delBlock = (di, bi) => setAgenda(agenda.map((d, i) => i === di ? { ...d, blocks: d.blocks.filter((_, j) => j !== bi) } : d))

  return (
    <div>
      <PageHeader step={4} total={5} icon="CalendarDays" title="Agenda"
        subtitle="Build the daily schedule from what you’ve closed — the manager proposes, you edit."
        actions={<Btn onClick={() => onGo('control')}>Next: Overview →</Btn>} />

      {/* context — what the draft is based on */}
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

      <Card className="fade-up">
        <SectionTitle icon="CalendarDays" hint={agenda.length ? 'Click any field to edit' : 'Suggest or add a day'}>Daily schedule</SectionTitle>
        {agenda.length === 0 && <Empty icon="CalendarDays">No schedule yet — hit “Suggest schedule” or add a day, then edit freely.</Empty>}

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
                  return (
                    <div key={bi} className="group flex items-center gap-2 rounded-lg bg-stone-50 ring-1 ring-stone-200 px-2.5 py-2 hover:ring-stone-300 transition">
                      <Icon name={k.iconName} size="sm" className="text-stone-400 shrink-0" />
                      <input value={b.t} onChange={(e) => updBlock(di, bi, { t: e.target.value })}
                        className="w-14 text-xs font-semibold text-stone-500 bg-white rounded-md px-2 py-1 ring-1 ring-stone-200 outline-none text-center" />
                      <input value={b.label} onChange={(e) => updBlock(di, bi, { label: e.target.value })}
                        className="flex-1 text-sm bg-transparent outline-none font-medium text-stone-700 min-w-0" />
                      <select value={b.kind} onChange={(e) => updBlock(di, bi, { kind: e.target.value })}
                        className="text-xs font-semibold text-stone-500 bg-white rounded-md px-2 py-1 ring-1 ring-stone-200 outline-none">
                        {KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <button onClick={() => delBlock(di, bi)} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 transition"><Icon name="X" size="sm" /></button>
                    </div>
                  )
                })}
                <button onClick={() => addBlock(di)} className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 mt-1"><Icon name="Plus" size="xs" /> Add block</button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addDay} className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900"><Icon name="Plus" size="sm" /> Add day</button>
      </Card>
    </div>
  )
}
