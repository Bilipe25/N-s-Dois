# Matriz de restauração da experiência pública

Fonte visual e funcional: commit `9cd5beccb70efb51ed94fbbcaef957f8592dfc3d`, especialmente `app/routes/public.bridal-shower.tsx` e `app/components/bridal-shower/*`.

Esta matriz foi fechada antes das alterações de implementação. A restauração atua somente sobre a experiência pública oficial em `/celebracao`; os contratos inseguros e acessos diretos do código legado não serão reativados.

| Recurso anterior | Situação em `/celebracao` | Ação aprovada |
| --- | --- | --- |
| Hero fotográfico com nomes, texto afetivo e atalhos | Hero editorial dividido, com linguagem de caderno arquitetônico e portal | Restaurar a composição fotográfica, o overlay, `Gabriel & Raabe`, o texto afetivo e os atalhos. Usar apenas a imagem configurada pelo casal; quando ausente, mostrar fallback visual local sem imagem quebrada ou fotografia stock. O CTA de RSVP abre a experiência segura atual. |
| Contagem regressiva | Ausente | Reutilizar `Countdown`, alimentado pelo próximo evento publicado no futuro. Não renderizar contagem para evento passado ou sem data. |
| Cartões de locais | Lista editorial linear | Adaptar `celebration_events` para cartões equivalentes aos de `LocationsSection`, preservando título, data, local, endereço e link externo de mapa. Nenhum local será inventado. |
| Paleta de cores / orientação | Ausente | Restaurar a seção visual quando houver `dress_code` ou nota publicada; apresentar o texto configurado. A paleta neutra anterior pode acompanhar o conteúdo, mas não substituirá informação ausente. |
| Cartões ricos de presentes | Linhas editoriais simplificadas | Adaptar o visual de `GiftCard` ao contrato público seguro: imagem/fallback, categoria, nome, faixa/valor, link, disponibilidade e ações. Identidade do autor da reserva continua privada. |
| Busca, categoria e faixa de preço | Busca/categoria filtram somente itens já carregados | Restaurar `GiftFilter` e executar filtros no endpoint servidor sobre o conjunto completo. Paginação e estado vazio passam a refletir a consulta global. |
| Progresso de presentes | Ausente | Reutilizar `GiftProgressBar` com contagens agregadas seguras de total e reservas ativas, sem nomes ou metadados privados. |
| Modal PIX com QR e cópia | Bloco PIX inline | Restaurar o modal/drawer e QR Code, mas gerar o BR Code exclusivamente pelo endpoint seguro atual. Não reativar confirmação de pagamento nem geração client-side com chave exposta. |
| Modal/drawer de reserva | Reserva inline no cartão | Restaurar a confirmação em modal/drawer. A identidade vem apenas da sessão de convite e a escrita usa a API atômica atual; sem campo público de nome. Sem convite, o modal explica como obter o link pessoal. |
| Mural de mensagens | Ausente; endpoint legado expõe dados e permite escrita insegura | Restaurar somente com leitura por cliente servidor, campos públicos selecionados, limites, Zod e rate limiting. Publicação exigirá convite válido e usará a identidade do convidado no servidor. O endpoint legado e acesso anon direto não serão reativados; se o lockdown mínimo não puder ser garantido, a seção permanecerá oculta. |
| Contatos | Rodapé textual simples | Restaurar os botões de contato no estilo anterior, publicando somente telefones configurados e normalizando os links de WhatsApp. |
| Compartilhar | Ausente | Restaurar Web Share com fallback de cópia da URL canônica `/celebracao`; o token de convite nunca será compartilhado, copiado ou incluído em metadata. |
| Voltar ao topo | Ausente | Restaurar o botão flutuante com nome acessível, foco visível e respeito a `prefers-reduced-motion`. |

## Limites arquiteturais

- `/celebracao` continua sendo a única implementação pública oficial; as rotas anteriores permanecem redirects.
- O modelo novo (`celebration_events`, `guest_event_rsvps`, `guest_invite_tokens`, `gift_reservations` e `app_config`) permanece como fonte de dados.
- O cliente Supabase com service role permanece exclusivamente no servidor.
- RSVP, reserva e cancelamento continuam exigindo convite individual; a página, os eventos publicados, presentes disponíveis, PIX habilitado, contatos e mensagens públicas continuam úteis sem convite.
- Não serão restaurados pesquisa nominal, autocadastro, confirmação de pagamento, endpoints legados de RSVP/reserva, dados privados de reserva, secrets antigos ou permissões anon.
