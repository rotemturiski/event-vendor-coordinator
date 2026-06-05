import { useEffect, useMemo, useState } from 'react'
import { newRetreat, toISO, learnedPlanningProfile } from './lib.js'
import Landing from './components/Landing.jsx'
import Login from './components/Login.jsx'
import Home from './components/Home.jsx'
import Workspace from './components/Workspace.jsx'

const LS_KEY = 'retreatos.app.v1'
function load() {
  try { const r = localStorage.getItem(LS_KEY); if (r) return JSON.parse(r) } catch { /* */ }
  return null
}

export default function App() {
  const saved = load()
  const [user, setUser] = useState(saved?.user || null)
  const [retreats, setRetreats] = useState(saved?.retreats || [])
  const [view, setView] = useState(saved?.user ? 'home' : 'landing') // landing | login | home | workspace
  const [currentId, setCurrentId] = useState(null)

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ user, retreats }))
  }, [user, retreats])

  const login = (u) => { setUser(u); setView('home') }
  const logout = () => { setUser(null); setView('landing') }

  const createRetreat = () => {
    const r = { ...newRetreat(), createdAt: toISO(new Date()) }
    setRetreats((rs) => [r, ...rs])
    setCurrentId(r.id); setView('workspace')
  }
  const openRetreat = (id) => { setCurrentId(id); setView('workspace') }
  const deleteRetreat = (id) => setRetreats((rs) => rs.filter((r) => r.id !== id))
  const updateRetreat = (id, updater) => setRetreats((rs) => rs.map((r) => r.id === id ? updater(r) : r))

  const current = retreats.find((r) => r.id === currentId)

  // Cross-retreat learning: derived from all past retreats + explicit accept/reject
  // signals stored on the user. Biases the smart planner's defaults next time.
  const learningProfile = useMemo(
    () => learnedPlanningProfile(retreats, user?.planningMemory),
    [retreats, user?.planningMemory],
  )
  const recordPlanningSignal = (signal) => setUser((u) => {
    const mem = { ...(u?.planningMemory || {}) }
    if (signal.type === 'accept-vendor' && signal.category) {
      mem.acceptedByCategory = { ...(mem.acceptedByCategory || {}) }
      mem.acceptedByCategory[signal.category] = (mem.acceptedByCategory[signal.category] || 0) + 1
    }
    if (signal.type === 'reject-vendor' && signal.category) {
      mem.acceptedByCategory = { ...(mem.acceptedByCategory || {}) }
      mem.acceptedByCategory[signal.category] = Math.max(0, (mem.acceptedByCategory[signal.category] || 0) - 1)
    }
    mem.signals = (mem.signals || 0) + 1
    return { ...u, planningMemory: mem }
  })

  if (view === 'landing') return <Landing onEnter={() => setView(user ? 'home' : 'login')} />
  if (view === 'login') return <Login onLogin={login} onBack={() => setView('landing')} />
  if (view === 'workspace' && current) {
    return (
      <Workspace
        retreat={current}
        onChange={(updater) => updateRetreat(current.id, updater)}
        onExit={() => setView('home')}
        learningProfile={learningProfile}
        onPlanningSignal={recordPlanningSignal}
      />
    )
  }
  return (
    <Home
      user={user} retreats={retreats}
      onOpen={openRetreat} onCreate={createRetreat} onDelete={deleteRetreat} onLogout={logout}
    />
  )
}
