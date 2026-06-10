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

## Desenvolvimento

Monorepo pnpm + Turborepo (ver [docs/04-arquitetura.md](docs/04-arquitetura.md)):

```
apps/api      → backend NestJS (monolito modular: identity, catalog, tracking, discovery, trust)
apps/web      → web React + Vite (criação de Dexes)
apps/mobile   → app Expo / React Native
packages/shared → tipos de domínio, schemas zod e eventos de analytics compartilhados
```

### Pré-requisitos

Node ≥ 22, pnpm ≥ 10, Docker (para Postgres/Redis locais).

### Primeiros passos

```bash
pnpm install
cp .env.example .env        # ajuste se necessário
docker compose up -d        # Postgres + Redis
pnpm build                  # build de todos os pacotes
pnpm dev                    # api + web + mobile em watch
```

Com `AUTH_ALLOW_DEV_TOKEN=true` (somente dev), a API aceita `Authorization: Bearer dev:<userId>`:

```bash
curl -H "Authorization: Bearer dev:marina" localhost:3000/v1/me
```

### Qualidade

```bash
pnpm lint && pnpm typecheck && pnpm test
```

O CI (GitHub Actions) roda lint, typecheck, testes e build em cada PR.

## Status

🏗️ **Fase 0 (fundação) implementada:** monorepo, esqueleto do monolito modular com auth e pipeline de eventos de analytics, esqueletos web/mobile, CI e ambiente local. Pendências da Fase 0 que dependem de credenciais externas: ativar o deploy no PaaS escolhido (`.github/workflows/deploy-api.yml`) e configurar o provedor de auth gerenciado em staging. Próximo: [Fase 1 — núcleo da mecânica](docs/05-roadmap.md).
