export function autorizarAdmin(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Autenticação necessária.",
    });
  }

  if (req.usuario.tipo !== "ADMIN") {
    return res.status(403).json({
      sucesso: false,
      mensagem: "Acesso permitido apenas para administradores.",
    });
  }

  return next();
}
