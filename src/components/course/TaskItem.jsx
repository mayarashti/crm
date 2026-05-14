import { useState } from 'react'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { formatDate, isOverdue } from '../../utils/dateUtils'
import PriorityBadge from '../common/PriorityBadge'
import TaskModal from '../modals/TaskModal'

export default function TaskItem({ task }) {
  const { dispatch } = useApp()
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function toggle() {
    dispatch({ type: 'TOGGLE_TASK', payload: task.id })
  }

  return (
    <>
      <div className="task-item">
        <div
          className={`task-checkbox ${task.completed ? 'checked' : ''}`}
          onClick={toggle}
          role="checkbox"
          aria-checked={task.completed}
          tabIndex={0}
          onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') toggle() }}
        >
          {task.completed && <Check size={11} strokeWidth={3} />}
        </div>

        <div className="task-content">
          <div className={`task-title ${task.completed ? 'completed' : ''}`}>
            {task.title}
          </div>
          <div className="task-meta">
            {task.deadline && (
              <span className={`task-deadline ${!task.completed && isOverdue(task.deadline) ? 'overdue' : ''}`}>
                {!task.completed && isOverdue(task.deadline) ? 'באיחור · ' : ''}
                {formatDate(task.deadline)}
              </span>
            )}
            <PriorityBadge priority={task.priority} />
          </div>
        </div>

        <div className="task-actions">
          {!confirmDelete ? (
            <>
              <button
                className="icon-btn"
                onClick={() => setShowEdit(true)}
                aria-label="עריכה"
              >
                <Pencil size={14} />
              </button>
              <button
                className="icon-btn"
                onClick={() => setConfirmDelete(true)}
                aria-label="מחיקה"
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--danger)', whiteSpace: 'nowrap' }}>למחוק?</span>
              <button
                className="btn btn-danger"
                style={{ padding: '3px 8px', fontSize: '12px' }}
                onClick={() => dispatch({ type: 'DELETE_TASK', payload: task.id })}
              >
                כן
              </button>
              <button
                className="btn btn-ghost"
                style={{ padding: '3px 8px', fontSize: '12px' }}
                onClick={() => setConfirmDelete(false)}
              >
                לא
              </button>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <TaskModal task={task} courseId={task.courseId} onClose={() => setShowEdit(false)} />
      )}
    </>
  )
}
