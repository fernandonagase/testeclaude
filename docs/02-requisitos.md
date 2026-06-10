# 02 — Requisitos

## 1. Histórias de usuário

Agrupadas por épico. Critérios de aceite nas histórias do MVP.

### Épico A — Contas e perfis

- **A1.** Como visitante, quero criar conta com e-mail/senha ou login social, para guardar meu progresso.
- **A2.** Como usuário, quero um perfil público com minhas listas criadas, adesões e completudes, para mostrar minhas conquistas.
- **A3.** Como usuário, quero controlar a visibilidade do meu perfil e progresso (público/privado), para proteger minha privacidade.

### Épico B — Criação de listas (Dex)

- **B1.** Como criador, quero criar uma Dex com título, descrição, categoria e capa, para publicá-la à comunidade.
  - *Aceite:* Dex criada começa como rascunho; só aparece na busca após publicação; título e ≥1 item obrigatórios.
- **B2.** Como criador, quero adicionar itens com nome, descrição, imagem e atributos extras (ex.: raridade, região), para que a lista seja rica.
  - *Aceite:* item tem nome obrigatório; campos extras são definidos por Dex (esquema flexível); reordenação possível.
- **B3.** Como criador, quero importar itens em lote (CSV/colar texto), para não cadastrar 200 itens um a um.
- **B4.** Como criador, quero editar uma Dex publicada gerando nova versão, para corrigir/expandir sem quebrar o progresso de quem já aderiu.
  - *Aceite:* itens removidos não apagam capturas existentes (ficam marcados como "legado"); aderentes são notificados de novas versões.
- **B5.** Como criador, quero aceitar/recusar sugestões de itens enviadas por aderentes, para curar a lista colaborativamente. *(pós-MVP)*

### Épico C — Adesão e rastreamento (Tracker)

- **C1.** Como usuário, quero aderir a uma Dex, para começar a rastrear meu progresso nela.
  - *Aceite:* adesão cria tracker zerado; Dex passa a aparecer em "Minhas Dexes"; contador de aderentes da Dex incrementa.
- **C2.** Como usuário, quero marcar um item como capturado em até 2 toques, para que o registro seja sem atrito.
  - *Aceite:* toque simples marca com data atual; desfazer disponível; funciona offline com sincronização posterior.
- **C3.** Como usuário, quero anexar evidências à captura (foto, nota, data, local), para que meu registro tenha valor de memória.
- **C4.** Como usuário, quero ver meu progresso (n/total, % e barra) por Dex e no agregado, para me motivar.
- **C5.** Como usuário, quero abandonar uma Dex mantendo ou apagando meu histórico, para controlar meus dados.

### Épico D — Descoberta e social

- **D1.** Como usuário, quero buscar e filtrar Dexes por texto, categoria e popularidade, para descobrir listas do meu interesse.
- **D2.** Como usuário, quero compartilhar uma Dex por link/QR, para convidar amigos e família.
- **D3.** Como usuário, quero ver o ranking de aderentes de uma Dex (por completude), para comparar progresso. *(privacidade: só perfis públicos)*
- **D4.** Como usuário, quero seguir amigos e ver suas capturas recentes, para acompanhar e me inspirar. *(pós-MVP)*
- **D5.** Como usuário, quero ganhar badges por marcos (primeira captura, 50%, 100%, criar Dex popular), para gamificar a jornada. *(pós-MVP)*

### Épico E — Confiança e segurança

- **E1.** Como usuário, quero denunciar Dexes/itens/imagens impróprios, para manter a plataforma saudável.
- **E2.** Como operador, quero fila de moderação e bloqueio de conteúdo denunciado, para responder a abusos.
- **E3.** Como usuário, quero exportar e excluir meus dados, para atender meu direito (LGPD).

## 2. Escopo do MVP — MoSCoW

| Prioridade | Itens |
|---|---|
| **Must** | A1, A2, B1, B2, B4 (versão simplificada: edição aditiva), C1, C2, C3 (foto+data+nota), C4, D1, D2, E1, E3 |
| **Should** | A3, B3, C5, D3, E2 (ferramenta interna mínima) |
| **Could** | D5 (badges básicos), modo offline completo (C2 offline-first) |
| **Won't (agora)** | B5 (curadoria colaborativa), D4 (grafo social), monetização, apps nativos completos (começar com um único codebase multiplataforma), itens com geolocalização verificada |

**Definição de pronto do MVP:** um usuário consegue descobrir uma Dex, aderir, capturar itens com foto e ver seu progresso; um criador consegue publicar e atualizar uma Dex — tudo em produção, com analytics dos eventos-chave instrumentados.

## 3. Requisitos não-funcionais

| Categoria | Requisito |
|---|---|
| **Plataformas** | Mobile-first (iOS + Android via codebase único) + web responsivo para criação de listas |
| **Desempenho** | Marcar captura: feedback < 100 ms (otimista, local-first); abertura de Dex de 500 itens: < 1 s |
| **Offline** | Capturas funcionam sem rede e sincronizam depois (essencial para viagens/natureza — Persona 3) |
| **Escala inicial** | Dimensionar para 10k usuários ativos/mês e Dexes de até 1.000 itens; sem otimização prematura além disso |
| **Privacidade/LGPD** | Consentimento explícito; perfis privados por padrão para menores; exportação e exclusão de dados; fotos com EXIF de localização removido por padrão ao publicar |
| **Segurança** | Autenticação com tokens de curta duração + refresh; autorização por recurso (só o criador edita a Dex); rate limiting em escrita |
| **Moderação** | Todo conteúdo público (Dex, item, foto) é denunciável; imagens passam por verificação automática básica antes de ficarem públicas |
| **Acessibilidade** | Conformidade WCAG 2.1 AA nos fluxos principais; não depender só de cor para estados de captura |
| **Internacionalização** | Estrutura i18n desde o início; lançamento em pt-BR |
| **Observabilidade** | Logs estruturados, métricas de produto (eventos: adesão, captura, publicação) e de sistema desde o dia 1 |

## 4. Fora de escopo permanente (por ora)

- Troca/venda de itens entre usuários.
- Verificação "anti-trapaça" de capturas (a evidência é social, não criptográfica).
- Mensageria privada entre usuários (reduz superfície de moderação).
