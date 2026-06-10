# MiniCraft 🟫

Uma versão básica do Minecraft que roda direto no navegador, feita com [Three.js](https://threejs.org/). Tudo em um único arquivo `index.html` — sem build, sem dependências locais.

## Como jogar

Abra o `index.html` no navegador (precisa de internet para carregar o Three.js via CDN). Se preferir servir localmente:

```bash
npx serve .
# ou
python3 -m http.server
```

e acesse `http://localhost:8000` (ou a porta indicada).

## Controles

| Tecla / Mouse | Ação |
|---|---|
| **WASD** | Mover |
| **Mouse** | Olhar |
| **Espaço** | Pular |
| **F** | Alternar voo (Espaço sobe, Shift desce) |
| **Clique esquerdo** | Quebrar bloco / atacar inimigo |
| **Clique direito** | Colocar bloco |
| **1–9** ou **roda do mouse** | Escolher bloco na hotbar |
| **Esc** | Pausar / soltar o mouse |

## Recursos

- **Mundo de voxels procedural** — terreno gerado com ruído (colinas, areia em terreno baixo) e árvores espalhadas pelo mapa.
- **Modo criativo** — blocos infinitos e voo. 9 tipos de bloco: grama, terra, pedra, pedregulho, tronco, tábuas, folhas, areia e vidro.
- **Texturas procedurais** — todas as texturas em pixel art são geradas em tempo de execução via canvas.
- **Inimigos** — zumbis aparecem perto do jogador, perseguem quando se aproximam, pulam obstáculos e atacam por contato.
- **Combate** — ataque corpo a corpo com clique esquerdo (3 acertos derrotam um zumbi), knockback, barra de vida sobre os inimigos, corações de vida, tela de morte e contador de abates.
- **Física** — gravidade, colisão AABB com o terreno tanto para o jogador quanto para os zumbis.
