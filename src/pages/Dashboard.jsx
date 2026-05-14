import OverviewBar from '../components/dashboard/OverviewBar'
import CourseGrid from '../components/dashboard/CourseGrid'

export default function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">הקורסים שלי</h1>
        <p className="page-subtitle">עקבי אחר המשימות שלך בכל הקורסים</p>
      </div>
      <OverviewBar />
      <CourseGrid />
    </div>
  )
}
