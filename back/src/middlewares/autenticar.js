import jwt from "jsonwebtoken";

export function autenticar(req, res, next) {
  const token = req.cookies?.aurora_access;

  if (!token) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Autenticação necessária.",
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.usuario = {
      id: payload.sub,
      tipo: payload.tipo,
    };

    return next();
  } catch (erro) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Token inválido ou expirado.",
    });
  }
}
