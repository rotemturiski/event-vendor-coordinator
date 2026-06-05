import { fmtRange, daysBetween, toISO } from '../lib.js'
import { Icon, Chip } from './ui.jsx'

export default function Home({ user, retreats, onOpen, onCreate, onDelete, onLogout }) {
  const today = toISO(new Date())

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200/70 bg-white/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-emerald-700 grid place-items-center text-white"><Icon name="Sprout" size="sm" /></div>
            <div className="font-semibold text-stone-800">Retreat OS</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-stone-500 hidden sm:block">Hi, <b className="text-stone-700 font-semibold">{user?.name}</b></div>
            <div className="size-9 rounded-full bg-emerald-100 text-emerald-800 grid place-items-center font-semibold">{(user?.name || '?').charAt(0)}</div>
            <button onClick={onLogout} className="text-xs font-semibold text-stone-400 hover:text-stone-700">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8">
        <div className="flex items-end justify-between mb-6 fade-up">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900">My retreats</h1>
            <p className="text-stone-500 text-sm mt-1">{retreats.length ? `${retreats.length} retreat${retreats.length > 1 ? 's' : ''}` : 'No retreats yet — create your first'}</p>
          </div>
          <button onClick={onCreate} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg px-5 py-2.5 shadow-sm transition active:scale-[0.98]">
            <Icon name="Plus" size="sm" /> New retreat
          </button>
        </div>

        {retreats.length === 0 ? (
          <button onClick={onCreate} className="w-full bg-white rounded-2xl ring-2 ring-dashed ring-stone-200 hover:ring-emerald-300 hover:bg-emerald-50/30 transition py-16 text-center fade-up">
            <span className="inline-grid place-items-center size-14 rounded-2xl bg-emerald-50 text-emerald-700 mb-3"><Icon name="Sprout" size="xl" /></span>
            <div className="font-semibold text-stone-700 text-lg">Create your first retreat</div>
            <p className="text-stone-500 text-sm mt-1">Planning, vendors, guests and operations — it all starts here.</p>
          </button>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {retreats.map((r) => {
              const daysToGo = r.startDate ? daysBetween(today, r.startDate) : null
              return (
                <div key={r.id} className="group bg-white rounded-2xl ring-1 ring-stone-200 card overflow-hidden fade-up flex flex-col">
                  <button onClick={() => onOpen(r.id)} className="text-left flex-1">
                    <div className="h-24 bg-gradient-to-br from-emerald-500 to-emerald-700 relative p-4 flex items-end">
                      <div className="font-semibold text-white text-lg leading-tight">{r.name || 'Untitled retreat'}</div>
                      {daysToGo != null && daysToGo >= 0 && (
                        <span className="absolute top-3 right-3 text-xs font-semibold bg-white/20 text-white rounded-full px-2 py-1">{daysToGo}d to go</span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-stone-400"><Icon name="Calendar" size="xs" /> {fmtRange(r.startDate, r.endDate)}</div>
                      {r.location && <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-0.5 truncate"><Icon name="MapPin" size="xs" /> {r.location}</div>}
                      <div className="flex gap-2 mt-3">
                        <Chip tone="emerald" icon="Handshake">{r.vendors.length} vendors</Chip>
                        <Chip tone="stone" icon="Users">{r.participants.length}</Chip>
                      </div>
                    </div>
                  </button>
                  <div className="px-4 pb-3 flex items-center justify-between">
                    <button onClick={() => onOpen(r.id)} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900">Open →</button>
                    <button onClick={() => { if (confirm('Delete this retreat?')) onDelete(r.id) }} className="opacity-0 group-hover:opacity-100 text-xs text-stone-300 hover:text-rose-500 transition">Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
