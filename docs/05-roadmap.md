# 05 — Roadmap de Implementação

## 1. Estratégia

Entregar valor verificável a cada fase, validando as hipóteses do doc 01 na ordem do risco: primeiro a mecânica de captura (H3), depois a criação comunitária (H2), depois a dimensão social (H1). Cada fase termina com critério de saída mensurável — não com "features prontas".

## 2. Fases

### Fase 0 — Fundação (1–2 semanas)
Monorepo, CI/CD, ambientes (staging/prod), esqueleto do monolito modular, auth integrada, pipeline de analytics, telas-esqueleto do app.
- **Saída:** deploy contínuo funcionando de ponta a ponta; "hello world" autenticado no app físico.

### Fase 1 — Núcleo da mecânica (3–4 semanas) → valida H3
Módulos `catalog` + `tracking`: criar Dex (web), publicar, aderir, capturar com foto/nota/data, progresso. Dexes seed criadas pela equipe (sem criação aberta ainda). Sync offline básico.
- **Histórias:** A1, B1, B2, C1, C2, C3, C4.
- **Saída:** beta fechado (~30 usuários das 2 verticais piloto); medir capturas/semana e retenção D7.

### Fase 2 — Criação comunitária (2–3 semanas) → valida H2
Criação aberta de Dexes, importação em lote (B3), versionamento completo com itens legacy (B4), denúncias + fila de moderação mínima (E1, E2), LGPD (E3).
- **Saída:** ≥ 20 Dexes criadas por usuários externos no beta; nenhum incidente de moderação sem resposta em 48 h.

### Fase 3 — Descoberta e social (2–3 semanas) → valida H1
Busca e filtros (D1), compartilhamento por link/QR (D2), perfis públicos com vitrine (A2, A3), leaderboard por Dex (D3).
- **Saída:** razão adesões/visualizações ≥ 15% nas Dexes públicas; lançamento aberto nas 2 verticais piloto.

### Fase 4 — Retenção e polimento (contínuo)
Badges (D5), notificações (nova versão de Dex aderida, marcos de progresso), offline robusto, acessibilidade AA auditada, performance.
- **Saída:** retenção D30 ≥ 20% nas coortes pós-lançamento.

### Fase 5 — Expansão (condicionada à tração)
Curadoria colaborativa (B5), seguir amigos (D4), novas verticais, exploração de monetização (premium + listas patrocinadas), apps em mais idiomas.

## 3. Métricas norteadoras

| Métrica | Definição | Meta inicial |
|---|---|---|
| Ativação | % de cadastros que capturam ≥ 1 item em 24 h | ≥ 40% |
| Engajamento | Capturas/semana por usuário ativo | ≥ 3 |
| Efeito de rede | Adesões por Dex publicada (mediana) | ≥ 5 |
| Retenção | D7 / D30 | ≥ 35% / ≥ 20% |
| Criação | % de usuários ativos que publicam uma Dex | ≥ 3% |

## 4. Riscos e mitigação

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Cold start de conteúdo (sem listas boas, ninguém adere) | Alta | Alto | Seed manual de ~50 Dexes de qualidade nas verticais piloto antes do beta; parceria com 2–3 criadores de comunidade |
| Generalismo perde para apps de nicho | Média | Alto | Lançar focado em 2 verticais; só expandir com H4 validada |
| Conteúdo impróprio em fotos/listas | Média | Alto | Verificação automática de imagem antes de publicar + denúncias desde o MVP (não adiar) |
| Sincronização offline com bugs de duplicação | Média | Médio | Operações idempotentes por design (ADR 005) + testes E2E dedicados ao fluxo de sync |
| Escopo crescer antes da validação | Alta | Médio | Lista "Won't" do doc 02 tratada como contrato; mudanças exigem revisão dos docs |
| Custo de storage de fotos | Baixa | Médio | Compressão no cliente, limites por captura, CDN com cache agressivo |

## 5. Equipe mínima sugerida

- 1 dev full-stack TS (backend + web) · 1 dev mobile RN · 1 designer de produto (part-time) — fases 0–3.
- Moderação: rotação interna no beta; ferramenta dedicada só na fase 3+.

## 6. Próximos passos imediatos

1. Validar este plano com 5–8 entrevistas curtas (2 por persona) antes da Fase 0.
2. Escolher e nomear as 2 verticais piloto.
3. Criar protótipo navegável (Figma) dos 3 fluxos críticos: aderir+capturar, criar Dex, descobrir.
4. Iniciar Fase 0.
