import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { generateId } from '../../utils/dateUtils'

const PRIORITIES = [
  { value: 'high', label: 'גבוהה' },
  { value: 'medium', label: 'בינונית' },
  { value: 'low', label: 'נמוכה' },
]

export default function TaskModal({ courseId, task, onClose }) {
  const { state, dispatch } = useApp()
  const [title, setTitle] = useState(task?.title ?? '')
  const [deadline, setDeadline] = useState(task?.deadline ?? '')
  const [priority, setPriority] = useState(task?.priority ?? 'medium')
  const [selectedCourseId, setSelectedCourseId] = useState(task?.courseId ?? courseId ?? '')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return

    if (task) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { ...task, title: title.trim(), deadline, priority, courseId: selectedCourseId },
      })
    } else {
      dispatch({
        type: 'ADD_TASK',
        payload: {
          id: generateId(),
          courseId: selectedCourseId,
          title: title.trim(),
          deadline,
          priority,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      })
    }
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card">
        <div className="modal-header">
          <span className="modal-title">{task ? 'עריכת משימה' : 'הוספת משימה'}</span>
          <button className="modal-close" onClick={onClose} aria-label="סגור">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">שם המשימה</label>
              <input
                ref={inputRef}
                className="form-input"
                placeholder="לדוגמה: הגשת תרגיל 3"
                value={title}
                onChange={e => setTitle(e.target.value)}
                dir="auto"
              />
            </div>

            {!courseId && (
              <div className="form-group">
                <label className="form-label">קורס</label>
                <select
                  className="form-input"
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                >
                  <option value="">בחרי קורס (אופציונלי)</option>
                  {state.courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">דדליין</label>
              <input
                type="date"
                className="form-input"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">חשיבות</label>
              <div className="priority-selector">
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    className={`priority-option ${priority === p.value ? `selected-${p.value}` : ''}`}
                    onClick={() => setPriority(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              בטל
            </button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
              {task ? 'שמור' : 'הוסף'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
