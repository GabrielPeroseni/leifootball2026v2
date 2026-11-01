# FutManager 2026

Jogo de futebol com vários modos, feito em HTML + CSS + JavaScript puro (sem build). Funciona direto no GitHub Pages.

## Modos
- **Leilão** — leilão de jogadores online com amigos (PeerJS), mata-mata e troca de reforços na 2ª temporada.
- **Modo Carreira** — *(desativado por enquanto: aparece como "Em Breve" no menu)*. O código continua em `js/carreira*.js` e é reaproveitado pelo Estadualzão (base de clubes e escudos).
- **Estadualzão 5x5 Co-op** — cada amigo controla um jogador do time (goleiro, fixo, alas e pivô) em partidas em tempo real. Campeonato de 8 a 128 times: sorteio por potes, fase de grupos (3 jogos, passam 2 por grupo), mata-mata, temporadas e estatísticas (jogos, gols e assistências por jogador). Todos os times aparecem com escudo.

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
js/estadualzao-torneio.js       campeonato: sorteio, grupos, mata-mata, temporadas e estatísticas
js/estadualzao-escudos.js       escudos dos times (links do Leilão + busca automática + escudo desenhado)
js/estadualzao-interface.js     sala, rede, telas, controles e desenho do campo
```

> Para reativar o Modo Carreira: em `index.html`, tire a classe `disabled` do card dele e a etiqueta "Em Breve"; em `js/leilao.js`, na função `selectGameMode`, volte o ramo `mode === 'carreira'` chamando `crOpenSetup()`.

## Ordem dos scripts (importante)
Os arquivos JS compartilham as mesmas variáveis globais e **precisam carregar nesta ordem** (já está assim no `index.html`):
`leilao` → `carreira-dados` → `carreira` → `estadualzao-motor` → `estadualzao-torneio` → `estadualzao-escudos` → `estadualzao-interface`.

## Atualizando o site
Depois de alterar um arquivo, aumente o número `?v=` no `index.html` (ex.: `js/leilao.js?v=2`) para o navegador não usar a versão antiga em cache. Se algo parecer desatualizado, recarregue com Ctrl+F5.

## Controles do Estadualzão
- Mover: `W A S D` ou setas
- Chutar: `Espaço` ou `J` (segure para mais força)
- Passar: `K` ou `E`
- Correr: `Shift` ou `L`
- Celular: joystick na esquerda e botões de chute, passe e correr na direita.


## Escudos (Estadualzão)
Cada time usa, nesta ordem: 1) seus links em `FS_CRESTS_EXTRA` (topo de `js/estadualzao-escudos.js`), 2) os links do Leilão (`TEAM_LOGOS`), 3) busca automática na internet (TheSportsDB), guardada no navegador, 4) escudo desenhado com as cores e a sigla do time. A busca automática roda em segundo plano (~1 time a cada 2 s) e os escudos vão aparecendo sozinhos; nas próximas vezes já estão salvos.
Para trocar um escudo: `'Nome do Time': 'https://link-da-imagem.png'` em `FS_CRESTS_EXTRA`.

## Estatísticas
O motor (`estadualzao-motor.js`) registra quem fez o gol e quem deu o passe (assistência = passe de companheiro até 6 s antes do gol). A cada jogo, os 5 postos do seu time ganham +1 jogo e os gols/assistências; no fim da temporada aparece a tabela por jogador, com o acumulado da carreira nas temporadas seguintes.
