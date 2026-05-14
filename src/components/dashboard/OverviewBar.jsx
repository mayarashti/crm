import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { isToday, isUpcoming } from '../../utils/dateUtils'

export default function OverviewBar() {
  const { state } = useApp()
  const navigate = useNavigate()
  const { tasks } = state

  const todayCount = tasks.filter(t => !t.completed && isToday(t.deadline)).length
  const upcomingCount = tasks.filter(t => !t.completed && isUpcoming(t.deadline)).length
  const urgentCount = tasks.filter(t => !t.completed && t.priority === 'high').length

  return (
    <div className="overview-bar">
      <button className="overview-chip chip-today" onClick={() => navigate('/tasks?filter=today')}>
        <span className="chip-icon">{todayCount}</span>
        <span className="chip-label">להיום</span>
      </button>
      <button className="overview-chip chip-upcoming" onClick={() => navigate('/tasks?filter=upcoming')}>
        <span className="chip-icon">{upcomingCount}</span>
        <span className="chip-label">קרוב</span>
      </button>
      <button className="overview-chip chip-urgent" onClick={() => navigate('/tasks?filter=urgent')}>
        <span className="chip-icon">{urgentCount}</span>
        <span className="chip-label">דחוף</span>
      </button>
    </div>
  )
}
