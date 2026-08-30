---
name: "Nós Dois"
description: "Sistema afetivo e fotográfico para uma celebração íntima, segura e acolhedora."
colors:
  stone-canvas: "#fafaf9"
  stone-soft: "#f5f5f4"
  stone-border: "#e7e5e4"
  stone-muted: "#78716c"
  stone-copy: "#57534e"
  stone-heading: "#292524"
  stone-night: "#1c1917"
  pure-white: "#ffffff"
  rose-wash: "#fff1f2"
  rose-selection: "#ffe4e6"
  burnt-rose: "#f43f5e"
  burnt-rose-hover: "#e11d48"
  burnt-rose-ink: "#9f1239"
  focus-rose: "#be123c"
  emerald-wash: "#ecfdf5"
  functional-green: "#047857"
  success-ink: "#065f46"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(3.25rem, 15vw, 7rem)"
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.875rem, 5vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.15
  title:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.08em"
  control:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1
rounded:
  control: "6px"
  field: "12px"
  card: "16px"
  feature-card: "24px"
  drawer-top: "20px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "64px"
  page-gutter: "16px"
components:
  primary-cta:
    backgroundColor: "{colors.burnt-rose}"
    textColor: "{colors.pure-white}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "16px 32px"
    height: "56px"
  primary-cta-hover:
    backgroundColor: "{colors.burnt-rose-hover}"
    textColor: "{colors.pure-white}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "16px 32px"
    height: "56px"
  hero-secondary-action:
    backgroundColor: "rgba(255, 255, 255, 0.10)"
    textColor: "{colors.pure-white}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
    height: "48px"
  event-card:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.stone-heading}"
    rounded: "{rounded.feature-card}"
    padding: "28px"
  gift-card:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.stone-heading}"
    rounded: "{rounded.card}"
    padding: "12px"
    height: "144px"
  input-field:
    backgroundColor: "{colors.stone-canvas}"
    textColor: "{colors.stone-heading}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "12px"
    height: "44px"
  modal-panel:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.stone-heading}"
    rounded: "{rounded.control}"
    padding: "24px"
    width: "min(32rem, calc(100vw - 32px))"
  functional-action:
    backgroundColor: "{colors.functional-green}"
    textColor: "{colors.pure-white}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "12px 32px"
    height: "48px"
---

# Design System: Nós Dois

## Overview

**Creative North Star: "O Retrato Afetivo em Primeiro Plano"**

O sistema coloca a celebração e a fotografia real no centro de uma experiência calorosa, direta e contemporânea. Um hero imersivo e escuro abre a página como um retrato em tela cheia; títulos em Playfair Display dão intimidade e solenidade, enquanto Inter mantém detalhes, filtros, formulários e ações simples de operar. Pedra, marfim e branco sustentam o conteúdo; rosa queimado conduz o gesto afetivo; verde aparece somente quando há função, contato ou estado positivo.

A fonte visual é a experiência do commit `9cd5beccb70efb51ed94fbbcaef957f8592dfc3d`, reinterpretada pelos componentes atuais. Essa autoridade é estritamente visual: a arquitetura segura vigente governa identidade, RSVP, reservas, cancelamentos e PIX. A página pública permanece completa sem convite; o link individual apenas libera ações privadas. Nenhum padrão antigo de busca pública, autocadastro, escrita direta ou confirmação de pagamento faz parte deste sistema.

Fotografia é imersiva quando existe mídia real configurada. Sem ela, o hero usa um fallback cromático acabado — pedra profunda, luz radial rosa e overlay de alto contraste — sem imagem stock, arquivo quebrado ou conteúdo inventado. Datas, locais, orientação, contagem regressiva e mídia só aparecem quando vêm de configuração verificada.

**Key Characteristics:**

- Hero fotográfico imersivo com fallback cromático completo.
- Base clara em pedra, marfim e branco, com rosa queimado como voz afetiva.
- Verde reservado a PIX, contato, disponibilidade e sucesso.
- Playfair Display para presença emocional; Inter para leitura e operação.
- Cards ricos, arredondados e levemente elevados para eventos, presentes e estados.
- Dialog no desktop e Drawer no mobile para tarefas privadas e focadas.
- A estética histórica é referência visual; a arquitetura segura atual é a única referência funcional.

**The Visual Source, Safe Contract Rule.** Preserve o vocabulário visual da fonte restaurada, mas implemente fluxos somente pelos contratos seguros atuais; aparência nunca autoriza ressuscitar comportamento legado.

**The Real Photograph Rule.** Use apenas fotografia configurada e legítima. Na ausência dela, entregue o fallback cromático completo, nunca imagem stock ou ficção visual.

## Colors

A paleta combina neutros minerais e branco luminoso com um rosa quente de celebração; verdes entram como sinais funcionais, não como segunda identidade.

### Primary

- **Rosa Queimado:** ação principal, coração, pequenos ícones afetivos e pontos de destaque que convidam à participação.
- **Rosa Queimado Profundo:** hover da ação principal e reforço de contraste em interações.
- **Tinta Rosa:** texto e seleção ativa sobre lavagens claras.

### Secondary

- **Verde Funcional:** PIX, contato e ações que comunicam utilidade ou disponibilidade.
- **Tinta de Sucesso:** confirmação persistente e feedback positivo.

### Neutral

- **Pedra Marfim:** canvas contínuo da página e fallback claro para carregamento.
- **Pedra Suave:** placeholders, filtros, fundos secundários e áreas de baixa ênfase.
- **Linha de Pedra:** divisores e bordas de cards, campos e controles.
- **Pedra Silenciosa:** metadados e texto auxiliar.
- **Pedra de Leitura:** corpo de texto e descrição.
- **Pedra de Título:** headings, nomes de itens e dados importantes.
- **Pedra Noturna:** base do hero, overlay, QR code e ações de alto contraste.
- **Branco Puro:** cards, painéis, conteúdo modal e texto no hero.

### Tertiary

- **Lavagem Rosa:** fundos de RSVP, seleção, placeholder de presente e destaque gentil.
- **Lavagem Esmeralda:** fundo de contribuição, sucesso e PIX sem peso comercial.

**The Rose Leads, Green Confirms Rule.** Rosa conduz convite e afeto; verde sinaliza função, disponibilidade ou sucesso. Não faça os dois disputarem a mesma ação.

**The Mineral Base Rule.** A maior parte da tela permanece em pedra, marfim ou branco; cores saturadas aparecem em ações, ícones e painéis com propósito.

## Typography

**Display Font:** Playfair Display (com Georgia e serif como fallback)
**Body Font:** Inter (com ui-sans-serif e system-ui como fallback)

**Character:** Playfair Display traz romance sóbrio e presença editorial sem recorrer a caligrafia. Inter oferece legibilidade firme para fluxos privados, dados de evento, filtros, estados e microcopy.

### Hierarchy

- **Display** (600, escala fluida, entrelinha 0.92, tracking -0.03em): título sobre o hero, com legibilidade protegida por overlay e sombra.
- **Headline** (600, escala fluida entre 1.875rem e 2.25rem): títulos de seções principais.
- **Title** (600, 1.25rem, entrelinha 1.25): evento, painel, card vazio e cabeçalho de modal; cards compactos podem usar 1rem a 1.125rem.
- **Body** (400, 1rem, entrelinha 1.625): narrativa, instruções e explicações; limitar linhas a aproximadamente 64ch.
- **Label** (700, 0.75rem, tracking 0.08em): categorias, progresso e metadados em caixa alta; use apenas para fragmentos curtos.
- **Control** (600, 1rem, entrelinha 1): CTA principal; controles densos reduzem para 0.75rem a 0.875rem.

**The One Serif Rule.** Playfair Display concentra toda a expressão romântica; não introduza script, caligrafia ou uma terceira fonte decorativa.

**The Operation Stays Sans Rule.** Botões, campos, filtros, descrições e estados usam Inter, mesmo quando estão dentro de um card ou painel com título serifado.

## Layout

O hero ocupa no mínimo 82svh e centraliza uma coluna de conteúdo de até 56rem, com 20px a 24px de gutter. Fotografia ou fallback preenche toda a área por `cover`; o conteúdo fica sobre overlay vertical escuro e organiza selo, display, história, CTA e uma grade curta de ações secundárias.

O conteúdo principal usa largura máxima de 64rem, gutter de 16px e intervalos verticais de 64px. Quando existe próximo evento verificável, a primeira superfície pode sobrepor o hero em 40px; sem esse dado, o conteúdo começa com respiro positivo. Eventos formam uma ou duas colunas a partir de 768px. Presentes formam uma coluna, duas a partir de 640px e três a partir de 1280px. O card de presente permanece horizontal: mídia de 112px, ampliada para 128px em telas maiores, e conteúdo flexível ao lado.

Filtros ficam em uma superfície sticky no topo do fluxo, com fundo de pedra quase opaco e blur moderado. Categorias rolam horizontalmente em cápsulas. Painéis de tarefa mudam por dispositivo: abaixo de 640px usam Drawer inferior com até 92vh; acima disso usam Dialog central com até 90vh e largura de 28rem a 36rem. Conteúdo longo rola dentro do painel, não por trás dele.

Em larguras inferiores a 360px, escolhas de RSVP passam de duas para uma coluna. Alvos continuam com pelo menos 44px, e CTAs críticos usam 48px ou 56px.

**The Immersive First View Rule.** O primeiro viewport pertence ao hero e à ação principal; listas, filtros e detalhes entram depois, sem competir com o retrato.

**The Adaptive Panel Rule.** A mesma tarefa usa Drawer no mobile e Dialog no desktop, preservando conteúdo, hierarquia, privacidade e estado.

## Elevation & Depth

O sistema combina profundidade fotográfica no hero com superfícies brancas suaves sobre pedra. Cards ricos têm sombra ambiente quente e baixa; hover adiciona apenas uma elevação curta. Modais e drawers recebem overlay escuro para remover distração. Blur aparece somente em ações translúcidas do hero e filtros sticky.

### Shadow Vocabulary

- **Card Rico** (`box-shadow: 0 16px 40px rgba(120, 113, 108, 0.14)`): eventos e superfícies de alta importância.
- **Card em Repouso** (`box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05)`): presentes, QR code, mensagens e estados vazios.
- **Card em Hover** (`box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.10), 0 2px 4px -2px rgba(0, 0, 0, 0.10)`): resposta discreta de cards interativos.
- **Ação em Destaque** (`box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.10), 0 4px 6px -4px rgba(0, 0, 0, 0.10)`): CTA do hero e botão flutuante.
- **Título no Hero** (`filter: drop-shadow(0 20px 13px rgba(0, 0, 0, 0.20))`): separação do display sobre fotografia ou fallback.

**The Soft Lift Rule.** Elementos interativos sobem no máximo 2px; imagem de presente pode ampliar até 1.05. Profundidade nunca vira flutuação contínua ou espetáculo.

**The Focused Layer Rule.** Dialog e Drawer usam overlay preto a 80%; só o painel ativo recebe foco, rolagem e prioridade visual.

## Shapes

A linguagem é generosamente arredondada, mas hierárquica. Botões, filtros, badges, contadores e progressos são cápsulas. Campos e avisos usam 12px. Cards compactos usam 16px; eventos, RSVP, estados vazios e painéis promocionais usam 24px. Dialogs mantêm cantos contidos no desktop; Drawers usam topo de 20px e base presa à tela.

Imagens de presentes são recortadas pelo card horizontal e separadas por uma linha leve. Ícones de seção vivem em quadrados de 48px com 16px de raio ou círculos amplos. O hero é a única superfície deliberadamente sem moldura: ocupa o viewport e termina por contraste, não por borda.

**The Radius Signals Scale Rule.** Quanto maior e mais narrativa a superfície, maior o raio; controles continuam cápsulas e o hero permanece sem moldura.

## Components

### Buttons

- **Primary:** cápsula rosa com texto branco, 56px no hero e 48px em RSVP ou reserva; pode usar coração quando a ação é presença.
- **Functional:** cápsula verde com texto branco para PIX, contato ou disponibilidade; nunca substitui a ação afetiva principal.
- **Hero Secondary:** vidro branco a 10%, borda branca translúcida, texto branco e blur discreto; sempre sobre overlay escuro.
- **Outline / Ghost:** branco ou transparente, linha de pedra ou rosa e texto semanticamente correspondente.
- **Hover / Focus:** hover sobe até 2px e aprofunda a cor; foco usa contorno rosa de 3px com offset de 3px. Active retorna ao plano; disabled mantém rótulo e reduz opacidade.

### Chips

- **Category:** cápsula branca com linha de pedra; selecionada usa pedra de título com texto branco.
- **RSVP:** cápsula pedra clara; selecionada usa lavagem rosa, linha rosa e tinta rosa.
- **Badge:** cápsula compacta para loja, faixa ou estado; não funciona como CTA.

### Cards / Containers

- **Event Card:** branco, 24px de raio, padding de 28px, ícone rosa em bloco suave, título serifado e sombra rica.
- **Gift Card:** horizontal, branco, 16px de raio, borda de pedra, sombra curta, mídia à esquerda e duas ações compactas. Sem imagem real, usa fallback rosa–pedra com ícone de presente.
- **State Card:** branco ou lavagem semântica, ícone grande, título e orientação; deve oferecer recuperação quando existir ação segura.
- **Sticky Filter:** pedra quase opaca com blur, borda suave e raio apenas em telas que já oferecem margem lateral.

### Inputs / Fields

- **Style:** fundo pedra marfim ou branco, linha de pedra, 12px de raio, 44px de altura mínima e texto Inter.
- **Focus:** contorno rosa externo de alto contraste; nunca depender só da borda.
- **Error / Success:** erro usa lavagem e tinta rosa profunda; sucesso usa lavagem esmeralda e tinta verde escura.
- **Disabled / Loading:** mantém estrutura, rótulo e tamanho; reduz opacidade e comunica progresso textual.

### Navigation

Não há barra global competindo com o hero. A navegação de primeiro nível é a própria grade de ações secundárias do hero; a rolagem para seções respeita movimento reduzido. O botão flutuante de retorno aparece somente depois de 500px de rolagem e mantém 48px.

### Hero Imersivo

Fotografia real configurada ocupa o plano completo e é tratada como atmosfera, enquanto nome da experiência, título e história continuam em HTML. Um overlay de pedra noturna preserva contraste. A imagem entra por saturação e brilho em 900ms e por opacidade em 500ms. Se mídia estiver ausente ou falhar, o fallback cromático permanece completo e legível.

### Dialog / Drawer

RSVP, reserva e PIX são tarefas privadas e focadas. No desktop, Dialog centraliza conteúdo sobre overlay e limita altura; no mobile, Drawer sobe da base com alça, topo arredondado e área interna rolável. Título Playfair, descrição Inter e CTA de largura total formam a hierarquia comum.

### Gift List

Filtro de busca, faixa e categorias precede uma grade responsiva de cards ricos. A reserva abre confirmação focada e só fica disponível pelo convite seguro; cancelamento pertence à própria reserva. PIX é apresentado como opção separada, nunca como checkout ou prova de pagamento.

### Motion & Accessibility

O hero pode revelar fotografia uma vez; cards usam 300ms para elevação e 500ms para zoom de mídia; progresso e contagem só animam dados reais. Conteúdo nunca nasce oculto sem fallback. Com `prefers-reduced-motion`, rolagem suave é removida e animações/transições caem para 0.01ms. Foco de 3px, alvos mínimos de 44px, títulos semânticos, radiogroups, estados textuais e contraste de overlay são requisitos. Informação essencial não depende de fotografia, hover, cor ou animação.

**The 44px Target Rule.** Toda ação pública permanece com pelo menos 44px em ambos os eixos; ações principais usam 48px ou 56px.

## Do's and Don'ts

### Do:

- **Do** use fotografia real configurada como plano imersivo e preserve o fallback cromático de pedra e rosa para ausência ou falha.
- **Do** use Playfair Display em títulos afetivos e Inter em tudo o que a pessoa lê, filtra, confirma ou opera.
- **Do** use cards ricos para eventos, presentes e estados que realmente agrupam conteúdo e ação.
- **Do** adapte tarefas privadas para Drawer abaixo de 640px e Dialog a partir de 640px.
- **Do** mantenha rosa como ação afetiva principal e verde como sinal funcional ou positivo.
- **Do** mostre data, local, contagem, fotografia e orientação somente quando existirem dados verificados.
- **Do** preserve sessão individual, respostas privadas, reserva identificada, cancelamento autorizado e operações sensíveis no servidor.

### Don't:

- **Don't** use imagem stock, nomes, datas, locais, orientações ou confirmação de pagamento inventados.
- **Don't** restaure busca pública de pessoas, autocadastro, escrita direta do navegador, fallback de credencial ou qualquer fluxo legado inseguro.
- **Don't** trate presentes ou PIX como checkout, obrigação ou confirmação de presença.
- **Don't** use verde como cor romântica principal nem rosa para indicar sucesso operacional quando verde já resolve o estado.
- **Don't** aplique blur, sombra rica e raio de 24px a todo bloco; reserve profundidade para superfícies com hierarquia real.
- **Don't** introduza script, caligrafia, ornamento temático genérico ou uma terceira família tipográfica.
- **Don't** dependa de fotografia, cor, movimento ou hover para manter a experiência compreensível.
