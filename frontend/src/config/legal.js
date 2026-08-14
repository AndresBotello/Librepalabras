/**
 * Datos de los términos y condiciones que comparten la página pública y el
 * formulario de registro.
 */

/**
 * Versión del texto. Se guarda junto a la cuenta en el momento de aceptarla.
 *
 * Sirve para saber quién aceptó qué: cuando el texto cambie de forma
 * sustancial, se sube este número y las cuentas anteriores quedan identificadas
 * como aceptantes de la versión vieja, en lugar de que parezca que todo el mundo
 * aceptó siempre lo mismo.
 */
export const TERMS_VERSION = '1.0';

/** Última revisión del texto, tal y como se muestra en la página. */
export const TERMS_UPDATED_AT = '13 de agosto de 2026';

/**
 * PENDIENTE: sustituir por el correo real de la plataforma antes de publicar.
 *
 * Es la dirección que los términos dan para ejercer los derechos sobre los datos
 * personales, reclamar por una obra ajena y pedir la baja de la cuenta. Si el
 * buzón no existe, esos tres caminos quedan cortados y la Ley 1581 de 2012 exige
 * que el primero funcione.
 */
export const LEGAL_CONTACT_EMAIL = 'contacto@liberapalabras.com';

/** Edad mínima para abrir cuenta, la misma que valida el formulario. */
export const MIN_AGE = 13;
