import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { getHebrewDate } from '../../utils/dateUtils'
import CourseModal from '../modals/CourseModal'

export default function Header() {
  const location = useLocation()
  const [showCourseModal, setShowCourseModal] = useState(false)

  return (
    <>
      <header className="header">
        <div className="header-greeting">
          <h2>שלום 👋</h2>
          <p>{getHebrewDate()}</p>
        </div>

        <nav className="header-nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            לוח מחוונים
          </Link>
          <Link
            to="/tasks"
            className={`nav-link ${location.pathname === '/tasks' ? 'active' : ''}`}
          >
            כל המשימות
          </Link>
        </nav>

        <div className="header-actions">
          <button className="add-btn" onClick={() => setShowCourseModal(true)}>
            <Plus size={16} />
            הוספת קורס
          </button>
        </div>
      </header>

      {showCourseModal && (
        <CourseModal onClose={() => setShowCourseModal(false)} />
      )}
    </>
  )
}
