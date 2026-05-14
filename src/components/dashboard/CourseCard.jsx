import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import CourseModal from '../modals/CourseModal'
import TaskModal from '../modals/TaskModal'

export default function CourseCard({ course }) {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef(null)

  const tasks = state.tasks.filter(t => t.courseId === course.id)
  const completed = tasks.filter(t => t.completed).length
  const progress = tasks.length > 0 ? (completed / tasks.length) * 100 : 0
  const previewTasks = tasks.slice(0, 3)
  const extra = tasks.length - 3

  useEffect(() => {
    if (!showMenu) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
        setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  function handleCardClick(e) {
    if (e.target.closest('.course-card-menu') || e.target.closest('.course-card-footer')) return
    navigate(`/course/${course.id}`)
  }

  function handleDelete() {
    dispatch({ type: 'DELETE_COURSE', payload: course.id })
  }

  return (
    <>
      <div className="course-card" onClick={handleCardClick}>
        <div className="course-card-accent" style={{ background: course.color }} />

        <div className="course-card-body">
          <div className="course-card-header">
            <span className="course-card-name">{course.name}</span>

            <div className="menu-wrapper course-card-menu" ref={menuRef}>
              <button
                className="icon-btn"
                onClick={e => { e.stopPropagation(); setShowMenu(v => !v); setConfirmDelete(false) }}
                aria-label="אפשרויות"
              >
                <MoreHorizontal size={16} />
              </button>

              {showMenu && (
                <div className="dropdown-menu">
                  {!confirmDelete ? (
                    <>
                      <button
                        className="dropdown-item"
                        onClick={e => { e.stopPropagation(); setShowEditModal(true); setShowMenu(false) }}
                      >
                        <Pencil size={14} />
                        עריכה
                      </button>
                      <button
                        className="dropdown-item danger"
                        onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
                      >
                        <Trash2 size={14} />
                        מחיקה
                      </button>
                    </>
                  ) : (
                    <div className="delete-confirm">
                      <span>למחוק?</span>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '3px 10px', fontSize: '12px' }}
                        onClick={e => { e.stopPropagation(); handleDelete() }}
                      >
                        כן
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '3px 10px', fontSize: '12px' }}
                        onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}
                      >
                        לא
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="course-progress-section">
            <div className="progress-label">
              <span>{completed}/{tasks.length} הושלמו</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%`, background: course.color }}
              />
            </div>
          </div>

          <div className="course-task-preview">
            {tasks.length === 0 ? (
              <span className="course-card-empty">אין משימות עדיין</span>
            ) : (
              <>
                {previewTasks.map(task => (
                  <div key={task.id} className={`task-preview-item ${task.completed ? 'completed-task' : ''}`}>
                    <div className="task-preview-dot" />
                    <span className="task-preview-title">{task.title}</span>
                  </div>
                ))}
                {extra > 0 && (
                  <span className="task-preview-more">+{extra} נוספות</span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="course-card-footer">
          <button
            className="add-task-btn"
            onClick={e => { e.stopPropagation(); setShowTaskModal(true) }}
          >
            <Plus size={14} />
            הוסף משימה
          </button>
        </div>
      </div>

      {showEditModal && (
        <CourseModal course={course} onClose={() => setShowEditModal(false)} />
      )}
      {showTaskModal && (
        <TaskModal courseId={course.id} onClose={() => setShowTaskModal(false)} />
      )}
    </>
  )
}
