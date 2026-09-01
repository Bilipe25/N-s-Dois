# Product Readiness Final — RSVP, Presentes, Admin e WhatsApp

Relatório da rodada final de prontidão de `/celebracao`. A matriz abaixo foi registrada antes da implementação. As evidências combinam reprodução pública sem envio de PII, inspeção de código, testes de rota/unidade, navegador local responsivo e consultas agregadas somente leitura ao Supabase `Nós-Dois2`.

## 1. Diagnóstico

As quatro jornadas já estavam funcionais, mas não igualmente prontas para uso real. O RSVP precisava de tolerância a falhas, idempotência e um encerramento humano; presentes precisavam preservar a intenção e distinguir melhor reserva de PIX; o admin precisava transformar respostas em informação escaneável; e o compartilhamento dependia de uma imagem hospedada no projeto antigo.

Matriz produzida antes do código:

### RSVP

| ID | Prioridade | Jornada | Problema observado | Evidência | Impacto | Solução e validação |
|---|---|---|---|---|---|---|
| RSVP-01 | P0 | Requisições | Falhas de rede podiam deixar a interface ocupada. | `fetch` sem tratamento uniforme. | Abandono ou reenvio incerto. | Cliente HTTP com timeout, erro humano e `finally`; exercitado por contratos e navegador. |
| RSVP-02 | P0 | Envio repetido | Duplo clique podia repetir notificação. | Estado React não é trava síncrona e o endpoint sempre notificava. | Ruído e dúvida sobre duplicidade. | Guarda síncrona e no-op idempotente no servidor; teste de repetição. |
| RSVP-03 | P1 | Identificação | Hífen/apóstrofo equivalentes não eram normalizados. | Função preservava a pontuação. | Falso “nome não encontrado”. | Normalização conservadora no servidor, sem alterar o nome oficial; testes com acentos e pontuação. |
| RSVP-04 | P1 | Sucesso | O formulário continuava visível após salvar. | Apenas uma linha de feedback. | Confirmação pouco conclusiva. | Estado de sucesso dedicado com resumo, detalhes e edição. |
| RSVP-05 | P1 | Recusa | Recusa compartilhava o mesmo retorno do aceite. | Copy genérica. | Interpretação errada. | Texto e resumo específicos; contagens zeradas no servidor e em teste. |
| RSVP-06 | P1 | Reabertura | Sucesso antigo permanecia montado. | Drawer não reagia ao fechamento. | Resposta atual pouco clara. | Fechar limpa o sucesso; reabrir carrega a resposta editável. |
| RSVP-07 | P1 | Cadastro espontâneo | Cadastro novo não tinha encerramento emocional. | Revalidava direto para o formulário. | Baixa confiança. | Mesmo sucesso humano, mantendo a origem apenas no admin. |
| RSVP-08 | P2 | Limites/rate limit | Teto 6/6 e bloqueios tinham pouca orientação. | Schemas protegiam, UI explicava pouco. | Erro parecia arbitrário. | Copy contextual e mensagens genéricas para 429/timeout/offline. |

### Presentes

| ID | Prioridade | Jornada | Problema observado | Evidência | Impacto | Solução e validação |
|---|---|---|---|---|---|---|
| GIFT-01 | P0 | Reserva | Falha de rede podia manter `busy`. | Ausência de `try/catch/finally`. | Repetição sem certeza. | Tratamento uniforme e liberação garantida do estado. |
| GIFT-02 | P1 | Sucesso | O drawer fechava e o feedback ficava distante. | Mensagem global acima da grade. | Confirmação imperceptível. | Estado local “Presente reservado”, continuar e cancelar. |
| GIFT-03 | P1 | Identificação | A escolha era preservada tecnicamente, mas não comunicada. | Estado local mantinha o item. | Sensação de perda da intenção. | Copy explícita e retorno ao mesmo presente após identificar. |
| GIFT-04 | P1 | Privacidade | Reserva alheia exigia mensagem consistente. | API já ocultava o autor. | Risco de ambiguidade ou exposição futura. | “Já escolhido” sem identidade; contrato público mantido. |
| GIFT-05 | P2 | Link externo | Era preciso preservar o contexto ao abrir sugestão. | Link já usava nova aba. | Retorno confuso se regredir. | `target=_blank` com `noopener noreferrer`; estado permanece local. |
| GIFT-06 | P2 | PIX por item | PIX podia parecer reserva ou pagamento. | Aviso geral insuficiente no contexto do item. | Expectativa financeira incorreta. | Copy explícita: não reserva, não confirma pagamento e só inclui valor exato configurado. |

### Admin

| ID | Prioridade | Jornada | Problema observado | Evidência | Impacto | Solução e validação |
|---|---|---|---|---|---|---|
| ADM-01 | P1 | Lista | Linha não mostrava status textual, quantidades respondidas e horário. | Cor e capacidade dominavam o card. | Leitura exigia abrir cada pessoa. | Status, adultos/crianças confirmados, origem e última resposta. |
| ADM-02 | P1 | Filtros | Faltavam novos pelo site, confirmados hoje e com mensagem. | Contrato tinha quatro filtros. | Revisão diária lenta. | Filtros de alto valor com “hoje” em `America/Fortaleza`. |
| ADM-03 | P1 | Detalhe | Respostas/mensagens por evento não eram carregadas. | API não aninhava eventos. | Mensagens privadas podiam ficar escondidas. | Contrato tipado, resposta por evento e drawer organizado. |
| ADM-04 | P1 | Contadores | Cadastros e pessoas eram misturados. | Rótulos ambíguos. | Decisão logística errada. | Unidades explícitas para convites, pessoas, adultos, crianças e origem. |
| ADM-05 | P2 | Sincronização | Cache atualizava apenas após ação local. | Sem polling/focus refetch. | RSVP de outro aparelho demorava. | Atualização a cada 30 s com aba ativa, foco e botão manual. |
| ADM-06 | P2 | Mobile | Controles críticos tinham menos de 44 px. | `h-8` e seleção dependente de hover. | Operação imprecisa. | Alvos de 44 px e seleção visível por toque/teclado. |

### WhatsApp

| ID | Prioridade | Jornada | Problema observado | Evidência | Impacto | Solução e validação |
|---|---|---|---|---|---|---|
| WA-01 | P0 | Preview | OG publicado dependia do Supabase antigo e não declarava dimensões/tipo. | Produção referenciava `hyvszj…`; projeto atual é `eamcrf…`. | Preview podia quebrar. | Arte local 1200×630 e metadados completos; arquivo e DOM local verificados. |
| WA-02 | P1 | Metadata | Tags OG/Twitter estavam incompletas. | Inspeção do `<head>` publicado. | Prévia inconsistente. | Title, description, canonical, locale, site, dimensões, tipo e Twitter completos. |
| WA-03 | P1 | Compartilhar | Web Share enviava só título/URL. | Função anterior não tinha texto/fallback robusto. | Convite pouco acolhedor. | `title + text + url`, cancelamento separado e cópia com feedback. |
| WA-04 | P1 | Ambiente | Produção e local apontam para projetos Supabase diferentes. | DOM remoto versus `.env.local`/conector. | QA pode comparar dados distintos. | Ajustar Vercel antes do deploy e revalidar sem versionar credenciais. |
| WA-05 | P2 | Cache | Não havia procedimento de revalidação. | Documentação ausente. | WhatsApp pode manter imagem antiga. | Procedimento registrado na seção 8, sem parâmetros permanentes na URL. |

## 2. P0

Foram corrigidos os quatro P0 desta rodada: requisições de RSVP não ficam presas após erro; envios idênticos são no-op e não criam nova notificação; reserva/cancelamento sempre libera o estado e diferencia conflito 409 de falha recuperável; e a imagem social deixou de depender de mídia do projeto Supabase antigo.

Não houve envio real de RSVP ou reserva contra produção durante a auditoria: isso evitaria criar PII/dados artificiais. Os cenários mutáveis foram exercitados em testes de rota com o mesmo contrato servidor usado em produção.

## 3. P1

Foram entregues: normalização por acento/caixa/espaço/hífen/apóstrofo; sucesso e recusa distintos; reabertura editável; continuidade do presente após identificação; cancelamento da própria reserva; admin escaneável com filtros operacionais, mensagens e horário; atualização periódica; metadata social completa e compartilhamento com fallback.

Não foi feito redesign, troca de identidade, nova biblioteca, rotação de segredo, reescrita Git ou alteração de RLS.

## 4. RSVP

Resultados por cenário:

| Cenário | Resultado | Evidência |
|---|---|---|
| Nome existente e outro celular | Reidentificação cria sessão no navegador atual e carrega a resposta existente. | Testes de identificação/sessão e contrato do loader. |
| Acentos, caixa e espaços | Equivalentes sem mudar o valor oficial. | Testes `guest-name`. |
| Hífen/apóstrofo e nomes compostos | Separadores tipográficos equivalentes; nenhuma lista é devolvida. | Teste de rota específico. |
| Nome ausente | Pode continuar com RSVP espontâneo, origem `public_rsvp`, sessão e edição posterior. | Testes de cadastro. |
| Homônimo | Resposta genérica; nenhum grupo, telefone ou candidato exposto. | Teste com dois matches. |
| Recusa | Adultos/crianças viram zero; mensagem permanece válida. | Schema e teste de rota. |
| Acompanhantes | Limites individuais e público 6/6 validados no servidor; negativo/acima do teto rejeitado. | Schemas e testes. |
| Alterar resposta | Faz update do mesmo vínculo/resposta. | Teste confirmado→alterado e recusa. |
| Repetição/double click | Uma requisição em voo no cliente; payload idêntico não atualiza timestamp nem notifica. | Teste idempotente. |
| Offline/timeout/500/429 | Nunca mostra sucesso antes de `2xx`; mensagem orienta tentar novamente. | Cliente HTTP centralizado e inspeção de estados. |
| Drawer | Foco inicia no nome, Tab avança e Escape fecha visivelmente. | Navegador local a 390 px. |

## 5. Experiência de sucesso

Antes, uma linha técnica coexistia com o formulário. Depois, o formulário é substituído por um pequeno estado emocional: “Presença confirmada” para aceite, “Resposta registrada” para recusa e uma variação correta para múltiplos eventos. O resumo mostra presença e quantidades por evento/geral.

“Ver detalhes da celebração” fecha o drawer e rola para evento/local; “Alterar resposta” retorna ao formulário. A entrada dura 320 ms e é removida por `prefers-reduced-motion`. Fechar limpa o momento inicial; reabrir mostra a resposta atual editável.

## 6. Presentes

A busca/filtro/paginação continuam server-side e o primeiro lote SSR não foi alterado. A reserva agora preserva o item após identificação, mostra confirmação no próprio drawer, permite continuar ou cancelar a própria escolha e trata 409 sem expor quem reservou. Reserva alheia continua genérica.

“Ver sugestão” abre nova aba com isolamento. PIX geral permanece independente; PIX por item deixa explícito que não reserva, não confirma compra/pagamento/RSVP e só inclui valor quando `price_cents` existe.

## 7. Admin

A lista passou a responder, sem abrir cada registro: nome, grupo, status textual, adultos/crianças confirmados, origem e última resposta. Os filtros são Todos, Confirmados, Pendentes, Recusados, Novos pelo site, Confirmados hoje e Com mensagem. O cálculo de hoje usa `America/Fortaleza` e a interface informa o fuso.

O detalhe mostra telefone privado quando houver, origem, status, totais, mensagem geral, eventos relacionados, mensagens por evento e timestamps. Contadores distinguem convites de pessoas. A consulta revalida no foco, a cada 30 segundos com aba ativa e por botão manual.

O admin publicado redireciona corretamente para login. O QA visual autenticado e a confirmação com dados reais permanecem manuais porque nenhuma senha/PII foi solicitada ou transmitida nesta rodada.

## 8. WhatsApp

Metadata final: título `Gabriel & Raabe — Celebrando o Amor`; descrição curta configurável com fallback seguro; canonical HTTPS `/celebracao`; `og:type`, URL, título, descrição, site, locale, imagem, tipo, 1200×630 e alt; Twitter large image, URL, título, descrição e imagem. Nenhum token/sessão entra nos metadados.

A arte dedicada é `public/celebration-og.png` (PNG, 1200×630, cerca de 144 kB), derivada do SVG versionado, com contraste e safe area próprios para redução. Não é screenshot da página. O botão usa somente a URL canônica.

Procedimento pós-deploy: abrir a imagem e `/celebracao` publicamente; confirmar status 200 e tags absolutas; compartilhar a URL canônica em uma conversa de teste; se o WhatsApp mantiver o preview antigo, aguardar a recaptura do crawler e reenviar a mesma URL em nova mensagem/conversa. Não persistir query aleatória como URL oficial. A prévia real do WhatsApp depende do novo deploy e está explicitamente pendente.

## 9. Mensagens prontas

Curta:

> Oi! 💛 Preparamos este cantinho com os detalhes da nossa celebração. Esperamos você: https://nosdois-mu.vercel.app/celebracao

Acolhedora:

> Com muito carinho, queremos compartilhar com você um momento especial da nossa história. No nosso cantinho estão os detalhes da celebração, a confirmação de presença e a lista de presentes: https://nosdois-mu.vercel.app/celebracao

Mais formal:

> Olá! Gabriel e Raabe têm a alegria de convidar você para celebrar este novo capítulo. Consulte os detalhes e confirme sua presença em: https://nosdois-mu.vercel.app/celebracao

## 10. Screenshots

- `docs/celebration-audit/screenshots/after/final-390x844-hero.png`: hero e portal para eventos.
- `docs/celebration-audit/screenshots/after/final-390x844-rsvp.png`: identificação privada no RSVP.
- `docs/celebration-audit/screenshots/after/final-390x844-reservation.png`: identificação preservando o presente.
- `docs/celebration-audit/screenshots/after/final-1440x900-hero.png`: composição desktop e transição para evento/RSVP.

## 11. Arquivos alterados

- Público: `celebration.tsx`, `celebration.css`, `guest-identification.tsx` — sucesso, falhas, compartilhamento e metadata.
- HTTP: `http.client.ts` — timeout, abort e mensagens recuperáveis.
- RSVP servidor: `guest-name.ts`, schemas e rotas públicas de identificar/cadastrar/salvar — normalização, limites e idempotência.
- Admin: `api.guests.ts`, `guests.tsx`, componentes `guest-*`, `useGuests.ts`, `guest-rsvp.ts` — contrato por evento, filtros, contadores e sincronização.
- Testes: suites de nomes, identificação, cadastro, RSVP, schemas e helpers administrativos.
- Social/QA: `public/celebration-og.png`, `public/celebration/og-source.svg`, screenshots e este relatório.

`supabase/.temp/cli-latest` e `scratch_upload_gift_images.mjs` já existiam como mudanças do usuário e não pertencem a esta entrega.

## 12. Banco

Não houve migration nem escrita remota. A normalização adicional foi implementada no servidor sobre os nomes privados, adequada aos 64 convidados atuais, mantendo o schema e as migrations aplicadas intactos.

Leitura agregada de `Nós-Dois2`: 64 convidados (60 pendentes, 4 confirmados), 69 respostas por evento (63 pendentes, 6 confirmadas), 94 presentes, seis reservas ativas, uma cancelada e dois eventos em rascunho. Nenhum nome, telefone, mensagem ou token foi exportado.

## 13. Segurança

Sessão HttpOnly, origem/CSRF, Zod, limites persistentes, service role somente no servidor e contratos públicos sem autores/PII permanecem intactos. A busca nunca devolve candidatos e a UI/logs não registram nomes, telefones, mensagens ou tokens.

O advisor do Supabase também apontou uma pendência pré-existente fora deste escopo: RLS desativado em `events`, `groomsmen`, `inspiration_comments` e `inspiration_likes`, além de avisos em funções legadas. A correção não foi aplicada automaticamente porque habilitar RLS sem definir os consumidores/policies dessas superfícies pode quebrar o produto; exige uma decisão e teste dedicados do casal.

## 14. Qualidade

- `npm test -- --reporter=verbose`: 13 arquivos, 49/49 testes aprovados.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado.
- `npm run build`: aprovado.
- `npm audit --audit-level=high`: 0 vulnerabilidades.
- pgTAP/RLS: o arquivo existente foi revisado, mas não pôde ser executado nesta máquina porque `psql` e Supabase CLI não estão instalados; a checagem remota desta rodada foi somente leitura pelo advisor.
- Responsivo: sem overflow horizontal e sem alvo visível abaixo de 44 px em 320, 360, 375, 390, 393, 412, 430, 768 e 1440 px.
- Navegador: foco inicial/Tab/Escape aprovados; nenhum erro de aplicação, somente uma reconexão transitória do HMR do Vite.
- Detector Impeccable: somente avisos heurísticos de paleta/tipografia já presentes/aprovadas; nenhum bloqueio. A configuração `.impeccable/design.json` está desatualizada frente ao `DESIGN.md` e pode ser regenerada em uma rodada de documentação.

O build mantém um débito conhecido: `pdfmake`/fontes administrativas geram chunks grandes. Eles não entram no chunk público de `celebration`, mas devem ser carregados dinamicamente em uma otimização futura.

## 15. Pendências reais

1. Atualizar no Vercel as variáveis do projeto `Nós-Dois2`, pois o deploy inspecionado ainda referencia conteúdo do Supabase antigo; então publicar esta rodada.
2. Após o deploy, validar status 200 da arte social HTTPS e a prévia real no WhatsApp. Isso não pode ser afirmado antes da versão pública existir.
3. Fazer smoke test autenticado no `/guests` com o casal: conferir um RSVP real no público e no admin sem compartilhar credenciais com a auditoria.
4. Definir policies e habilitar RLS nas quatro tabelas legadas apontadas pelo advisor em uma rodada segura, caso continuem em uso.
5. Publicar pelo menos um evento somente quando data/local reais estiverem configurados; os dois eventos atuais permanecem corretamente em rascunho.
6. Considerar lazy-loading dos módulos PDF administrativos e regenerar o sidecar do Impeccable; ambos são refinamentos, não bloqueios do fluxo público.
