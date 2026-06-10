# 01 — Visão de Produto

## 1. O problema

Pessoas que colecionam, exploram ou completam coisas (selos, vinis, trilhas, aves, restaurantes, países, troféus de jogos) hoje rastreiam seu progresso de forma fragmentada: planilhas, notas no celular, apps de nicho que cobrem só um tipo de coleção (ex.: apps só de cervejas, só de aves, só de filmes).

Dores principais:

1. **Fragmentação** — cada hobby exige um app diferente, com UX e contas diferentes.
2. **Esforço de catalogação** — montar a lista do zero (ex.: todas as 120 aves do Cerrado) é trabalhoso; esse trabalho é repetido por cada pessoa.
3. **Falta de dimensão social** — planilhas não permitem comparar progresso, descobrir listas novas ou competir de forma saudável.

## 2. A proposta de valor

> **"Uma Pokédex para qualquer coisa."** Um único app onde a comunidade cria as listas uma vez e todos rastreiam seu progresso nelas.

A mecânica da Pokédex é o insight central de design: uma lista **finita e conhecida** de itens, com estados claros (não visto / visto / capturado), progresso visível (37/120) e satisfação de completude. Essa mecânica é universal e o app a generaliza para qualquer domínio.

- **Para quem rastreia:** progresso gamificado, registro com evidências (foto, data, local), descoberta de novas listas.
- **Para quem cria:** o trabalho de catalogar vira um ativo social — reconhecimento, comunidade em torno da lista, curadoria colaborativa.

## 3. Lean Canvas

| Bloco | Conteúdo |
|---|---|
| **Problema** | Rastreamento de coleções é fragmentado, manual e solitário |
| **Segmentos de clientes** | Colecionadores (físico/digital), viajantes, observadores de natureza, completionistas de mídia (filmes, jogos, livros) |
| **Proposta de valor única** | A mecânica de Pokédex aplicada a qualquer lista, com criação comunitária e progresso social |
| **Solução** | Listas-modelo criadas pela comunidade + trackers pessoais + capturas com evidência + perfil/rankings |
| **Canais** | Lojas de apps, comunidades de nicho (Reddit, grupos de hobby), compartilhamento de listas por link |
| **Receita (futuro)** | Freemium: listas ilimitadas, estatísticas avançadas, badges premium; listas oficiais patrocinadas (ex.: rota turística de uma cidade) |
| **Estrutura de custos** | Infra (backend + storage de imagens), moderação de conteúdo, desenvolvimento |
| **Métricas-chave** | Adesões por lista, capturas/semana por usuário ativo, taxa de completude, retenção D30 |
| **Vantagem injusta** | Efeito de rede de conteúdo: cada lista criada aumenta o valor do app para todos os próximos usuários |

## 4. Personas

### Persona 1 — Marina, a Criadora (28, bióloga)
Observa aves há 10 anos e mantém planilhas detalhadas. Quer compartilhar suas listas regionais e formar comunidade em torno delas.
- **Precisa:** editor de listas eficiente (importação em lote), controle de versão da lista, moderação de sugestões.
- **Sucesso:** "Minha lista de aves do Cerrado tem 500 pessoas aderindo."

### Persona 2 — Caio, o Completionista (22, estudante)
Joga e coleciona action figures. Adora barras de progresso e troféus; abandona apps que dão trabalho.
- **Precisa:** marcar capturas em 2 toques, progresso visual, comparação com amigos.
- **Sucesso:** "Fechei 100% da lista e ganhei o badge."

### Persona 3 — Lúcia, a Viajante (45, arquiteta)
Viaja em família e quer transformar roteiros em jogo para os filhos ("os 30 pontos históricos de Ouro Preto").
- **Precisa:** uso offline durante viagens, fotos como evidência, adesão fácil para a família.
- **Sucesso:** "As crianças pediram para visitar mais um ponto para completar a lista."

## 5. Diferenciais e antirrecursos

**Diferenciais:**
- Generalidade com mecânica única e consistente (qualquer domínio, mesma UX de "dex").
- Conteúdo criado pela comunidade e reutilizável — diferente de apps de checklist pessoais (Todoist etc.), a lista é um artefato compartilhado.
- Evidências de captura (foto/data/local) tornam o progresso significativo, não só um checkbox.

**Antirrecursos (o que o app NÃO é):**
- Não é um app de tarefas/to-do: listas são finitas e colecionáveis, não rotinas.
- Não é marketplace: não há compra/venda de itens (evita complexidade regulatória no início).
- Não é rede social genérica: interação gira em torno de listas e progresso, sem feed aberto de posts.

## 6. Hipóteses a validar (riscos de produto)

| # | Hipótese | Como validar |
|---|---|---|
| H1 | Usuários aderem a listas criadas por desconhecidos | MVP: medir razão adesões/visualizações de lista |
| H2 | Criadores produzem listas de qualidade sem incentivo financeiro | Seed manual de ~50 listas + abrir criação e medir produção orgânica |
| H3 | A mecânica de captura sustenta retenção | Medir capturas/semana e retenção D7/D30 por coorte |
| H4 | Um app generalista compete com apps de nicho | Entrevistas com usuários de apps de nicho; medir migração em 2 verticais piloto |

A estratégia de lançamento ataca H4 escolhendo **duas verticais piloto** (sugestão: observação de natureza + colecionáveis pop) em vez de lançar "para tudo" de uma vez.
