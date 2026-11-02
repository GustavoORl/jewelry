import * as pedidoModel from "../models/pedidoModel.js";


/**
 * =========================================
 * ERRO DE SERVIÇO
 * =========================================
 */

function erro(mensagem, status = 400) {
  const error = new Error(mensagem);

  error.status = status;

  return error;
}


/**
 * =========================================
 * VALIDAÇÃO DE TEXTO
 * =========================================
 */

function validarTexto(
  valor,
  campo,
  obrigatorio = true
) {
  if (
    valor == null &&
    !obrigatorio
  ) {
    return null;
  }

  if (
    typeof valor !== "string" ||
    !valor.trim()
  ) {
    throw erro(
      `Informe ${campo}.`
    );
  }

  return valor.trim();
}


/**
 * =========================================
 * STATUS DO PEDIDO
 * =========================================
 */

const statusPermitidos = [
  "PENDENTE",
  "PAGO",
  "EM_PREPARACAO",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
];


/**
 * =========================================
 * TRANSIÇÕES ADMINISTRATIVAS
 * =========================================
 *
 * IMPORTANTE:
 *
 * PENDENTE -> PAGO
 *
 * NÃO pode ser realizado pelo administrador.
 *
 * O status PAGO deve ser definido somente
 * após a confirmação do pagamento.
 *
 *
 * Fluxo permitido para o administrador:
 *
 * PAGO
 *    ↓
 * EM_PREPARACAO
 *    ↓
 * ENVIADO
 *    ↓
 * ENTREGUE
 *
 *
 * null significa que não existe próxima
 * etapa administrativa.
 */

const transicoesAdministrativas = {
  PENDENTE: null,

  PAGO:
    "EM_PREPARACAO",

  EM_PREPARACAO:
    "ENVIADO",

  ENVIADO:
    "ENTREGUE",

  ENTREGUE:
    null,

  CANCELADO:
    null,
};


/**
 * =========================================
 * CRIAR PEDIDO
 * =========================================
 */

export async function criarPedido(
  usuarioId,
  dadosEndereco,
  itensSelecionados
) {
  if (!usuarioId) {
    throw erro(
      "Usuário não autenticado.",
      401
    );
  }


  /**
   * Validação dos itens.
   */

  if (
    !Array.isArray(
      itensSelecionados
    ) ||
    itensSelecionados.length === 0
  ) {
    throw erro(
      "Selecione pelo menos um produto para continuar."
    );
  }


  if (
    itensSelecionados.some(
      (id) =>
        typeof id !== "string" ||
        !id.trim()
    )
  ) {
    throw erro(
      "Os identificadores dos itens selecionados são inválidos."
    );
  }


  /**
   * Evita IDs repetidos na requisição.
   */

  const idsUnicos = [
    ...new Set(
      itensSelecionados
    ),
  ];


  if (
    idsUnicos.length !==
    itensSelecionados.length
  ) {
    throw erro(
      "Existem itens duplicados na seleção."
    );
  }


  /**
   * Validação do endereço.
   */

  if (
    !dadosEndereco ||
    typeof dadosEndereco !==
      "object" ||
    Array.isArray(
      dadosEndereco
    )
  ) {
    throw erro(
      "Informe o endereço de entrega."
    );
  }


  const endereco = {
    destinatario:
      validarTexto(
        dadosEndereco.destinatario,
        "o nome do destinatário"
      ),

    cep:
      validarTexto(
        dadosEndereco.cep,
        "o CEP"
      ),

    rua:
      validarTexto(
        dadosEndereco.rua,
        "a rua"
      ),

    numero:
      validarTexto(
        dadosEndereco.numero,
        "o número"
      ),

    complemento:
      validarTexto(
        dadosEndereco.complemento,
        "o complemento",
        false
      ),

    bairro:
      validarTexto(
        dadosEndereco.bairro,
        "o bairro"
      ),

    cidade:
      validarTexto(
        dadosEndereco.cidade,
        "a cidade"
      ),

    estado:
      validarTexto(
        dadosEndereco.estado,
        "o estado"
      ),
  };


  return pedidoModel
    .criarPedidoComItens({
      usuarioId,

      endereco,

      itensSelecionados:
        idsUnicos,
    });
}


/**
 * =========================================
 * LISTAR PEDIDOS DO USUÁRIO
 * =========================================
 */

export async function listarPedidos(
  usuarioId
) {
  if (!usuarioId) {
    throw erro(
      "Usuário não autenticado.",
      401
    );
  }


  return pedidoModel
    .listarPedidosDoUsuario(
      usuarioId
    );
}


/**
 * =========================================
 * BUSCAR PEDIDO DO USUÁRIO
 * =========================================
 */

export async function buscarPedido(
  usuarioId,
  pedidoId
) {
  if (!usuarioId) {
    throw erro(
      "Usuário não autenticado.",
      401
    );
  }


  if (
    typeof pedidoId !==
      "string" ||
    !pedidoId.trim()
  ) {
    throw erro(
      "Identificador do pedido inválido."
    );
  }


  const pedido =
    await pedidoModel
      .buscarPedidoDoUsuario(
        usuarioId,
        pedidoId
      );


  if (!pedido) {
    throw erro(
      "Pedido não encontrado.",
      404
    );
  }


  return pedido;
}


/**
 * =========================================
 * LISTAR TODOS OS PEDIDOS
 * ADMINISTRADOR
 * =========================================
 */

export async function listarTodosPedidos(
  usuario
) {
  if (
    !usuario ||
    usuario.tipo !== "ADMIN"
  ) {
    throw erro(
      "Acesso não autorizado.",
      403
    );
  }


  return pedidoModel
    .listarTodosPedidos();
}


/**
 * =========================================
 * ATUALIZAR STATUS
 * ADMINISTRADOR
 * =========================================
 */

export async function atualizarStatus(
  usuario,
  pedidoId,
  novoStatus
) {
  /**
   * -----------------------------------------
   * 1. AUTORIZAÇÃO
   * -----------------------------------------
   */

  if (
    !usuario ||
    usuario.tipo !== "ADMIN"
  ) {
    throw erro(
      "Acesso não autorizado.",
      403
    );
  }


  /**
   * -----------------------------------------
   * 2. VALIDAR ID
   * -----------------------------------------
   */

  if (
    typeof pedidoId !==
      "string" ||
    !pedidoId.trim()
  ) {
    throw erro(
      "Identificador do pedido inválido."
    );
  }


  const id =
    pedidoId.trim();


  /**
   * -----------------------------------------
   * 3. VALIDAR STATUS
   * -----------------------------------------
   */

  if (
    typeof novoStatus !==
      "string" ||
    !novoStatus.trim()
  ) {
    throw erro(
      "Informe o novo status do pedido."
    );
  }


  const statusNormalizado =
    novoStatus
      .trim()
      .toUpperCase();


  if (
    !statusPermitidos.includes(
      statusNormalizado
    )
  ) {
    throw erro(
      "Status do pedido inválido."
    );
  }


  /**
   * -----------------------------------------
   * 4. BUSCAR PEDIDO ATUAL
   * -----------------------------------------
   *
   * Precisamos saber o status atual antes
   * de permitir qualquer alteração.
   */

  const pedidoAtual =
    await pedidoModel
      .buscarPedidoPorId(
        id
      );


  if (!pedidoAtual) {
    throw erro(
      "Pedido não encontrado.",
      404
    );
  }


  const statusAtual =
    pedidoAtual.status;


  /**
   * -----------------------------------------
   * 5. MESMO STATUS
   * -----------------------------------------
   */

  if (
    statusAtual ===
    statusNormalizado
  ) {
    throw erro(
      `O pedido já está com o status ${statusAtual}.`
    );
  }


  /**
   * -----------------------------------------
   * 6. PENDENTE
   * -----------------------------------------
   *
   * O administrador não pode transformar
   * manualmente um pedido em PAGO.
   *
   * PAGO deve ser definido pelo fluxo de
   * pagamento após confirmação do provedor.
   */

  if (
    statusAtual ===
    "PENDENTE"
  ) {
    throw erro(
      "Pedidos aguardando pagamento não podem ter o status alterado manualmente. Aguarde a confirmação do pagamento."
    );
  }


  /**
   * -----------------------------------------
   * 7. ENTREGUE
   * -----------------------------------------
   *
   * Estado final.
   */

  if (
    statusAtual ===
    "ENTREGUE"
  ) {
    throw erro(
      "Pedidos entregues não podem ter o status alterado."
    );
  }


  /**
   * -----------------------------------------
   * 8. CANCELADO
   * -----------------------------------------
   *
   * Estado final.
   */

  if (
    statusAtual ===
    "CANCELADO"
  ) {
    throw erro(
      "Pedidos cancelados não podem ter o status alterado."
    );
  }


  /**
   * -----------------------------------------
   * 9. DESCOBRIR PRÓXIMO STATUS
   * -----------------------------------------
   */

  const proximoStatusPermitido =
    transicoesAdministrativas[
      statusAtual
    ];


  if (
    !proximoStatusPermitido
  ) {
    throw erro(
      `Não existe uma próxima etapa disponível para um pedido com status ${statusAtual}.`
    );
  }


  /**
   * -----------------------------------------
   * 10. VALIDAR TRANSIÇÃO
   * -----------------------------------------
   *
   * Exemplos bloqueados:
   *
   * PAGO -> ENVIADO
   * PAGO -> ENTREGUE
   *
   * EM_PREPARACAO -> PAGO
   * EM_PREPARACAO -> ENTREGUE
   *
   * ENVIADO -> PAGO
   * ENVIADO -> EM_PREPARACAO
   */

  if (
    statusNormalizado !==
    proximoStatusPermitido
  ) {
    throw erro(
      `Não é permitido alterar o pedido de ${statusAtual} para ${statusNormalizado}. A próxima etapa permitida é ${proximoStatusPermitido}.`
    );
  }


  /**
   * -----------------------------------------
   * 11. ATUALIZAR
   * -----------------------------------------
   */

  const pedidoAtualizado =
    await pedidoModel
      .atualizarStatusPedido(
        id,
        statusNormalizado
      );


  return pedidoAtualizado;
}