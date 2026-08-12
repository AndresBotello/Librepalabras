import { useAuth } from '../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import CollaboratorSidebar from './CollaboratorSidebar';

/**
 * Elige el menú según QUIÉN eres, no según en qué URL estás.
 *
 * Las pantallas de autoría (`/collaborator/*`) las comparten colaborador, juez
 * y administrador, pero montaban el menú de colaborador a pelo. Para un
 * administrador eso significaba que al entrar a publicar una obra desaparecía
 * su menú, aparecía el de colaborador y ya no había forma de volver a su panel:
 * daba la impresión de haber sido degradado a mitad de camino.
 *
 * Ninguno de los dos menús recibe props ni pide nada al que lo monta, así que
 * intercambiarlos aquí es seguro.
 */
export default function AreaSidebar() {
  const { user } = useAuth();

  return user?.role === 'admin' ? <AdminSidebar /> : <CollaboratorSidebar />;
}
