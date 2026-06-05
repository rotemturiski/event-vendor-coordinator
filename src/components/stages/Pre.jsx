import { catById, STATUS, fmtDate, fmtCountdown, fmtRange, money, daysBetween } from '../../lib.js'
import { PageHeader, Card, Stat, SectionTitle, Empty, Btn, Chip, Icon } from '../ui.jsx'

const BUCKETS = [
  { min: 60, label: 'Early', sub: '60+ days', dot: 'bg-stone-300' },
  { min: 30, label: 'A month out', sub: '30–59 days', dot: 'bg-teal-400' },
  { min: 14, label: 'Two weeks out', sub: '14–29 days', dot: 'bg-emerald-400' },
  { min: 7, label: 'A week out', sub: '7–13 days', dot: 'bg-emerald-500' },
  { min: 1, label: 'Final days', sub: '1–6 days', dot: 'bg-amber-400' },
  { min: -Infinity, label: 'Event day', sub: 'The big day', dot: 'bg-rose-400' },
]
const bucketOf = (d) => BUCKETS.findIndex((b) => d >= b.min)

export default function Pre({ retreat, today, enrichedVendors, tasks, onToggleTask, onNavigate }) {
  const daysToGo = daysBetween(today, retreat.startDate)

  if (!retreat.startDate && enrichedVendors.length === 0) {
    return (
      <div>
        <PageHeader step={5} total={5} icon="LayoutDashboard" title="Overview" subtitle="Timeline, tasks and alerts — built automatically from your data." />
        <Card className="text-center py-14 fade-up">
          <Empty icon="LayoutDashboard">
            <div className="font-semibold text-stone-700 text-base">Nothing to show yet</div>
            <p className="text-stone-500 text-sm mt-1 mb-5">Set a date and add vendors — the timeline, tasks and alerts build themselves.</p>
            <div className="flex justify-center gap-2">
              <Btn icon="Compass" onClick={() => onNavigate('planning')}>Go to Planning</Btn>
              <Btn variant="soft" icon="Handshake" onClick={() => onNavigate('vendors')}>Go to Vendors</Btn>
            </div>
          </Empty>
        </Card>
      </div>
    )
  }

  const budget = enrichedVendors.reduce((s, v) => s + (Number(v.price) || 0), 0)
  const pending = enrichedVendors.filter((v) => v.status === 'pending').length
  const doneTasks = tasks.filter((t) => t.done).length
  const openTasks = tasks.length - doneTasks
  const taskPct = tasks.length ? Math.round(doneTasks / tasks.length * 100) : 0

  const alerts = []
  enrichedVendors.forEach((v) => {
    if (v.status === 'pending' && v.daysLeft != null && v.daysLeft < 0) alerts.push({ iconName: 'AlarmClock', tone: 'rose', text: `Overdue: "${v.deliverable}" — ${v.name}` })
    else if (v.status === 'pending' && v.daysLeft != null && v.daysLeft <= 5) alerts.push({ iconName: 'Bell', tone: 'amber', text: `Coming up (${fmtCountdown(v.daysLeft).text}): ${v.name}` })
  })
  if (retreat.budget && budget > retreat.budget) alerts.push({ iconName: 'TrendingDown', tone: 'rose', text: `Over budget: ${money(budget)} of ${money(retreat.budget)}` })

  const groups = BUCKETS.map((b, i) => ({ ...b, items: enrichedVendors.filter((v) => bucketOf(v.daysBefore) === i).sort((a, c) => c.daysBefore - a.daysBefore) })).filter((g) => g.items.length)

  return (
    <div>
      <PageHeader step={5} total={5} icon="LayoutDashboard" title="Overview"
        subtitle="Timeline, tasks and alerts — all updated automatically from your data." />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat icon="CalendarDays" label="To retreat" value={daysToGo == null ? '—' : daysToGo >= 0 ? `${daysToGo} days` : 'Past'} sub={fmtRange(retreat.startDate, retreat.endDate)} tone="emerald" />
        <Stat icon="Wallet" label="Vendor spend" value={money(budget)} sub={`Budget: ${money(retreat.budget)}`} tone={retreat.budget && budget > retreat.budget ? 'rose' : 'stone'} />
        <Stat icon="Handshake" label="Pending vendors" value={pending} sub={`of ${enrichedVendors.length}`} tone={pending ? 'amber' : 'stone'} />
        <Stat icon="CheckCircle2" label="Tasks done" value={`${doneTasks}/${tasks.length}`} sub={`${openTasks} open`} tone={openTasks ? 'amber' : 'emerald'} progress={taskPct} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="fade-up">
          <SectionTitle icon="CalendarDays" hint="Updates with the date">Timeline</SectionTitle>
          <div className="relative pl-5 max-h-[58vh] overflow-y-auto nice-scroll">
            <div className="absolute top-2 bottom-2 left-[7px] w-0.5 bg-stone-200" />
            {groups.length === 0 && <Empty>No items on the timeline.</Empty>}
            {groups.map((g) => (
              <div key={g.label} className="mb-5 last:mb-0">
                <div className="flex items-center gap-3 mb-2 -ml-[3px]">
                  <span className={`size-4 rounded-full ${g.dot} ring-4 ring-white z-10`} />
                  <div className="flex items-center gap-2">
                    <div><div className="font-semibold text-stone-800 text-sm leading-none">{g.label}</div><div className="text-xs text-stone-400 mt-0.5">{g.sub}</div></div>
                    <Chip tone="stone">{g.items.length}</Chip>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {g.items.map((v) => {
                    const cat = catById(v.category); const st = STATUS[v.status]
                    const overdue = v.daysLeft != null && v.daysLeft < 0 && v.status === 'pending'
                    return (
                      <div key={v.id} className={`ml-1 rounded-lg bg-white ring-1 px-3 py-1.5 ${overdue ? 'ring-rose-200 bg-rose-50/40' : 'ring-stone-200'}`}>
                        <div className="flex items-center gap-2">
                          <Icon name={cat.iconName} size="xs" className="text-stone-400" />
                          <span className="font-semibold text-stone-800 text-sm truncate flex-1">{v.name}</span>
                          <span className={`size-2 rounded-full ${st.dot}`} title={st.label} />
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-stone-500 truncate max-w-[60%]">{v.deliverable}</span>
                          <span className={`text-xs font-semibold ${overdue ? 'text-rose-600' : 'text-stone-400'}`}>{fmtDate(v.deadline)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {enrichedVendors.length > 0 && (
              <div className="flex items-center gap-3 -ml-[3px] mt-1">
                <span className="size-4 rounded-full bg-emerald-600 ring-4 ring-white z-10 grid place-items-center text-white"><Icon name="Sprout" size="xs" strokeWidth={2.5} /></span>
                <div className="flex-1 rounded-lg bg-gradient-to-r from-emerald-50 to-amber-50 ring-1 ring-emerald-200 px-3 py-2">
                  <div className="font-semibold text-emerald-800 text-sm">{retreat.name || 'Retreat'}</div>
                  <div className="text-xs text-emerald-600 font-medium">{fmtRange(retreat.startDate, retreat.endDate)}</div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="fade-up">
            <SectionTitle icon="Bell">Alerts ({alerts.length})</SectionTitle>
            {alerts.length === 0 ? <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium"><Icon name="CheckCircle2" size="sm" /> All under control — no open alerts</div> : (
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div key={i} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 ring-1 text-sm font-medium ${a.tone === 'rose' ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                    <Icon name={a.iconName} size="sm" /> {a.text}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="fade-up" pad={false}>
            <div className="px-5 pt-4 pb-2"><SectionTitle icon="CheckCircle2" hint={`${doneTasks}/${tasks.length} done`}>To-do list</SectionTitle></div>
            <div className="max-h-[34vh] overflow-y-auto nice-scroll divide-y divide-stone-100">
              {tasks.map((t) => (
                <button key={t.id} onClick={() => onToggleTask(t.id)} className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-stone-50/60 transition">
                  <span className={`size-5 shrink-0 rounded-md grid place-items-center ring-1 ${t.done ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white ring-stone-300'}`}>{t.done && <Icon name="Check" size="xs" strokeWidth={3} className="pop-check" />}</span>
                  <span className={`flex-1 text-sm ${t.done ? 'line-through text-stone-400' : 'text-stone-700 font-medium'}`}>{t.title}</span>
                  <span className={`text-xs font-semibold ${t.daysLeft != null && t.daysLeft < 0 && !t.done ? 'text-rose-500' : 'text-stone-400'}`}>{fmtDate(t.deadline)}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
