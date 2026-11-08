export function criarExclusaoImagemProduto(db, removerArquivo) {
  return async (produtoId, imagemId) => {
    const imagem = await db.$transaction(async tx => {
      const encontrada = await tx.imagemProduto.findFirst({ where: { id: imagemId, produtoId } });
      if (!encontrada) throw Object.assign(new Error("Imagem não encontrada neste produto."), { status: 404 });
      const resultado = await tx.imagemProduto.deleteMany({ where: { id: imagemId, produtoId } });
      if (!resultado.count) throw Object.assign(new Error("Esta imagem já foi removida."), { status: 404 });
      return encontrada;
    });
    let aviso = null;
    try { await removerArquivo(imagem.url); }
    catch { aviso = "A foto foi removida do produto, mas não foi possível apagar o arquivo do armazenamento."; }
    return { sucesso: true, imagemId, aviso };
  };
}
