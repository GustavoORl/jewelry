-- Alterações aditivas: não modifica pedidos, pagamentos ou estoque existentes.
CREATE TYPE "StatusDevolucao" AS ENUM ('SOLICITADA', 'APROVADA', 'RECUSADA', 'RECEBIDA', 'CONCLUIDA');
CREATE TABLE "Postagem" (
  "id" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "resumo" TEXT NOT NULL,
  "conteudo" TEXT NOT NULL,
  "imagemUrl" TEXT NOT NULL DEFAULT '',
  "publicada" BOOLEAN NOT NULL DEFAULT false,
  "publicadoEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Postagem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Postagem_publicada_publicadoEm_idx" ON "Postagem"("publicada", "publicadoEm");
CREATE TABLE "Devolucao" (
  "id" TEXT NOT NULL,
  "pedidoId" TEXT NOT NULL,
  "motivo" TEXT NOT NULL,
  "itens" JSONB NOT NULL,
  "status" "StatusDevolucao" NOT NULL DEFAULT 'SOLICITADA',
  "resposta" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Devolucao_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Devolucao_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Devolucao_pedidoId_key" ON "Devolucao"("pedidoId");
CREATE INDEX "Devolucao_status_criadoEm_idx" ON "Devolucao"("status", "criadoEm");
