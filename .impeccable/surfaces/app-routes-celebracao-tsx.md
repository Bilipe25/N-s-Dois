---
version: 1
slug: "app-routes-celebration-tsx"
primary_target: "app/routes/celebration.tsx"
related_targets: ["app/components/celebration","app/routes/api.public.celebration-rsvp.ts","app/routes/api.public.celebration-gifts.ts"]
---

# Celebrando o Amor e o Novo Lar — restauração da experiência afetiva

## Direção aprovada

- Restaurar e adaptar a experiência pública do commit `9cd5beccb70efb51ed94fbbcaef957f8592dfc3d`.
- Hero fotográfico imersivo, overlay escuro, serifada romântica, base pedra/marfim e acentos rosa/verde.
- A direção de caderno arquitetônico e portal foi revogada e não deve aparecer na implementação.

## Conteúdo e hierarquia

- A página sem convite é completa: hero, eventos reais, orientação configurada, presentes, PIX habilitado, mural protegido, contatos e compartilhamento.
- O convite acrescenta RSVP, reserva identificada e cancelamento; nunca funciona como barreira para o conteúdo público.
- Recuperar contagem futura, cartões de locais, filtros globais, progresso, cards ricos, modais/drawers, mural, contatos e voltar ao topo.

## Restrições

- Manter integralmente a arquitetura segura nova; adaptar dados novos aos recursos antigos, sem reativar contratos legados.
- Sem foto configurada, usar fallback cromático completo e local; não usar fotografia stock.
- Sem evento futuro, não mostrar contagem. Sem dress code/nota, não inventar paleta ou orientação.
- PIX vem do endpoint servidor e nunca afirma pagamento. Compartilhamento usa sempre `/celebracao`, sem token.
- Filtros de presentes consultam o conjunto completo no servidor; PII e autores de reserva nunca são públicos.

## Qualidade

- Mobile-first de 320 a 430 px, tablet 768 px e desktop 1440 px.
- WCAG 2.2 AA, alvos de 44 px, foco visível, teclado e movimento reduzido.
