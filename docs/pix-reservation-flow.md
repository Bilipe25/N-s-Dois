# Evolução do fluxo PIX + reserva de presentes

## 1. Fluxo anterior

O drawer de PIX gerava o código para um presente, mas a reserva precisava ser feita fora dele. A interface não explicava de forma suficiente que copiar ou pagar um PIX não reservava o item, não continuava automaticamente após a identificação e não diferenciava com clareza um presente disponível de uma reserva do próprio convidado.

## 2. Problemas encontrados

- Ações de contribuição e escolha pareciam fazer parte do mesmo efeito, embora sejam independentes.
- O convidado precisava fechar o PIX e voltar ao card para reservar.
- O contexto era perdido quando a identificação por nome era necessária.
- Uma reserva própria não era usada como referência do payload.
- A concorrência retornava uma mensagem técnica demais e não oferecia uma saída clara.
- O feedback de cópia dependia apenas do toast, sem anúncio dedicado para tecnologia assistiva.

## 3. Novo fluxo

O card agora apresenta `Escolher presente` como ação principal e `PIX` como alternativa secundária. Abrir, copiar ou focar o PIX nunca cria uma reserva. No drawer, um texto curto explica a diferença e a pessoa pode reservar o item sem sair do contexto.

Quando a identificação é necessária, o formulário por nome aparece dentro do mesmo drawer. Ao concluir a identificação, a tentativa de reserva continua automaticamente. O endpoint de reserva também trata a repetição da própria ação como idempotente.

Após a reserva, o drawer permanece aberto, confirma que o presente está marcado como escolha do convidado e mantém o QR/código PIX disponível abaixo. A interface nunca afirma que houve pagamento.

## 4. PIX geral

O PIX geral continua público e independente da lista. Ele usa payload sem valor fixo e sem referência pessoal, informa que o valor deve ser escolhido no aplicativo do banco e não cria reserva.

## 5. PIX por presente

Para um presente disponível, o payload usa `giftId`. O valor só é incluído quando `price_cents` possui um valor exato. `price_range` permanece apenas como texto de referência e nunca é convertido, estimado ou usado como média.

## 6. PIX de presente reservado pelo próprio convidado

Quando a resposta pública contém `reservation_id` do próprio convidado, o payload usa `reservationId`. O servidor valida sessão, titularidade e status ativo antes de gerar o código. Reserva inexistente e reserva de outra pessoa recebem a mesma resposta pública genérica, sem revelar identidade ou existência.

## 7. Presente reservado por outra pessoa

Foi adotada a decisão de ocultar/bloquear o PIX específico do item quando existe uma reserva ativa de outra pessoa. Em caso de concorrência, a interface informa que o presente acabou de ser escolhido, oferece retorno à lista e lembra que o PIX geral continua disponível. Nenhum nome ou dado do autor da reserva é exposto.

## 8. Banco

Não houve migration, mudança de schema, grant, policy ou RLS. A proteção contra duas reservas ativas continua sendo o índice único parcial existente em `gift_reservations`; o código traduz a violação `23505` em idempotência para o próprio convidado ou conflito `409` para outra pessoa.

## 9. Arquivos alterados

- `app/components/celebration/pix-panel.tsx`: drawer/dialog integrado, QR, cópia, identificação, reserva e estados de sucesso/conflito/erro.
- `app/components/celebration/public-gift-card.tsx`: nomenclatura das ações e empilhamento dos botões em telas menores que 360 px.
- `app/routes/celebration.tsx`: estado compartilhado dos presentes e integração do novo painel.
- `app/lib/gift-reservations.ts`: referência PIX e chamadas centralizadas de reserva/cancelamento.
- `app/routes/api.public.celebration-pix-payload.ts`: regras de `giftId`, `reservationId`, valor exato e bloqueio de item já reservado.
- `app/routes/api.public.celebration-gift-reservations.ts`: concorrência humana e repetição idempotente.
- Testes correspondentes em `app/lib/gift-reservations.test.ts`, `app/routes/api.public.celebration-pix-payload.test.ts` e `app/routes/api.public.celebration-gift-reservations.test.ts`.

## 10. Segurança

- O código PIX não contém nome, telefone ou outro dado pessoal.
- `reservationId` exige a sessão privada do respectivo convidado.
- O contrato público continua expondo somente disponibilidade e a reserva do próprio convidado.
- O PIX específico é rejeitado no servidor quando outra reserva ativa já existe.
- A aplicação não registra, processa nem confirma pagamentos.
- O fluxo mantém validação Zod, limites de corpo/origem, rate limit e respostas `no-store` já existentes.

## 11. Testes

- Typecheck: aprovado.
- ESLint: aprovado.
- Vitest: 15 arquivos e 62 testes aprovados.
- Build de produção: aprovado.
- `npm audit --audit-level=high`: 0 vulnerabilidades.
- Casos adicionados: PIX geral, `giftId`, `reservationId`, reserva própria, reserva ausente/de outra pessoa, `price_cents` nulo, configuração incompleta/inválida, rate limit, concorrência e idempotência.
- QA visual: drawer renderizado e inspecionado em 390 × 844, sem overflow horizontal, com QR nomeado, feedback de cópia por `aria-live`, alvos principais de 44 px ou mais e formulário de identificação preservando o contexto.
- Impeccable: sem bloqueios; avisos estáticos de contraste correspondem a classes condicionais de estados mutuamente exclusivos, e três avisos de 10 px são da tipografia compacta já existente nos cards.
- pgTAP/RLS: o arquivo existente foi revisado, mas não executado localmente porque `psql` e Supabase CLI não estão instalados. Não houve alteração de banco ou RLS nesta rodada.

Evidência visual: `docs/celebration-audit/screenshots/after/pix-flow-390x844.png`.
