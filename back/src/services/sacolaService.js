import * as sacolaModel from "../models/sacolaModel.js";

function erro(mensagem, status = 400) {
  const error = new Error(mensagem);
  error.status = status;
  return error;
}

function validarQuantidade(quantidade) {
  if (
    !Number.isInteger(quantidade) ||
    quantidade < 1
  ) {
    throw erro("A quantidade deve ser um número inteiro maior que zero.");
  }
}

async function obterSacola(usuarioId) {
  return sacolaModel.buscarOuCriarSacola(usuarioId);
}

async function validarProdutoDisponivel(produtoId) {
  const produto = await sacolaModel.buscarProduto(produtoId);

  if (!produto) {
    throw erro("Produto não encontrado.", 404);
  }

  if (!produto.ativo || !produto.categoria.ativo) {
    throw erro("Este produto não está disponível para compra.", 400);
  }

  if (produto.estoque <= 0) {
    throw erro("Este produto está sem estoque.", 400);
  }

  return produto;
}

export async function consultarSacola(usuarioId) {
  let sacola = await sacolaModel.buscarSacola(usuarioId);

  if (!sacola) {
    await sacolaModel.criarSacola(usuarioId);
    sacola = await sacolaModel.buscarSacola(usuarioId);
  }

  const itens = sacola.itens.map((item) => {
    const preco = Number(item.produto.preco);
    const subtotal = preco * item.quantidade;

    return {
      id: item.id,
      produtoId: item.produtoId,
      nome: item.produto.nome,
      slug: item.produto.slug,
      preco,
      quantidade: item.quantidade,
      subtotal,
      estoque: item.produto.estoque,
      disponivel:
        item.produto.ativo &&
        item.produto.categoria.ativo &&
        item.produto.estoque >= item.quantidade,
      imagem: item.produto.imagens[0]?.url ?? null,
      categoria: item.produto.categoria.nome,
    };
  });

  const valorTotal = itens.reduce(
    (total, item) => total + item.subtotal,
    0
  );

  return {
    id: sacola.id,
    itens,
    quantidadeItens: itens.reduce(
      (total, item) => total + item.quantidade,
      0
    ),
    valorTotal: Number(valorTotal.toFixed(2)),
    atualizadoEm: sacola.atualizadoEm,
  };
}

export async function adicionarProduto(usuarioId, produtoId, quantidade = 1) {
  validarQuantidade(quantidade);

  const produto = await validarProdutoDisponivel(produtoId);
  const sacola = await obterSacola(usuarioId);

  const itemExistente = await sacolaModel.buscarItemSacola(
    sacola.id,
    produtoId
  );

  const quantidadeFinal =
    (itemExistente?.quantidade ?? 0) + quantidade;

  if (quantidadeFinal > produto.estoque) {
    throw erro(
      `Estoque insuficiente. Disponível: ${produto.estoque} unidade(s).`
    );
  }

  await sacolaModel.adicionarItemSacola(
    sacola.id,
    produtoId,
    quantidade
  );

  return consultarSacola(usuarioId);
}


export async function alterarQuantidade(
  usuarioId,
  itemId,
  quantidade
) {
  validarQuantidade(quantidade);

  const sacolaAtual = await sacolaModel.buscarSacola(usuarioId);

  if (!sacolaAtual) {
    throw erro("Sacola não encontrada.", 404);
  }

  const item = sacolaAtual.itens.find(
    (itemAtual) => itemAtual.id === itemId
  );

  if (!item) {
    throw erro("Item não encontrado na sua sacola.", 404);
  }

  // Busca os dados atuais do produto e da categoria.
  const produto = await sacolaModel.buscarProduto(item.produtoId);

  if (!produto) {
    throw erro("Produto não encontrado.", 404);
  }

  // Se a quantidade estiver diminuindo, permitimos a correção
  // mesmo que a quantidade atual ultrapasse o estoque.
  const estaDiminuindo = quantidade < item.quantidade;

  if (!estaDiminuindo) {
    if (!produto.ativo || !produto.categoria?.ativo) {
      throw erro("Este produto não está disponível para compra.");
    }

    if (produto.estoque <= 0) {
      throw erro("Este produto está sem estoque.");
    }

    if (quantidade > produto.estoque) {
      throw erro(
        `Estoque insuficiente. Disponível: ${produto.estoque} unidade(s).`
      );
    }
  }

  await sacolaModel.atualizarQuantidadeItem(itemId, quantidade);

  return consultarSacola(usuarioId);
}


export async function removerProduto(usuarioId, itemId) {
  const sacola = await sacolaModel.buscarSacola(usuarioId);

  if (!sacola) {
    throw erro("Sacola não encontrada.", 404);
  }

  const item = sacola.itens.find(
    (itemAtual) => itemAtual.id === itemId
  );

  if (!item) {
    throw erro("Item não encontrado na sua sacola.", 404);
  }

  await sacolaModel.removerItemSacola(itemId);

  return consultarSacola(usuarioId);
}

export async function esvaziarSacola(usuarioId) {
  const sacola = await sacolaModel.buscarSacola(usuarioId);

  if (!sacola) {
    return {
      mensagem: "Sua sacola já está vazia.",
      itens: [],
      quantidadeItens: 0,
      valorTotal: 0,
    };
  }

  await sacolaModel.limparSacola(sacola.id);

  return consultarSacola(usuarioId);
}
