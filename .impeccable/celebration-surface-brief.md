# Celebrando o Amor e o Novo Lar

## Escopo e modo

- Superfície: rota pública `/celebracao` e estados personalizados do convite.
- Modo: Persuade, com RSVP como ação principal e informação prática antes de presentes.

## Visitante, tarefa e conteúdo

- Convidados e familiares chegam principalmente por WhatsApp em celulares.
- Devem entender a celebração, ver somente eventos reais e responder com privacidade.
- Sem convite, a página continua útil e orienta o contato com o casal sem busca nominal.
- Datas, locais, fotografia, contatos e PIX vêm da configuração; ausências recebem estados honestos.

## Direção aprovada

- “Caderno de materiais do novo lar”: linho/papel marfim, barro queimado, verde-folha e linhas arquitetônicas.
- Composição A aprovada, incorporando o gesto de portal da composição C entre hero e próximo evento.
- Comps: `.impeccable/mocks/celebracao-approved-mobile.png` e `.impeccable/mocks/celebracao-approved-desktop.png`.
- Momento memorável: o eixo vertical do título encontra um recorte de porta/casa que revela o próximo evento e a ação do convite.

## Sistema extraído dos comps

| Ingrediente | Registro aprovado | Implementação |
| --- | --- | --- |
| Fundo | marfim amostrado `#F1E4D1` | HTML/CSS + tile de linho raster eficiente |
| Campo de evento | barro amostrado `#B8673F` | HTML/CSS + tile mineral raster eficiente |
| Campo secundário | oliva/pedra amostrado `#AEA992`, oliva funcional `#53604B` | HTML/CSS |
| Tipografia | display serif estreita de alto contraste; sans humanista | fonte web obtida e CSS, texto permanece semântico |
| Portal | recorte geométrico central, com eixo vertical oliva | CSS `clip-path`/pseudo-elementos, responsivo |
| CTA | bloco marfim amplo, mínimo 44 px, sem ícone decorativo | botão/link semântico |
| Hero futuro | área de mídia real configurável; fallback material completo | `<picture>` quando houver foto; CSS quando não houver |

## Gramática de componentes

- Seções grandes e contínuas, sem grade de cards como esqueleto.
- Cantos discretos de 12–16 px apenas em controles e itens funcionais; campos editoriais permanecem retos.
- Linhas de 1 px, sombras apenas com deslocamento e blur suave; nenhum halo.
- Display em escala forte; sans para controles e dados. Corpo limitado a 70ch.
- Uma única entrada orquestrada no portal; conteúdo visível por padrão e motion reduzido sem transição.

## Restrições e pendências

- Não inventar data, endereço, imagem do casal ou confirmação de pagamento.
- Fotografia horizontal real e data futura continuam pendentes de configuração.
- O comp mostra somente o primeiro viewport; RSVP, eventos, presentes, PIX e contato herdam a mesma gramática sem repetir o portal.
