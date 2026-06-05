import { useState } from 'react'
import { fmtRange, daysBetween, toISO } from '../lib.js'
import { Icon } from './ui.jsx'

export default function Sidebar({ phases, active, onNavigate, retreat, vendors, participants, tasks, onExit }) {
  const [open, setOpen] = useState(false)
  const today = toISO(new Date())
  const daysToGo = retreat.startDate ? daysBetween(today, retreat.startDate) : null

  const progress = {
    vendors: vendors.length ? Math.round(vendors.filter((v) => v.status !== 'pending').length / vendors.length * 100) : null,
    participants: retreat.target ? Math.round(participants.length / retreat.target * 100) : null,
    control: tasks.length ? Math.round(tasks.filter((t) => t.done).length / tasks.length * 100) : null,
  }

  const allStages = phases.flatMap((p) => p.sub ? p.sub : [p])
  const activeLabel = allStages.find((s) => s.key === active)?.label
  const go = (k) => { onNavigate(k); setOpen(false) }

  const Item = ({ s, nested }) => {
    const isActive = active === s.key
    const pct = progress[s.key]
    return (
      <button onClick={() => go(s.key)}
        className={`group w-full rounded-lg px-3 py-2.5 text-left transition ${nested ? 'ml-2' : ''} ${
          isActive ? 'bg-white shadow-sm text-emerald-950' : 'text-emerald-800 hover:bg-emerald-200/60'
        }`}>
        <span className="flex items-center gap-3">
          <span className={`size-9 shrink-0 grid place-items-center rounded-lg ${
            isActive ? 'bg-emerald-700 text-white' : 'bg-white ring-1 ring-emerald-200 text-emerald-700'
          }`}><Icon name={s.iconName} size={nested ? 'sm' : 'md'} /></span>
          <span className="flex-1 min-w-0">
            <span className="font-semibold">{s.label}</span>
            <span className={`block text-xs truncate ${isActive ? 'text-emerald-700/80' : 'text-emerald-700/50'}`}>{s.desc}</span>
          </span>
          {pct != null && <span className={`text-xs font-semibold tabular-nums ${isActive ? 'text-emerald-600' : 'text-emerald-600/50'}`}>{pct}%</span>}
        </span>
        {pct != null && (
          <span className="mt-2 block h-0.5 rounded-full bg-emerald-900/10 overflow-hidden">
            <span className={`block h-full rounded-full transition-[width] duration-500 ${isActive ? 'bg-emerald-600' : 'bg-emerald-500/50'}`} style={{ width: `${pct}%` }} />
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-emerald-100 text-emerald-900">
        <button onClick={() => setOpen((o) => !o)}><Icon name="Menu" size="lg" /></button>
        <div className="font-semibold">Retreat OS</div>
        <span className="text-xs bg-white rounded-full px-2 py-1">{activeLabel}</span>
      </div>

      <aside className={`${open ? 'block' : 'hidden'} lg:block lg:sticky lg:top-0 lg:h-screen w-full lg:w-72 shrink-0 bg-emerald-100 text-emerald-900 flex flex-col`} style={{ boxShadow: 'var(--shadow-rail)' }}>
        <div className="px-5 pt-5 pb-4">
          <button onClick={onExit} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition mb-4">
            <Icon name="ChartNoAxesColumn" size="xs" className="rotate-180 scale-x-[-1]" /> My retreats
          </button>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-emerald-700 grid place-items-center text-white"><Icon name="Sprout" size="md" /></div>
            <div className="leading-tight">
              <div className="font-semibold tracking-tight text-emerald-950">Retreat OS</div>
              <div className="text-xs text-emerald-700/70">retreat management</div>
            </div>
          </div>
        </div>

        <div className="mx-4 mb-4 rounded-2xl bg-white ring-1 ring-emerald-200 p-4">
          <div className="text-xs text-emerald-700/70 font-semibold mb-1 uppercase tracking-wide">Current retreat</div>
          <div className="font-semibold leading-snug text-emerald-950">{retreat.name || 'Untitled retreat'}</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 mt-1.5"><Icon name="Calendar" size="xs" className="text-emerald-600" /> {fmtRange(retreat.startDate, retreat.endDate)}</div>
          {retreat.location && <div className="flex items-center gap-1.5 text-xs text-emerald-700 mt-0.5"><Icon name="MapPin" size="xs" className="text-emerald-600" /> {retreat.location}</div>}
          {daysToGo != null && daysToGo >= 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-100 text-amber-800 ring-1 ring-amber-200 rounded-full px-2.5 py-1">
              <Icon name="Timer" size="xs" /> {daysToGo} days to go
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto nice-scroll">
          {phases.map((p) => {
            if (!p.sub) return <Item key={p.key} s={p} />
            const childActive = p.sub.some((s) => s.key === active)
            return (
              <div key={p.key}>
                <div className={`flex items-center gap-2 px-3 pt-3 pb-1.5 ${childActive ? 'text-emerald-800' : 'text-emerald-700/60'}`}>
                  <Icon name={p.iconName} size="xs" />
                  <span className="text-xs font-semibold tracking-wide uppercase">{p.label}</span>
                </div>
                <div className="space-y-1 pl-2 border-l border-emerald-300/60 ml-3">
                  {p.sub.map((s) => <Item key={s.key} s={s} nested />)}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="p-4">
          <button onClick={onExit} className="w-full text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-white ring-1 ring-emerald-200 hover:bg-emerald-50 rounded-lg py-2.5 transition">
            Back to all retreats
          </button>
        </div>
      </aside>
    </>
  )
}
