import { useMemo, useRef, useState } from 'react'
import {
  CATEGORIES, STATUS, catById, parseCSV, cryptoId, CSV_TEMPLATE,
  fmtDate, fmtCountdown, money, generateDraft, planRetreat,
} from '../../lib.js'
import { PageHeader, Card, Btn, Field, Label, Empty, Chip, Icon, Textarea, TILE_TONES } from '../ui.jsx'

const EMPTY = { name: '', category: 'venue', contactName: '', phone: '', email: '', deliverable: '', daysBefore: 14, price: '' }
const TONE_LABEL = { warm: 'Warm & personal', short: 'Short & direct', formal: 'Formal' }
const URGENCY_TONE = { overdue: 'rose', urgent: 'orange', soon: 'amber', calm: 'stone' }

export default function Vendors({
  retreat, enrichedVendors, vendorApi, prefs, learnedTone, feedbackCount, onFeedback,
  senderName, setSenderName, learningProfile = {}, onPlanningSignal = () => {},
}) {
  const [tab, setTab] = useState('manage')
  return (
    <div>
      <PageHeader step={2} total={5} icon="Handshake" title="Vendors"
        subtitle="Organize by category, track deliverables & deadlines, and let the planner find what you’re missing."
        actions={
          <div className="flex items-center gap-1 bg-white rounded-lg ring-1 ring-stone-200 p-1">
            {[['manage', 'Manage', 'ClipboardList'], ['find', 'Find for me', 'Sparkles'], ['ai', 'Reminders', 'Bell']].map(([k, l, ic]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex items-center gap-1.5 text-sm font-semibold rounded-md px-3 py-1.5 transition ${tab === k ? 'bg-emerald-700 text-white' : 'text-stone-500'}`}>
                <Icon name={ic} size="xs" /> {l}
              </button>
            ))}
          </div>
        } />
      {tab === 'manage' && <Manage vendors={enrichedVendors} api={vendorApi} />}
      {tab === 'find' && <Discover retreat={retreat} api={vendorApi} learningProfile={learningProfile} onSignal={onPlanningSignal} onGoManage={() => setTab('manage')} />}
      {tab === 'ai' && <Copilot vendors={enrichedVendors} retreat={retreat} prefs={prefs} learnedTone={learnedTone}
        feedbackCount={feedbackCount} onFeedback={onFeedback} senderName={senderName} setSenderName={setSenderName} />}
    </div>
  )
}

function Manage({ vendors, api }) {
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(EMPTY)
  const [toast, setToast] = useState('')
  const fileRef = useRef(null)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2200) }

  const counts = useMemo(() => { const c = {}; vendors.forEach((v) => { c[v.category] = (c[v.category] || 0) + 1 }); return c }, [vendors])
  const shown = filter === 'all' ? vendors : vendors.filter((v) => v.category === filter)
  const openAdd = () => { setForm({ ...EMPTY, category: filter !== 'all' ? filter : 'venue' }); setAdding(true) }

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    api.add([{ ...form, id: cryptoId(), daysBefore: parseInt(form.daysBefore) || 0, price: parseInt(String(form.price).replace(/[^\d]/g, '')) || 0, deliverable: form.deliverable.trim() || 'Coordinate details', status: 'pending' }])
    setForm(EMPTY); setAdding(false); flash('Vendor added')
  }
  const onFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader()
    r.onload = () => { const rows = parseCSV(String(r.result)); if (rows.length) { api.add(rows); flash(`Imported ${rows.length} vendors`) } else flash('No valid rows found') }
    r.readAsText(file, 'utf-8'); e.target.value = ''
  }
  const dlTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'vendors-template.csv'; a.click()
  }

  return (
    <div>
      {/* category breakdown */}
      <div className="flex items-center gap-1.5 overflow-x-auto nice-scroll pb-2 mb-4">
        <CatChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" count={vendors.length} />
        {CATEGORIES.map((c) => (
          <CatChip key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)} icon={c.iconName} label={c.label} count={counts[c.key] || 0} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Btn icon="Plus" onClick={() => adding ? setAdding(false) : openAdd()}>{adding ? 'Close' : 'New vendor'}</Btn>
        <Btn variant="soft" icon="Upload" onClick={() => fileRef.current?.click()}>Import CSV</Btn>
        <button onClick={dlTemplate} className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold"><Icon name="Download" size="xs" /> Template</button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
        {toast && <Chip tone="emerald" icon="CheckCircle2" className="fade-in">{toast}</Chip>}
      </div>

      {adding && (
        <Card className="mb-4 bg-stone-50 fade-up">
          <VendorForm form={form} set={set} onSubmit={submit} submitLabel="Add vendor" onCancel={() => { setForm(EMPTY); setAdding(false) }} />
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {shown.length === 0 && (
          <div className="sm:col-span-2"><Card><Empty icon={filter === 'all' ? 'Handshake' : catById(filter).iconName}>
            {filter === 'all' ? 'No vendors yet — add one, import a CSV, or try “Find for me”.' : `No ${catById(filter).label.toLowerCase()} vendors yet.`}
          </Empty></Card></div>
        )}
        {shown.map((v, i) => <VendorCard key={v.id} v={v} api={api} i={i} />)}
      </div>
    </div>
  )
}

function CatChip({ active, onClick, icon, label, count }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 ring-1 transition ${active ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white text-stone-600 ring-stone-200 hover:ring-stone-300'}`}>
      {icon && <Icon name={icon} size="xs" />} {label}
      <span className={`tabular-nums ${active ? 'text-emerald-200' : 'text-stone-400'}`}>{count}</span>
    </button>
  )
}

// Shared form body — used for both adding a vendor and editing an existing one.
function VendorForm({ form, set, onSubmit, submitLabel, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
      <Field className="col-span-2" label="Vendor name" value={form.name} onChange={(v) => set('name', v)} placeholder="Mountain Estate" autoFocus />
      <div className="col-span-2">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button type="button" key={c.key} onClick={() => set('category', c.key)}
              className={`flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 ring-1 transition ${form.category === c.key ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white text-stone-500 ring-stone-200'}`}>
              <Icon name={c.iconName} size="xs" /> {c.label}
            </button>
          ))}
        </div>
      </div>
      <Field label="Contact" value={form.contactName} onChange={(v) => set('contactName', v)} />
      <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
      <Field className="col-span-2" label="Email" value={form.email} onChange={(v) => set('email', v)} />
      <Field className="col-span-2" label="Deliverable" value={form.deliverable} onChange={(v) => set('deliverable', v)} placeholder="Finalize menu" />
      <Field label="Days before event" type="number" value={form.daysBefore} onChange={(v) => set('daysBefore', v)} />
      <Field label="Price ($)" type="number" value={form.price} onChange={(v) => set('price', v)} />
      <div className="col-span-2 flex justify-end gap-2">
        {onCancel && <Btn type="button" variant="ghost" onClick={onCancel}>Cancel</Btn>}
        <Btn type="submit">{submitLabel}</Btn>
      </div>
    </form>
  )
}

function VendorCard({ v, api, i }) {
  const cat = catById(v.category); const st = STATUS[v.status]; const cd = fmtCountdown(v.daysLeft)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => ({
    name: v.name, category: v.category, contactName: v.contactName || '', phone: v.phone || '',
    email: v.email || '', deliverable: v.deliverable || '', daysBefore: v.daysBefore, price: v.price || '',
  }))
  const set = (k, val) => setForm((f) => ({ ...f, [k]: val }))
  const save = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    api.update(v.id, {
      ...form,
      daysBefore: parseInt(form.daysBefore) || 0,
      price: parseInt(String(form.price).replace(/[^\d]/g, '')) || 0,
      deliverable: (form.deliverable || '').trim() || 'Coordinate details',
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <Card className="fade-up bg-stone-50">
        <VendorForm form={form} set={set} onSubmit={save} submitLabel="Save changes" onCancel={() => setEditing(false)} />
      </Card>
    )
  }

  return (
    <Card className="group fade-up" pad={false} style={{ animationDelay: `${i * 40}ms` }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`size-11 shrink-0 rounded-xl grid place-items-center ${TILE_TONES[cat.color] || TILE_TONES.stone}`}><Icon name={cat.iconName} size="md" /></div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-stone-800 truncate">{v.name}</div>
            <div className="text-xs text-stone-400">{cat.label}</div>
            <div className="flex items-center gap-1.5 text-sm text-stone-500 truncate mt-1"><Icon name="ClipboardList" size="xs" className="shrink-0 text-stone-400" /> {v.deliverable}</div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => setEditing(true)} title="Edit" className="text-stone-300 hover:text-emerald-600 transition"><Icon name="PenLine" size="sm" /></button>
            <button onClick={() => api.remove(v.id)} title="Remove" className="text-stone-300 hover:text-rose-500 transition"><Icon name="X" size="sm" /></button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2.5 text-xs text-stone-400">
          {v.contactName && <span className="flex items-center gap-1"><Icon name="User" size="xs" /> {v.contactName}</span>}
          {v.price > 0 && <span className="font-semibold text-stone-500">· {money(v.price)}</span>}
        </div>
        <div className="flex items-center justify-between mt-3 gap-2">
          <Chip as="button" tone={st.tone} dot={st.dot} onClick={() => api.cycle(v.id)}>{st.label}</Chip>
          <Chip tone={v.deadline ? URGENCY_TONE[cd.tone] : 'stone'}>
            {v.deadline ? `${fmtDate(v.deadline)} · ${cd.text}` : `${v.daysBefore}d before`}
          </Chip>
        </div>
      </div>
    </Card>
  )
}

function Copilot({ vendors, retreat, prefs, learnedTone, feedbackCount, onFeedback, senderName, setSenderName }) {
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState(''); const [loading, setLoading] = useState(false)
  const [channel, setChannel] = useState('whatsapp'); const [rated, setRated] = useState(false); const [copied, setCopied] = useState(false)
  const reminders = vendors.filter((v) => v.status !== 'done')
  const current = vendors.find((v) => v.id === selected)

  const run = (v) => { setSelected(v.id); setRated(false); setDraft(''); setLoading(true); setTimeout(() => { setDraft(generateDraft(v, retreat, channel, { ...prefs, senderName })); setLoading(false) }, 700) }
  const reChannel = (ch) => { setChannel(ch); if (current) setDraft(generateDraft(current, retreat, ch, { ...prefs, senderName })) }
  const copy = () => { navigator.clipboard?.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  const wa = () => { const p = (current?.phone || '').replace(/\D/g, '').replace(/^0/, '972'); window.open(`https://wa.me/${p}?text=${encodeURIComponent(draft)}`, '_blank') }
  const mail = () => window.open(`mailto:${current?.email || ''}?subject=${encodeURIComponent('Reminder · ' + (current?.deliverable || '') + ' — ' + (retreat.name || 'retreat'))}&body=${encodeURIComponent(draft)}`)
  const rate = (vote) => { onFeedback(prefs.tone, vote); setRated(true) }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card pad={false} className="fade-up">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <h2 className="font-semibold text-stone-800">Open reminders ({reminders.length})</h2>
          <label className="flex items-center gap-1 text-xs text-stone-500">From:
            <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="you" className="w-16 bg-stone-100 rounded-md px-2 py-1 font-semibold text-stone-700 outline-none" />
          </label>
        </div>
        <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto nice-scroll">
          {reminders.length === 0 && <Empty icon="CheckCircle2">No open tasks</Empty>}
          {reminders.map((v) => {
            const cat = catById(v.category); const cd = fmtCountdown(v.daysLeft); const urgent = cd.tone === 'overdue' || cd.tone === 'urgent'
            return (
              <button key={v.id} onClick={() => run(v)} className={`w-full text-left rounded-lg ring-1 p-3 transition hover:shadow-sm ${selected === v.id ? 'ring-emerald-400 bg-emerald-50/50' : 'ring-stone-200 bg-white'}`}>
                <div className="flex items-center gap-2">
                  <Icon name={cat.iconName} size="xs" className="text-stone-400" />
                  <span className="font-semibold text-stone-800 text-sm truncate flex-1">{v.name}</span>
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${urgent ? 'bg-rose-100 text-rose-600' : 'bg-stone-100 text-stone-500'}`}>{cd.text}</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-stone-500 truncate max-w-[65%]">{v.deliverable}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><Icon name="Wand2" size="xs" /> Draft</span>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="fade-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 font-semibold text-stone-800"><Icon name="Sparkles" size="sm" className="text-violet-500" /> Reminder draft</h2>
          <Chip tone="violet" icon="Brain">{TONE_LABEL[learnedTone]}</Chip>
        </div>
        {!loading && !draft && <Empty icon="Wand2">Pick a reminder on the left to draft a personal message.</Empty>}
        {loading && <div className="space-y-2"><div className="h-3.5 rounded shimmer w-5/6" /><div className="h-3.5 rounded shimmer w-full" /><div className="h-3.5 rounded shimmer w-2/3" /></div>}
        {!loading && draft && (
          <>
            <Textarea value={draft} onChange={setDraft} rows={Math.min(9, draft.split('\n').length + 1)} />
            <div className="flex items-center gap-1 mt-2.5 p-1 bg-stone-100 rounded-lg w-fit">
              {[['whatsapp', 'WhatsApp', 'MessageCircle'], ['email', 'Email', 'Mail']].map(([k, l, ic]) => (
                <button key={k} onClick={() => reChannel(k)} className={`flex items-center gap-1.5 text-xs font-semibold rounded-md px-2.5 py-1 transition ${channel === k ? 'bg-emerald-700 text-white' : 'text-stone-500'}`}><Icon name={ic} size="xs" /> {l}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2.5">
              <Btn className="col-span-2" icon={channel === 'whatsapp' ? 'MessageCircle' : 'Mail'} onClick={channel === 'whatsapp' ? wa : mail}>
                {channel === 'whatsapp' ? 'Send on WhatsApp' : 'Send email'}
              </Btn>
              <Btn variant="ghost" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Btn>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
              <span className="text-xs text-stone-400">{rated ? 'Thanks! Tone will adapt next time' : 'How’s the tone?'}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => rate('up')} disabled={rated} className="size-8 grid place-items-center rounded-lg ring-1 ring-stone-200 hover:bg-emerald-50 text-stone-500 disabled:opacity-40"><Icon name="ThumbsUp" size="sm" /></button>
                <button onClick={() => rate('down')} disabled={rated} className="size-8 grid place-items-center rounded-lg ring-1 ring-stone-200 hover:bg-rose-50 text-stone-500 disabled:opacity-40"><Icon name="ThumbsDown" size="sm" /></button>
              </div>
            </div>
          </>
        )}
        <div className="mt-4 rounded-lg bg-stone-50 ring-1 ring-stone-200 p-3 text-xs text-stone-500 leading-relaxed">
          Every draft uses the real vendor data (name, deliverable, computed deadline). {feedbackCount} ratings stored to tune the tone. In production this is sent as context to an LLM via <code className="bg-white px-1 rounded">/api/draft</code>.
        </div>
      </Card>
    </div>
  )
}

// ── Find for me: recommendations from the Planning preferences ────────────
function Discover({ retreat, api, learningProfile, onSignal, onGoManage }) {
  const [added, setAdded] = useState({}) // id -> true | 'dismissed'
  const plan = useMemo(() => planRetreat(retreat, learningProfile), [
    retreat.concept, retreat.budget, retreat.target, retreat.startDate, retreat.endDate, retreat.vendors, learningProfile,
  ])
  const live = plan.vendorSuggestions.filter((s) => added[s.id] !== 'dismissed')

  const add = (s) => {
    if (added[s.id] === true) return
    api.add([{ id: cryptoId(), name: s.label, category: s.category, contactName: '', phone: '', email: '', deliverable: s.deliverable, daysBefore: s.daysBefore, price: s.estPrice, status: 'pending' }])
    setAdded((a) => ({ ...a, [s.id]: true }))
    onSignal({ type: 'accept-vendor', category: s.category })
  }
  const dismiss = (s) => { setAdded((a) => ({ ...a, [s.id]: 'dismissed' })); onSignal({ type: 'reject-vendor', category: s.category }) }

  return (
    <div>
      <Card tone="emerald" className="mb-4 fade-up">
        <div className="flex items-start gap-3">
          <span className="size-9 shrink-0 grid place-items-center rounded-lg bg-emerald-700 text-white"><Icon name="Sparkles" size="md" /></span>
          <div className="flex-1">
            <div className="font-semibold text-stone-800">Find vendors for your retreat</div>
            <p className="text-sm text-stone-500 mt-0.5">
              Based on your Planning preferences — <b className="text-stone-700">{plan.profileLabel}</b>
              {retreat.budget ? `, ${money(retreat.budget)} budget` : ''}{retreat.target ? `, ${retreat.target} guests` : ''}.
              The more you accept or skip, the smarter the suggestions get.
            </p>
          </div>
        </div>
      </Card>

      {live.length === 0 ? (
        <Card>
          <Empty icon="CheckCircle2">
            <div className="font-semibold text-stone-700 text-sm">You’re covered on the essentials</div>
            <p className="text-stone-500 text-xs mt-1">No more category gaps for this concept. Add anything else manually in Manage.</p>
            <Btn variant="soft" icon="ClipboardList" className="mt-4" onClick={onGoManage}>Go to Manage</Btn>
          </Empty>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {live.map((s, i) => {
            const cat = catById(s.category)
            const done = added[s.id] === true
            return (
              <Card key={s.id} className="fade-up" pad={false} style={{ animationDelay: `${i * 40}ms` }}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`size-11 shrink-0 rounded-xl grid place-items-center ${TILE_TONES[cat.color] || TILE_TONES.stone}`}><Icon name={cat.iconName} size="md" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-stone-800">{cat.label}</div>
                      <div className="text-sm text-stone-500 mt-0.5">{s.deliverable}</div>
                    </div>
                    {s.estPrice > 0 && <Chip tone="stone">~{money(s.estPrice)}</Chip>}
                  </div>
                  <p className="text-xs text-stone-500 mt-2.5 flex items-start gap-1.5"><Icon name="Lightbulb" size="xs" className="shrink-0 mt-0.5 text-amber-500" /> {s.why}</p>
                  <div className="flex items-center gap-2 mt-3">
                    {done ? (
                      <Chip tone="emerald" icon="CheckCircle2">Added to vendors</Chip>
                    ) : (
                      <>
                        <Btn icon="Plus" onClick={() => add(s)}>Add</Btn>
                        <Btn variant="ghost" onClick={() => dismiss(s)}>Skip</Btn>
                        <span className="ml-auto text-xs text-stone-400">{s.daysBefore}d before</span>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
