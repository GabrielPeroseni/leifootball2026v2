# FutManager 2026

Jogo de futebol com vários modos, feito em HTML + CSS + JavaScript puro (sem build). Funciona direto no GitHub Pages.

## Modos
- **Leilão** — leilão de jogadores online com amigos (PeerJS), mata-mata e troca de reforços na 2ª temporada.
- **Modo Carreira** — treinador personalizado, clube real ou criado, liga + mata-mata, várias temporadas, salva no navegador.
- **Estadualzão 5x5 Co-op** — cada amigo controla um jogador do time (goleiro, fixo, alas e pivô) em partidas em tempo real contra até 128 times.

## Estrutura
```
index.html                      telas (HTML) e ordem de carregamento
css/base.css                    estilos base e do Leilão
css/carreira.css                estilos do Modo Carreira (prefixo cr-)
css/estadualzao.css             estilos do Estadualzão (prefixo fs-)
js/leilao.js                    Leilão: jogadores, times, rede, torneio, menu principal
js/carreira-dados.js            base de clubes por liga (CR_DB)
js/carreira.js                  Modo Carreira
js/estadualzao-motor.js         motor da partida: física, bola e IA (roda no host)
js/estadualzao-torneio.js       torneio de até 128 times
js/estadualzao-interface.js     sala, rede, telas, controles e desenho do campo
```

## Ordem dos scripts (importante)
Os arquivos JS compartilham as mesmas variáveis globais e **precisam carregar nesta ordem** (já está assim no `index.html`):
`leilao` → `carreira-dados` → `carreira` → `estadualzao-motor` → `estadualzao-torneio` → `estadualzao-interface`.

## Atualizando o site
Depois de alterar um arquivo, aumente o número `?v=` no `index.html` (ex.: `js/leilao.js?v=2`) para o navegador não usar a versão antiga em cache. Se algo parecer desatualizado, recarregue com Ctrl+F5.

## Controles do Estadualzão
- Mover: `W A S D` ou setas
- Chutar: `Espaço` ou `J` (segure para mais força)
- Passar: `K` ou `E`
- Correr: `Shift` ou `L`
- Celular: joystick na esquerda e botões de chute, passe e correr na direita.
