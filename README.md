# Xadrez 3D Multiplayer (Socket.IO)

Jogo de xadrez em 3D (Three.js) jogável em rede local via Socket.IO.

## Como rodar

```bash
npm install
npm start
```

O terminal vai mostrar dois endereços:

- `http://localhost:3000` — para acessar na própria máquina
- `http://<seu-ip-na-rede>:3000` — para outros dispositivos na mesma rede local acessarem

## Como jogar

- O primeiro jogador a entrar recebe as **Brancas**, o segundo recebe as **Pretas**.
- Demais conexões entram como **espectadores** (podem assistir, mas não jogar).
- Clique em uma peça para ver os movimentos legais destacados e clique na casa de destino para mover.
- Arraste o mouse para girar a câmera e use o scroll para dar zoom.
- Use "Girar Tabuleiro" para ver o jogo do outro lado.
- "Novo Jogo" reinicia a partida para todos os conectados.

A validação das jogadas (xeque, xeque-mate, empate, promoção, etc.) é feita pelo servidor usando `chess.js`, garantindo que o estado fique sincronizado entre todos os clientes.
