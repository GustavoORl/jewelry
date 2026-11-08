ALTER TABLE "Pedido" ADD COLUMN "entregueEm" TIMESTAMP(3);
-- Não presumimos a data de entrega de pedidos antigos pelo campo atualizadoEm.
ALTER TABLE "Postagem" ADD COLUMN "blocos" JSONB NOT NULL DEFAULT '[]', ADD COLUMN "estilo" TEXT NOT NULL DEFAULT 'CLASSICO';
ALTER TABLE "Devolucao" ADD COLUMN "tipoMotivo" TEXT NOT NULL DEFAULT 'OUTRO';
CREATE TABLE "FotoDevolucao" (
  "id" TEXT NOT NULL,
  "devolucaoId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "dados" BYTEA NOT NULL,
  CONSTRAINT "FotoDevolucao_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FotoDevolucao_devolucaoId_fkey" FOREIGN KEY ("devolucaoId") REFERENCES "Devolucao"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "FotoDevolucao_devolucaoId_idx" ON "FotoDevolucao"("devolucaoId");
