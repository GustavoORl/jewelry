
import { ZodError } from "zod";
import { autenticarUsuario } from "../../services/authService.js";

export async function login(req, res) {
  try {
    const resultado = await autenticarUsuario(req.body);

    return res.status(200).json({
      sucesso: true,
      mensagem: "Login realizado com sucesso.",
      ...resultado,
    });
  } catch (erro) {
    if (erro instanceof ZodError) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe um email válido e uma senha.",
      });
    }

    if (erro.message === "CREDENCIAIS_INVALIDAS") {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Email ou senha incorretos.",
      });
    }

    console.error("Erro no login:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível realizar o login.",
    });
  }
}
