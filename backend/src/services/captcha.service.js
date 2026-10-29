/**
 * Verificación de reCAPTCHA contra Google. La comparten el registro de cuentas
 * (`/auth/verify-captcha`) y los comentarios de visitantes sin cuenta.
 *
 * Devuelve `{ ok: true }` o `{ ok: false, status, message }` para que quien la
 * llama responda con el código HTTP adecuado sin repetir la lógica.
 */
export async function verifyRecaptchaToken(token) {
  if (!token || typeof token !== 'string') {
    return { ok: false, status: 400, message: 'Falta completar el captcha.' };
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    // En producción no arrancar el servidor por esto sería desproporcionado
    // para unas pocas rutas, pero tampoco se puede dejar pasar en silencio.
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, status: 503, message: 'El captcha no está configurado en el servidor.' };
    }

    return { ok: true };
  }

  try {
    const googleResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });

    const result = await googleResponse.json();

    if (!result.success) {
      return { ok: false, status: 400, message: 'No se pudo verificar el captcha. Vuelve a intentarlo.' };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      message: 'No se pudo verificar el captcha. Vuelve a intentarlo.',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
