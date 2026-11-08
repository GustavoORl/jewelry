-- Não recalcula nem altera valores de pedidos/pagamentos anteriores.
ALTER TABLE "Pedido"
 ADD COLUMN "subtotalProdutos" DECIMAL(10,2),
 ADD COLUMN "freteValor" DECIMAL(10,2),
 ADD COLUMN "freteCusto" DECIMAL(10,2),
 ADD COLUMN "freteServicoId" TEXT,
 ADD COLUMN "freteServico" TEXT,
 ADD COLUMN "freteTransportadora" TEXT,
 ADD COLUMN "fretePrazoDias" INTEGER,
 ADD COLUMN "freteOrigemCep" TEXT,
 ADD COLUMN "freteCotadoEm" TIMESTAMP(3),
 ADD COLUMN "freteAmbiente" TEXT;
