# Collectdex 📒

> Uma "Pokédex para tudo": crie e compartilhe listas de coisas para colecionar, visitar, observar ou completar — e acompanhe seu progresso junto com outras pessoas.

## O que é

O Collectdex é um app onde usuários criam **listas-modelo** (templates) de itens — colecionáveis, locais de viagem, aves para observar, pratos típicos, filmes de um diretor — e outros usuários **aderem** a essas listas para rastrear seu próprio progresso, item a item, como quem preenche uma Pokédex.

**Exemplo:** alguém cria a lista "Aves do Cerrado Brasileiro" com 120 espécies. Você adere a ela e, a cada ave que avistar, marca o item como "capturado", podendo anexar foto, data e nota. Seu progresso (37/120) aparece no seu perfil e em rankings da lista.

## Documentação

A documentação segue o fluxo de ideação → requisitos → modelagem → arquitetura → execução:

| Documento | Conteúdo |
|---|---|
| [01 — Visão de Produto](docs/01-visao-de-produto.md) | Problema, proposta de valor, Lean Canvas, personas, diferenciais |
| [02 — Requisitos](docs/02-requisitos.md) | Histórias de usuário, requisitos funcionais e não-funcionais, escopo do MVP (MoSCoW) |
| [03 — Domínio e Dados](docs/03-dominio-e-dados.md) | Linguagem ubíqua, modelo de domínio, modelo de dados (ERD), regras de negócio |
| [04 — Arquitetura](docs/04-arquitetura.md) | Stack, arquitetura do sistema, API, decisões técnicas (ADRs) |
| [05 — Roadmap](docs/05-roadmap.md) | Fases de implementação, métricas de sucesso, riscos e mitigação |

## Conceitos centrais

- **Dex (lista-modelo):** uma lista publicada por um criador, com itens fixos e versionados.
- **Adesão (tracker):** a cópia pessoal de progresso de um usuário sobre uma Dex.
- **Captura:** o ato de marcar um item como obtido/visitado/concluído, com evidência opcional (foto, nota, data, local).

## Status

📐 Fase de ideação e planejamento. Nenhum código ainda — comece pelos documentos acima.
