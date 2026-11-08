CREATE TABLE "MensagemDevolucao" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "devolucaoId" TEXT NOT NULL REFERENCES "Devolucao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "autorId" TEXT REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 "autorTipo" "TipoUsuario" NOT NULL,
 "texto" TEXT NOT NULL,
 "chaveCliente" TEXT,
 "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "MensagemDevolucao_chaveCliente_key" ON "MensagemDevolucao"("chaveCliente");
CREATE INDEX "MensagemDevolucao_devolucaoId_criadoEm_id_idx" ON "MensagemDevolucao"("devolucaoId", "criadoEm", "id");
CREATE TABLE "Notificacao" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "usuarioId" TEXT NOT NULL REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "chave" TEXT NOT NULL,
 "titulo" TEXT NOT NULL,
 "texto" TEXT NOT NULL,
 "url" TEXT NOT NULL,
 "lidaEm" TIMESTAMP(3),
 "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Notificacao_chave_key" ON "Notificacao"("chave");
CREATE INDEX "Notificacao_usuarioId_lidaEm_criadoEm_idx" ON "Notificacao"("usuarioId", "lidaEm", "criadoEm");
-- Preserva o conteúdo que já existia, sem gerar avisos retroativos aos usuários.
INSERT INTO "MensagemDevolucao" ("id", "devolucaoId", "autorId", "autorTipo", "texto", "criadoEm")
 SELECT 'legado-cliente-' || d."id", d."id", p."usuarioId", 'CLIENTE', d."motivo", d."criadoEm"
 FROM "Devolucao" d JOIN "Pedido" p ON p."id" = d."pedidoId";
INSERT INTO "MensagemDevolucao" ("id", "devolucaoId", "autorTipo", "texto", "criadoEm")
 SELECT 'legado-admin-' || "id", "id", 'ADMIN', "resposta", "atualizadoEm"
 FROM "Devolucao" WHERE "resposta" IS NOT NULL AND length(trim("resposta")) > 0;
