# Auditoria de reservas, notificações e push da celebração

Data da auditoria: 1º de setembro de 2026. Projeto remoto consultado: `Nós-Dois2` (`eamcrftdbhugeyrreiij`). Este relatório contém somente agregados e não registra nomes, telefones, mensagens privadas, tokens ou subscriptions.

## 1. Causa raiz

A reserva pública já gravava em `gift_reservations`, mas o endpoint e a interface administrativa determinavam disponibilidade por `bridal_shower_gifts.status`, `reserved_by` e `reserved_at`. As fontes divergiram: há reservas ativas sem o status legado correspondente, fazendo o admin exibir presentes reais como disponíveis.

## 2. Dados existentes

- 94 presentes.
- 9 reservas históricas: 8 ativas e 1 cancelada.
- 9 reservas com `guest_id`; 7 também possuem snapshot de nome.
- Zero referência órfã de convidado e zero referência órfã de presente.
- Zero presente com mais de uma reserva ativa.
- 6 presentes possuem o status legado `comprado`; 2 reservas ativas não estão refletidas nesse campo.
- 30 notificações: 5 não lidas e 4 criadas nos sete dias anteriores à auditoria.
- 9 registros de push distribuídos por 3 destinos administrativos.

Nenhum dado foi alterado durante o diagnóstico e nenhuma reserva foi apagada ou reconstruída.

## 3. Fonte de verdade

`gift_reservations.status = 'active'` passou a ser a única regra administrativa para indicar que um presente está reservado. `guests` fornece a identidade atual; `reserved_by_name_snapshot` é somente fallback histórico. Os campos legados continuam preservados, sem dual-write e sem novas decisões baseadas neles.

## 4. Admin

O loader protegido carrega presentes, reservas ativas e configuração em paralelo, busca os convidados necessários em um único lote e monta um mapa em memória. Cada presente retorna `active_reservation` com ID, convidado, nome resolvido, horário e origem. A lista e o drawer mostram `Reservado` ou `Disponível`, nome, horário em `America/Fortaleza` e origem em linguagem humana. `?gift=<uuid>` abre o drawer somente depois de localizar o ID nos dados autenticados já carregados.

## 5. Notificações RSVP

Formatos produzidos:

- `Maria confirmou presença` — `2 adultos · 1 criança`.
- `Maria alterou a confirmação` — `Agora: 3 adultos · 1 criança`.
- `Maria respondeu ao convite` — `Não poderá estar presente.`
- Nova pessoa: mesmo formato nominal, com prefixo `Nova pelo site` no detalhe.

Telefone, mensagem privada e token não entram no alerta. Uma submissão sem mudança retorna `updated: false` e não notifica.

## 6. Notificações de presente

- Reserva criada: `Maria reservou um presente` — `“Air Fryer”`.
- Cancelamento pelo convidado: `Maria liberou um presente` — `“Air Fryer” voltou a ficar disponível.`

Repetição da própria reserva e conflito `409` não criam notificações ou push adicionais.

## 7. Push

O serviço existente, VAPID, `push_subscriptions`, limpeza em `404/410` e service worker foram preservados. O novo serviço persiste a notificação, obtém seu UUID e envia para `all` com a tag única `notification-<uuid>`. RSVP abre `/guests`; presente abre `/celebracao/admin?gift=<giftId>`. Falha no push não desfaz a operação nem a notificação interna.

## 8. Cancelamentos

O convidado continua podendo cancelar somente a própria reserva ativa. O admin ganhou `Cancelar reserva`, com confirmação, que atualiza `status = 'cancelled'` e `cancelled_at` sem apagar o histórico. O antigo botão de marcar `comprado/disponível` foi removido da interface e seu contrato retorna `410 Gone`.

## 9. Stats

O total reservado e o progresso agora contam `active_reservation`, portanto refletem as mesmas 8 reservas ativas usadas pela página pública. Reservas canceladas não entram no total.

## 10. Exportação

O CSV usa o estado canônico, o nome resolvido por `guests` com fallback de snapshot e o horário da reserva em `America/Fortaleza`. Os campos `bridal_shower_gifts.reserved_by/reserved_at` não alimentam novas exportações.

## 11. Migrations

Foi criada `20260901170407_centralize_celebration_notifications.sql`. Ela redefine, de forma aditiva, `create_public_rsvp_guest`, remove somente o `INSERT` genérico de notificação do RPC, usa os limites configurados e preserva execução exclusiva por `service_role`. A migration antiga não foi editada. A aplicação foi concluída no projeto `Nós-Dois2` e registrada remotamente como `20260901171646 centralize_celebration_notifications`.

## 12. Arquivos alterados

- `app/routes/api.bridal-shower.ts`: leitura canônica, enriquecimento em lote e cancelamento administrativo.
- `app/routes/bridal-shower.tsx`, drawer, stats, schemas e hooks: status, pessoa, horário, origem, filtros, deep link, CSV e polling.
- APIs públicas de RSVP e reservas: snapshot e eventos ricos, sem mudar o contrato público de sucesso.
- `app/services/admin-notifications.server.ts`: persistência e push best-effort centralizados.
- `app/services/push.server.ts` e `public/sw.js`: tag única.
- Hooks/tela de notificações e TopNav: atualização em foco e a cada 25 segundos.
- Migration e teste pgTAP: função sem notificação duplicada e privilégios explícitos.
- Testes Vitest: domínio, falhas best-effort, snapshot, join em lote, conflitos, repetição e cancelamento.

## 13. Testes

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado.
- `npm test`: 26 arquivos e 118 testes aprovados.
- `npm run build`: aprovado; permanecem apenas avisos conhecidos de sourcemap e chunks administrativos grandes.
- `npm audit --audit-level=high`: zero vulnerabilidades.
- Verificação remota de segurança: RLS ativo e `SELECT` negado a `anon` e `authenticated` em `gift_reservations`, `guests`, `notifications` e `push_subscriptions`; `service_role` preservado.
- Impeccable: detector executado; os tamanhos literais de 10 px encontrados na superfície alterada foram substituídos pelo degrau documentado de 12 px.

## 14. Pendências reais

- Publicar o código e confirmar o deploy do Vercel, então executar o smoke test autenticado.
- A inspeção visual local da rota protegida parou corretamente no login; desktop/mobile autenticados devem ser validados no preview ou com uma sessão administrativa fornecida pelo casal.
- Não foi enviado push real: existem inscrições reais e não há um dispositivo de teste isolado. A integração e os cenários de falha estão cobertos por mocks.
- O build ainda alerta para chunks administrativos grandes (`pdfmake`, fontes e gráficos), sem impacto novo no bundle público desta correção.
- O advisor remoto ainda aponta RLS desabilitado em `events`, `groomsmen`, `inspiration_comments` e `inspiration_likes`, além de funções legadas `SECURITY DEFINER` expostas. São achados anteriores e fora desta correção; exigem mapear consumidores antes de qualquer lockdown adicional. [Referência do linter Supabase](https://supabase.com/docs/guides/database/database-linter)
