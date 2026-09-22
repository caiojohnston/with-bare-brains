# Brief para sessão isolada de front-end — With Bare Brains

Cola isso como primeira mensagem numa sessão nova do Claude Code, aberta na pasta deste projeto.

## Contexto

**With Bare Brains** é uma wiki de computação pessoal, estilo Wikipedia, onde o dono escreve os próprios artigos (algoritmos, estruturas de dados, etc.) — sem IA gerando o *conteúdo* dos artigos, isso é regra do projeto e não muda. O que muda aqui é o **front-end**: essa parte é território livre pra IA codar, é a exceção documentada no `CLAUDE.md` deste repositório (que carrega automaticamente nesta sessão — não precisa pedir permissão pra escrever código aqui).

Back-end (Python/FastAPI + PostgreSQL + Cloudflare R2 pra imagem) já existe, já está rodando, já foi testado de ponta a ponta. **Não mexe nele.** Seu trabalho é só o front-end que consome essa API.

## O que já existe (API real, prefixo `/api/v1`)

Confere sempre contra o Swagger ao vivo (`http://localhost:8000/docs`) antes de assumir — rotas podem ter mudado desde que este brief foi escrito.

- `POST /pages` — cria artigo. Body: `{title, content, sidecard?, slug?, category_ids?, tag_ids?}` → 201
- `GET /pages?q=&category_id=&tag_id=&limit=&offset=` — lista/busca (busca textual real via Postgres, não é substring simples)
- `GET /pages/{id}` — artigo completo: `{id, title, sidecard, content, slug, categories[], tags[], images[], outgoing_page_ids[], incoming_page_ids[]}`
- `PATCH /pages/{id}` / `DELETE /pages/{id}`
- `POST /pages/{id}/links/{destiny_id}` / `DELETE /pages/{id}/links/{destiny_id}` — link entre artigos (direcional)
- `GET /categories` — lista flat. `GET /categories/tree` — árvore aninhada (`children` recursivo). `POST` / `PATCH /{id}` / `DELETE /{id}`
- `GET /tags` / `POST` / `PATCH /{id}` / `DELETE /{id}`
- `POST /upload/{page_id}` — multipart, campos `file` + `alt_text` (obrigatório) → `{id, page_id, storage_key, alt_text, mime_type, public_url}`. `public_url` já é a URL pública direta no R2, usa direto num `<img>`.
- `GET /page/{page_id}` — lista imagens de um artigo (repara: sem prefixo `/images`, confere se isso mudou)
- `DELETE /{image_id}` — apaga imagem (banco + R2 junto)

`sidecard` é um JSON livre (infobox estilo Wikipedia — "Complexidade: O(n log n)", "Autor: Tony Hoare", etc.) — chave/valor arbitrário, não tem schema fixo.

**Pendência que você vai esbarrar:** o back-end provavelmente ainda não tem CORS habilitado (`CORSMiddleware` no `main.py`). Se as chamadas do navegador falharem silenciosamente por CORS, essa é a causa — é ajuste de 3 linhas no back-end, mas isso é código de back-end, então **não mexe direto**: avisa o dono do projeto pra ele (ou a sessão de back-end) adicionar.

## Stack recomendado

- **React + Vite + TypeScript** — não Next.js. Isso aqui não precisa de SSR/rota de servidor; Vite dá loop de dev mais rápido e menos opinião imposta.
- **CSS escrito à mão, com custom properties pra tema** (light/dark) — não Tailwind+shadcn default. É exatamente essa combinação que dá a "cara de vibe-coded" que o dono do projeto quer evitar. Controle total do visual > biblioteca de utilitário genérica.
- `react-router` pra navegação entre artigo/categoria/busca.
- `@tanstack/react-query` pra cache e mutação contra a API — evita gerenciar loading/erro na mão em todo componente.
- Editor: markdown com preview ao vivo (textarea + render lado a lado, ou toggle) — não precisa de WYSIWYG pesado. Tem que suportar inserir imagem (upload direto, gera markdown `![alt](url)` sozinho) e inserir link pra outro artigo (autocomplete buscando em `GET /pages?q=`).

## Direção de design — isso é o que mais importa

O pedido explícito de quem vai usar isso: **parecer Wikipedia, ter alma, não parecer "gerado por IA".** Concretamente:

**Tipografia** — nunca Inter, Poppins, ou system-ui genérico (são a assinatura visual de site vibe-coded). Sugestões:
- Corpo do artigo (leitura longa): uma serifa pensada pra leitura — **Source Serif 4**, **Literata** ou **Newsreader** (as três são do Google Fonts, gratuitas, com peso editorial de livro/enciclopédia).
- Interface/navegação: uma sans distinta — **IBM Plex Sans**, **Public Sans** ou **Work Sans**.
- Blocos de código (isso é wiki de CS, vai ter bastante): **IBM Plex Mono** ou **JetBrains Mono**.

**Cor** — nada de gradiente roxo/azul de SaaS genérico.
- Modo claro: fundo levemente amarelado/papel (tipo `#FAF8F3`, não branco puro `#FFFFFF`), texto tinta escura (não preto puro).
- Modo escuro: cinza-carvão quente (tipo `#1A1817`), não preto OLED (`#000000`) — preto puro também é assinatura de vibe-coded.
- Cor de destaque/link: algo mais editorial que indigo-genérico — verde-escuro, azul-petróleo ou vinho/oxblood, remetendo a capa de livro acadêmico.

**Layout** — pega estrutura da Wikipedia de verdade: sidebar de navegação/categoria à esquerda, corpo do artigo com largura de leitura confortável (não full-width esticado), área de infobox/sidecard à direita quando existir. Sem hero section, sem card com sombra flutuante em tudo, sem emoji decorativo na interface.

**Evita, especificamente:** botão com gradiente, tudo dentro de `rounded-2xl` com `shadow-lg`, hero centralizado com título gigante + subtítulo cinza + botão CTA, ícone de emoji em vez de ícone de verdade, fonte Inter em qualquer lugar.

## Funcionalidades — nessa ordem de prioridade

O motivo desse projeto inteiro é o dono escrever artigos de novo. Se a experiência de escrever for desconfortável, ele desiste. Por isso a ordem importa:

1. **Criar/editar artigo** — fluxo tem que ser confortável, rápido de abrir, autosave se der (perder texto escrito é o pior cenário possível aqui). Isso vem antes de tudo.
2. **Navegar, buscar, filtrar por categoria/tag** — a wiki básica funcionando.
3. **Links entre artigos** — inserir/remover, ver quem aponta pra quem.
4. **Upload de imagem embutida no editor.**
5. **(Depois, não bloqueia o resto) Visão em grafo interativa** — nós/arestas dos artigos linkados. Isso é o item mais complexo e mais adiável de todos — só entra depois do resto rodando bem.

## Fora de escopo pra essa sessão

Não decide schema de banco, não mexe em rota Python, não sugere mudança de arquitetura de back-end — isso já foi fechado noutra sessão. Se achar algo que precisa mudar do lado do back-end (tipo o CORS), anota e devolve pro dono, não implementa.
