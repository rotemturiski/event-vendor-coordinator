import { useState } from 'react'
import {
  PAY_STATUS, money, fmtRange, cryptoId, QUESTION_TYPES, defaultQuestionnaire,
  collectedFrom, DEPOSIT_PCT, dietSummary,
} from '../../lib.js'
import { PageHeader, Card, Btn, Field, Select, Textarea, Label, Stat, Empty, Chip, Icon } from '../ui.jsx'

const PAY_OPTIONS = Object.entries(PAY_STATUS).map(([value, p]) => ({ value, label: p.label }))
const TYPE_OPTIONS = Object.entries(QUESTION_TYPES).map(([value, t]) => ({ value, label: t.label }))

export default function Participants({ retreat, participants, api, setQuestionnaire, setRegPrice }) {
  const [tab, setTab] = useState('roster')
  const questionnaire = retreat.questionnaire?.length ? retreat.questionnaire : defaultQuestionnaire()
  const regPrice = Number(retreat.regPrice) || 0

  return (
    <div>
      <PageHeader step={3} total={4} icon="Users" title="Participants & registration"
        subtitle="Build the pre-retreat questionnaire, register guests, and track payments."
        actions={
          <div className="flex items-center gap-1 bg-white rounded-lg ring-1 ring-stone-200 p-1">
            {[['roster', 'Roster', 'Users'], ['questionnaire', 'Questionnaire', 'ClipboardList']].map(([k, l, ic]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex items-center gap-1.5 text-sm font-semibold rounded-md px-3 py-1.5 transition ${tab === k ? 'bg-emerald-700 text-white' : 'text-stone-500'}`}>
                <Icon name={ic} size="xs" /> {l}
              </button>
            ))}
          </div>
        } />

      {tab === 'roster'
        ? <Roster retreat={retreat} participants={participants} api={api} questionnaire={questionnaire} regPrice={regPrice} />
        : <Builder questionnaire={questionnaire} setQuestionnaire={setQuestionnaire} regPrice={regPrice} setRegPrice={setRegPrice} />}
    </div>
  )
}

// ── ROSTER ──────────────────────────────────────────────────────────────────
function Roster({ retreat, participants, api, questionnaire, regPrice }) {
  const [modal, setModal] = useState(null) // null | 'new' | participant object (edit)

  const target = Number(retreat.target) || 0
  const fillPct = target ? Math.round(participants.length / target * 100) : 0
  const paidCount = participants.filter((p) => p.pay === 'paid').length
  const collected = collectedFrom(participants, regPrice)
  const expected = participants.length * regPrice
  const outstanding = Math.max(0, expected - collected)

  const submit = (data) => {
    const diet = dietSummary(data.answers, questionnaire)
    if (modal === 'new') api.add({ id: cryptoId(), ...data, diet })
    else api.update(modal.id, { ...data, diet })
    setModal(null)
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat icon="Users" label="Registered" value={`${participants.length}${target ? `/${target}` : ''}`} sub={target ? `${fillPct}% full` : 'Set a target in Planning'} tone="emerald" progress={target ? fillPct : null} />
        <Stat icon="Wallet" label="Collected" value={money(collected)} sub={regPrice ? `of ${money(expected)} expected` : 'Set a price →'} tone="amber" />
        <Stat icon="Receipt" label="Outstanding" value={money(outstanding)} sub={`${participants.length - paidCount} not fully paid`} tone={outstanding ? 'rose' : 'stone'} />
        <Stat icon="CheckCircle2" label="Paid in full" value={paidCount} sub={`of ${participants.length}`} tone="emerald" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Btn icon="Plus" onClick={() => setModal('new')}>Register guest</Btn>
        {regPrice === 0 && <Chip tone="amber" icon="Lightbulb">Set a registration price in the Questionnaire tab</Chip>}
      </div>

      <Card pad={false}>
        {participants.length === 0 ? <Empty icon="Users">No participants yet — register your first guest.</Empty> : (
          <div className="divide-y divide-stone-100">
            {participants.map((p) => (
              <ParticipantRow key={p.id} p={p} api={api} questionnaire={questionnaire} onEdit={() => setModal(p)} />
            ))}
          </div>
        )}
      </Card>

      {modal && (
        <RegistrationForm
          questionnaire={questionnaire} regPrice={regPrice} retreat={retreat}
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)} onSubmit={submit}
        />
      )}
    </div>
  )
}

function ParticipantRow({ p, api, questionnaire, onEdit }) {
  const ps = PAY_STATUS[p.pay] || PAY_STATUS.unpaid
  const answered = questionnaire.filter((q) => { const v = p.answers?.[q.id]; return Array.isArray(v) ? v.length : v })
  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-stone-50/60 transition">
      <div className="size-9 rounded-full bg-emerald-100 text-emerald-800 grid place-items-center font-semibold text-sm shrink-0">{(p.name || '?').charAt(0)}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-stone-800 text-sm">{p.name}</div>
        <div className="text-xs text-stone-400 flex items-center gap-2 flex-wrap">
          {p.phone && <span>{p.phone}</span>}
          {answered.slice(0, 3).map((q) => {
            const v = p.answers[q.id]
            const txt = Array.isArray(v) ? v.join(', ') : String(v)
            const isHealth = /diet|allerg/i.test(q.label) || q.id === 'dietary' || q.id === 'allergies'
            return <span key={q.id} className={`flex items-center gap-1 ${isHealth ? 'text-amber-600 font-medium' : ''}`}>
              {isHealth && <Icon name="Salad" size="xs" />}<span className="truncate max-w-[12rem]">{txt}</span>
            </span>
          })}
          {answered.length === 0 && p.diet && <span className="flex items-center gap-1 text-amber-600 font-medium"><Icon name="Salad" size="xs" /> {p.diet}</span>}
          {answered.length === 0 && p.note && <span className="text-stone-400">· {p.note}</span>}
        </div>
      </div>
      <Chip as="button" tone={ps.tone} onClick={() => api.update(p.id, { pay: p.pay === 'unpaid' ? 'deposit' : p.pay === 'deposit' ? 'paid' : 'unpaid' })}>{ps.label}</Chip>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={onEdit} title="Edit" className="text-stone-300 hover:text-emerald-600 transition"><Icon name="PenLine" size="sm" /></button>
        <button onClick={() => api.remove(p.id)} title="Remove" className="text-stone-300 hover:text-rose-500 transition"><Icon name="X" size="sm" /></button>
      </div>
    </div>
  )
}

// ── REGISTRATION FORM (schema-driven) ───────────────────────────────────────
function RegistrationForm({ questionnaire, regPrice, retreat, initial, onClose, onSubmit }) {
  const [core, setCore] = useState({
    name: initial?.name || '', phone: initial?.phone || '', email: initial?.email || '', pay: initial?.pay || 'unpaid',
  })
  const [answers, setAnswers] = useState(initial?.answers || {})
  const [error, setError] = useState('')
  const setC = (k, v) => setCore((c) => ({ ...c, [k]: v }))
  const setA = (id, v) => setAnswers((a) => ({ ...a, [id]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (!core.name.trim()) { setError('Name is required'); return }
    const missing = questionnaire.find((q) => q.required && !(Array.isArray(answers[q.id]) ? answers[q.id].length : answers[q.id]))
    if (missing) { setError(`“${missing.label}” is required`); return }
    onSubmit({ name: core.name.trim(), phone: core.phone.trim(), email: core.email.trim(), pay: core.pay, answers })
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm grid place-items-center p-4 fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden card fade-up flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="h-24 shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-end p-4">
          <div className="text-white">
            <div className="text-lg font-semibold">{retreat.name || 'Your retreat'}</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-50"><Icon name="Calendar" size="xs" /> {fmtRange(retreat.startDate, retreat.endDate)}{retreat.location ? ` · ${retreat.location}` : ''}</div>
          </div>
        </div>
        <form onSubmit={submit} className="p-5 overflow-y-auto nice-scroll space-y-3">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{initial ? 'Edit registration' : 'Guest registration'}</div>
          <Field label="Full name *" value={core.name} onChange={(v) => setC('name', v)} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" value={core.phone} onChange={(v) => setC('phone', v)} />
            <Field label="Email" value={core.email} onChange={(v) => setC('email', v)} />
          </div>

          {questionnaire.map((q) => (
            <QuestionInput key={q.id} q={q} value={answers[q.id]} onChange={(v) => setA(q.id, v)} />
          ))}

          <Select label={`Payment status${regPrice ? ` · ${money(regPrice)} per guest` : ''}`} value={core.pay} onChange={(v) => setC('pay', v)} options={PAY_OPTIONS} />
          {regPrice > 0 && (
            <div className="text-xs text-stone-400">
              {core.pay === 'paid' ? `Counts as ${money(regPrice)} collected.`
                : core.pay === 'deposit' ? `Deposit counts as ${money(Math.round(regPrice * DEPOSIT_PCT))} (${Math.round(DEPOSIT_PCT * 100)}%).`
                : 'Nothing collected yet.'}
            </div>
          )}

          {error && <div className="text-xs font-medium text-rose-600">{error}</div>}
          <div className="flex justify-end gap-2 pt-1">
            <Btn type="button" variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn type="submit" icon={initial ? 'Check' : 'CreditCard'}>{initial ? 'Save' : 'Register'}</Btn>
          </div>
        </form>
      </div>
    </div>
  )
}

function QuestionInput({ q, value, onChange }) {
  const label = q.label + (q.required ? ' *' : '')
  if (q.type === 'textarea') return <Textarea label={label} value={value || ''} onChange={onChange} rows={3} />
  if (q.type === 'single') {
    return <Select label={label} value={value || ''} onChange={onChange}
      options={[{ value: '', label: 'Select…' }, ...q.options.map((o) => ({ value: o, label: o }))]} />
  }
  if (q.type === 'multi') {
    const arr = Array.isArray(value) ? value : []
    const toggle = (o) => onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o])
    return (
      <div>
        <Label>{label}</Label>
        <div className="flex flex-wrap gap-1.5">
          {q.options.map((o) => (
            <Chip as="button" type="button" key={o} tone={arr.includes(o) ? 'emerald' : 'stone'} onClick={() => toggle(o)}>
              {arr.includes(o) && <Icon name="Check" size="xs" />}{o}
            </Chip>
          ))}
        </div>
      </div>
    )
  }
  return <Field label={label} value={value || ''} onChange={onChange} />
}

// ── QUESTIONNAIRE BUILDER ───────────────────────────────────────────────────
function Builder({ questionnaire, setQuestionnaire, regPrice, setRegPrice }) {
  const update = (id, patch) => setQuestionnaire(questionnaire.map((q) => q.id === id ? { ...q, ...patch } : q))
  const remove = (id) => setQuestionnaire(questionnaire.filter((q) => q.id !== id))
  const add = () => setQuestionnaire([...questionnaire, { id: cryptoId(), label: 'New question', type: 'text', options: [], required: false }])
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= questionnaire.length) return
    const next = questionnaire.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setQuestionnaire(next)
  }
  const reset = () => setQuestionnaire(defaultQuestionnaire())

  return (
    <div className="grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
      <div className="space-y-4 min-w-0">
        <Card className="fade-up">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label>Registration price (per guest)</Label>
              <input type="number" value={regPrice || ''} onChange={(e) => setRegPrice(parseInt(e.target.value) || 0)}
                placeholder="0" className="w-40 text-sm bg-white rounded-lg px-3 py-2.5 ring-1 ring-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition" />
            </div>
            <div className="text-xs text-stone-400 text-right max-w-[14rem]">Drives the “Collected” figure on the Roster (paid = full, deposit = {Math.round(DEPOSIT_PCT * 100)}%).</div>
          </div>
        </Card>

        <div className="flex items-center gap-2">
          <Btn icon="Plus" onClick={add}>Add question</Btn>
          <Btn variant="ghost" onClick={reset}>Reset to default</Btn>
        </div>

        {questionnaire.map((q, i) => (
          <QuestionEditor key={q.id} q={q} i={i} total={questionnaire.length} update={update} remove={remove} move={move} />
        ))}
        {questionnaire.length === 0 && <Card><Empty icon="ClipboardList">No questions — add one or reset to the default template.</Empty></Card>}
      </div>

      {/* live preview */}
      <aside className="lg:sticky lg:top-7 self-start fade-up">
        <Card pad={false} className="overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
            <Icon name="Sparkles" size="sm" className="text-emerald-600" />
            <span className="text-sm font-semibold text-stone-800">Live preview</span>
          </div>
          <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto nice-scroll">
            <div className="text-sm text-stone-400 bg-stone-50 ring-1 ring-stone-200 rounded-lg px-3 py-2.5">Full name *</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-stone-400 bg-stone-50 ring-1 ring-stone-200 rounded-lg px-3 py-2.5">Phone</div>
              <div className="text-sm text-stone-400 bg-stone-50 ring-1 ring-stone-200 rounded-lg px-3 py-2.5">Email</div>
            </div>
            {questionnaire.map((q) => (
              <div key={q.id}>
                <div className="text-xs font-semibold text-stone-500 mb-1">{q.label}{q.required ? ' *' : ''}</div>
                {(q.type === 'single' || q.type === 'multi')
                  ? <div className="flex flex-wrap gap-1.5">{q.options.length ? q.options.map((o) => <span key={o} className="text-xs text-stone-500 bg-stone-100 rounded-full px-2.5 py-1">{o}</span>) : <span className="text-xs text-stone-300">No options yet</span>}</div>
                  : <div className={`text-sm text-stone-300 bg-stone-50 ring-1 ring-stone-200 rounded-lg px-3 ${q.type === 'textarea' ? 'py-4' : 'py-2.5'}`}>{QUESTION_TYPES[q.type].label}</div>}
              </div>
            ))}
            <div className="flex items-center justify-center gap-2 text-white font-semibold bg-emerald-700 rounded-lg py-3 mt-2"><Icon name="CreditCard" size="sm" /> Register{regPrice ? ` · ${money(regPrice)}` : ''}</div>
          </div>
        </Card>
      </aside>
    </div>
  )
}

function QuestionEditor({ q, i, total, update, remove, move }) {
  const hasOptions = q.type === 'single' || q.type === 'multi'
  // local string mirror so typing options stays smooth (parent stores the array)
  const [optStr, setOptStr] = useState(q.options.join(', '))
  const onType = (t) => update(q.id, { type: t, options: (t === 'single' || t === 'multi') && q.options.length === 0 ? ['Option 1', 'Option 2'] : q.options })
  const onOpts = (s) => { setOptStr(s); update(q.id, { options: s.split(',').map((x) => x.trim()).filter(Boolean) }) }

  return (
    <Card className="fade-up">
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5 pt-1">
          <button onClick={() => move(i, -1)} disabled={i === 0} className="text-stone-300 hover:text-stone-600 disabled:opacity-30 transition"><Icon name="ChevronUp" size="sm" /></button>
          <button onClick={() => move(i, 1)} disabled={i === total - 1} className="text-stone-300 hover:text-stone-600 disabled:opacity-30 transition"><Icon name="ChevronDown" size="sm" /></button>
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <Field label="Question" value={q.label} onChange={(v) => update(q.id, { label: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={q.type} onChange={onType} options={TYPE_OPTIONS} />
            <label className="flex items-end gap-2 pb-2.5 cursor-pointer">
              <input type="checkbox" checked={q.required} onChange={(e) => update(q.id, { required: e.target.checked })} className="size-4 accent-emerald-600" />
              <span className="text-sm text-stone-600 font-medium">Required</span>
            </label>
          </div>
          {hasOptions && <Field label="Options (comma-separated)" value={optStr} onChange={onOpts} placeholder="Option 1, Option 2, Option 3" />}
        </div>
        <button onClick={() => remove(q.id)} title="Remove question" className="text-stone-300 hover:text-rose-500 transition pt-1"><Icon name="X" size="sm" /></button>
      </div>
    </Card>
  )
}
