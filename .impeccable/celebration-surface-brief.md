# Celebrando o Amor e o Novo Lar — restauração da experiência afetiva

## Escopo e modo

- Superfície: rota pública oficial `/celebracao`, com ou sem convite individual.
- Modo: celebrar e orientar. A página pública é completa; o convite acrescenta RSVP, reserva identificada e cancelamento.

## Fonte de verdade visual

- Commit `9cd5beccb70efb51ed94fbbcaef957f8592dfc3d`.
- Referências primárias: `app/routes/public.bridal-shower.tsx` e `app/components/bridal-shower/*` naquele commit.
- A direção anterior de caderno arquitetônico, composição A e portal da C foi explicitamente revogada pelo usuário e não governa esta superfície.

## Mundo visual restaurado

- Hero fotográfico imersivo com overlay escuro, nomes do casal em serifada romântica e texto afetivo.
- Base em pedra/marfim, branco, rosa queimado e verde funcional; seções claras, leves e acolhedoras.
- Cartões de locais e presentes ricos, filtros legíveis, progresso discreto, modais/drawers para tarefas focadas.
- Movimento pontual e suave; nenhum efeito depende de movimento para comunicar estado.
- A fotografia vem da configuração. Sem foto, o hero usa um fallback cromático completo, sem stock remoto e sem imagem quebrada.

## Hierarquia e recursos obrigatórios

1. Hero com Gabriel & Raabe, CTA de RSVP, atalhos para PIX, locais, orientação, presentes e compartilhar.
2. Contagem regressiva apenas para o próximo evento publicado no futuro.
3. Eventos/locais reais em cartões e dress code/nota somente quando configurados.
4. RSVP seguro: convite individual abre a resposta; sem convite, explica o link pessoal e oferece contato.
5. Lista completa de presentes com busca, categoria e preço globais, progresso, paginação e estados vazio/reservado/próprio.
6. Reserva/cancelamento via APIs seguras e modal/drawer; PIX em modal com payload produzido no servidor.
7. Mural somente se protegido, contatos, compartilhar URL canônica, voltar ao topo e rodapé.

## Limites arquiteturais

- Não reativar hooks/endpoints públicos legados, cliente Supabase browser, busca nominal, autocadastro, confirmação de pagamento ou PII de reservas.
- Preservar `celebration_events`, `guest_event_rsvps`, `guest_invite_tokens`, `gift_reservations`, `app_config`, RLS/grants, service role no servidor, Zod, CSRF/origin e rate limiting.
- URLs de convite nunca entram em canonical, compartilhamento ou metadata.
- Datas, locais, imagem, dress code e informações não configuradas recebem estados honestos; nada é inventado.

## Responsividade e acesso

- Mobile-first em 320, 360, 375, 390 e 430 px; tablet 768 px; desktop 1440 px.
- Alvos de pelo menos 44 px, foco visível, teclado completo, contraste AA, nomes acessíveis e `prefers-reduced-motion`.
- O primeiro lote de presentes continua SSR e o restante é carregado sob demanda; filtros consultam o conjunto completo no servidor.
