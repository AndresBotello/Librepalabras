import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useDialog } from '../../context/DialogContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import { createInvitation, getInvitations, revokeInvitation } from '../../services/api';

const ROLES = [
  { value: 'collaborator', label: 'Colaborador', help: 'Publica obra propia y participa en concursos.' },
  { value: 'judge', label: 'Jurado', help: 'Califica los concursos. No puede concursar.' },
  { value: 'admin', label: 'Administrador', help: 'Acceso total al panel de gestión.' },
];

const STATUS_BADGES = {
  pending: { label: 'Pendiente', classes: 'bg-amber-500/10 text-amber-600' },
  accepted: { label: 'Aceptada', classes: 'bg-emerald-500/10 text-emerald-600' },
  revoked: { label: 'Revocada', classes: 'bg-slate-500/10 text-slate-500' },
  expired: { label: 'Caducada', classes: 'bg-rose-500/10 text-rose-500' },
};

export default function AdminInvitaciones() {
  const { isDark } = useContext(ThemeContext);
  const { confirm } = useDialog();

  const [invitations, setInvitations] = useState([]);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('collaborator');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  // Enlace de la última invitación creada. Es la única vez que existe: el token
  // no se guarda en claro, así que si se cierra sin copiarlo hay que reinvitar.
  const [lastLink, setLastLink] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    try {
      const response = await getInvitations();

      if (response.ok) {
        setInvitations(response.invitations || []);
        setEmailEnabled(Boolean(response.emailEnabled));
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    setCreating(true);
    setFeedback(null);
    setLastLink(null);
    setCopied(false);

    try {
      const response = await createInvitation(email.trim(), role);

      setLastLink({ url: response.inviteUrl, email: response.invitation.email, emailSent: response.emailSent });
      setFeedback({ type: 'success', text: response.message });
      setEmail('');
      await load();
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lastLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // El portapapeles falla sin HTTPS o sin permiso; el enlace sigue visible
      // en pantalla para seleccionarlo a mano.
      setFeedback({ type: 'error', text: 'No se pudo copiar. Selecciona el enlace y cópialo manualmente.' });
    }
  };

  const handleRevoke = async (invitation) => {
    const confirmed = await confirm({
      title: 'Revocar invitación',
      message: 'El enlace dejará de funcionar de inmediato. Si te equivocas, tendrás que crear una invitación nueva.',
      detail: invitation.email,
      confirmLabel: 'Revocar',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const response = await revokeInvitation(invitation.id);
      setFeedback({ type: 'success', text: response.message });
      await load();
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    }
  };

  const cardClass = `rounded-xl border transition-colors ${
    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
  }`;

  const inputClass = `w-full px-4 py-2 rounded-lg transition-colors ${
    isDark
      ? 'bg-slate-800 text-slate-100 border border-slate-700 focus:border-amber-500'
      : 'bg-white text-slate-900 border border-slate-300 focus:border-amber-600'
  } focus:outline-none`;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className={`px-6 lg:px-10 py-8 border-b transition-colors ${
            isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="max-w-4xl mx-auto">
              <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                Acceso
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
                Invitaciones
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Invita a alguien con su rol ya asignado, en vez de cambiárselo después de que se registre.
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-6 lg:px-10 py-8 space-y-8">
            {!emailEnabled && (
              <div className={`px-4 py-3 rounded-lg text-sm ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}>
                <strong>El envío por correo está desactivado.</strong> Las invitaciones se crean igual:
                copia el enlace y compártelo por WhatsApp, correo o donde prefieras. Para activar el envío
                automático, define <code className="font-mono text-xs">SMTP_USER</code> y{' '}
                <code className="font-mono text-xs">SMTP_PASS</code> en el servidor.
              </div>
            )}

            {feedback && (
              <div
                role="status"
                className={`px-4 py-3 rounded-lg text-sm font-medium ${
                  feedback.type === 'success'
                    ? isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
                    : isDark ? 'bg-rose-950 text-rose-300' : 'bg-rose-50 text-rose-800'
                }`}
              >
                {feedback.text}
              </div>
            )}

            {/* Formulario */}
            <section className={`${cardClass} p-6`}>
              <h2 className="text-lg font-bold mb-5">Nueva invitación</h2>

              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label htmlFor="invite-email" className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Correo de la persona
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="persona@ejemplo.com"
                    className={inputClass}
                  />
                </div>

                <fieldset>
                  <legend className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Rol asignado
                  </legend>

                  <div className="grid sm:grid-cols-3 gap-3">
                    {ROLES.map((item) => (
                      <label
                        key={item.value}
                        className={`block px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                          role === item.value
                            ? 'border-[#5D4037] bg-[#5D4037]/10'
                            : isDark
                              ? 'border-slate-700 hover:border-slate-600'
                              : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={item.value}
                          checked={role === item.value}
                          onChange={(e) => setRole(e.target.value)}
                          className="sr-only"
                        />
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className={`block text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.help}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <button
                  type="submit"
                  disabled={creating || !email.trim()}
                  className="px-5 py-2 rounded-lg font-semibold text-sm bg-[#5D4037] text-white hover:bg-[#4A302A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? 'Creando…' : 'Crear invitación'}
                </button>
              </form>

              {lastLink && (
                <div className={`mt-6 p-4 rounded-lg border ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-amber-50/60 border-amber-200'
                }`}>
                  <p className="text-sm font-semibold mb-1">
                    Enlace para {lastLink.email}
                  </p>
                  <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {lastLink.emailSent
                      ? 'Ya se envió por correo. Guarda el enlace por si no llega.'
                      : 'Cópialo ahora: por seguridad no se vuelve a mostrar.'}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <input
                      readOnly
                      value={lastLink.url}
                      onFocus={(e) => e.target.select()}
                      className={`flex-1 min-w-0 px-3 py-2 rounded-lg text-xs font-mono ${
                        isDark ? 'bg-slate-900 text-slate-300 border border-slate-700' : 'bg-white text-slate-700 border border-slate-300'
                      }`}
                    />
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#5D4037] text-white hover:bg-[#4A302A] transition-colors"
                    >
                      {copied ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Listado */}
            <section className={cardClass}>
              <h2 className={`text-lg font-bold px-6 pt-6 pb-4 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                Invitaciones enviadas
              </h2>

              {loading ? (
                <div className="p-6 space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className={`h-14 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                  ))}
                </div>
              ) : invitations.length === 0 ? (
                <p className={`px-6 py-12 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Todavía no has creado ninguna invitación.
                </p>
              ) : (
                <ul>
                  {invitations.map((invitation) => {
                    const badge = STATUS_BADGES[invitation.status] || STATUS_BADGES.pending;
                    const roleLabel = ROLES.find((r) => r.value === invitation.role)?.label || invitation.role;

                    return (
                      <li
                        key={invitation.id}
                        className={`flex flex-wrap items-center gap-3 px-6 py-4 border-b last:border-b-0 ${
                          isDark ? 'border-slate-800' : 'border-slate-100'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{invitation.email}</p>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {roleLabel} · Invitada el{' '}
                            {new Date(invitation.createdAt).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${badge.classes}`}>
                          {badge.label}
                        </span>

                        {invitation.status === 'pending' && (
                          <button
                            onClick={() => handleRevoke(invitation)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                              isDark ? 'text-rose-400 hover:bg-slate-800' : 'text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            Revocar
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
