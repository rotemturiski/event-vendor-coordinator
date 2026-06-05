import { catById } from '../../lib.js'
import { PageHeader, Card, SectionTitle, Stat, Empty, Icon } from '../ui.jsx'

export default function Reviews({ vendors, ratings, onRate }) {
  const rated = vendors.filter((v) => ratings[v.id])
  const avg = rated.length ? (rated.reduce((s, v) => s + ratings[v.id], 0) / rated.length).toFixed(1) : '—'

  return (
    <div>
      <PageHeader icon="Star" title="Vendor reviews"
        subtitle="Rate each vendor while it's fresh — your scores carry into the next retreat." />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <Stat icon="Star" label="Rated" value={`${rated.length}/${vendors.length}`} tone="amber" progress={vendors.length ? Math.round(rated.length / vendors.length * 100) : null} />
        <Stat icon="ChartNoAxesColumn" label="Average score" value={avg} tone="emerald" />
        <Stat icon="Handshake" label="Vendors" value={vendors.length} />
      </div>

      <Card pad={false}>
        <div className="px-5 pt-4 pb-2"><SectionTitle icon="Star">Rate your vendors</SectionTitle></div>
        {vendors.length === 0 && <Empty icon="Handshake">No vendors to rate.</Empty>}
        <div className="divide-y divide-stone-100">
          {vendors.map((v) => {
            const cat = catById(v.category)
            const r = ratings[v.id] || 0
            return (
              <div key={v.id} className="flex items-center gap-3 px-5 py-3">
                <Icon name={cat.iconName} size="md" className="text-stone-400" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-stone-800 text-sm truncate">{v.name}</div>
                  <div className="text-xs text-stone-400">{cat.label}</div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => onRate(v.id, n)} className="transition hover:scale-110" title={`${n} star${n > 1 ? 's' : ''}`}>
                      <Icon name="Star" size="sm" className={r >= n ? 'fill-amber-400 text-amber-400' : 'text-stone-200'} />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
