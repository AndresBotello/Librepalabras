import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../Pages/Auth/login.jsx';
import Register from '../Pages/Auth/register.jsx';
import Home from '../Pages/Home/home.jsx';
import Authors from '../Pages/Home/authors.jsx';
import Stories from '../Pages/Stories/stories.jsx';
import Literature from '../Pages/Stories/literature.jsx';
import PoliversiaCatalog from '../Pages/Poliversia/catalog.jsx';
import Concursos from '../Pages/Concursos/index.jsx';
import Concurso from '../Pages/Concursos/concurso.jsx';
import ContestWinners from '../Pages/Concursos/ganadores.jsx';
import ContestPanel from '../Pages/Concursos/panel.jsx';
import Admin from '../Pages/Admin/dashboard.jsx';
import Moderation from '../Pages/Admin/moderation.jsx';
import Users from '../Pages/Admin/users.jsx';
import Files from '../Pages/Admin/files.jsx';
import AdminSettings from '../Pages/Admin/settings.jsx';
import PublishBook from '../Pages/Admin/publishbook.jsx';
import AdminPoliversia from '../Pages/Admin/poliversia.jsx';
import AdminConcursos from '../Pages/Admin/concursos.jsx';
import CollaboratorDashboard from '../Pages/Collaborator/dashboard.jsx';
import CollaboratorPublications from '../Pages/Collaborator/publications.jsx';
import CollaboratorAnalytics from '../Pages/Collaborator/analytics.jsx';
import CollaboratorProfile from '../Pages/Collaborator/profile.jsx';
import CollaboratorCreatePost from '../Pages/Collaborator/createpost.jsx';
import CollaboratorConcurso from '../Pages/Collaborator/concurso.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

function AdminRoute({ children }) {
  return <ProtectedRoute allowedRoles={[ 'admin' ]}>{children}</ProtectedRoute>;
}

// Área de autoría: publicar obra propia y gestionarla. El juez también escribe.
function AuthorRoute({ children }) {
  return <ProtectedRoute allowedRoles={[ 'admin', 'collaborator', 'judge' ]}>{children}</ProtectedRoute>;
}

// Reservado a quien puede concursar: el juez queda fuera para no calificarse
// a sí mismo.
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
      <Route path="/poleversia" element={<PoliversiaCatalog />} />
      {/* Ruta anterior: se conserva redirigida para no romper enlaces ya compartidos. */}
      <Route path="/poliversia" element={<Navigate to="/poleversia" replace />} />
      <Route path="/concursos" element={<Concursos />} />
      <Route path="/concursos/ganadores" element={<ContestWinners />} />

      {/* Panel de calificación: compartido por administradores y jueces. */}
      <Route
        path="/concursos/panel"
        element={
          <ProtectedRoute allowedRoles={['admin', 'judge']}>
            <ContestPanel />
          </ProtectedRoute>
        }
      />

      {/* Va al final para que /concursos/panel y /concursos/ganadores ganen el
          match antes que el slug del catálogo. */}
      <Route path="/concursos/:slug" element={<Concurso />} />

      <Route path="/admin/dashboard" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="/admin/moderation" element={<AdminRoute><Moderation /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><Users /></AdminRoute>} />
      <Route path="/admin/files" element={<AdminRoute><Files /></AdminRoute>} />
      <Route path="/admin/publishbook" element={<AdminRoute><PublishBook /></AdminRoute>} />
      <Route path="/admin/poleversia" element={<AdminRoute><AdminPoliversia /></AdminRoute>} />
      <Route path="/admin/poliversia" element={<Navigate to="/admin/poleversia" replace />} />
      <Route path="/admin/concursos" element={<AdminRoute><AdminConcursos /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

      {/* Autoría: abierta también al juez. */}
      <Route path="/collaborator/dashboard" element={<AuthorRoute><CollaboratorDashboard /></AuthorRoute>} />
      <Route path="/collaborator/publications" element={<AuthorRoute><CollaboratorPublications /></AuthorRoute>} />
      <Route path="/collaborator/analytics" element={<AuthorRoute><CollaboratorAnalytics /></AuthorRoute>} />
      <Route path="/collaborator/profile" element={<AuthorRoute><CollaboratorProfile /></AuthorRoute>} />
      <Route path="/collaborator/create" element={<AuthorRoute><CollaboratorCreatePost /></AuthorRoute>} />

      {/* Inscripción al concurso: sin jueces. */}
      <Route path="/collaborator/concurso" element={<CollaboratorRoute><CollaboratorConcurso /></CollaboratorRoute>} />
    </Routes>
  );
}