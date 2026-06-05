import { useMemo, useState } from 'react'
import {
  PHASES, deriveTasks, deadlineFor, daysBetween, toISO, tonePreference, cryptoId,
} from '../lib.js'
import Sidebar from './Sidebar.jsx'
import Planning from './stages/Planning.jsx'
import Vendors from './stages/Vendors.jsx'
import Participants from './stages/Participants.jsx'
import Agenda from './stages/Agenda.jsx'
import Pre from './stages/Pre.jsx'
import During from './stages/During.jsx'
import Reviews from './stages/Reviews.jsx'
import Feedback from './stages/Feedback.jsx'
import Content from './stages/Content.jsx'
import Closing from './stages/Closing.jsx'

export default function Workspace({ retreat, onChange, onExit, learningProfile = {}, onPlanningSignal = () => {} }) {
  const [stage, setStage] = useState('planning')
  const today = toISO(new Date())

  const learnedTone = useMemo(() => tonePreference(retreat.feedback || []), [retreat.feedback])
  const prefs = { today, tone: learnedTone, senderName: retreat.senderName }

  const enrichedVendors = useMemo(() =>
    (retreat.vendors || []).map((v) => {
      const deadline = deadlineFor(retreat.startDate, v.daysBefore)
      return { ...v, deadline, daysLeft: daysBetween(today, deadline) }
    }).sort((a, b) => (a.daysLeft ?? 1e9) - (b.daysLeft ?? 1e9)),
    [retreat.vendors, retreat.startDate, today])

  const tasks = useMemo(() =>
    deriveTasks(retreat.vendors || [], retreat).map((t) => ({
      ...t, done: retreat.taskDone?.[t.id] ?? t.done, daysLeft: daysBetween(today, t.deadline),
    })),
    [retreat.vendors, retreat.startDate, retreat.taskDone, today])

  // mutation helpers, all routed through onChange(updater)
  const upd = (fn) => onChange(fn)
  const setRetreatValue = (val) => upd(() => val)
  const setAgenda = (val) => upd((r) => ({ ...r, agenda: val }))
  const setSenderName = (v) => upd((r) => ({ ...r, senderName: v }))
  const setQuestionnaire = (qs) => upd((r) => ({ ...r, questionnaire: qs }))
  const setRegPrice = (n) => upd((r) => ({ ...r, regPrice: n }))

  const vendorApi = {
    add: (list) => upd((r) => ({ ...r, vendors: [...r.vendors, ...list] })),
    update: (id, patch) => upd((r) => ({ ...r, vendors: r.vendors.map((v) => v.id === id ? { ...v, ...patch } : v) })),
    remove: (id) => upd((r) => ({ ...r, vendors: r.vendors.filter((v) => v.id !== id) })),
    cycle: (id) => upd((r) => { const o = ['pending', 'confirmed', 'done']; return { ...r, vendors: r.vendors.map((v) => v.id === id ? { ...v, status: o[(o.indexOf(v.status) + 1) % o.length] } : v) } }),
  }
  const participantApi = {
    add: (x) => upd((r) => ({ ...r, participants: [...r.participants, x] })),
    update: (id, patch) => upd((r) => ({ ...r, participants: r.participants.map((v) => v.id === id ? { ...v, ...patch } : v) })),
    remove: (id) => upd((r) => ({ ...r, participants: r.participants.filter((v) => v.id !== id) })),
  }
  const toggleTask = (id) => upd((r) => ({ ...r, taskDone: { ...r.taskDone, [id]: !(r.taskDone?.[id] ?? tasks.find((t) => t.id === id)?.done) } }))
  const issueApi = {
    add: (x) => upd((r) => ({ ...r, issues: [{ ...x, id: 'iss-' + (r.issues.length + 1) + '-' + x.text.length, done: false }, ...r.issues] })),
    toggle: (id) => upd((r) => ({ ...r, issues: r.issues.map((i) => i.id === id ? { ...i, done: !i.done } : i) })),
  }
  const recordFeedback = (tone, vote) => upd((r) => ({ ...r, feedback: [...(r.feedback || []), { tone, vote }] }))

  // persisted real-time check-in (During)
  const toggleArrived = (id) => upd((r) => ({ ...r, arrived: { ...(r.arrived || {}), [id]: !(r.arrived?.[id]) } }))

  // ── After-phase apis ──
  const setRating = (id, n) => upd((r) => ({ ...r, ratings: { ...(r.ratings || {}), [id]: n } }))
  const toggleClosing = (key) => upd((r) => ({ ...r, closing: { ...(r.closing || {}), [key]: !(r.closing?.[key]) } }))
  const sendSurvey = () => upd((r) => ({ ...r, surveySent: true }))
  const contentApi = {
    add: (x) => upd((r) => ({ ...r, content: [{ ...x, id: cryptoId() }, ...(r.content || [])] })),
    update: (id, patch) => upd((r) => ({ ...r, content: (r.content || []).map((c) => c.id === id ? { ...c, ...patch } : c) })),
    remove: (id) => upd((r) => ({ ...r, content: (r.content || []).filter((c) => c.id !== id) })),
  }
  const responseApi = {
    add: (x) => upd((r) => ({ ...r, responses: [{ ...x, id: cryptoId() }, ...(r.responses || [])] })),
    remove: (id) => upd((r) => ({ ...r, responses: (r.responses || []).filter((x) => x.id !== id) })),
  }

  const shared = { retreat, today, enrichedVendors, participants: retreat.participants || [], tasks }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar
        phases={PHASES} active={stage} onNavigate={setStage}
        retreat={retreat} vendors={enrichedVendors} participants={retreat.participants || []}
        tasks={tasks} onExit={onExit}
      />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto nice-scroll">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-7">
          {stage === 'planning' && (
            <Planning retreat={retreat} setRetreat={setRetreatValue} agenda={retreat.agenda || []} setAgenda={setAgenda}
              onGo={setStage} vendorApi={vendorApi} learningProfile={learningProfile} onPlanningSignal={onPlanningSignal} />
          )}
          {stage === 'vendors' && (
            <Vendors {...shared} vendorApi={vendorApi} prefs={prefs} learnedTone={learnedTone}
              feedbackCount={(retreat.feedback || []).length} onFeedback={recordFeedback} senderName={retreat.senderName} setSenderName={setSenderName}
              learningProfile={learningProfile} onPlanningSignal={onPlanningSignal} />
          )}
          {stage === 'participants' && (
            <Participants retreat={retreat} participants={retreat.participants || []} api={participantApi}
              setQuestionnaire={setQuestionnaire} setRegPrice={setRegPrice} />
          )}
          {stage === 'agenda' && (
            <Agenda retreat={retreat} agenda={retreat.agenda || []} setAgenda={setAgenda} learningProfile={learningProfile} onGo={setStage} />
          )}
          {stage === 'control' && (
            <Pre {...shared} onToggleTask={toggleTask} onNavigate={setStage} />
          )}
          {stage === 'during' && (
            <During retreat={retreat} participants={retreat.participants || []} participantApi={participantApi} issues={retreat.issues || []} issueApi={issueApi} agenda={retreat.agenda || []}
              arrived={retreat.arrived || {}} onToggleArrived={toggleArrived} />
          )}
          {stage === 'reviews' && (
            <Reviews vendors={enrichedVendors} ratings={retreat.ratings || {}} onRate={setRating} />
          )}
          {stage === 'feedback' && (
            <Feedback participants={retreat.participants || []} surveySent={!!retreat.surveySent} onSend={sendSurvey}
              responses={retreat.responses || []} responseApi={responseApi} />
          )}
          {stage === 'content' && (
            <Content content={retreat.content || []} api={contentApi} />
          )}
          {stage === 'closing' && (
            <Closing retreat={retreat} vendors={enrichedVendors} closing={retreat.closing || {}} onToggle={toggleClosing} />
          )}
        </div>
      </main>
    </div>
  )
}
