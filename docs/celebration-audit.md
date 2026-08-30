# Auditoria e evolução — Celebrando o Amor e o Novo Lar

Data da implementação local: 30/08/2026. Escopo canônico: `/celebracao`, convites individuais e `/celebracao/admin`. Este relatório não contém PII nem valores de segredos.

## 1. Resultado executivo

A nova experiência pública, SSR-first e mobile-first foi implementada e validada em preview de produção, com fallback completo sem evento ou fotografia. A restauração visual desta correção ainda não foi implantada no ambiente publicado. RSVP, reservas e cancelamentos exigem sessão de convite individual; PIX gera BR Code EMV e não afirma pagamento. A administração agora concentra página, eventos/locais, aparência, PIX, contatos, compartilhamento e presentes; convites/RSVP vivem somente em `/guests`.

O rollout remoto foi concluído em 30/08/2026: credenciais rotacionadas, migration aditiva e backfill aplicados, deploy compatível validado, lockdown de grants/RLS ativado, chaves legadas desabilitadas e histórico Git reescrito. Um clone espelho do GitHub confirmou zero commits e zero objetos alcançáveis para `.env.local`.

## 2. Achados e tratamento

| ID | prioridade | arquivo/componente | problema | impacto | causa | solução |
|---|---|---|---|---|---|---|
| SEC-01 | P0 | `.env.local` / Git | Segredos rastreados e presentes no histórico | Comprometimento de banco, push e sessão | Arquivo privado versionado | Removido do índice, variantes ignoradas, credenciais rotacionadas e histórico reescrito; espelho remoto validado sem o arquivo |
| SEC-02 | P0 | `app/sessions.ts` | Senha e segredo com fallback conhecido | Acesso administrativo previsível | Defaults em código | `SESSION_SECRET` obrigatório, hashes scrypt distintos, comparação constante e sessão de sete dias |
| SEC-03 | P0 | Data API Supabase | Tabelas privadas acessíveis ao anon/authenticated | Exposição de PII e subscriptions | Grants e RLS permissivos | Cliente secreto somente servidor, REVOKE/RLS aplicados após o deploy e validação remota por credencial |
| SEC-04 | P0 | APIs públicas | Busca nominal, autocadastro e contratos legados | Enumeração e escrita insegura | Compatibilidade pública ampla | Endpoints antigos retornam 410; novos contratos exigem convite, Zod, origem, limite de corpo e rate limit persistente |
| SEC-05 | P0 | React Router | Versão auditada posteriormente vulnerável a CSRF | Execução indevida de action | Advisory publicado após o plano | Conjunto alinhado em 7.18.3, versão corrigida da mesma linha; `npm audit` sem vulnerabilidades |
| DAT-01 | P0 | RSVP legado | Escrita em `guests.message` inexistente | RSVP quebrado | Contrato divergente do schema | Mensagem privada movida para `guest_event_rsvps.private_message` |
| DAT-02 | P1 | Convidados | Duas listas e dois campos de confirmação | Duplicidade e divergência | Módulos evoluíram isoladamente | Backfill por nome normalizado apenas quando único; `confirmed` como fonte; administração única em `guests` |
| DAT-03 | P1 | Reservas | Status e metadados incompatíveis | Dupla reserva/autor exposto | Reserva embutida no presente | `gift_reservations`, índice parcial único, snapshot privado e cancelamento pelo próprio convite |
| UX-01 | P1 | Rotas públicas | Duas experiências divergentes | Conteúdo inconsistente | Módulos públicos separados | `/celebracao` canônica; redirects permanentes das URLs anteriores |
| UX-02 | P1 | Hero/mídia | Fotografia quebrada e data passada | Primeira impressão falsa | Conteúdo incompleto | Fallback material intencional; legado vira rascunho e nunca é publicado automaticamente |
| UX-03 | P1 | Presentes | Página mobile extremamente longa | Descoberta e performance ruins | Lista integral no cliente | Primeiro lote SSR de 12, cursor, filtros derivados e carregamento sob demanda |
| QUA-01 | P2 | Projeto | Sem lint, testes ou CI | Regressões silenciosas | Tooling ausente | ESLint, Vitest, GitHub Actions, build/typecheck/audit obrigatórios |

## 3. Mapa de dependências

`/celebracao` usa `loadCelebration` e o cliente servidor. A troca de token cria cookie HttpOnly; o cookie autoriza as APIs públicas de RSVP, presentes, reservas e PIX. `/guests` emite o token bruto uma única vez e persiste somente SHA-256. `/celebracao/admin` usa `/api/admin/celebracao`; presentes mantêm temporariamente o endpoint administrativo legado protegido. O lockdown só deve ser aplicado depois desse código estar publicado.

## 4. Modelo e migrations

- `20260830021808_celebration_additive.sql`: colunas semânticas, eventos, RSVP por evento, tokens, reservas, rate limiting e backfill idempotente.
- `20260830021811_celebration_lockdown.sql`: default privileges, REVOKE, grants de service role e RLS nas tabelas privadas.
- `20260830120000_legacy_public_surfaces_lockdown.sql`: lockdown mínimo de `message_wall` e `pix_confirmations`; criado após a restauração visual revelar que essas duas superfícies históricas não estavam cobertas. Aplicado no projeto atual `Nós-Dois2` (`eamcrftdbhugeyrreiij`) pelo conector Supabase e registrado remotamente como migration `20260830151430 legacy_public_surfaces_lockdown`.
- Nenhuma tabela ou coluna legada é removida.
- Eventos derivados de dados antigos ficam em `draft`; nenhuma data ou local é inventado.

## 5. Reconciliação de dados

O algoritmo processa convidados principais e legados sem exportar nomes. Correspondência acontece apenas quando o nome normalizado possui exatamente um candidato. Não correspondidos recebem o grupo `Legado — Chá de Casa Nova`. Reservas com status comprado viram ativas; metadados sem status comprado viram histórico cancelado. Os scripts `celebration_preflight.sql` e `celebration_migration_validation.sql` retornam somente agregados.

O backfill remoto processou 58 convidados principais e 11 legados, com cinco correspondências únicas, totalizando 64 convidados consolidados e 69 vínculos convidado–evento. Foram criados dois eventos em rascunho, preservados 94 presentes e produzidas sete reservas históricas: seis ativas e uma cancelada para o metadado incompatível. As seis divergências de confirmação permaneceram auditáveis, sem sobrescrever `is_confirmed`.

## 6. Segurança aplicada

- Service role não é enviada ao browser.
- Sessões administrativas e de convite são assinadas, HttpOnly, SameSite=Lax e Secure em produção.
- Token de 256 bits é removido da URL após a troca e somente o hash é armazenado.
- Mutations verificam sessão, origem e schemas; fluxos públicos possuem rate limiting persistente por hash de IP/ação.
- Página personalizada e APIs usam `no-store`, `no-referrer`, `nosniff`; a página adiciona CSP e Permissions-Policy.
- PII, autores de reserva, mensagens, tokens e subscriptions não entram em payload público ou metadata.

## 7. Produto e interface

A correção de direção de 30/08/2026 substituiu a composição A/portal C pela experiência afetiva do commit `9cd5beccb70efb51ed94fbbcaef957f8592dfc3d`. O hero imersivo, nomes do casal, texto carinhoso, contagem futura, cartões de locais, orientação configurável, cartões ricos de presentes, progresso, filtros, modais/drawers, contatos, compartilhamento e voltar ao topo foram restaurados ou adaptados em `/celebracao`.

A página sem convite voltou a ser completa; o convite acrescenta RSVP, reserva identificada e cancelamento. A implementação antiga não foi reativada: `celebration_events`, `guest_event_rsvps`, `guest_invite_tokens`, `gift_reservations`, `app_config` e as APIs seguras continuam como fonte. Busca, categoria e faixa de preço consultam os 94 presentes no servidor, inclusive itens fora do primeiro lote SSR. O fallback do hero não mostra stock nem ícone de mídia quebrada.

O mural não foi restaurado. O endpoint legado não está roteado e a migration mínima fechou a exposição de `message_wall` e `pix_confirmations`. A validação pós-migration executada com o papel `anon` retornou `42501 permission denied` para ambas; pela Data API com a publishable key, ambas retornaram HTTP `401` e código `42501`. Qualquer reconsideração futura exigirá um contrato público novo e deliberado.

## 8. Acessibilidade e responsividade

A navegação possui nomes acessíveis, foco visível e alvos mínimos de 44 px. Contadores usam botões nomeados e `output`; escolhas usam radiogroup/aria-checked; mensagens de erro e sucesso usam live regions. `prefers-reduced-motion` desliga transições. A inspeção do build de produção cobriu 320, 360, 375, 390, 430, 768 e 1440 px sem overflow horizontal. Foram capturados hero mobile/desktop, busca global, cartão e modal PIX.

## 9. SEO, headers e privacidade de URL

Foram adicionados title, description, canonical fixo em `/celebracao`, Open Graph, Twitter Card e theme-color. URLs com token nunca entram em canonical ou metadata. A fotografia configurada pode abastecer hero/OG; até sua entrega, não há imagem quebrada ou stock remoto.

## 10. Qualidade e performance

Estado validado após a restauração: `typecheck`, lint, 10 testes unitários, build e `npm audit` passam; zero vulnerabilidades conhecidas. O chunk específico da rota pública ficou em 36,30 KB JS (11,67 KB gzip) e 3,89 KB CSS (1,31 KB gzip). PDF e gráficos permanecem em chunks administrativos separados. No preview do build com os dados remotos, `/celebracao`, presentes filtrados e PIX responderam 200; a página entrega `Cache-Control: no-store`, `Referrer-Policy: no-referrer` e CSP.

## 11. Inventário legado remanescente

As ocorrências `bridal`, `bridal_shower`, `bridal-shower`, “Chá” e “Casa Nova” se enquadram em:

1. Compatibilidade de schema/migration: tabelas e campos legados preservados por uma versão.
2. Compatibilidade de navegação: redirects e endpoint administrativo antigo protegido.
3. Componentes não roteados do módulo público anterior: mantidos temporariamente para rollback, sem exposição via route config.
4. Nomes internos de arquivos/hooks de presentes: não aparecem na interface pública nova.
5. Rótulo histórico do grupo de reconciliação: necessário para auditoria de origem.

Não existe nova escrita pública nos cadastros legados. A remoção física só deve ocorrer em uma entrega posterior, após um ciclo estável e validação do rollback.

## 12. Rollout, rollback e pendências reais

A ordem segura foi executada: snapshot agregado; rotação de Supabase, VAPID, senhas e segredos de sessão; migration aditiva; backfill e correção dos seis vínculos legados; deploy compatível; smoke tests; lockdown; validação pós-RLS; desativação de `anon`/`service_role`; remoção das variáveis legadas; reescrita e force-push. A chave pública recebe 401 em tabelas privadas, as chaves legadas recebem 401 e a chave final do servidor continua operando. O rollback de aplicação permanece aditivo e não exige excluir os dados novos.

O lockdown complementar foi aplicado no projeto atual `Nós-Dois2` (`eamcrftdbhugeyrreiij`). `message_wall` e `pix_confirmations` mantêm RLS habilitado, não concedem SELECT/INSERT/UPDATE/DELETE a `anon` ou `authenticated`, preservam essas operações para `service_role` e retornam HTTP `401`/Postgres `42501` quando consultadas anonimamente pela Data API.

O advisor de segurança remoto ainda classifica quatro tabelas públicas com RLS desabilitado como erro: `events`, `groomsmen`, `inspiration_comments` e `inspiration_likes`. Também alerta que `handle_new_user()` e `keepalive_ping()` são funções `SECURITY DEFINER` executáveis por `anon`/`authenticated`, e que `handle_new_user()` não fixa `search_path`. Esses itens não foram alterados automaticamente porque exigem confirmar consumidores e políticas antes de bloquear acesso.

Também permanecem o deploy desta restauração, a configuração de nova data, endereços e fotografia real, a distribuição dos links individuais após revisão do casal e a execução de Lighthouse/Core Web Vitals e Axe no ambiente publicado. O projeto remoto não possuía histórico de migrations no conector antes deste lockdown; migrations anteriores aplicadas por SQL Editor ainda devem ser adotadas/reconciliadas antes de usar o histórico como fonte integral. Todos os clones anteriores ao force-push devem ser refeitos.
