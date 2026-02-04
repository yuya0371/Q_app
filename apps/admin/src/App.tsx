import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import QuestionsPage from './pages/QuestionsPage'
import UserQuestionsPage from './pages/UserQuestionsPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import NgWordsPage from './pages/NgWordsPage'
import FlaggedPostsPage from './pages/FlaggedPostsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="user-questions" element={<UserQuestionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="ng-words" element={<NgWordsPage />} />
        <Route path="flagged-posts" element={<FlaggedPostsPage />} />
      </Route>
    </Routes>
  )
}

export default App
