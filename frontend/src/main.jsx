import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import Login from './Pages/Auth/login.jsx'
import Home from './Pages/Home/home.jsx'
import Stories from './Pages/Stories/stories.jsx'
import Literature from './Pages/Stories/literature.jsx'
import Admin from './Pages/Admin/dashboard.jsx'
import Moderation from './Pages/Admin/moderation.jsx'
import Users from './Pages/Admin/users.jsx'
import Files from './Pages/Admin/files.jsx'
import AdminSettings from './Pages/Admin/settings.jsx'
import CollaboratorDashboard from './Pages/Collaborator/dashboard.jsx'
import CollaboratorPublications from './Pages/Collaborator/publications.jsx'
import CollaboratorAnalytics from './Pages/Collaborator/analytics.jsx'
import CollaboratorProfile from './Pages/Collaborator/profile.jsx'
import CollaboratorCreatePost from './Pages/Collaborator/createpost.jsx'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/literature" element={<Literature />} />
        <Route path="/admin/dashboard" element={<Admin />} />
        <Route path="/admin/moderation" element={<Moderation />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/files" element={<Files />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/collaborator/dashboard" element={<CollaboratorDashboard />} />
        <Route path="/collaborator/publications" element={<CollaboratorPublications />} />
        <Route path="/collaborator/analytics" element={<CollaboratorAnalytics />} />
        <Route path="/collaborator/profile" element={<CollaboratorProfile />} />
        <Route path="/collaborator/create" element={<CollaboratorCreatePost />} />
      </Routes>
    </Router>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
