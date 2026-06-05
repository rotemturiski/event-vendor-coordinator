import { useMemo, useState } from 'react'
import { fmtRange, daysBetween, money, planRetreat, catById, cryptoId } from '../../lib.js'
import { PageHeader, Card, SectionTitle, Btn, Field, DateField, Chip, Icon, Empty } from '../ui.jsx'

// Literal bg classes per category so Tailwind generates them (no dynamic strings).
const CAT_BAR = {
  venue: 'bg-emerald-500', catering: 'bg-amber-400', facilitator: 'bg-stone-400',
  transport: 'bg-emerald-300', photo: 'bg-rose-400', av: 'bg-amber-300',
  design: 'bg-stone-300', other: 'bg-stone-200',
}

export default function Planning({ retreat, setRetreat, agenda, setAgenda, onGo, vendorApi, learningProfile = {}, onPlanningSignal = () => {} }) {
  const [thinking, setThinking] = useState(false)
  const [planned, setPlanned] = useState(false)
  const [added, setAdded] = useState({}) // suggestion id -> true
  const set = (k, v) => setRetreat({ ...retreat, [k]: v })
  const nights = Math.max(0, daysBetween(retreat.startDate, retreat.endDate) || 0)

  // The smart planner — pure, recomputes from the real stored data + learning bias.
  const plan = useMemo(() => planRetreat(retreat, learningProfile), [
    retreat.concept, retreat.audience, retreat.name, retreat.budget, retreat.target,
    retreat.startDate, retreat.endDate, retreat.vendors, retreat.agenda, learningProfile,
  ])

  const doneCount = plan.openDecisions.filter((d) => d.done).length
  const progress = Math.round((doneCount / plan.openDecisions.length) * 100)

  // "Plan it for me" — seed the agenda from the concept-aware draft, then open
  // the dedicated Agenda step to refine it.
  const planForMe = () => {
    setThinking(true)
    setTimeout(() => {
      setAgenda(plan.agenda)
      setThinking(false); setPlanned(true)
      onGo('agenda')
    }, 1100)
  }

  const addSuggestion = (s) => {
    if (added[s.id]) return
    vendorApi.add([{
      id: cryptoId(), name: s.label, category: s.category,
      contactName: '', phone: '', email: '',
      deliverable: s.deliverable, daysBefore: s.daysBefore, price: s.estPrice, status: 'pending',
    }])
    setAdded((a) => ({ ...a, [s.id]: true }))
    onPlanningSignal({ type: 'accept-vendor', category: s.category })
  }
  const dismissSuggestion = (s) => {
    setAdded((a) => ({ ...a, [s.id]: 'dismissed' }))
    onPlanningSignal({ type: 'reject-vendor', category: s.category })
  }

  const onDecision = (d) => {
    if (d.done) return
    if (d.id === 'd-agenda') return onGo('agenda')
    if (d.jumpTo) return onGo(d.jumpTo)
    document.getElementById('plan-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const hasBudget = (Number(retreat.budget) || 0) > 0
  const liveSuggestions = plan.vendorSuggestions.filter((s) => added[s.id] !== 'dismissed')

  return (
    <div>
      <PageHeader step={1} total={5} icon="Compass" title="Planning"
        subtitle="Set the compass — concept, dates, budget — and let the manager draft the plan."
        actions={<Btn onClick={() => onGo('vendors')}>Next: Vendors →</Btn>} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6 items-start">
        {/* ── LEFT: canvas ───────────────────────────────────────────── */}
        <div className="space-y-6 min-w-0">

          {/* Retreat details */}
          <Card id="plan-details" className="fade-up">
            <SectionTitle icon="PenLine" hint={<Chip tone="emerald" icon={plan.confidence === 'low' ? 'Compass' : 'Sparkles'}>{plan.profileLabel}</Chip>}>
              Retreat details
            </SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <Field className="col-span-2" label="Retreat name" value={retreat.name} onChange={(v) => set('name', v)} placeholder="Mountain Reset" />
              <DateField label="Start date" value={retreat.startDate} onChange={(v) => set('startDate', v)} />
              <DateField label="End date" value={retreat.endDate} min={retreat.startDate} onChange={(v) => set('endDate', v)} />
              <Field className="col-span-2" label="Location" value={retreat.location} onChange={(v) => set('location', v)} placeholder="Mountain Estate, Upper Galilee" />
              <Field label="Concept" value={retreat.concept} onChange={(v) => set('concept', v)} placeholder="Yoga & nature reset" />
              <Field label="Audience" value={retreat.audience} onChange={(v) => set('audience', v)} placeholder="Founders" />
              <Field label="Target participants" type="number" value={retreat.target} onChange={(v) => set('target', parseInt(v) || 0)} />
              <Field label="Budget ($)" type="number" value={retreat.budget} onChange={(v) => set('budget', parseInt(v) || 0)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip tone="emerald" icon="CalendarDays">{fmtRange(retreat.startDate, retreat.endDate)}{nights > 0 ? ` · ${nights} nights` : ''}</Chip>
              <Chip tone="amber" icon="Lightbulb">Changing dates auto-updates the timeline & deadlines</Chip>
            </div>
          </Card>

          {/* Budget breakdown */}
          <Card id="plan-budget" className="fade-up">
            <SectionTitle icon="Wallet" hint={hasBudget ? `${money(retreat.budget)} total` : 'Set a budget'}>Budget breakdown</SectionTitle>
            {!hasBudget ? (
              <Empty icon="Wallet">Set a total budget above and the manager will split it across vendors.</Empty>
            ) : (
              <>
                <div className="flex h-3 w-full rounded-full overflow-hidden ring-1 ring-stone-200 mb-4">
                  {plan.budget.map((b) => (
                    <div key={b.catKey} className={`${CAT_BAR[b.catKey] || 'bg-stone-300'}`} style={{ width: `${b.pct}%` }} title={`${b.label} · ${b.pct}%`} />
                  ))}
                </div>
                <div className="space-y-2">
                  {plan.budget.map((b) => (
                    <div key={b.catKey} className="flex items-center gap-3">
                      <span className={`size-2.5 rounded-full shrink-0 ${CAT_BAR[b.catKey] || 'bg-stone-300'}`} />
                      <span className="text-sm font-medium text-stone-700 w-36 shrink-0">{b.label}</span>
                      <span className="text-xs text-stone-400 w-8 tabular-nums">{b.pct}%</span>
                      <span className="text-sm font-semibold text-stone-800 tabular-nums w-20 text-right">{money(b.amount)}</span>
                      {b.perPerson != null && <span className="text-xs text-stone-400 tabular-nums">{money(b.perPerson)}/pp</span>}
                      {b.note && <span className="text-xs text-amber-700 ml-auto flex items-center gap-1"><Icon name="Lightbulb" size="xs" />{b.note}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Vendor suggestions */}
          {liveSuggestions.length > 0 && (
            <Card className="fade-up">
              <SectionTitle icon="Handshake" hint="Tailored to your concept">Suggested vendors</SectionTitle>
              <div className="space-y-2">
                {liveSuggestions.map((s) => {
                  const cat = catById(s.category)
                  const isAdded = added[s.id] === true
                  return (
                    <div key={s.id} className="flex items-start gap-3 rounded-xl bg-stone-50 ring-1 ring-stone-200 p-3">
                      <span className={`size-8 grid place-items-center rounded-lg shrink-0 ${CAT_BAR[s.category] || 'bg-stone-300'} text-white`}><Icon name={cat.iconName} size="sm" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-stone-800">{s.label}</span>
                          {s.estPrice > 0 && <Chip tone="stone">~{money(s.estPrice)}</Chip>}
                          <Chip tone="amber">{s.daysBefore}d before</Chip>
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">{s.deliverable} — {s.why}</div>
                      </div>
                      {isAdded ? (
                        <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1 shrink-0 mt-1"><Icon name="CheckCircle2" size="sm" /> Added</span>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <Btn variant="soft" icon="Plus" onClick={() => addSuggestion(s)}>Add</Btn>
                          <button onClick={() => dismissSuggestion(s)} className="text-stone-300 hover:text-rose-500 transition p-1"><Icon name="X" size="sm" /></button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Agenda lives in its own step — link across */}
          <Card className="fade-up">
            <SectionTitle icon="CalendarDays" hint={`${agenda.length} ${agenda.length === 1 ? 'day' : 'days'} drafted`}>Agenda</SectionTitle>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-stone-500">Build the daily schedule in its own step — the manager drafts it from your concept, dates and closed vendors.</p>
              <Btn variant="soft" icon="CalendarDays" onClick={() => onGo('agenda')}>Open Agenda step →</Btn>
            </div>
          </Card>
        </div>

        {/* ── RIGHT: AI assistant rail ───────────────────────────────── */}
        <aside className="lg:sticky lg:top-7 self-start space-y-4 fade-up">
          <Card tone="emerald" pad={false} className="overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-emerald-200/60">
              <span className="size-10 grid place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm"><Icon name="Brain" size="lg" /></span>
              <div className="min-w-0">
                <div className="font-semibold text-stone-800 leading-tight">Maya</div>
                <div className="text-xs text-stone-500">Your retreat manager</div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <Btn icon="Wand2" loading={thinking} className="w-full" onClick={planForMe}>{thinking ? 'Planning…' : 'Plan it for me'}</Btn>
              {thinking && <div className="space-y-2"><div className="h-3 rounded shimmer w-2/3" /><div className="h-3 rounded shimmer w-full" /></div>}
              {planned && !thinking && <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700"><Icon name="CheckCircle2" size="sm" /> Agenda drafted — opening the Agenda step…</div>}

              {/* insights */}
              <div className="space-y-2">
                {plan.insights.map((line, i) => (
                  <div key={i} className="flex gap-2 text-sm text-stone-600 leading-snug">
                    <Icon name="Sparkles" size="sm" className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Open decisions */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-800"><Icon name="ClipboardList" size="sm" className="text-stone-400" /> Open decisions</h2>
              <span className="text-xs font-semibold text-stone-400 tabular-nums">{doneCount}/{plan.openDecisions.length}</span>
            </div>
            <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden mb-3">
              <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="space-y-1">
              {plan.openDecisions.map((d) => (
                <button key={d.id} onClick={() => onDecision(d)} disabled={d.done}
                  className={`w-full flex items-start gap-2 text-left rounded-lg px-2 py-1.5 transition ${d.done ? 'opacity-60' : 'hover:bg-stone-50'}`}>
                  <Icon name={d.done ? 'CheckCircle2' : 'Circle'} size="sm" className={`shrink-0 mt-0.5 ${d.done ? 'text-emerald-600' : 'text-stone-300'}`} />
                  <span className="min-w-0">
                    <span className={`text-sm ${d.done ? 'text-stone-400 line-through' : 'text-stone-700 font-medium'}`}>{d.label}</span>
                    {!d.done && <span className="block text-xs text-stone-400">{d.hint}</span>}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
