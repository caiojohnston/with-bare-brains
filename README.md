# With Bare Brains

> Subtítulo: _a definir_

Wiki de computação escrita à mão, sem IA gerando conteúdo ou código de back-end, para forçar a absorção real de fundamentos.

## Contexto e motivação

Projeto nascido de um momento de reflexão: dependência excessiva de IA no dia a dia estava apagando conceitos já dominados.

Objetivo duplo:

1. Construir uma wiki de computação, escrita por mim, para forçar a absorção real do conteúdo.
2. Recuperar/reforçar fundamentos técnicos e aprender Go do zero programando o back-end sem IA gerando código.

IA aqui é uma ferramenta de impulso, como deve ser. As regras de como a IA pode (e não pode) colaborar neste repositório estão em [CLAUDE.md](CLAUDE.md).

## O que é

Wiki de termos de computação, estilo Wikipedia, com artigos interligados (ex: página de Estrutura de Dados linkando para Bubble Sort, Quick Sort, etc).

**Categoria raiz (nó central):** "Ciência da Computação" *todas as categorias (estruturas de dados, algoritmos, computação distribuída e paralela, grafos, etc.) se ramificam a partir dela.*

Todo o conteúdo dos artigos é escrito por mim, nunca gerado por IA, sempre citando fontes confiáveis (livros, sites de referência).

### Navegação (3 formas)

1. Busca por palavra-chave (índice de busca textual)
2. Navegação por links internos entre artigos correlatos
3. Visão em grafo interativa (nós e arestas) para explorar o conteúdo visualmente

### Funcionalidades especiais

- Formulário para adicionar/editar artigos, linkar artigos existentes, adicionar imagens.
- Espaço para embutir visualizações codificadas de verdade (não GIFs) dentro dos artigos. ex: animação real de um quicksort rodando, renderizada via código.

## Stack técnica

| Camada | Tecnologia | Quem codifica |
|---|---|---|
| Back-end principal (artigos, formulário, links, busca) | Python (FastAPI)
| Microsserviço de visualizações/animações | Go (aprendizado novo, foco em paralelismo/goroutines)
| Comunicação entre serviços | API REST
| Banco de dados | PostgreSQL (dados relacionais: artigos, categorias, links, grafo)
| Front-end | A definir (React/Next provavelmente)
| Visualização do grafo interativo | A definir
| Hospedagem | Railway (banco, back-end, front-end e microsserviços todos ali)

**Decisão em aberto:** framework Go - biblioteca padrão (`net/http`, para aprender goroutines/channels sem abstração) vs. Gin (framework mais popular do ecossistema, ~1-2 dias de curva de aprendizado).

## Roadmap

- [ ] 1. Desenhar o esquema do banco de dados: artigos, categorias, links entre artigos, e como representar o grafo (nós e arestas) no modelo relacional.
- [ ] 2. Definir a arquitetura geral: como Python (back-end), Go (microsserviço) e front-end vão se comunicar, e onde cada peça roda dentro do Railway.
- [ ] 3. Subir o esqueleto do back-end em Python (FastAPI): rotas básicas de criar, ler e listar artigos. Ainda sem front-end.
- [ ] 4. Implementar a busca por palavra-chave: usando recursos de busca textual do Postgres.
- [ ] 5. Construir o formulário de criação/edição de artigos: incluindo upload de imagem e criação de links entre artigos.
- [ ] 6. Criar o microsserviço em Go: começar pela primeira visualização (ex: animação do quicksort), conectando ao back-end Python via API REST.
- [ ] 7. Montar o front-end (com ajuda de IA): incluindo a visão em grafo interativa.
- [ ] 8. Publicar no Railway e escrever os primeiros artigos reais: começando pelos algoritmos de ordenação, que foram o gatilho do projeto.
