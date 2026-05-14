const FILTERS = [
  { value: 'all', label: 'הכל' },
  { value: 'today', label: 'להיום' },
  { value: 'upcoming', label: 'קרוב' },
  { value: 'urgent', label: 'דחוף' },
  { value: 'completed', label: 'הושלם' },
]

export default function FilterBar({ active, onChange }) {
  return (
    <div className="filter-bar">
      {FILTERS.map(f => (
        <button
          key={f.value}
          className={`filter-tab ${active === f.value ? 'active' : ''}`}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
