import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../Pages/Auth/login.jsx';
import Register from '../Pages/Auth/register.jsx';
import Home from '../Pages/Home/home.jsx';
import Authors from '../Pages/Home/authors.jsx';
import Stories from '../Pages/Stories/stories.jsx';
import Literature from '../Pages/Stories/literature.jsx';
import PoliversiaCatalog from '../Pages/Poliversia/catalog.jsx';
import GrupoFocal from '../Pages/GrupoFocal/index.jsx';
import GrupoFocalEncuentro from '../Pages/GrupoFocal/encuentro.jsx';
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
import AdminGrupoFocal from '../Pages/Admin/grupofocal.jsx';
import AdminConcursos from '../Pages/Admin/concursos.jsx';
import AdminComentarios from '../Pages/Admin/comentarios.jsx';
import AdminHome from '../Pages/Admin/home.jsx';
import AdminInvitaciones from '../Pages/Admin/invitaciones.jsx';
import AdminAutores from '../Pages/Admin/autores.jsx';
import AdminSalud from '../Pages/Admin/salud.jsx';
import CollaboratorDashboard from '../Pages/Collaborator/dashboard.jsx';
import CollaboratorPublications from '../Pages/Collaborator/publications.jsx';
import CollaboratorAnalytics from '../Pages/Collaborator/analytics.jsx';
import CollaboratorProfile from '../Pages/Collaborator/profile.jsx';
import CollaboratorCreatePost from '../Pages/Collaborator/createpost.jsx';
import CollaboratorConcurso from '../Pages/Collaborator/concurso.jsx';
import UsuarioDashboard from '../Pages/Usuario/dashboard.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

function AdminRoute({ children }) {
  return <ProtectedRoute allowedRoles={[ 'admin' ]}>{children}</ProtectedRoute>;
}

// Área de autoría: publicar obra propia y gestionarla. El juez también escribe.
function AuthorRoute({ children }) {
  return <ProtectedRoute allowedRoles={[ 'admin', 'collaborator', 'judge' ]}>{children}</ProtectedRoute>;
}

// Reservado a quien puede concursar. Es el mismo conjunto que CONTESTANT_ROLES
// en el backend, y tiene que seguir siéndolo: antes dejaba entrar al admin, que
// la API nunca ha aceptado como concursante, así que la pantalla ofrecía algo
// que terminaba en 403. El juez queda fuera para no calificarse a sí mismo.
function ContestantRoute({ children }) {
  return <ProtectedRoute allowedRoles={[ 'collaborator', 'user' ]}>{children}</ProtectedRoute>;
}

// Área de quien todavía no publica obra. No lleva guardia de rol por encima de
// la sesión: cualquiera que haya entrado puede verla, y es el destino al que
// `homeRouteForRole` manda los roles sin área propia.
function SignedInRoute({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
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
      <Route path="/grupo-focal" element={<GrupoFocal />} />
      <Route path="/grupo-focal/:id" element={<GrupoFocalEncuentro />} />
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
      <Route path="/admin/autores" element={<AdminRoute><AdminAutores /></AdminRoute>} />
      <Route path="/admin/files" element={<AdminRoute><Files /></AdminRoute>} />
      <Route path="/admin/publishbook" element={<AdminRoute><PublishBook /></AdminRoute>} />
      <Route path="/admin/poleversia" element={<AdminRoute><AdminPoliversia /></AdminRoute>} />
      <Route path="/admin/poliversia" element={<Navigate to="/admin/poleversia" replace />} />
      <Route path="/admin/grupo-focal" element={<AdminRoute><AdminGrupoFocal /></AdminRoute>} />
      <Route path="/admin/concursos" element={<AdminRoute><AdminConcursos /></AdminRoute>} />
      <Route path="/admin/comentarios" element={<AdminRoute><AdminComentarios /></AdminRoute>} />
      <Route path="/admin/home" element={<AdminRoute><AdminHome /></AdminRoute>} />
      <Route path="/admin/invitaciones" element={<AdminRoute><AdminInvitaciones /></AdminRoute>} />
      <Route path="/admin/salud" element={<AdminRoute><AdminSalud /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

      {/* Autoría: abierta también al juez. */}
      <Route path="/collaborator/dashboard" element={<AuthorRoute><CollaboratorDashboard /></AuthorRoute>} />
      <Route path="/collaborator/publications" element={<AuthorRoute><CollaboratorPublications /></AuthorRoute>} />
      <Route path="/collaborator/analytics" element={<AuthorRoute><CollaboratorAnalytics /></AuthorRoute>} />
      <Route path="/collaborator/profile" element={<AuthorRoute><CollaboratorProfile /></AuthorRoute>} />
      <Route path="/collaborator/create" element={<AuthorRoute><CollaboratorCreatePost /></AuthorRoute>} />

      {/* Inscripción al concurso: sin jueces. */}
      <Route path="/collaborator/concurso" element={<ContestantRoute><CollaboratorConcurso /></ContestantRoute>} />

      {/* Área de quien aún no publica obra. Reaprovecha las pantallas de
          concurso y perfil, que no dependen de tener obra propia. */}
      <Route path="/usuario/dashboard" element={<SignedInRoute><UsuarioDashboard /></SignedInRoute>} />
      <Route path="/usuario/concurso" element={<ContestantRoute><CollaboratorConcurso /></ContestantRoute>} />
      <Route path="/usuario/perfil" element={<SignedInRoute><CollaboratorProfile /></SignedInRoute>} />
    </Routes>
  );
}