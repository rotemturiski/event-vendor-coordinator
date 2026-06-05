import { useState } from 'react'
import { PageHeader, Card, Field, SectionTitle, Stat, Empty, Chip, Icon } from '../ui.jsx'

const QUICK = ['Room not ready', 'Food / dietary issue', 'Transport delay', 'AV glitch in session', 'Late arrival']

export default function During({ participants, issues, issueApi, agenda, arrived = {}, onToggleArrived }) {
  const [issueText, setIssueText] = useState('')
  const checkIn = (id) => onToggleArrived(id)
  const arrivedCount = participants.filter((p) => arrived[p.id]).length
  const openIssues = issues.filter((i) => !i.done).length

  const addIssue = (text) => { const t = (text ?? issueText).trim(); if (!t) return; issueApi.add({ text: t }); setIssueText('') }

  return (
    <div>
      <PageHeader icon="Zap" title="During the retreat"
        subtitle="Check guests in, handle issues in real time, and keep the team aligned." />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <Stat icon="CheckCircle2" label="Arrived" value={`${arrivedCount}/${participants.length}`} tone="emerald" progress={participants.length ? Math.round(arrivedCount / participants.length * 100) : null} />
        <Stat icon="Wrench" label="Open issues" value={openIssues} tone={openIssues ? 'rose' : 'stone'} />
        <Stat icon="CalendarDays" label="Program days" value={agenda.length} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card pad={false} className="fade-up">
          <div className="px-5 pt-4 pb-2"><SectionTitle icon="DoorOpen" hint="Tap to mark arrival">Check-in</SectionTitle></div>
          <div className="max-h-[58vh] overflow-y-auto nice-scroll divide-y divide-stone-100">
            {participants.length === 0 && <Empty icon="Users">No participants.</Empty>}
            {participants.map((p) => (
              <button key={p.id} onClick={() => checkIn(p.id)} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-stone-50/60 transition">
                <span className={`size-6 shrink-0 rounded-full grid place-items-center ring-1 ${arrived[p.id] ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white ring-stone-300'}`}>{arrived[p.id] && <Icon name="Check" size="xs" strokeWidth={3} className="pop-check" />}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${arrived[p.id] ? 'text-stone-400' : 'text-stone-800'}`}>{p.name}</div>
                  {p.diet && <div className="flex items-center gap-1 text-xs text-amber-600 font-medium"><Icon name="Salad" size="xs" /> {p.diet}</div>}
                </div>
                {arrived[p.id] && <span className="text-xs font-semibold text-emerald-600">Arrived</span>}
              </button>
            ))}
          </div>
        </Card>

        <Card className="fade-up">
          <SectionTitle icon="Wrench">Issues & team tasks</SectionTitle>
          <div className="flex gap-2 mb-2">
            <Field className="flex-1" value={issueText} onChange={setIssueText} placeholder="Describe an issue / urgent task…" onKeyDown={(e) => e.key === 'Enter' && addIssue()} />
            <button onClick={() => addIssue()} className="self-stretch px-4 rounded-lg bg-emerald-700 text-white grid place-items-center transition active:scale-[0.98]"><Icon name="Plus" size="sm" /></button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUICK.map((q) => <Chip as="button" key={q} tone="stone" onClick={() => addIssue(q)}>{q}</Chip>)}
          </div>
          <div className="space-y-2 max-h-[40vh] overflow-y-auto nice-scroll">
            {issues.length === 0 && <Empty icon="CheckCircle2">No open issues — all calm</Empty>}
            {issues.map((i) => (
              <div key={i.id} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 ring-1 ${i.done ? 'bg-stone-50 ring-stone-200' : 'bg-rose-50 ring-rose-200'}`}>
                <button onClick={() => issueApi.toggle(i.id)} className={`size-5 shrink-0 rounded-md grid place-items-center ring-1 ${i.done ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white ring-rose-300'}`}>{i.done && <Icon name="Check" size="xs" strokeWidth={3} className="pop-check" />}</button>
                <span className={`flex-1 text-sm font-medium ${i.done ? 'line-through text-stone-400' : 'text-rose-800'}`}>{i.text}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
