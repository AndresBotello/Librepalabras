import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastStack from '../components/ToastStack';

/**
 * Sustituye a `window.confirm` y `window.alert` en toda la aplicación.
 *
 * Los diálogos nativos los pinta el navegador: no se pueden estilizar, se ven
 * distintos en cada uno, muestran el dominio ("localhost:5173 dice") y congelan
 * el hilo de la página mientras están abiertos.
 *
 * `confirm` devuelve una promesa de booleano para que el punto de llamada
 * cambie lo mínimo:
 *
 *   if (!window.confirm('¿Seguro?')) return;      // antes
 *   if (!await confirm({ message: '¿Seguro?' })) return;   // ahora
 *
 * `notify` NO es un reemplazo literal de `alert`: los avisos aparecen como
 * mensajes flotantes que se van solos, sin bloquear ni exigir un clic. Un
 * "guardado correctamente" no merece interrumpir a nadie.
 */

const DialogContext = createContext(null);

let toastId = 0;

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [toasts, setToasts] = useState([]);

  // El `resolve` de la promesa se guarda fuera del estado: es una función y
  // meterla en `useState` invitaría a que React la tratase como actualizador.
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    // Acepta una cadena suelta para los casos simples.
    const config = typeof options === 'string' ? { message: options } : options || {};

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        title: config.title || '¿Confirmar acción?',
        message: config.message || '',
        detail: config.detail || null,
        confirmLabel: config.confirmLabel || 'Confirmar',
        cancelLabel: config.cancelLabel || 'Cancelar',
        // 'danger' pinta el botón en rojo y deja el foco en Cancelar: en una
        // acción irreversible, pulsar Enter sin leer no debe destruir nada.
        variant: config.variant || 'default',
      });
    });
  }, []);

  const closeDialog = useCallback((result) => {
    setDialog(null);

    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((type, message, duration) => {
    if (!message) return null;

    toastId += 1;
    const id = toastId;

    setToasts((prev) => [...prev, { id, type, message: String(message) }]);

    if (duration !== 0) {
      // Los errores se quedan más tiempo: suelen traer información que hay que
      // leer con calma, y a veces copiar.
      setTimeout(() => dismissToast(id), duration || (type === 'error' ? 7000 : 4000));
    }

    return id;
  }, [dismissToast]);

  const notify = useMemo(() => ({
    success: (message, duration) => pushToast('success', message, duration),
    error: (message, duration) => pushToast('error', message, duration),
    info: (message, duration) => pushToast('info', message, duration),
  }), [pushToast]);

  const value = useMemo(() => ({ confirm, notify }), [confirm, notify]);

  return (
    <DialogContext.Provider value={value}>
      {children}

      {dialog && (
        <ConfirmDialog
          {...dialog}
          onConfirm={() => closeDialog(true)}
          onCancel={() => closeDialog(false)}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error('useDialog debe usarse dentro de <DialogProvider>');
  }

  return context;
}

/** Atajos para cuando solo hace falta una de las dos cosas. */
export function useConfirm() {
  return useDialog().confirm;
}

export function useNotify() {
  return useDialog().notify;
}
