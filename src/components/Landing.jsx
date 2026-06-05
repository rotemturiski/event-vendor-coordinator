import { Icon } from './ui.jsx'

const FEATURES = [
  { iconName: 'Compass', title: 'Smart planning', desc: 'Define the retreat and draft an agenda with AI — from idea to skeleton in seconds.' },
  { iconName: 'Handshake', title: 'Vendor coordination', desc: 'Track deliverables and deadlines, and auto-draft personal reminders.' },
  { iconName: 'Users', title: 'Guest management', desc: 'Registration, payments, dietary needs — all in one place.' },
  { iconName: 'LayoutDashboard', title: 'Live overview', desc: 'A timeline that updates itself, with tasks and alerts before anything slips.' },
]

export default function Landing({ onEnter }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-emerald-700 grid place-items-center text-white"><Icon name="Sprout" size="md" /></div>
          <div className="font-semibold text-stone-800">Retreat OS</div>
        </div>
        <button onClick={onEnter} className="text-sm font-semibold text-emerald-800 bg-emerald-50 ring-1 ring-emerald-200 hover:bg-emerald-100 rounded-lg px-4 py-2 transition">
          Sign in
        </button>
      </header>

      <section className="flex-1 grid place-items-center px-5 py-10">
        <div className="max-w-2xl text-center fade-up">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 rounded-full px-3 py-1.5 mb-7">
            <Icon name="Sparkles" size="xs" /> AI-powered
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-stone-900 tracking-tight leading-[1.05]">
            Your entire retreat,<br />
            <span className="text-emerald-700">in one place.</span>
          </h1>
          <p className="text-stone-500 text-lg mt-5 max-w-xl mx-auto leading-relaxed">
            The platform that takes retreat producers from planning to wrap-up — vendor coordination,
            guest registration, and live operations. Less spreadsheet, more presence.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={onEnter} className="text-base font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl px-7 py-3.5 shadow-lg shadow-emerald-700/20 transition">
              Get started — free →
            </button>
          </div>
          <div className="text-xs text-stone-400 mt-3">No credit card · one-click sign in</div>
        </div>
      </section>

      <section className="px-5 sm:px-10 pb-16">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="bg-white rounded-2xl ring-1 ring-stone-200 card p-5 fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="size-10 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 grid place-items-center text-emerald-700 mb-3"><Icon name={f.iconName} size="md" /></div>
              <div className="font-semibold text-stone-800">{f.title}</div>
              <p className="text-sm text-stone-500 mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-xs text-stone-400 pb-8">
        Retreat OS · end-to-end retreat management
      </footer>
    </div>
  )
}
