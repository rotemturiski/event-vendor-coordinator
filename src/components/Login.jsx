import { useState } from 'react'
import { Icon } from './ui.jsx'

export default function Login({ onLogin, onBack }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const submit = (e) => {
    e.preventDefault()
    onLogin({ name: name.trim() || 'Retreat Producer', email: email.trim() })
  }

  return (
    <div className="min-h-screen grid place-items-center px-5">
      <div className="w-full max-w-sm fade-up">
        <button onClick={onBack} className="text-sm text-stone-400 hover:text-stone-700 mb-6">← Back</button>
        <div className="bg-white rounded-2xl ring-1 ring-stone-200 card p-7">
          <div className="size-11 rounded-xl bg-emerald-700 grid place-items-center text-white mb-4"><Icon name="Sprout" size="lg" /></div>
          <h1 className="text-2xl font-semibold text-stone-900">Welcome back</h1>
          <p className="text-stone-500 text-sm mt-1 mb-6">Sign in to manage your retreats.</p>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-stone-400 mb-1 uppercase tracking-wide">Full name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rotem Turiski" autoFocus
                className="w-full text-sm bg-stone-50 rounded-lg px-3 py-3 ring-1 ring-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-400 mb-1 uppercase tracking-wide">Email</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email"
                className="w-full text-sm bg-stone-50 rounded-lg px-3 py-3 ring-1 ring-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <button type="submit" className="w-full text-base font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg py-3.5 shadow-sm transition mt-2">
              Sign in
            </button>
          </form>
          <p className="text-xs text-stone-400 text-center mt-4">Demo — no real password needed</p>
        </div>
      </div>
    </div>
  )
}
