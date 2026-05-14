const LABELS = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' }

export default function PriorityBadge({ priority }) {
  if (!priority) return null
  return (
    <span className={`priority-badge ${priority}`}>
      {LABELS[priority] ?? priority}
    </span>
  )
}
