import { useState } from 'react'
import { PageHeader, Card, SectionTitle, Btn, Field, Select, Empty, Icon, TILE_TONES } from '../ui.jsx'

const KINDS = {
  photos: { label: 'Photos', iconName: 'Camera', tone: 'rose' },
  videos: { label: 'Videos', iconName: 'Video', tone: 'violet' },
  decks: { label: 'Decks & docs', iconName: 'FileText', tone: 'amber' },
  other: { label: 'Other', iconName: 'FolderOpen', tone: 'stone' },
}
const KIND_OPTIONS = Object.entries(KINDS).map(([value, k]) => ({ value, label: k.label }))

export default function Content({ content, api }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ label: '', url: '', kind: 'photos' })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.label.trim()) return
    api.add({ label: form.label.trim(), url: form.url.trim(), kind: form.kind })
    setForm({ label: '', url: '', kind: 'photos' }); setAdding(false)
  }

  return (
    <div>
      <PageHeader icon="FolderOpen" title="Content"
        subtitle="Collect the photos, videos, decks and recordings from the retreat in one place."
        actions={<Btn icon="Plus" onClick={() => setAdding((a) => !a)}>{adding ? 'Close' : 'Add link'}</Btn>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {Object.entries(KINDS).map(([key, k]) => {
          const count = content.filter((c) => c.kind === key).length
          return (
            <div key={key} className="bg-white rounded-2xl ring-1 ring-stone-200 card p-4">
              <span className={`size-8 grid place-items-center rounded-lg ${TILE_TONES[k.tone]}`}><Icon name={k.iconName} size="sm" /></span>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-stone-800">{count}</div>
              <div className="text-xs text-stone-400">{k.label}</div>
            </div>
          )
        })}
      </div>

      {adding && (
        <Card className="mb-4 bg-stone-50 fade-up">
          <ContentForm form={form} set={set} onSubmit={submit} submitLabel="Add to library" onCancel={() => { setForm({ label: '', url: '', kind: 'photos' }); setAdding(false) }} />
        </Card>
      )}

      <Card pad={false}>
        {content.length === 0 ? <Empty icon="FolderOpen">No content yet — add links to your albums, recordings or decks.</Empty> : (
          <div className="divide-y divide-stone-100">
            {content.map((c) => <ContentRow key={c.id} c={c} api={api} />)}
          </div>
        )}
      </Card>
    </div>
  )
}

// Shared form body — used for both adding and editing a content link.
function ContentForm({ form, set, onSubmit, submitLabel, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
      <Field className="sm:col-span-2" label="Title" value={form.label} onChange={(v) => set('label', v)} placeholder="Drive album — Day 1" autoFocus />
      <Field label="Link (URL)" value={form.url} onChange={(v) => set('url', v)} placeholder="https://…" />
      <Select label="Type" value={form.kind} onChange={(v) => set('kind', v)} options={KIND_OPTIONS} />
      <div className="sm:col-span-2 flex justify-end gap-2">
        {onCancel && <Btn type="button" variant="ghost" onClick={onCancel}>Cancel</Btn>}
        <Btn type="submit">{submitLabel}</Btn>
      </div>
    </form>
  )
}

function ContentRow({ c, api }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => ({ label: c.label, url: c.url || '', kind: c.kind || 'other' }))
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const save = (e) => { e.preventDefault(); if (!form.label.trim()) return; api.update(c.id, { label: form.label.trim(), url: form.url.trim(), kind: form.kind }); setEditing(false) }
  const k = KINDS[c.kind] || KINDS.other

  if (editing) {
    return (
      <div className="px-4 py-3 bg-stone-50 fade-up">
        <ContentForm form={form} set={set} onSubmit={save} submitLabel="Save changes" onCancel={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-stone-50/60 transition">
      <span className={`size-9 shrink-0 grid place-items-center rounded-lg ${TILE_TONES[k.tone]}`}><Icon name={k.iconName} size="sm" /></span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-stone-800 text-sm truncate">{c.label}</div>
        {c.url && <div className="text-xs text-stone-400 truncate">{c.url}</div>}
      </div>
      {c.url && (
        <a href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900">
          Open <Icon name="ExternalLink" size="xs" />
        </a>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={() => setEditing(true)} title="Edit" className="text-stone-300 hover:text-emerald-600 transition"><Icon name="PenLine" size="sm" /></button>
        <button onClick={() => api.remove(c.id)} title="Remove" className="text-stone-300 hover:text-rose-500 transition"><Icon name="X" size="sm" /></button>
      </div>
    </div>
  )
}
