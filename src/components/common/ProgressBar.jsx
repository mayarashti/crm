export default function ProgressBar({ total, completed, color }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="progress-section">
      <div className="progress-section-label">
        <span>התקדמות</span>
        <strong>{completed}/{total} הושלמו</strong>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${pct}%`, background: color || 'var(--accent)' }}
        />
      </div>
    </div>
  )
}
