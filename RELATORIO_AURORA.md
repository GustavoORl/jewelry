# Aurora — implementações e avaliação do site

Data: 7 de novembro de 2026.

## Entrega realizada

### Devolução de produtos

O cliente acessa **Devoluções e reembolso** pelo perfil ou menu da conta, na rota protegida `/devolucoes-reembolso`. A solicitação e seu acompanhamento foram retirados do histórico de compras e dos detalhes de pedidos. A nova tela mostra pedidos entregues e pedidos que já possuem uma solicitação, para preservar o acompanhamento mesmo se o status do pedido mudar. É possível escolher produtos e quantidades, selecionar o motivo, descrever o ocorrido e anexar até três fotos opcionais (JPG, PNG ou WebP, até 4 MB por foto). Os motivos são defeito, arrependimento, produto incorreto, avaria no transporte, tamanho e outro. A solicitação recebe protocolo e é acompanhada na nova área de devoluções.

O painel ganhou **Devoluções** em `/admin/devolucoes`. A equipe consulta o cliente, o pedido, os produtos e o motivo; aprova ou recusa e informa as instruções ao cliente. As etapas são:

`Solicitada → Aprovada → Produtos recebidos → Concluída`

Também existe a saída `Solicitada → Recusada`. A API bloqueia produtos de outro pedido, quantidades inválidas, pedidos de outros clientes, duplicidade e alterações de status fora dessa sequência. Atualizações concorrentes de administradores são verificadas pelo status anterior.

**Limites desta versão:** uma solicitação por pedido, reunindo todos os produtos a devolver. Não há reabertura ou segunda solicitação após recusa. A análise é manual. O prazo de solicitação é validado no servidor: somente enquanto decorreram menos de sete períodos de 24 horas desde a entrega; o instante exato de sete dias já é bloqueado. O campo `entregueEm` é gravado quando a equipe marca o pedido como entregue e não é renovado ao repetir o status. Para pedidos antigos sem data, o painel de devoluções permite registrar a data real; não foi presumida uma data a partir da última atualização. O atendimento agora usa um chat contínuo com histórico persistente. O motivo inicial e a última resposta que existiam antes da migração foram preservados como mensagens; respostas antigas já sobrescritas antes desta entrega não podem ser reconstruídas. O estorno deve ser realizado no provedor de pagamento; concluir a solicitação não executa estorno nem repõe estoque. O painel informa isso e exige confirmação antes da conclusão.

### Editorial / blog

O painel ganhou **Editorial / Blog** em `/admin/editorial`, com criação, edição, exclusão, rascunho e publicação. Cada postagem tem título, resumo, introdução e capa opcional enviada por upload. Os campos de digitação de URL foram removidos. A capa tem uma área própria com prévia e remoção; fotos do corpo são enviadas separadamente em blocos posicionados entre os parágrafos. O editor permite compor e reordenar até 40 blocos de título, parágrafo, citação, foto e card de produto. Há modelos iniciais de inspiração, estilos Clássico e Revista, seletor com todos os produtos do catálogo administrativo e pré-visualização ao vivo usando o mesmo componente da página pública. Produtos inativos aparecem identificados no seletor, mas o card público fica indisponível até sua ativação.

A loja ganhou a listagem `/editorial` e a leitura `/editorial/:id`. A listagem pública usa o fundo, a paleta, a navegação estrutural e os cards das demais páginas, com título, capa, resumo, data, busca e ordenação. Somente postagens publicadas ficam acessíveis ao público. Textos e blocos são renderizados sem executar HTML inserido pelo administrador. Cards de produtos usam dados atuais do catálogo e levam a `/produtos/:id`, rota de `ProdutoDetalhado.jsx`. A API valida a existência do produto; produtos desativados posteriormente aparecem como indisponíveis.

O card editorial ao lado das promoções na home apresenta um carrossel automático a cada seis segundos, com swipe horizontal, dois pequenos controles redondos no canto inferior direito e links para leitura ou listagem. Não há setas visíveis. A rotação pausa durante a interação, ao receber foco e quando a página está oculta; respeita também a preferência por movimento reduzido. Sem publicações, apresenta uma mensagem de preparação do editorial. O botão **Ver editorial** do banner principal também leva à seção correta.

**Limites desta versão:** a listagem pública consulta todas as postagens publicadas, com busca e ordenação; a lista administrativa ainda limita o retorno a 100 postagens. Ainda não há paginação no servidor, tags ou agendamento. O editor trabalha com blocos, sem edição livre de HTML. As fotos editoriais são públicas e usam o armazenamento já configurado. Fotos de devolução são privadas: ficam no banco e só são entregues por rota autenticada ao dono do pedido ou a administradores.

### Endereço por CEP no checkout

Ao digitar os oito dígitos do CEP em um novo endereço, o checkout consulta o ViaCEP e preenche rua, bairro, cidade e estado. Número, complemento e destinatário continuam sob controle do cliente.

Há máscara de CEP, pequeno intervalo para evitar consultas a cada tecla, cancelamento de consultas anteriores, limite de espera e aviso de CEP inexistente. Campos continuam editáveis. Alterações manuais feitas durante a consulta são preservadas. Carregar o endereço histórico de um pedido não dispara uma busca por conta própria.

Contrato do serviço consultado: [documentação oficial do ViaCEP](https://viacep.com.br/).

### Banco e preservação dos fluxos existentes

Foram aplicadas as migrações `20261107120000_editorial_devolucoes` e `20261107180000_editorial_blocos_fotos_prazo`. Além de `Postagem`, `Devolucao` e `StatusDevolucao`, há o registro de entrega, motivos, `FotoDevolucao` e blocos/estilo das postagens. Não altera os valores históricos de pedidos, pagamentos ou estoques existentes.

As novas rotas administrativas reutilizam a autenticação e a autorização de administrador já existentes. As alterações locais que já estavam no schema e nos arquivos de dependências foram preservadas. Não foram adicionadas dependências para as novas funções.

### Histórico e pedidos

O histórico (`/historico-compras`) contém apenas pedidos com status ENTREGUE ou CANCELADO, além de pedidos cujo pagamento esteja REEMBOLSADO. Pagamento aprovado por si só não coloca pedidos em preparação ou enviados no histórico. O formulário de devolução não aparece mais nessa página. Há filtros por todo o período, últimos 30, 90 e 365 dias ou datas personalizadas; datas inicial e final são inclusivas e respeitam o calendário de São Paulo. Os totais refletem apenas os resultados filtrados.

Em `/pedidos`, todos os pedidos permanecem consultáveis. É possível filtrar por status e ordenar por mais recentes, mais antigos, maior ou menor valor. Os filtros podem ser limpos e não alteram os dados salvos.

## O que está bom

- Identidade visual consistente: as novas áreas acompanham a paleta, os componentes e a organização existentes.
- Separação entre loja pública, cliente autenticado e administração, com bloqueios também na API.
- Estrutura existente de catálogo, categorias, materiais, favoritos, sacola, pedidos, endereços e pagamentos, que permitiu integrar os recursos sem reformular a compra.
- Pedido guarda informações históricas de entrega e preços; a busca por CEP não muda valores do pedido.
- Editorial distingue rascunho e publicação e possui estado vazio compreensível.
- Devolução tem validação de propriedade, produtos, quantidades e sequência de análise.
- As novas funcionalidades possuem testes reproduzíveis e uma tela local de QA com dados simulados.

Esses pontos combinam observações de interface e leitura do código. Não equivalem a uma homologação integral de todos os recursos anteriores.

## O que pode melhorar

| Prioridade | Ponto observado | Melhoria recomendada |
| --- | --- | --- |
| Alta | Checkout ainda mostra frete “A calcular” e informa total sem frete, enquanto a faixa anuncia frete grátis acima de R$ 299 | Implementar cálculo, prazo e regra de frete grátis no servidor e no total cobrado |
| Alta | Links como `/trocas`, `/garantia`, `/guia-de-medidas`, `/contato`, `/lojas`, `/ajuda` e `/vender` não têm rotas correspondentes em `App.jsx` | Criar as páginas ou corrigir/remover os links |
| Alta | Rodapé usa links `/categoria/...`, mas a listagem existente usa `/produtos?categoria=...` | Unificar a navegação por categoria |
| Média | Lint global aponta avisos anteriores de variáveis sem uso, efeitos e dependências; `AdminCategorias.jsx` contém chave `imagemUrl` duplicada | Corrigir gradualmente, com validação dos fluxos afetados |
| Média | Build mantém aviso de pacote JavaScript acima de 500 kB; nesta entrega ficou aproximadamente em 845 kB antes de gzip | Separar carregamento das páginas administrativas e de pagamento |
| Média | Editorial limita a listagem a 100 entradas; devoluções ainda não têm filtros ou paginação | Acrescentar paginação, pesquisa e filtros por status |
| Média | Chat contínuo e histórico já implementados | Evoluir, se necessário, para anexos por mensagem, indicadores de presença e recibos de leitura |
| Média | Upload e prévia já disponíveis; imagens externas ainda podem ser removidas na origem | Acrescentar gestão de arquivos sem uso e tratamento visual de imagem indisponível |
| Baixa | Card de produto usa avaliação ilustrativa; rodapé apresenta CNPJ de exemplo | Substituir por dados reais ou ajustar a apresentação antes da publicação comercial |

## O que falta implementar

1. **Logística e frete:** cotação, prazo, rastreamento e logística reversa/etiqueta de devolução.
2. **Reembolso integrado:** estorno total ou parcial com idempotência, confirmação do provedor e conciliação. Hoje a operação financeira permanece manual.
3. **Política operacional de devolução:** evoluir o prazo fixo já implementado para políticas configuráveis se necessário, múltiplas solicitações quando cabíveis e histórico de atendimento. Registro de entrega e fotos já estão disponíveis.
4. **Páginas de atendimento e políticas:** destinos dos links de ajuda, garantia, contato e demais páginas citadas acima; página de erro para rota inexistente.
5. **Newsletter:** o formulário atual apenas mostra uma mensagem solicitando conexão com um serviço; não conclui a inscrição.
6. **Notificações externas:** e-mail, SMS ou push ainda não estão integrados. As notificações internas do site já informam pedidos, devoluções e novas mensagens.
7. **Evolução editorial:** agendamento, categorias/tags, metadados específicos por artigo e gestão de arquivos sem uso. Composição por blocos, upload e prévia já estão implementados.
8. **Homologação comercial completa:** pagamentos em ambiente de testes do provedor, webhooks e demais fluxos anteriores com contas de teste apropriadas.

## Testes executados

| Verificação | Resultado e alcance |
| --- | --- |
| Backend: `npm test` | 15 testes aprovados, incluindo testes de registro da entrega, limite exato de sete dias, motivos, quantidade/tipo/tamanho de fotos, privacidade por HTTP, CRUD editorial e validação/hidratação dos cards; banco simulado |
| Frontend: `npm test` | 13 testes aprovados: CEP, status finais do histórico, intervalos de datas no fuso brasileiro, combinação de status/ordenação e direção/ciclo do carrossel |
| Banco real: `node tests/database-smoke.mjs` | Blocos e estilo editorial, registro de entrega, bytes de foto privada e ciclo completo de devolução aprovados; rollback confirmado |
| Armazenamento real: `node tests/storage-smoke.mjs` | Upload e leitura de PNG editorial aprovados; imagem temporária removida |
| Prisma | Schema validado, cliente gerado e migração aplicada com sucesso |
| `npm run build` | Aprovado; permanece o aviso de tamanho do pacote |
| `npm run lint` | Concluído sem erro bloqueante; avisos nas áreas anteriores do projeto. Verificação direcionada dos novos componentes sem avisos |
| HTTP local com banco configurado | Frontend respondeu 200; `/editorial` retornou a lista vazia esperada |
| Navegador: loja real local | Home carregou catálogo e novo card; editorial público exibiu o estado sem postagens |
| Navegador: dados simulados | Avançar carrossel e ler artigo; publicar pelo painel; solicitar devolução com produto/quantidade/motivo; aprovar e exibir resposta; CEP preencheu rua/bairro/cidade/UF e preservou número/complemento; CEP inexistente mostrou aviso |
| Revisão móvel | Painel editorial em 390 × 844, sem transbordamento horizontal observado; menu abriu e fechou |
| `git diff --check` | Sem erros de whitespace |

**Total automatizado: 28 testes aprovados**, além da verificação transacional no banco, do armazenamento e dos cenários de navegador.

Na revisão anterior, o navegador confirmou a devolução dentro do histórico, o envio com motivo Defeito, o bloqueio visual após oito dias, o uso de modelo editorial, a troca para estilo Revista, a inclusão e reordenação de card com destino `/produtos/:id` e o salvamento da postagem. As telas autenticadas foram exercitadas com dados simulados.

Os testes HTTP usam registros simulados no processo de teste. A verificação de persistência usa registros sintéticos dentro de uma transação desfeita ao final; não deixou clientes, produtos, pedidos ou postagens de QA no banco. Não foram realizadas cobranças, estornos, envios ou publicações reais. As telas autenticadas foram verificadas com dados simulados; não foi feita uma compra completa com login real.

### Verificação desta atualização

No navegador, com dados simulados, foram verificados: upload da capa e de foto do corpo em campos separados; ausência de campos de URL; seleção de produto no card; histórico excluindo pedido pendente e filtro de últimos 30 dias; pedidos filtrados por status e ordenados por valor; troca automática do carrossel, controles redondos e arraste horizontal em viewport móvel; listagem `/editorial` e busca reduzindo os resultados. Não houve publicação real de conteúdo durante esses testes.

### Nova área de devoluções e reembolso

Acesso pelo atalho do perfil e pelo menu da conta; rota protegida por autenticação. A API lista apenas os identificadores de pedidos com solicitações do usuário autenticado. A nova tela reutiliza os motivos, anexos privados, prazo de sete dias e protocolos existentes. No navegador, com dados simulados, foram confirmados o acesso pelo perfil, o envio e o protocolo na nova tela, e a ausência do formulário no histórico. Os testes HTTP verificaram a autenticação e o filtro por proprietário da nova listagem.

## Como reproduzir

```powershell
cd back
npm test
npx prisma validate
# Opcional: requer acesso ao banco configurado e desfaz os dados de teste.
node tests/database-smoke.mjs
# Opcional: cria uma foto mínima no bucket e a remove ao final.
node tests/storage-smoke.mjs

cd ../front
npm test
npm run build
npm run lint
```

Com o Vite em execução, os cenários visuais simulados estão em:

- `/tests/browser-harness.html?tela=editorial`
- `/tests/browser-harness.html?tela=admin-editorial`
- `/tests/browser-harness.html?tela=perfil`
- `/tests/browser-harness.html?tela=devolucoes`
- `/tests/browser-harness.html?tela=pedidos`
- `/tests/browser-harness.html?tela=editorial-lista`
- `/tests/browser-harness.html?tela=historico`
- `/tests/browser-harness.html?tela=devolucao-expirada`
- `/tests/browser-harness.html?tela=devolucao`
- `/tests/browser-harness.html?tela=admin-devolucoes`
- `/tests/browser-harness.html?tela=checkout`

Essa tela de QA substitui as requisições por dados locais, não concede acesso à API e não integra a entrada do build de produção. Para ambientes diferentes do banco já atualizado, executar `npx prisma migrate deploy` antes de usar as novas rotas. A publicação do código em hospedagem não foi realizada nesta entrega.


## Fluxo de início de devolução

A seção “Pedidos elegíveis para devolução” lista pedidos entregues há menos de sete dias, com data de entrega registrada, sem reembolso anterior e sem solicitação prévia. Cada card mostra os itens, a data-limite e o botão “Iniciar devolução/reembolso”. Esse botão abre o formulário de itens, motivo e fotos. Após o envio, o pedido sai da lista de elegíveis e passa para “Minhas solicitações”, com protocolo e acompanhamento. Solicitações antigas permanecem acessíveis mesmo após o prazo ou alteração do status do pedido. A ausência de data de entrega não é substituída por uma data presumida.

Verificado no navegador com dados simulados: listar elegível, abrir formulário, selecionar item/motivo, enviar e exibir protocolo na seção de acompanhamento. Os testes automatizados cobrem expiração, limite exato de sete dias, entrega futura, falta de data, reembolso anterior e solicitação já existente.


## Chat contínuo e notificações internas

Foi aplicada a migração `20261107230000_chat_notificacoes`, com as tabelas `MensagemDevolucao` e `Notificacao`. Cada devolução tem uma conversa entre o cliente dono do pedido e administradores autenticados. O histórico não é sobrescrito; atualizações de status também acrescentam mensagens. Há paginação para carregar mensagens anteriores, identificação do participante, data/hora, limite de 4.000 caracteres por mensagem e proteção contra duplicação em reenvios. É possível continuar o atendimento após a conclusão ou recusa da solicitação. O chat é textual; as fotos iniciais da devolução continuam disponíveis na solicitação.

A conversa atualiza a cada 10 segundos enquanto estiver aberta e a página estiver visível. Não há promessa de entrega instantânea, websocket, presença online ou confirmação de que a outra parte leu a mensagem.

O sino da loja e do painel agora tem avisos persistentes, contador de não lidas, marcação individual ao abrir e opção de marcar todas como lidas. A marcação em lote usa o instante da consulta para não apagar o estado de leitura de avisos que chegaram depois. Cada aviso leva ao pedido ou à conversa relacionada; a conversa abre automaticamente quando acessada pela notificação. Mensagens de clientes notificam administradores ativos; respostas e mudanças da devolução notificam o cliente. Notificações não são compartilhadas entre contas.

O sino atualiza a cada 20 segundos e ao voltar à página. São exibidos os 50 avisos mais recentes, com contagem de todas as não lidas. Pedidos atualizados nos últimos 30 dias (até 100 por sincronização) também são reconciliados para contemplar confirmações de pagamento/webhooks e a implantação inicial; eventos repetidos não criam avisos duplicados. Não há envio de e-mails, SMS ou push nesta entrega.

Validação: 15 testes no backend e 13 no frontend; testes HTTP verificaram cliente/administrador, bloqueio de outra conta, mensagens sucessivas, reenvio idempotente, paginação, notificações por destinatário e leitura individual/em lote. A verificação no banco real confirmou mensagens, atualizações de status e avisos dentro de uma transação integralmente desfeita. No navegador, com dados simulados, foram verificados envios sucessivos do cliente, resposta do administrador, contador, leitura em lote, abertura da conversa pelo aviso e layout em 390 × 844.

Cenários adicionais de QA: `/tests/browser-harness.html?tela=devolucao-chat` e `/tests/browser-harness.html?tela=notificacoes`.
