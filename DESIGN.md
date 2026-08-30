---
name: "Nós Dois"
description: "Sistema editorial quente para uma celebração íntima e a construção de um novo lar."
colors:
  ivory-linen: "#f1e4d1"
  burnt-clay: "#b8673f"
  deep-clay: "#8f452d"
  portal-clay: "#763824"
  botanical-olive: "#53604b"
  olive-stone: "#aea992"
  charcoal-ink: "#262720"
  restrained-ochre: "#c89a57"
  error-ink: "#6e251d"
  error-surface: "#f5cfbd"
  success-ink: "#34412d"
typography:
  display:
    fontFamily: "Bodoni Moda, Georgia, serif"
    fontSize: "clamp(5rem, 9.4vw, 9.3rem)"
    fontWeight: 400
    lineHeight: 0.82
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Bodoni Moda, Georgia, serif"
    fontSize: "clamp(3.2rem, 6.5vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.94
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Bodoni Moda, Georgia, serif"
    fontSize: "1.8rem"
    fontWeight: 500
    lineHeight: 1.1
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 600
    lineHeight: 1
  control:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1
rounded:
  editorial: "0px"
  functional: "12px"
  pill: "999px"
  circle: "50%"
spacing:
  xxs: "8px"
  xs: "10px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "32px"
  viewport-gutter: "clamp(20px, 5vw, 70px)"
  section-block: "clamp(90px, 12vw, 170px)"
components:
  portal-threshold:
    backgroundColor: "{colors.portal-clay}"
    textColor: "{colors.ivory-linen}"
    rounded: "{rounded.editorial}"
    padding: "125px 40px 50px"
    width: "min(820px, 72vw)"
    height: "330px"
  invitation-button:
    backgroundColor: "{colors.ivory-linen}"
    textColor: "{colors.charcoal-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.functional}"
    padding: "16px 32px"
    height: "56px"
  primary-button:
    backgroundColor: "{colors.charcoal-ink}"
    textColor: "{colors.ivory-linen}"
    typography: "{typography.control}"
    rounded: "{rounded.functional}"
    padding: "16px 32px"
    height: "56px"
  choice-chip:
    backgroundColor: "transparent"
    textColor: "{colors.charcoal-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
    height: "44px"
  choice-chip-selected:
    backgroundColor: "{colors.botanical-olive}"
    textColor: "{colors.ivory-linen}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
    height: "44px"
  input-field:
    backgroundColor: "rgba(255, 255, 255, 0.34)"
    textColor: "{colors.charcoal-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.functional}"
    padding: "14px 16px"
---

# Design System: Nós Dois

## Overview

**Creative North Star: "O Caderno de Materiais do Novo Lar"**

O sistema apresenta a experiência como um caderno arquitetônico vivido: papel de linho marfim, barro queimado, oliva botânico, tinta carvão e linhas de planta substituem o repertório previsível de um template romântico. A composição A é a base — tipografia monumental, assimetria editorial, navegação rarefeita e grandes campos contínuos — com o gesto espacial da composição C incorporado como um portal entre o hero e o próximo encontro.

A superfície pública é expressiva, tátil e generosa; a administração é uma camada operacional, compacta e previsível, feita com os primitivos de formulário já existentes. Elas compartilham clareza, contraste, linguagem direta e estados honestos, mas a administração não replica texturas, escala monumental nem o portal. Conteúdo continua inteligível sem fotografia, movimento ou cor; quando não existe mídia real, o fallback material é uma composição final, não um espaço quebrado.

**Key Characteristics:**

- Editorial quente, arquitetônico e material.
- Tipografia serifada de alto contraste em diálogo com uma sans humanista.
- Seções amplas e contínuas, com poucas caixas e hierarquia por escala, cor e ritmo.
- Contrato A como composição-base e portal de C como única assinatura espacial.
- Presença e informação prática antes de presentes ou contribuição.
- Estados reais, privacidade e acessibilidade tratados como parte da linguagem visual.

**The One Threshold Rule.** O portal aparece uma única vez, na passagem do hero para o próximo encontro; repeti-lo o transforma em ornamento e elimina seu sentido narrativo.

## Colors

A paleta parece extraída de linho, argila, folha e grafite: quente e terrosa, com contraste funcional e sem romantismo açucarado.

### Primary

- **Barro Queimado:** campo de transição, seções de alta presença e superfícies que materializam o novo lar.
- **Barro Profundo:** rodapé e áreas que precisam de maior densidade sem recorrer a preto puro.
- **Barro do Portal:** interior multiplicado do limiar arquitetônico; use somente na assinatura do portal.

### Secondary

- **Oliva Botânico:** estados selecionados, eixo arquitetônico, seleção de texto e bandas narrativas.
- **Oliva Pedra:** campo secundário e fallback arquitetônico de mídia; apoia o hero sem disputar com a tipografia.

### Tertiary

- **Ocre Contido:** detalhe raro de material ou separação. Não funciona como segundo CTA nem como acento constante.

### Neutral

- **Linho Marfim:** plano dominante da experiência pública e texto sobre campos escuros.
- **Tinta Carvão:** texto principal, ação primária do RSVP e superfície do painel PIX.
- **Tinta de Erro / Superfície de Erro:** par semântico reservado a falhas e convites inválidos.
- **Tinta de Sucesso:** confirmação discreta de ações concluídas.

**The Material, Not Gradient Rule.** Variação visual vem de textura raster sutil e blocos tonais; não use gradientes brilhantes, halos ou fundos sintéticos de produto SaaS.

**The Rare Ochre Rule.** O ocre pontua, nunca governa. Se uma tela parecer dourada, o acento foi usado em excesso.

## Typography

**Display Font:** Bodoni Moda (com Georgia e serif como fallback)

**Body Font:** Manrope (com ui-sans-serif e system-ui como fallback)
**Operational Font:** Inter na administração existente; não misture Inter e Manrope na mesma superfície pública.

**Character:** Bodoni Moda dá verticalidade, contraste e gesto editorial; Manrope mantém dados, formulários e ações íntimos e legíveis. A tensão entre uma serif estreita e monumental e uma sans simples substitui ornamentos temáticos.

### Hierarchy

- **Display** (400, escala fluida, entrelinha 0.82): reservado ao título principal; no mobile, reduz para escala fluida e entrelinha 0.92 para preservar leitura e composição.
- **Headline** (400, escala fluida, entrelinha 0.94): títulos de seção e grandes frases narrativas.
- **Title** (500, 1.8rem, entrelinha 1.1): títulos de eventos e legendas de blocos funcionais; presentes usam uma versão menor de 1.35rem.
- **Body** (400, 1rem, entrelinha até 1.75): explicações, dados e orientação. Parágrafos ficam entre 60ch e 70ch.
- **Label** (600, 0.85rem, entrelinha 1): ações compactas e metadados; navegação pode subir a 0.95rem.
- **Control** (600, 1rem, entrelinha 1): CTA do portal e ação principal.

**The Serif Carries Meaning Rule.** Use a serif para títulos, nomes de capítulos e frases de presença; use a sans para tudo o que a pessoa precisa operar, conferir ou responder.

**The No Decorative Type Rule.** Não adicione script, caligrafia, caixa-alta espaçada ou uma terceira fonte para fabricar romantismo.

## Layout

A composição é mobile-first e se apoia em campos verticais extensos, não em uma grade de cards. Em desktop, o hero usa duas colunas assimétricas — aproximadamente 1.6fr para o título e 0.8fr para mídia real ou fallback arquitetônico — com respiro entre 30px e 100px. O conteúdo editorial usa largura máxima de 1180px; a lista de presentes pode chegar a 1240px. Gutter lateral e espaçamento de seção são fluidos conforme os tokens normativos.

As seções combinam um título largo com um bloco explicativo menor; linhas de 1px organizam eventos, respostas e presentes. No intervalo de 761px a 980px, o hero passa a bloco único e esconde o campo de mídia para preservar a hierarquia. Em 760px ou menos, navegação secundária desaparece, seções usam 20px de gutter e 90px de respiro vertical, linhas de evento viram uma coluna, escolhas e contadores empilham, a ação principal ocupa a largura e os painéis PIX e rodapé viram uma coluna.

O portal nasce do eixo vertical central do título. Em desktop, usa recorte de casa com ápice central e ombros a 31% da altura; no mobile, os ombros sobem para 21%, o portal cresce em profundidade e ocupa até 82vw. A ação e o próximo encontro ficam dentro do limiar; as seções seguintes herdam a gramática de materiais, mas nunca repetem a silhueta.

**The Continuous Field Rule.** Prefira seções contínuas, divisores e mudanças de material a pilhas de cartões. Um card só existe quando encapsula uma tarefa operacional real.

**The 390/1440 Contract Rule.** Toda nova composição pública deve funcionar primeiro nos contratos de 390px e 1440px, sem depender de recorte horizontal ou de uma fotografia para permanecer completa.

## Elevation & Depth

O sistema é plano por padrão e cria profundidade com sobreposição, recorte, textura e mudança de matéria. Sombras são raras, quentes e difusas: dão peso ao portal e resposta tátil ao CTA, sem produzir cartões flutuantes ou halos.

### Shadow Vocabulary

- **Peso do Portal** (`filter: drop-shadow(0 18px 24px rgba(70, 33, 22, 0.16))`): somente sob o limiar arquitetônico.
- **Repouso do CTA** (`box-shadow: 0 12px 28px rgba(46, 26, 19, 0.15)`): ação principal sobre barro.
- **Elevação do CTA** (`box-shadow: 0 16px 32px rgba(46, 26, 19, 0.20)`): resposta de hover junto de uma subida de 2px.

**The Flat-by-Default Rule.** Superfícies editoriais ficam no plano; sombra sinaliza limiar ou resposta a interação, nunca decoração permanente.

## Shapes

Campos editoriais, bandas de história, eventos, presentes, PIX e rodapé têm bordas retas. O portal é o recorte geométrico dominante: um pentágono de casa sem contorno ornamental, alinhado por um eixo oliva de 2px. Controles e feedback usam cantos funcionais discretos; chips usam cápsula, e contadores circulares preservam alvo de toque.

**The Geometry Has Rank Rule.** Silhueta arquitetônica pertence ao portal; controles recebem curvas de 12px, seletores recebem cápsulas e o conteúdo editorial permanece ortogonal.

## Components

### Buttons

- **Shape:** retângulo material de cantos discretos, com 56px de altura na ação principal e pelo menos 44px nas ações secundárias.
- **Invitation:** marfim sobre barro, amplo e sem ícone decorativo; concentra a entrada privada do convite.
- **Primary:** carvão sobre marfim para salvar o RSVP; largura total no mobile.
- **Secondary / Ghost:** fundo transparente, linha carvão semitransparente e 12px de raio para mapa, reserva, cópia e paginação.
- **Hover / Focus:** elevação de 2px em 250ms com curva de saída expressiva; foco visível combina contorno branco de 3px e anel carvão externo. Estado disabled reduz opacidade, mantém rótulo e comunica espera.

### Chips

- **Style:** cápsulas transparentes com linha fina; selecionadas usam oliva botânico com texto marfim.
- **State:** escolha de presença e filtros de presentes compartilham a mesma gramática, mas mantêm semântica e comportamento de teclado próprios.

### Cards / Containers

- **Public Surface:** listas são linhas editoriais com divisores, não cartões; a imagem de presente usa um bloco oliva translúcido como fallback.
- **Operational Surface:** cartões de administração podem usar fundo neutro, borda, sombra curta e 12px de raio porque agrupam tarefas de edição.
- **Internal Padding:** áreas funcionais usam 18px a 32px; grandes painéis usam padding fluido.

### Inputs / Fields

- **Style:** fundo marfim translúcido, linha carvão semitransparente, 12px de raio e padding de 14px por 16px.
- **Focus:** usa o anel duplo global, sem depender apenas de mudança de cor.
- **Error / Disabled:** erro usa o par semântico de tinta e superfície; desabilitado reduz opacidade e troca o cursor, sem remover o rótulo.

### Navigation

Marca serifada à esquerda, links centrais rarefeitos e convite à direita com sublinhado oliva. Todos os alvos têm pelo menos 44px. No mobile, os links centrais desaparecem e a marca com a entrada do convite formam a navegação essencial.

### Portal Threshold

É a assinatura do sistema e a fusão deliberada do contrato A com o gesto de C. Um eixo oliva desce do hero até uma superfície de barro recortada em casa, revelando somente o próximo encontro verificado e a ação privada. Seu conteúdo fica visível por padrão; qualquer entrada orquestrada acontece uma vez e não bloqueia leitura.

### Event, Gift and PIX Rows

Eventos e presentes usam linhas responsivas, ícones pequenos e hierarquia por tipo. Presentes são progressivos e opcionais; a reserva nunca parece compra. O painel PIX usa carvão e marfim, separa explicação de QR code e nunca comunica confirmação de pagamento.

### Motion & Accessibility

Movimento existe para confirmar estado e conduzir o olhar ao único limiar: transições de controle usam 250ms e a curva `cubic-bezier(0.16, 1, 0.3, 1)`. Todo conteúdo permanece presente antes da animação. Com `prefers-reduced-motion`, rolagem suave é desativada e durações caem para 0.01ms. Navegação por teclado, nomes acessíveis, foco de alto contraste, alvos mínimos de 44px e informação independente de foto, cor ou movimento são requisitos do componente, não acabamentos.

## Do's and Don'ts

### Do:

- **Do** trate o contrato A como estrutura: título monumental, assimetria editorial, navegação esparsa, grandes campos e leitura progressiva.
- **Do** use o portal de C uma única vez para ligar a promessa do hero ao próximo encontro e ao convite.
- **Do** use textura de linho e argila em tiles raster leves, uniformes, mate e de baixo contraste; mantenha um fundo de cor equivalente.
- **Do** mostre somente datas, locais, mídia e estados reais; ausências recebem fallback material e texto honesto.
- **Do** preserve leitura e operação completas em 390px, 1440px, teclado e movimento reduzido.
- **Do** mantenha RSVP como ação principal e presentes ou PIX como possibilidades posteriores e sem pressão.

### Don't:

- **Don't** use fotografia stock, imagem quebrada, countdown fictício, dress code inventado ou busca pública por nomes.
- **Don't** transforme a superfície pública em grade de cartões, vitrine de presentes ou checkout.
- **Don't** repita a casa, o eixo ou o recorte do portal em seções posteriores, botões, ícones ou molduras.
- **Don't** adicione gradientes luminosos, glassmorphism, glow, sombras frias ou ornamento romântico genérico.
- **Don't** misture Bodoni Moda, Manrope e a tipografia operacional na mesma hierarquia pública.
- **Don't** dependa de fotografia, animação, cor isolada ou hover para transmitir conteúdo ou estado.
