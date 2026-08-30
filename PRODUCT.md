# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Gabriel e Raabe organizam a celebração, administram eventos, convidados, presentes, contatos e configurações.
- Convidados e familiares acessam uma página pública compartilhável; quem recebe um link individual pode responder ao convite e reservar ou cancelar presentes.

## Product Purpose

“Nós Dois” reúne a organização privada do casal e a experiência pública da celebração. O módulo “Celebrando o Amor e o Novo Lar” deve comunicar o evento com afeto, entregar informações práticas e permitir respostas privadas sem expor dados pessoais. Sucesso significa que um convidado entende rapidamente o que está sendo celebrado, encontra os dados reais do evento, responde com segurança e percebe presentes e PIX como opções, não como obrigação.

## Positioning

A mesma lista canônica de convidados sustenta a organização administrativa e uma experiência pública personalizada por convite opaco, sem pesquisa nominal nem autocadastro público.

## Operating Context

- Administração usada em navegadores por duas pessoas autenticadas.
- Convites individuais compartilhados principalmente por WhatsApp.
- Página pública usada em celulares, frequentemente a partir de redes móveis.
- Dados e mídia são configurados no Supabase; nenhuma data, local, fotografia ou confirmação de pagamento pode ser inventada.

## Capabilities and Constraints

- URL pública canônica: `/celebracao`.
- Links individuais: `/celebracao/convite/:token`, trocados por sessão HttpOnly antes de exibir dados personalizados.
- RSVP por evento com limites de adultos e crianças, edição posterior e mensagem privada opcional.
- Presentes públicos paginados, reserva separada do RSVP e cancelamento pelo próprio convidado.
- PIX livre ou com valor exato de um presente, gerando BR Code EMV sem processar ou confirmar pagamento.
- Datas são armazenadas em UTC e apresentadas em `America/Fortaleza`.
- O modelo novo é aditivo e mantém dados e URLs legados durante a transição.
- A Data API não pode expor tabelas privadas; operações sensíveis passam pelo servidor.

## Brand Commitments

- Nome do produto: “Nós Dois”.
- Nome da experiência: “Celebrando o Amor e o Novo Lar”.
- Nomes do casal: Gabriel e Raabe.
- Voz íntima, direta e acolhedora, sem pressão comercial, promessas inventadas ou excesso de clichês românticos.
- Direção visual confirmada: editorial quente, marfim/pedra, acentos botânicos e terracota, tipografia serifada com sans, poucos contêineres e movimento discreto.
- Fluxo visual confirmado: comp-first em mobile 390 px e desktop 1440 px.

## Evidence on Hand

- O repositório contém duas experiências públicas legadas, administração, 58 convidados principais, 11 convidados legados e 94 presentes.
- Configurações reais incluem contatos e dados PIX; a data existente está no passado e as localidades do módulo legado estão vazias.
- Não há fotografia horizontal real do casal anexada nesta entrega. Até ela ser fornecida, a interface deve usar um fallback tipográfico completo, sem imagem stock ou imagem quebrada.

## Product Principles

- Privacidade antes de conveniência pública.
- Informação real antes de decoração ou preenchimento fictício.
- Presença antes de presentes.
- Uma fonte canônica de dados, com compatibilidade explícita durante a migração.
- Mobile primeiro, com desempenho e recuperação de erro como parte da experiência.

## Accessibility & Inclusion

- Alvo WCAG 2.2 AA.
- Navegação completa por teclado, foco visível, nomes acessíveis e alvos de toque mínimos de 44 px.
- Respeitar `prefers-reduced-motion`; não usar autoplay obrigatório.
- Conteúdo e estados precisam permanecer compreensíveis sem fotografia, animação ou cor.
