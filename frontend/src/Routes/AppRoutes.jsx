import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../Pages/Auth/login.jsx';
import Register from '../Pages/Auth/register.jsx';
import Home from '../Pages/Home/home.jsx';
import Authors from '../Pages/Home/authors.jsx';
import Stories from '../Pages/Stories/stories.jsx';
import Literature from '../Pages/Stories/literature.jsx';
import Admin from '../Pages/Admin/dashboard.jsx';
import Moderation from '../Pages/Admin/moderation.jsx';
import Users from '../Pages/Admin/users.jsx';
import Files from '../Pages/Admin/files.jsx';
import AdminSettings from '../Pages/Admin/settings.jsx';
import PublishBook from '../Pages/Admin/publishbook.jsx';
import CollaboratorDashboard from '../Pages/Collaborator/dashboard.jsx';
import CollaboratorPublications from '../Pages/Collaborator/publications.jsx';
import CollaboratorAnalytics from '../Pages/Collaborator/analytics.jsx';
import CollaboratorProfile from '../Pages/Collaborator/profile.jsx';
import CollaboratorCreatePost from '../Pages/Collaborator/createpost.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

function AdminRoute({ children }) {
  return <ProtectedRoute allowedRoles={[ 'admin' ]}>{children}</ProtectedRoute>;
}

function CollaboratorRoute({ children }) {
  return <ProtectedRoute allowedRoles={[ 'admin', 'collaborator' ]}>{children}</ProtectedRoute>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/authors" element={<Authors />} />
      <Route path="/stories" element={<Stories />} />
      <Route path="/literature" element={<Literature />} />

      <Route path="/admin/dashboard" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="/admin/moderation" element={<AdminRoute><Moderation /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><Users /></AdminRoute>} />
      <Route path="/admin/files" element={<AdminRoute><Files /></AdminRoute>} />
      <Route path="/admin/publishbook" element={<AdminRoute><PublishBook /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

      <Route path="/collaborator/dashboard" element={<CollaboratorRoute><CollaboratorDashboard /></CollaboratorRoute>} />
      <Route path="/collaborator/publications" element={<CollaboratorRoute><CollaboratorPublications /></CollaboratorRoute>} />
      <Route path="/collaborator/analytics" element={<CollaboratorRoute><CollaboratorAnalytics /></CollaboratorRoute>} />
      <Route path="/collaborator/profile" element={<CollaboratorRoute><CollaboratorProfile /></CollaboratorRoute>} />
      <Route path="/collaborator/create" element={<CollaboratorRoute><CollaboratorCreatePost /></CollaboratorRoute>} />
    </Routes>
  );
}