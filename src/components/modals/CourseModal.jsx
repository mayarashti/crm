import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { generateId } from '../../utils/dateUtils'

const COLORS = ['#C4B5FD', '#93C5FD', '#6EE7B7', '#FCA5A5', '#FCD34D', '#A5F3FC']

export default function CourseModal({ course, onClose }) {
  const { dispatch } = useApp()
  const [name, setName] = useState(course?.name ?? '')
  const [color, setColor] = useState(course?.color ?? COLORS[0])
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    if (course) {
      dispatch({ type: 'UPDATE_COURSE', payload: { ...course, name: name.trim(), color } })
    } else {
      dispatch({
        type: 'ADD_COURSE',
        payload: { id: generateId(), name: name.trim(), color, notes: '', createdAt: new Date().toISOString() },
      })
    }
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card">
        <div className="modal-header">
          <span className="modal-title">{course ? 'עריכת קורס' : 'הוספת קורס'}</span>
          <button className="modal-close" onClick={onClose} aria-label="סגור">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">שם הקורס</label>
              <input
                ref={inputRef}
                className="form-input"
                placeholder="לדוגמה: אלגוריתמים"
                value={name}
                onChange={e => setName(e.target.value)}
                dir="auto"
              />
            </div>

            <div className="form-group">
              <label className="form-label">צבע</label>
              <div className="color-swatches">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    aria-label={`צבע ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              בטל
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              שמור
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
