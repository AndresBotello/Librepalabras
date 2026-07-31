export function authorizeRoles(allowedRoles = []) {
  return (req, res, next) => {
    const currentRole = req.user?.role;

    if (!currentRole) {
      return res.status(403).json({
        ok: false,
        message: 'No se pudo determinar el rol del usuario',
      });
    }

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permisos para realizar esta acción',
      });
    }

    return next();
  };
}