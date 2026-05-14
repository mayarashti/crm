import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import CoursePage from './pages/CoursePage'
import AllTasksPage from './pages/AllTasksPage'

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/course/:id" element={<CoursePage />} />
          <Route path="/tasks" element={<AllTasksPage />} />
        </Routes>
      </Layout>
    </AppProvider>
  )
}
