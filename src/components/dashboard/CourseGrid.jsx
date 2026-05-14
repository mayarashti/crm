import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import CourseCard from './CourseCard'
import EmptyState from '../common/EmptyState'
import CourseModal from '../modals/CourseModal'

export default function CourseGrid() {
  const { state } = useApp()
  const [showCourseModal, setShowCourseModal] = useState(false)

  return (
    <>
      {state.courses.length === 0 ? (
        <EmptyState
          icon="📚"
          title="עדיין אין קורסים"
          description="הוסיפי קורס ראשון כדי להתחיל לעקוב אחר המשימות שלך"
          action={
            <button className="btn btn-primary" onClick={() => setShowCourseModal(true)}>
              <Plus size={16} />
              הוספת קורס ראשון
            </button>
          }
        />
      ) : (
        <div className="course-grid">
          {state.courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {showCourseModal && (
        <CourseModal onClose={() => setShowCourseModal(false)} />
      )}
    </>
  )
}
