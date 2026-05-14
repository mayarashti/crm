import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TaskList from '../components/course/TaskList'
import TaskModal from '../components/modals/TaskModal'
import CourseModal from '../components/modals/CourseModal'
import EmptyState from '../components/common/EmptyState'
import ProgressBar from '../components/common/ProgressBar'

export default function CoursePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notes, setNotes] = useState('')

  const course = state.courses.find(c => c.id === id)
  const tasks = state.tasks.filter(t => t.courseId === id)
  const completedCount = tasks.filter(t => t.completed).length

  useEffect(() => {
    if (course) setNotes(course.notes ?? '')
  }, [course?.id])

  useEffect(() => {
    if (!course) navigate('/')
  }, [course, navigate])

  if (!course) return null

  function saveNotes() {
    dispatch({ type: 'UPDATE_COURSE', payload: { ...course, notes } })
  }

  function handleDelete() {
    dispatch({ type: 'DELETE_COURSE', payload: course.id })
    navigate('/')
  }

  return (
    <>
      <div className="course-page">
        <div className="course-page-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ChevronRight size={16} />
            חזרה
          </button>

          <div className="course-title-block">
            <div className="course-color-dot" style={{ background: course.color }} />
            <h1 className="course-title">{course.name}</h1>
          </div>

          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={() => setShowEditModal(true)}
              aria-label="עריכת קורס"
            >
              <Pencil size={16} />
            </button>

            {!confirmDelete ? (
              <button
                className="icon-btn"
                style={{ color: 'var(--danger)' }}
                onClick={() => setConfirmDelete(true)}
                aria-label="מחיקת קורס"
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: 'var(--danger)', whiteSpace: 'nowrap' }}>
                  למחוק את הקורס וכל המשימות?
                </span>
                <button
                  className="btn btn-danger"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={handleDelete}
                >
                  כן
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => setConfirmDelete(false)}
                >
                  לא
                </button>
              </div>
            )}
          </div>
        </div>

        <ProgressBar total={tasks.length} completed={completedCount} color={course.color} />

        <div className="task-section" style={{ marginTop: '20px' }}>
          <div className="task-section-header">משימות</div>

          {tasks.length === 0 ? (
            <EmptyState
              icon="✅"
              title="אין משימות עדיין"
              description="הוסיפי משימה ראשונה לקורס"
            />
          ) : (
            <TaskList tasks={tasks} />
          )}

          <div className="add-task-row">
            <button className="add-task-row-btn" onClick={() => setShowTaskModal(true)}>
              <Plus size={15} />
              הוסף משימה
            </button>
          </div>
        </div>

        <div className="notes-section">
          <div className="notes-header">הערות</div>
          <textarea
            className="notes-textarea"
            placeholder="הוסיפי הערות, קישורים, או מידע חשוב על הקורס..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            dir="auto"
          />
        </div>
      </div>

      {showTaskModal && (
        <TaskModal courseId={id} onClose={() => setShowTaskModal(false)} />
      )}
      {showEditModal && (
        <CourseModal course={course} onClose={() => setShowEditModal(false)} />
      )}
    </>
  )
}
