import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, Calendar, ArrowRight, X, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { loginWithEmail, loginWithGoogle, registerWithEmail, sendPasswordReset } from '../../services/auth';
import { useAuth } from '../../context/AuthContext.jsx';
import { homeRouteForRole } from '../../utils/roles';
import { getInvitationByToken } from '../../services/api';
import gendersData from '../../config/genders.json';
import { TERMS_VERSION } from '../../config/legal';

const ROLE_LABELS_INVITE = {
  admin: 'Administrador',
  collaborator: 'Colaborador',
  judge: 'Jurado',
};

export default function Login({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { applySession, refreshAuth } = useAuth();
  const inviteToken = searchParams.get('invite');
  // null = sin comprobar todavía, false = token inválido, objeto = válido.
  const [invitation, setInvitation] = useState(null);
  const [inviteChecked, setInviteChecked] = useState(!inviteToken);
  const [isLogin, setIsLogin] = useState(initialMode !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  // Solo cuenta al registrarse. Arranca siempre en falso: la aceptación tiene
  // que ser un acto del usuario, así que ni se premarca ni se recuerda.
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    fechaNacimiento: '',
    genero: '',
  });

  const edad = useMemo(() => {
    if (!formData.fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(formData.fechaNacimiento);
    let edadCalculada = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edadCalculada--;
    }
    return edadCalculada;
  }, [formData.fechaNacimiento]);

  /**
   * Con un enlace de invitación el formulario arranca en modo registro y con el
   * correo ya puesto y bloqueado: el backend solo aplica el rol si la cuenta se
   * crea con esa misma dirección, así que dejarlo editable solo serviría para
   * que alguien se registrara y se quedara sin el rol prometido.
   */
  useEffect(() => {
    if (!inviteToken) return;

    let cancelled = false;

    getInvitationByToken(inviteToken)
      .then((response) => {
        if (cancelled) return;

        setInvitation(response.invitation);
        setIsLogin(false);
        setFormData((prev) => ({ ...prev, email: response.invitation.email }));
      })
      .catch(() => {
        if (!cancelled) setInvitation(false);
      })
      .finally(() => {
        if (!cancelled) setInviteChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setStatusMessage('Por favor completa todos los campos principales');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setStatusMessage('Por favor ingresa un correo electrónico válido');
      return false;
    }

    if (formData.password.length < 6) {
      setStatusMessage('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!isLogin) {
      if (!formData.nombres || !formData.apellidos) {
        setStatusMessage('Nombres y Apellidos son obligatorios');
        return false;
      }

      if (formData.nombres.length < 2 || formData.apellidos.length < 2) {
        setStatusMessage('Nombres y Apellidos deben tener al menos 2 caracteres');
        return false;
      }

      if (!formData.telefono || !/^\d{7,15}$/.test(formData.telefono)) {
        setStatusMessage('Ingresa un teléfono válido (7-15 dígitos)');
        return false;
      }

      if (!formData.fechaNacimiento) {
        setStatusMessage('La fecha de nacimiento es obligatoria');
        return false;
      }

      if (edad === null || edad < 13) {
        setStatusMessage('Debes tener al menos 13 años para registrarte');
        return false;
      }

      if (!formData.genero) {
        setStatusMessage('Por favor selecciona un género');
        return false;
      }

      // Se comprueba aquí además de deshabilitar el botón: el `disabled` es una
      // ayuda visual y se puede quitar desde el inspector del navegador, así que
      // no puede ser lo único que impida crear la cuenta.
      if (!acceptedTerms) {
        setStatusMessage('Para crear tu cuenta debes aceptar los Términos y Condiciones');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let sessionUser;

      if (isLogin) {
        sessionUser = await loginWithEmail(formData.email, formData.password, rememberMe);
      } else {
        const profileData = {
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          telefono: formData.telefono,
          fechaNacimiento: formData.fechaNacimiento,
          edad: edad,
          genero: formData.genero,
          // Queda guardado con la cuenta: qué versión del texto se aceptó. La
          // fecha la pone el servidor, no el navegador.
          terminosVersion: TERMS_VERSION,
        };

        sessionUser = await registerWithEmail(
          formData.email,
          formData.password,
          profileData,
          rememberMe,
          // Solo se manda si el token resultó válido: uno caducado haría que el
          // backend lo ignorase igualmente, pero así queda explícito.
          invitation ? inviteToken : null
        );
      }

      // Si por lo que sea el backend no devolvió perfil, caemos al camino largo.
      const currentUser = sessionUser ? applySession(sessionUser) : await refreshAuth();

      navigate(homeRouteForRole(currentUser?.role));
    } catch (error) {
      setStatusMessage(error.message || 'No se pudo conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    // El mismo botón sirve para entrar y para darse de alta. En modo registro
    // crea cuenta, así que exige la aceptación igual que el formulario; en modo
    // acceso no la pide, porque quien ya tiene cuenta la aceptó al abrirla.
    if (!isLogin && !acceptedTerms) {
      setStatusMessage('Para crear tu cuenta debes aceptar los Términos y Condiciones');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const sessionUser = await loginWithGoogle(
        rememberMe,
        invitation ? inviteToken : null,
        isLogin ? null : { terminosVersion: TERMS_VERSION }
      );
      const currentUser = sessionUser ? applySession(sessionUser) : await refreshAuth();

      setStatusMessage('Google conectado correctamente.');
      navigate(homeRouteForRole(currentUser?.role));
    } catch (error) {
      setStatusMessage(error.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReset = () => {
    // Si ya escribió el correo arriba, no se lo hacemos teclear otra vez.
    setResetEmail(formData.email);
    setResetError('');
    setResetSent(false);
    setResetOpen(true);
  };

  const closeReset = () => {
    if (resetSending) return;
    setResetOpen(false);
  };

  useEffect(() => {
    if (!resetOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !resetSending) {
        setResetOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resetOpen, resetSending]);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');

    const email = resetEmail.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResetError('Ingresa un correo electrónico válido');
      return;
    }

    setResetSending(true);

    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (error) {
      setResetError(error.message || 'No se pudo enviar el correo. Intenta de nuevo.');
    } finally {
      setResetSending(false);
    }
  };

  const { isDark } = useContext(ThemeContext);

  const goToMode = (mode) => {
    setIsLogin(mode === 'login');
    setStatusMessage('');
    navigate(mode === 'login' ? '/login' : '/register');
  };

  // Clases dinámicas reutilizables
  const inputBaseClasses = `w-full py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm ${
    isDark
      ? 'bg-gray-800/90 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-amber-500/30 focus:border-amber-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-brand-700/20 focus:border-brand-700'
  }`;

  const labelClasses = `block text-xs font-semibold mb-1.5 tracking-wider uppercase transition-colors ${
    isDark ? 'text-gray-300' : 'text-brand-700'
  }`;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Navbar />
      
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left Section - Form Container */}
        <div className={`w-full lg:w-1/2 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-10 transition-colors ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
          
          {/* Form Card */}
          <div className={`w-full transition-all duration-300 ${isLogin ? 'max-w-md' : 'max-w-lg'} rounded-2xl shadow-xl border p-6 sm:p-8 ${
            isDark ? 'bg-gray-900/90 border-gray-800 shadow-black/40' : 'bg-white border-gray-200/80 shadow-gray-200/50'
          }`}>
            
            {/* Header */}
            <div className="mb-6 text-center sm:text-left">
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-brand-700'}`}>
                {isLogin ? '¡Hola de nuevo!' : 'Únete a la comunidad'}
              </h1>
              <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {isLogin
                  ? 'Inicia sesión para acceder a tu espacio literario.'
                  : 'Forma parte del punto de encuentro cultural en Valledupar.'
                }
              </p>
            </div>

            {/* Selector de Pestañas */}
            <div className={`flex rounded-xl p-1 mb-6 transition-colors ${isDark ? 'bg-gray-800/70' : 'bg-gray-100'}`}>
              <button
                type="button"
                onClick={() => goToMode('login')}
                className={`flex-1 py-2 font-medium text-xs sm:text-sm rounded-lg transition-all duration-200 ${
                  isLogin
                    ? isDark
                      ? 'bg-gray-700 text-white shadow-sm'
                      : 'bg-white text-brand-700 shadow-sm font-semibold'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => goToMode('register')}
                className={`flex-1 py-2 font-medium text-xs sm:text-sm rounded-lg transition-all duration-200 ${
                  !isLogin
                    ? isDark
                      ? 'bg-gray-700 text-white shadow-sm'
                      : 'bg-white text-brand-700 shadow-sm font-semibold'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Crear Cuenta
              </button>
            </div>

            {/* Aviso de invitación. Solo se pinta cuando ya se comprobó el
                token, para no mostrar "inválida" durante la comprobación. */}
            {inviteToken && inviteChecked && (
              invitation ? (
                <div className={`mb-5 rounded-xl px-4 py-3 text-sm border ${
                  isDark
                    ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <p className="font-semibold mb-0.5">
                    🎟️ {invitation.invitedByName} te invitó como{' '}
                    {ROLE_LABELS_INVITE[invitation.role] || invitation.role}
                  </p>
                  <p className="text-xs opacity-90">
                    Crea tu cuenta con <strong>{invitation.email}</strong> y el rol se asignará solo.
                  </p>
                </div>
              ) : (
                <div className={`mb-5 rounded-xl px-4 py-3 text-sm border ${
                  isDark
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  Esta invitación no existe, ya se usó o caducó. Puedes registrarte igualmente,
                  pero tendrás el rol por defecto.
                </div>
              )
            )}

            {/* Status Message */}
            {statusMessage && (
              <div className={`mb-5 rounded-xl px-4 py-3 text-sm border flex items-center gap-2 animate-fadeIn ${
                statusMessage.includes('correctamente')
                  ? isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Campos dinámicos de Registro */}
              {!isLogin && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Nombres y Apellidos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses}>Nombres</label>
                      <div className="relative">
                        <User className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                          type="text"
                          name="nombres"
                          value={formData.nombres}
                          onChange={handleInputChange}
                          placeholder="Gabriel"
                          className={`${inputBaseClasses} pl-10 pr-3`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClasses}>Apellidos</label>
                      <div className="relative">
                        <User className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                          type="text"
                          name="apellidos"
                          value={formData.apellidos}
                          onChange={handleInputChange}
                          placeholder="García Márquez"
                          className={`${inputBaseClasses} pl-10 pr-3`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className={labelClasses}>Teléfono Móvil</label>
                    <div className="relative flex items-center">
                      <Phone className={`absolute left-3.5 top-3 w-4 h-4 z-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`absolute left-9 font-semibold text-xs border-r pr-2 transition-colors ${
                        isDark ? 'text-amber-400 border-gray-700' : 'text-brand-700 border-gray-200'
                      }`}>
                        +57
                      </span>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        placeholder="300 123 4567"
                        maxLength="15"
                        className={`${inputBaseClasses} pl-20 pr-4`}
                      />
                    </div>
                  </div>

                  {/* Fecha de Nacimiento y Edad */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses}>Fecha Nacimiento</label>
                      <div className="relative">
                        <Calendar className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                          type="date"
                          name="fechaNacimiento"
                          value={formData.fechaNacimiento}
                          onChange={handleInputChange}
                          className={`${inputBaseClasses} pl-10 pr-3`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClasses}>Edad</label>
                      <div className={`w-full py-2.5 px-4 border rounded-xl flex items-center text-sm font-medium ${
                        isDark ? 'bg-gray-800/40 border-gray-700 text-gray-300' : 'bg-gray-100/70 border-gray-200 text-gray-700'
                      }`}>
                        {edad !== null ? (
                          <span className="text-emerald-500 font-semibold">{edad} años</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Calculada aut.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Género */}
                  <div>
                    <label className={labelClasses}>Género</label>
                    <select
                      name="genero"
                      value={formData.genero}
                      onChange={handleInputChange}
                      className={`${inputBaseClasses} px-3`}
                    >
                      <option value="">Selecciona tu género</option>
                      {gendersData.map((gender) => (
                        <option key={gender.value} value={gender.value}>
                          {gender.icon} {gender.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className={labelClasses}>Correo Electrónico</label>
                <div className="relative">
                  <Mail className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="usuario@ejemplo.com"
                    // Con invitación válida el correo queda fijo: el rol solo se
                    // aplica si la cuenta se crea con esa dirección exacta.
                    readOnly={Boolean(invitation) && !isLogin}
                    className={`${inputBaseClasses} pl-10 pr-4 ${
                      invitation && !isLogin ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className={labelClasses}>Contraseña</label>
                <div className="relative">
                  <Lock className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className={`${inputBaseClasses} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3.5 top-3 transition-colors ${
                      isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-700 focus:ring-brand-700"
                  />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Mantener sesión</span>
                </label>
                <button
                  type="button"
                  onClick={openReset}
                  className={`font-medium transition-colors hover:underline ${
                    isDark ? 'text-amber-400 hover:text-amber-300' : 'text-brand-700'
                  }`}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Aceptación de los términos. Solo al registrarse: a quien ya
                  tiene cuenta se le pidió al abrirla, y volver a pedírsela en
                  cada acceso convertiría el trámite en ruido que se marca sin
                  leer. El enlace abre en otra pestaña para que nadie pierda el
                  formulario a medio llenar por ir a consultarlos. */}
              {!isLogin && (
                <div className={`mt-5 p-3 rounded-xl border transition-colors ${
                  isDark ? 'border-gray-800 bg-gray-800/40' : 'border-gray-200 bg-gray-50'
                }`}>
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0 rounded border-gray-300 text-brand-700 focus:ring-brand-700"
                    />
                    <span className={`text-xs leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      He leído y acepto los{' '}
                      <Link
                        to="/terminos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-semibold underline transition-colors ${
                          isDark ? 'text-amber-400 hover:text-amber-300' : 'text-brand-700 hover:text-brand-800'
                        }`}
                      >
                        Términos y Condiciones
                      </Link>
                      , y autorizo el tratamiento de mis datos personales conforme a lo que allí se explica.
                    </span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || (!isLogin && !acceptedTerms)}
                className="w-full text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 mt-6 text-sm tracking-wider uppercase bg-brand-700 hover:bg-brand-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Crear mi Cuenta'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Separador */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className={`px-3 uppercase font-medium tracking-wider ${
                    isDark ? 'bg-gray-900 text-gray-500' : 'bg-white text-gray-400'
                  }`}>
                    o acceder con
                  </span>
                </div>
              </div>

              {/* Acceso con proveedor externo. Solo Google: es el único que
                  está configurado como método de acceso. */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting || (!isLogin && !acceptedTerms)}
                  className={`w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border rounded-xl transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? 'border-gray-800 bg-gray-800/50 hover:bg-gray-800 text-gray-200'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </form>

            {/* Bottom Link */}
            <div className="mt-8 text-center text-xs">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                {isLogin ? '¿Aún no tienes cuenta? ' : '¿Ya tienes una cuenta? '}
                <button
                  type="button"
                  onClick={() => goToMode(isLogin ? 'register' : 'login')}
                  className={`font-semibold transition-colors hover:underline ${
                    isDark ? 'text-amber-400' : 'text-brand-700'
                  }`}
                >
                  {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Visual / Quote Banner */}
        <div
          className="hidden lg:flex lg:w-1/2 flex-col items-center justify-end p-12 relative overflow-hidden"
          style={{
            backgroundImage: 'url(https://res.cloudinary.com/dtuyckctv/image/upload/v1785045439/ebd25bff-35fb-4c83-a45f-04770cfbe21a_hvxmhk.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Layer Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10"></div>

          {/* Quote Glassmorphic Box */}
          <div className="max-w-md relative z-10 w-full">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl text-white">
              <p className="text-base font-serif italic mb-6 leading-relaxed text-amber-100">
                "La literatura es el arte de la palabra, y aquí en el Valle, cada palabra cuenta una historia que merece ser liberada."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-brand-700 to-amber-700 rounded-full flex-shrink-0 flex items-center justify-center border border-amber-300/40 shadow-inner">
                  <span className="text-white text-xs font-bold tracking-wider">AD</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Andrés Felipe Dana</p>
                  <p className="text-gray-300 text-xs">Fundador y Community Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal de recuperación de contraseña */}
      {resetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-title"
        >
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-modal-overlay"
            onClick={closeReset}
          />

          <div className={`relative z-10 w-full max-w-md rounded-2xl border shadow-2xl animate-modal-panel transition-colors ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className={`flex items-start justify-between gap-4 px-6 py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <h2 id="reset-title" className={`text-lg font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-brand-700'}`}>
                Recuperar contraseña
              </h2>
              <button
                type="button"
                onClick={closeReset}
                disabled={resetSending}
                aria-label="Cerrar"
                className={`p-1.5 rounded-lg flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSent ? (
              <div className="px-6 py-8 text-center">
                <CheckCircle2 className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Revisa tu correo
                </p>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Si hay una cuenta registrada con <span className="font-medium break-all">{resetEmail.trim()}</span>,
                  te enviamos un enlace para crear una contraseña nueva. Puede tardar un par de minutos
                  y a veces llega a la carpeta de spam.
                </p>
                <button
                  type="button"
                  onClick={() => setResetOpen(false)}
                  className="w-full mt-6 text-white font-semibold py-2.5 px-4 rounded-xl text-sm tracking-wider uppercase bg-brand-700 hover:bg-brand-800 transition-colors"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="px-6 py-5">
                <p className={`text-sm leading-relaxed mb-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Escribe el correo de tu cuenta y te enviaremos un enlace para crear una
                  contraseña nueva. Sirve también si entraste con Google y quieres volver a
                  usar correo y contraseña.
                </p>

                {resetError && (
                  <div className={`mb-4 rounded-xl px-4 py-3 text-sm border ${
                    isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {resetError}
                  </div>
                )}

                <label htmlFor="reset-email" className={labelClasses}>
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    id="reset-email"
                    type="email"
                    autoFocus
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className={`${inputBaseClasses} pl-10 pr-4`}
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeReset}
                    disabled={resetSending}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
                      isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetSending}
                    className="flex-1 text-white font-semibold py-2.5 px-4 rounded-xl text-sm tracking-wider uppercase bg-brand-700 hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetSending ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}