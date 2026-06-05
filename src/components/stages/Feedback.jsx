import { useState } from 'react'
import { summarizeFeedback } from '../../lib.js'
import { PageHeader, Card, SectionTitle, Stat, Btn, Field, Empty, Chip, Icon } from '../ui.jsx'

const EMPTY = { guest: '', loved: '', improve: '', nps: '' }

export default function Feedback({ participants, surveySent, onSend, responses = [], responseApi }) {
  const [form, setForm] = useState(EMPTY)
  const [adding, setAdding] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const summary = summarizeFeedback(responses)

  const submit = (e) => {
    e.preventDefault()
    if (!form.loved.trim() && !form.improve.trim() && form.nps === '') return
    responseApi.add({ guest: form.guest.trim(), loved: form.loved.trim(), improve: form.improve.trim(), nps: form.nps === '' ? null : Number(form.nps) })
    setForm(EMPTY); setAdding(false)
  }

  return (
    <div>
      <PageHeader icon="MessageSquare" title="Guest feedback"
        subtitle="Send a survey, log the responses, and let AI summarize what to keep and what to change."
        actions={<Btn icon="Plus" onClick={() => setAdding((a) => !a)}>{adding ? 'Close' : 'Log response'}</Btn>} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <Stat icon="Users" label="Invited" value={participants.length} />
        <Stat icon="MessageSquare" label="Responses" value={responses.length} tone="emerald" progress={participants.length ? Math.round(responses.length / participants.length * 100) : null} />
        <Stat icon="ChartNoAxesColumn" label="NPS" value={summary?.npsScore != null ? summary.npsScore : '—'} tone={summary?.npsScore >= 50 ? 'emerald' : summary?.npsScore < 0 ? 'rose' : 'amber'} />
      </div>

      {adding && (
        <Card className="mb-4 bg-stone-50 fade-up">
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
            <Field label="Guest (optional)" value={form.guest} onChange={(v) => set('guest', v)} placeholder="Dana" />
            <Field label="NPS (0–10)" type="number" min="0" max="10" value={form.nps} onChange={(v) => set('nps', v)} placeholder="9" />
            <Field className="sm:col-span-2" label="What they loved" value={form.loved} onChange={(v) => set('loved', v)} placeholder="The morning yoga and the food" />
            <Field className="sm:col-span-2" label="What to improve" value={form.improve} onChange={(v) => set('improve', v)} placeholder="Rooms were cold, transport was late" />
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Btn type="button" variant="ghost" onClick={() => { setForm(EMPTY); setAdding(false) }}>Cancel</Btn>
              <Btn type="submit">Save response</Btn>
            </div>
          </form>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* survey + responses */}
        <Card className="fade-up" pad={false}>
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <SectionTitle icon="Send">Survey & responses</SectionTitle>
            {surveySent
              ? <Chip tone="emerald" icon="CheckCircle2">Sent</Chip>
              : <Btn variant="soft" icon="Send" onClick={onSend} disabled={participants.length === 0}>Send survey</Btn>}
          </div>
          {responses.length === 0 ? (
            <div className="px-5 pb-6">
              <Empty icon="Inbox">
                <div className="font-semibold text-stone-700 text-sm">No responses yet</div>
                <p className="text-stone-500 text-xs mt-1 max-w-xs mx-auto">Send the survey, then log what guests reply with “Log response” — the AI summary builds itself.</p>
              </Empty>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 max-h-[48vh] overflow-y-auto nice-scroll">
              {responses.map((r) => (
                <div key={r.id} className="group px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-800 text-sm">{r.guest || 'Anonymous'}</span>
                    {r.nps != null && <Chip tone={r.nps >= 9 ? 'emerald' : r.nps <= 6 ? 'rose' : 'amber'}>NPS {r.nps}</Chip>}
                    <button onClick={() => responseApi.remove(r.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 transition"><Icon name="X" size="sm" /></button>
                  </div>
                  {r.loved && <div className="text-xs text-stone-500 mt-1 flex gap-1.5"><Icon name="ThumbsUp" size="xs" className="text-emerald-600 shrink-0 mt-0.5" /> {r.loved}</div>}
                  {r.improve && <div className="text-xs text-stone-500 mt-0.5 flex gap-1.5"><Icon name="Wrench" size="xs" className="text-amber-600 shrink-0 mt-0.5" /> {r.improve}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* AI analysis */}
        <Card tone="violet" className="fade-up">
          <SectionTitle icon="Sparkles" hint="AI summary">Feedback analysis</SectionTitle>
          {!summary ? (
            <div className="text-center py-6">
              <Empty icon="Brain">
                <div className="font-semibold text-stone-700 text-sm">Waiting for responses</div>
                <p className="text-stone-500 text-xs mt-1 max-w-xs mx-auto">Once you log responses, AI groups the open text into themes — loved, to-improve, and a recommendation for next time.</p>
              </Empty>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg bg-white ring-1 ring-stone-200 p-3 text-center">
                  <div className="text-2xl font-semibold text-stone-800 tabular-nums">{summary.npsScore ?? '—'}</div>
                  <div className="text-xs text-stone-400">NPS score</div>
                </div>
                <div className="flex-1 rounded-lg bg-white ring-1 ring-stone-200 p-3 text-center">
                  <div className="text-2xl font-semibold text-stone-800 tabular-nums">{summary.avgNps ?? '—'}</div>
                  <div className="text-xs text-stone-400">Avg score</div>
                </div>
              </div>

              {summary.loved.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-stone-400 mb-1.5 flex items-center gap-1"><Icon name="ThumbsUp" size="xs" className="text-emerald-600" /> Loved</div>
                  <div className="flex flex-wrap gap-1.5">{summary.loved.map((t) => <Chip key={t.word} tone="emerald">{t.word} · {t.count}</Chip>)}</div>
                </div>
              )}
              {summary.improve.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-stone-400 mb-1.5 flex items-center gap-1"><Icon name="Wrench" size="xs" className="text-amber-600" /> To improve</div>
                  <div className="flex flex-wrap gap-1.5">{summary.improve.map((t) => <Chip key={t.word} tone="amber">{t.word} · {t.count}</Chip>)}</div>
                </div>
              )}

              <div className="rounded-lg bg-white ring-1 ring-violet-200 p-3 text-sm text-stone-600 leading-snug flex gap-2">
                <Icon name="Sparkles" size="sm" className="text-violet-500 shrink-0 mt-0.5" />
                <span>{summary.recommendation}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
