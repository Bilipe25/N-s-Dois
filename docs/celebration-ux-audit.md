# Auditoria visual e UX/UI mobile-first — `/celebracao`

Data: 31 de agosto de 2026  
Baseline: `ef40489`  
Referência histórica: `9cd5beccb70efb51ed94fbbcaef957f8592dfc3d`

## 1. Escopo e método

A auditoria combina inspeção do código, comparação com a experiência histórica e renderização real da rota publicada em 320, 360, 375, 390, 430, 768 e 1440 px. A análise preserva o produto atual: conteúdo público sem convite, identificação privada por nome para RSVP e reservas, PIX independente e dados carregados pelo contrato seguro de `/celebracao`.

O baseline não apresentou overflow horizontal ou erros de console. A altura total variou de 5.522 px em 320 px a 3.652 px em 1440 px. Em todos os viewports foram encontrados 22 controles abaixo de 44 px; no drawer de RSVP em 320 px o conteúdo é rolável, mas não há botão de fechamento explícito.

## 2. Matriz de auditoria antes da implementação

| Área | Estado atual | Problema | Evidência | Referência antiga | Recomendação | Prioridade |
| --- | --- | --- | --- | --- | --- | --- |
| Estrutura geral | Hero, eventos, RSVP, presentes, PIX e contatos em sequência coerente | Página chega a 5.522 px em 320 px e os blocos vazios/RSVP usam mais altura que o necessário | Capturas 320–1440; 12 presentes no primeiro lote | Antigo também era longo e ainda adicionava paleta e mural | Compactar estados e ritmo sem remover conteúdo ou alterar paginação | P2 |
| Hero | Imersivo, afetivo, bom contraste e fallback gráfico íntegro | Nome ocupa 108 px em 390 px e o conjunto fica denso em telas curtas | H1 335×108 em 390 px; sem overflow | Hero antigo é a melhor referência visual, mas usava foto stock e motion excessivo | Manter composição; reduzir escala mobile e respeitar telas curtas | P2 |
| Hierarquia de ações | RSVP é primário; PIX, locais, presentes e compartilhar são secundários | Secundárias têm peso quase idêntico | Capturas 320/390 | Antigo tinha o mesmo padrão | Preservar ações, reduzir densidade visual e manter grade legível | P2 |
| Estado identificado | Chip no hero apresenta nome e estado da sessão | “Sua identificação está ativa” soa técnico e burocrático | Texto renderizado e fonte | Antigo não tinha sessão segura; usava busca pública | Trocar por acolhimento humano, sem expor detalhes de sessão | P1 |
| RSVP repetido | Segundo CTA garante acesso após o hero | Título chega a três linhas e repete muito volume visual | H2 com 108 px em 390 px | Antigo dependia mais do modal inicial | Manter o ponto de retorno, mas torná-lo um callout compacto | P2 |
| Identificação | Fluxo privado por nome, com recuperação para não encontrado/ambíguo | Microcopy fala em “vincular” e “identificação protegida”; pouco natural para público idoso | Drawer real em 320 px | Antigo sugeria nomes e expunha presença | Simplificar linguagem, mantendo privacidade e autocadastro moderado | P1 |
| Drawers mobile | Conteúdo rolável e foco inicial correto | Não existe fechamento explícito; rodapé não usa `safe-area`; altura usa `vh` | Drawer RSVP 320×568, `scrollHeight` interno 1.284 px | Antigo tinha botão “Cancelar” no rodapé | Adicionar fechar de 44 px, `dvh`, safe area e área rolável estável | P1 |
| RSVP completo | Estado, acompanhantes, mensagem, erro e sucesso estão implementados | Grupo com `role=radio` não segue o padrão de teclado de rádio; sucesso é pouco marcante | Inspeção de JSX/CSS | Antigo tinha sucesso emocional, porém com confete e dados excessivos | Usar botões pressionáveis sem semântica de rádio e reforçar confirmação com texto calmo | P1 |
| Contadores | Botões têm 44×44 px e limites são aplicados | Bom no estado auditado | CSS e contratos | Antigo tinha inputs/fluxos fragmentados | Preservar | — |
| Eventos vazios | Mensagem neutra sem inventar data/local | Cartão tem padding e seção altos para uma única informação | Captura mobile | Antigo inventava fallback de local/data visual | Compactar e manter texto neutro | P2 |
| Títulos mobile | Serifada consistente e boa identidade | Dois títulos longos quebram em três linhas em 320–390 px | Medição DOM | Antigo tinha tipografia semelhante | Aplicar escala mobile de seção e `text-wrap: balance` | P1 |
| Ritmo vertical | Espaço editorial claro entre seções | `space-y-16` somado a cards grandes aumenta o esforço de rolagem | Altura total do documento | Antigo era ainda mais longo | Reduzir espaços apenas no mobile; manter respiro no desktop | P2 |
| Presentes | Primeiro lote SSR, cursor, busca, filtros e estados de reserva corretos | Área domina a página; filtro sticky ocupa muito viewport no mobile | Capturas e `GiftSection` | Antigo carregava e filtrava tudo no cliente | Remover sticky no mobile e manter a paginação segura | P1 |
| Progresso de presentes | Mostra contexto quantitativo | “6 DE 94 PRESENTES RESERVADOS” soa transacional e cria pressão | Texto público | Herdado do antigo | Usar linguagem acolhedora e manter números apenas como contexto secundário | P2 |
| Filtros | Busca, preço e categorias derivadas dos dados | Selecte tem 40 px; chips têm 32 px; botão limpar busca tem 28 px | 22 alvos abaixo de 44 px | Herdado do antigo | Elevar todos a 44 px, nomear botão limpar e melhorar faixa rolável | P1 |
| Cartões de presente | Compactos, sem expor autor, ação de reserva e PIX separadas | Link externo tem 32 px; imagem quebrada não cai para placeholder; ações têm pouco contraste hierárquico | DOM: imagens com `naturalWidth=0`; alvo 32 px | Antigo tinha alt descritivo e visual semelhante | Fallback real no erro, link 44 px e reserva como ação visual principal | P1 |
| Reserva | Confirmação antes de gravar e cancelamento próprio | “vinculada à sua identificação” e “ela não confirma...” são técnicos | Drawer/código | Antigo pedia nome em fluxo inseguro | Explicar em linguagem de escolha e manter aviso de não pagamento | P1 |
| PIX | BR Code, cópia, valor opcional e aviso correto | Biblioteca de QR entra no bundle inicial e drawer não fecha explicitamente | Import estático; inspeção | Antigo sugeria confirmação de pagamento (“Já fiz o PIX”) | Preservar contrato atual; carregar QR sob demanda e corrigir drawer | P2 |
| Imagem principal | Fallback evita imagem quebrada visível | URL configurada falha; elemento não declara dimensões intrínsecas | `naturalWidth=0`; JSX | Antigo substituía por foto stock | Manter fallback honesto; declarar dimensões e não inventar fotografia | P2 |
| Scroll ao topo | Surge após 500 px e tem 48×48 px | Não considera safe area inferior | CSS utilitário fixo | Antigo tinha classe de safe area | Posicionar com `env(safe-area-inset-bottom)` | P2 |
| Tipografia/fontes | Playfair + Inter coerentes | A rota solicita uma segunda folha do Google Fonts já carregada no root | `root.tsx` e export `links` da rota | Antigo carregava a mesma família | Remover requisição duplicada da rota | P2 |
| Motion | Discreto e reduzido por preferência do sistema | Hover com deslocamento não agrega no touch, mas não bloqueia | CSS + media query | Antigo usava Framer Motion extensivamente | Manter motion mínimo e respeitar `prefers-reduced-motion` | P3 |
| Rodapé | Curto e coerente | Padding não considera safe area | JSX | Sem ganho relevante no antigo | Aplicar safe area inferior | P2 |
| Segurança/privacidade | Sem PII pública, convite e reservas protegidos | Nenhum problema visual P0 identificado | HTML/payload inspecionados | Antigo expunha nomes, presença e mural | Preservar integralmente o contrato novo | — |

## 3. Matriz antigo × atual

| Recurso | Antigo | Novo | Melhor abordagem |
| --- | --- | --- | --- |
| `HeroSection` | Forte presença visual, fotografia e CTA claro, mas fallback stock | Mesma linguagem, fallback honesto e conteúdo semântico | **A — merece reinterpretar:** preservar a presença e ajustar escala/densidade mobile |
| `Countdown` | Criava um portal visual entre hero e conteúdo, mas dependia de dados legados | Só aparece quando há próximo evento publicado | **B — nova implementação já é superior:** manter o gesto sem inventar data |
| `LocationsSection` | Cards ricos, porém acoplados a dois campos fixos | Eventos semânticos, mapas externos e empty state neutro | **B — nova implementação já é superior:** apenas compactar o estado vazio |
| `ColorPaletteSection` | Decorativa e com personalidade, mas hardcoded | Orientações só aparecem quando configuradas | **C — antigo era bom, mas não combina mais com o produto:** não restaurar paleta fixa |
| `GiftProgressBar` | Indicador leve, mas texto transacional | Herdava quase literalmente “reservados” | **A — merece reinterpretar:** manter contexto numérico com linguagem acolhedora |
| `GiftFilter` | Familiar e completo, porém denso e com alvos pequenos | Consulta paginada e categorias reais, mas sticky pesado no mobile | **A — merece reinterpretar:** alvos de 44 px e sticky apenas a partir de tablet |
| `GiftCard` | Compacto, afetivo e fácil de percorrer | Preserva a composição com privacidade e PIX correto | **A — merece reinterpretar:** fallback real e reserva visualmente primária |
| `ReserveGiftModal` | Fluxo direto, mas coletava nome pelo contrato inseguro | Sessão identificada, atomicidade e cancelamento próprio | **A — merece reinterpretar:** incorporar fechamento explícito e copy humana, não a lógica antiga |
| `ConfirmPresenceModal` | Tinha “Cancelar” visível e sucesso emocional; expunha autocomplete | RSVP seguro, editável, privado e com estados completos | **A — merece reinterpretar:** recuperar clareza de fechamento, sem autocomplete/confete |
| `PixModal` | Direto, mas sugeria confirmação de pagamento | Explicita que não processa nem confirma pagamento | **B — nova implementação já é superior:** manter e carregar o QR sob demanda |
| `MessageWallSection` | Acrescentava emoção e movimento, porém publicava autoria/mensagens | Mensagens são privadas no RSVP | **C — antigo era bom, mas não combina mais com o produto:** preservar privacidade |
| `ContactSection` | Links úteis, inseridos numa página muito mais longa | Contatos explícitos, configuráveis e simples | **B — nova implementação já é superior:** manter |
| Botão voltar ao topo | Tamanho adequado e animação agradável | Mesmo propósito, sem safe area | **A — merece reinterpretar:** manter e corrigir posição segura |
| Microanimações | Muitas entradas e confete | Motion discreto e redução global | **C — antigo era bom, mas não combina mais com o produto atual:** evitar espetáculo |
| Empty states | Grandes e visualmente expressivos | Neutros e honestos, mas ainda altos | **A — merece reinterpretar:** manter personalidade em escala proporcional |
| Fallback fotográfico | Usava uma foto stock como se fosse do casal | Usa textura/gradiente quando a mídia real falha | **D — não vale recuperar:** fotografia stock é enganosa |
| Busca pública por nome | Sugeria convidados e revelava presença | Respostas genéricas e nome exato | **D — não vale recuperar:** manter o contrato privado atual |

## 4. Priorização aprovada para implementação

- P0: nenhum achado visual/UX com quebra funcional, vazamento ou bloqueio total.
- P1: alvos de toque, fechamento e safe area dos drawers, semântica dos seletores RSVP, linguagem técnica, escala dos títulos, sticky de filtros mobile e fallback de imagens.
- P2: compactação de ritmo/estados, progresso acolhedor, hierarquia de cartões, dimensões da hero, fonte duplicada, lazy-load do QR e safe areas globais.
- P3 seletivo: pequenos refinamentos de transição e feedback, somente onde não aumentem carga cognitiva ou bundle.

## 5. Baseline visual

As capturas originais estão em `docs/celebration-audit/screenshots/before/`. O conjunto inclui 320×568, 360×640, 375×667, 390×844, 430×932, 768×1024, 1440×900 e o drawer de RSVP em 320×568.

## 6. Pontuação inicial

| Dimensão | Nota | Justificativa |
| --- | ---: | --- |
| Design e direção visual | 4/4 | Identidade consistente, hero marcante e superfícies coerentes |
| Responsividade | 3/4 | Sem overflow, porém títulos, sticky e densidade penalizam telas pequenas |
| Acessibilidade | 3/4 | Foco visível e contraste bons; 22 alvos pequenos e drawers sem fechar |
| Performance percebida | 3/4 | SSR e paginação corretos; fontes duplicadas, QR eager e mídia falha |
| Clareza e confiança | 3/4 | Contratos seguros, mas parte da microcopy é técnica/transacional |
| **Total** | **16/20** | Base boa, com refinamentos concentrados e de baixo risco |

## 7. Implementação, validação e resultado

### Diagnóstico geral

A direção visual estava boa e foi preservada: o hero comunica imediatamente quem celebra, o CTA principal é inequívoco, a paleta é coerente e o fallback sem fotografia parece intencional. A arquitetura pública também já era superior à antiga: SSR, paginação, privacidade e contratos de RSVP/reserva/PIX permaneceram intactos.

O que prejudicava a experiência era concentrado e observável: 22 alvos pequenos, três drawers sem fechamento explícito, títulos longos demais no mobile, filtros permanentemente sticky, textos técnicos e ações de card espremidas. Não havia motivo para um redesign.

### Problemas mobile e resultado

| Evidência | Antes | Depois |
| --- | ---: | ---: |
| Alvos abaixo de 44 px | 22 em todos os viewports | 0 em 320, 360, 375, 390, 393, 412, 430, 768 e 1440 |
| Overflow horizontal | 0 | 0 |
| H1 em 320 px | 108 px no baseline equivalente | 84 px |
| Título do RSVP em 390 px | 108 px / 3 linhas | 61 px / 2 linhas |
| Título de locais em 390 px | 72 px | 61 px |
| Drawer RSVP 320×568 | Sem fechar explícito | Fechar 44×44 px, foco no nome e scroll interno |
| Altura da página 320 px | 5.522 px | 5.258 px (−264 px) |
| Altura da página 360 px | 5.388 px | 5.205 px (−183 px) |
| Altura da página 375 px | 5.356 px | 5.190 px (−166 px) |
| Altura da página 390 px | 5.423 px | 5.232 px (−191 px) |
| Altura da página 430 px | 5.345 px | 5.277 px (−68 px) |
| Altura em tablet/desktop | 4.177 / 3.652 px | 4.242 / 3.715 px; aumento pequeno e deliberado pelos alvos de 44 px |

O hero em 320×568 agora acomoda RSVP e os quatro atalhos no primeiro viewport. Busca, preço, chips e links externos ganharam área de toque; o filtro deixa de ficar preso no mobile e continua sticky a partir de 640 px. Os chips permanecem numa faixa horizontal interna intencional, sem provocar scroll na página.

### O que foi aprendido da página antiga

A experiência antiga era melhor na sensação de ocasião, na presença do hero e na clareza de fechar/cancelar modais. Esses pontos foram reinterpretados. Não foram recuperados autocomplete público, mural, paleta fixa, foto stock, confirmação de pagamento, confete ou excesso de motion, porque entram em conflito com privacidade, conteúdo real ou maturidade do produto atual.

### Alterações realizadas, arquivo por arquivo

- `app/routes/celebration.tsx`: hierarquia mobile do hero, atalho compartilhar na grade 2×2, títulos fluidos, callout de RSVP compacto, microcopy humana, empty state menor, drawers com fechar/safe area, semântica `aria-pressed`, fallback robusto da hero, dimensões da imagem, PIX lazy-loaded, filtro sticky só em telas maiores e safe areas do scroll/footer.
- `app/routes/celebration.css`: escala fluida, regras para telas curtas, drawer com `dvh`/overscroll/safe area, botão fechar de 44 px e posições seguras.
- `app/components/celebration/guest-identification.tsx`: remove linguagem de sistema e explica privacidade em linguagem simples.
- `app/components/celebration/public-gift-card.tsx`: fallback após erro de imagem, dimensões intrínsecas, link de 44 px, nomes acessíveis e hierarquia “Escolher” × PIX sem texto espremido.
- `app/components/bridal-shower/gift-filter.tsx`: busca, limpar, select, status e chips com pelo menos 44 px; botão limpar nomeado.
- `app/components/bridal-shower/gift-progress-bar.tsx`: texto menos comercial, mantendo o número como contexto secundário.
- `docs/celebration-audit/screenshots/*`: baseline e resultado responsivo.

### Alterações deliberadamente não realizadas

- O segundo CTA de RSVP foi mantido porque recupera quem passou pelo hero; ele foi compactado em vez de removido.
- Não foi criado outro bloco narrativo: a história curta do hero já cumpre o papel e uma nova seção aumentaria o cansaço de rolagem.
- Não foi criado um filtro sticky compacto com estados próprios; retirar o sticky no mobile resolveu o problema sem nova complexidade.
- Não foram adicionadas animações de entrada, confete ou emojis em excesso; o motion existente já respeita `prefers-reduced-motion`.
- Não foram restaurados mural público, paleta hardcoded, busca nominal, foto stock ou botão de “pagamento feito”.
- Não houve mudança em APIs, banco, RLS, rate limit, sessão, modelos ou regras de RSVP/reserva.
- Não foram inventadas datas, locais, preços ou fotografia.

### Antes × depois

Capturas legíveis da primeira dobra e das áreas críticas:

| Estado | Antes | Depois |
| --- | --- | --- |
| Hero 320×568 | `screenshots/before/320x568-hero.png` | `screenshots/after/320x568-hero.png` |
| Hero 390×844 | `screenshots/before/390x844-hero.png` | `screenshots/after/390x844-hero.png` |
| Presentes 390×844 | `screenshots/before/390x844-gifts.png` | `screenshots/after/390x844-gifts.png` |
| Hero 1440×900 | `screenshots/before/1440x900-hero.png` | `screenshots/after/1440x900-hero.png` |
| RSVP 320×568 | `screenshots/before/320x568-rsvp.png` | `screenshots/after/320x568-rsvp.png` |
| Reserva 320×568 | — | `screenshots/after/320x568-reservation.png` |
| PIX 320×568 | — | `screenshots/after/320x568-pix.png` |

O conjunto full-page contém 320, 360, 375, 390, 393, 412, 430, 768 e 1440 px. A captura full-page do navegador usa costura por rolagem e pode repetir visualmente elementos durante o carregamento lazy; a validação de duplicidade foi feita no DOM e confirmou uma única seção, um único filtro e um único rodapé.

### Jornada de RSVP

1. O CTA abre um drawer com foco no nome, fechar explícito e fundo sem scroll.
2. Nome encontrado revalida a sessão HttpOnly e apresenta as respostas permitidas.
3. Nome não encontrado oferece confirmação espontânea, sem sugerir ou revelar nomes.
4. Nome ambíguo orienta falar com o casal e permite tentar outro nome.
5. Identificado pode confirmar ou recusar, ajustar adultos/crianças dentro dos limites, escrever mensagem privada, salvar e editar depois.
6. Loading, erro e sucesso usam regiões anunciáveis; a recusa recebe texto acolhedor.
7. A troca de pessoa permanece acessível como ação secundária “Não é você? Trocar nome”.

O percurso não identificado e os estados do drawer foram inspecionados visualmente. Os contratos de encontrado, ambíguo, espontâneo, edição, recusa e repetição são cobertos pelos testes de rota; não foi usado um nome real em produção nem gravada uma resposta durante a auditoria.

### Jornada de presente

1. A pessoa localiza o item por busca, faixa de preço ou categoria.
2. “Ver sugestão online” abre a referência externa; imagens indisponíveis viram fallback visual.
3. “Escolher” é a ação primária e abre uma confirmação; PIX permanece secundário e separado.
4. Sem nome, o mesmo fluxo privado identifica ou registra a pessoa.
5. Identificado pode confirmar a reserva e depois cancelar apenas a própria escolha.
6. O drawer esclarece que escolha, pagamento e presença são ações independentes.
7. O PIX geral ou do presente gera o BR Code sob demanda, permite copiar e nunca afirma que houve pagamento.

O drawer de escolha foi aberto e validado sem confirmar a ação, portanto nenhum dado remoto foi alterado.

### Resultado de qualidade

| Validação | Resultado |
| --- | --- |
| `npm run typecheck` | passou |
| `npm run lint` | passou |
| `npm run test` | 12 arquivos e 42 testes passaram |
| `npm run build` | passou; rota pública `celebration` com 47,61 kB / 14,04 kB gzip |
| QR Code | isolado em import dinâmico; não entra no carregamento inicial da rota |
| `npm audit --audit-level=high` | 0 vulnerabilidades |
| Console em navegação local limpa | 0 erros |
| Responsividade real | 9 viewports, 0 overflow horizontal, 0 alvos abaixo de 44 px |
| Foco/reduced motion | foco visível preservado; drawer foca o nome; CSS respeita preferência reduzida |

O build ainda informa chunks grandes de `pdfmake`/fontes PDF no conjunto administrativo; eles não são importados pela rota pública de celebração e não foram ampliados nesta rodada. O primeiro `npm run ci` concluiu typecheck, lint, testes e build, mas o `npm audit` não alcançou o registro dentro do sandbox; a mesma auditoria foi repetida com rede autorizada e retornou zero vulnerabilidades.

O detector final do Impeccable apontou avisos heurísticos de cinza sobre fundos tintados, Inter e escalas fluidas fora do ramp antigo. Eles foram revisados: os pares usam tons escuros com contraste visual adequado, Inter + Playfair é a direção documentada e os `clamp()` resolvem quebras reais em 320–430 px. Não houve erro bloqueante do detector.

### Pontuação final

| Dimensão | Antes | Depois |
| --- | ---: | ---: |
| Design e direção visual | 4/4 | 4/4 |
| Responsividade | 3/4 | 4/4 |
| Acessibilidade | 3/4 | 4/4 |
| Performance percebida | 3/4 | 3/4 |
| Clareza e confiança | 3/4 | 4/4 |
| **Total** | **16/20** | **19/20** |

### Pendências reais

- A URL da fotografia principal configurada continua inválida; o fallback é íntegro, mas a foto real precisa ser corrigida no conteúdo quando estiver disponível.
- Lighthouse/INP em aparelho físico e teclado virtual iOS/Android não foram medidos por automação nesta máquina. A inspeção cobre layout, foco, scroll interno, safe area e bundle, mas esses números devem ser confirmados no preview/deploy.
- Estados visuais que dependem de dados não existentes no ambiente atual — um/dois eventos, todos os presentes reservados, pós-evento e sessão identificada real — foram revisados no código e nos testes, mas não receberam captura com PII ou mutação de produção.
- `.impeccable/design.json` está anterior ao `DESIGN.md`; a implementação seguiu o documento mais novo. Uma rodada futura de `document` pode sincronizar o contexto sem alterar esta entrega.
