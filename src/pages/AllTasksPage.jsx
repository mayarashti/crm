import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import FilterBar from '../components/tasks/FilterBar'
import TaskRow from '../components/tasks/TaskRow'
import EmptyState from '../components/common/EmptyState'
import TaskModal from '../components/modals/TaskModal'
import { filterTasks } from '../utils/filterUtils'

export default function AllTasksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { state } = useApp()
  const [showTaskModal, setShowTaskModal] = useState(false)

  const activeFilter = searchParams.get('filter') ?? 'all'

  function setFilter(f) {
    setSearchParams(f === 'all' ? {} : { filter: f })
  }

  const filtered = filterTasks(state.tasks, activeFilter)
  const sorted = [...filtered].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0
    if (!a.deadline) return 1
    if (!b.deadline) return -1
    return a.deadline.localeCompare(b.deadline)
  })

  const emptyMessages = {
    today: 'אין משימות להיום',
    upcoming: 'אין משימות קרובות',
    urgent: 'אין משימות דחופות',
    completed: 'עדיין לא הושלמו משימות',
    all: 'עדיין אין משימות',
  }

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">כל המשימות</h1>
          <p className="page-subtitle">{sorted.length} משימות</p>
        </div>
        <button className="add-btn" onClick={() => setShowTaskModal(true)}>
          <Plus size={16} />
          הוספת משימה
        </button>
      </div>

      <FilterBar active={activeFilter} onChange={setFilter} />

      {sorted.length === 0 ? (
        <EmptyState
          icon={activeFilter === 'completed' ? '🎉' : '📋'}
          title={emptyMessages[activeFilter] ?? 'אין משימות'}
          description={activeFilter === 'all' ? 'הוסיפי משימה ראשונה דרך אחד מהקורסים' : undefined}
        />
      ) : (
        <div className="task-list-container">
          {sorted.map(task => {
            const course = state.courses.find(c => c.id === task.courseId)
            return <TaskRow key={task.id} task={task} course={course} />
          })}
        </div>
      )}

      {showTaskModal && (
        <TaskModal onClose={() => setShowTaskModal(false)} />
      )}
    </>
  )
}
