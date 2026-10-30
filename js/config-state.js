    // ===== CONFIGURAÇÕES DO JOGO =====
    const MAX_PASSES = 4;          // recusas por time no leilão
    const SWAPS_PER_SEASON = 4;    // trocas por time em cada temporada de reforços (2ª, 3ª e 4ª)
    const MAX_SEASONS = 4;         // total de temporadas (sempre o mesmo campeonato: Estadualzão)

    // Elenco de 11: 1 GOL + 4 DEF + 3 MC + 3 ATA
    const DEF_SLOTS = ['DEF1', 'DEF2', 'DEF3', 'DEF4'];
    const MC_SLOTS = ['MC1', 'MC2', 'MC3'];
    const ATA_SLOTS = ['ATA1', 'ATA2', 'ATA3'];
    const SLOT_LABELS = {
      GOL: 'GOL',
      DEF1: 'DEF 1', DEF2: 'DEF 2', DEF3: 'DEF 3', DEF4: 'DEF 4',
      MC1: 'MC 1', MC2: 'MC 2', MC3: 'MC 3',
      ATA1: 'ATA 1', ATA2: 'ATA 2', ATA3: 'ATA 3'
    };

    function emptyLineup() {
      const l = { GOL: null };
      DEF_SLOTS.forEach(k => l[k] = null);
      MC_SLOTS.forEach(k => l[k] = null);
      ATA_SLOTS.forEach(k => l[k] = null);
      return l;
    }

    function getSlotsForPos(pos) {
      if (pos === 'GOL') return ['GOL'];
      if (pos === 'DEF') return DEF_SLOTS;
      if (pos === 'MC') return MC_SLOTS;
      return ATA_SLOTS;
    }

    let playerCount = 5;

    let defaultTeamsMaster = [
      { id: 0, name: "Time 1", tokens: 100, passesLeft: MAX_PASSES, season2SwapsLeft: SWAPS_PER_SEASON, lineup: emptyLineup(), badge: { c1: "#3b82f6", c2: "#0f172a", shape: "shield", pattern: "solid", animal: "🦅" } },
      { id: 1, name: "Time 2", tokens: 100, passesLeft: MAX_PASSES, season2SwapsLeft: SWAPS_PER_SEASON, lineup: emptyLineup(), badge: { c1: "#10b981", c2: "#ffffff", shape: "circle", pattern: "solid", animal: "🟢" } },
      { id: 2, name: "Time 3", tokens: 100, passesLeft: MAX_PASSES, season2SwapsLeft: SWAPS_PER_SEASON, lineup: emptyLineup(), badge: { c1: "#f59e0b", c2: "#000000", shape: "diamond", pattern: "half", animal: "🦁" } },
      { id: 3, name: "Time 4", tokens: 100, passesLeft: MAX_PASSES, season2SwapsLeft: SWAPS_PER_SEASON, lineup: emptyLineup(), badge: { c1: "#8b5cf6", c2: "#ffffff", shape: "shield", pattern: "stripes", animal: "🦅" } },
      { id: 4, name: "Time 5", tokens: 100, passesLeft: MAX_PASSES, season2SwapsLeft: SWAPS_PER_SEASON, lineup: emptyLineup(), badge: { c1: "#06b6d4", c2: "#ffffff", shape: "circle", pattern: "stars", animal: "🐉" } },
      { id: 5, name: "Time 6", tokens: 100, passesLeft: MAX_PASSES, season2SwapsLeft: SWAPS_PER_SEASON, lineup: emptyLineup(), badge: { c1: "#ec4899", c2: "#ffffff", shape: "shield", pattern: "solid", animal: "🐺" } },
      { id: 6, name: "Time 7", tokens: 100, passesLeft: MAX_PASSES, season2SwapsLeft: SWAPS_PER_SEASON, lineup: emptyLineup(), badge: { c1: "#e11d48", c2: "#000000", shape: "diamond", pattern: "stripes", animal: "🐅" } },
      { id: 7, name: "Time 8", tokens: 100, passesLeft: MAX_PASSES, season2SwapsLeft: SWAPS_PER_SEASON, lineup: emptyLineup(), badge: { c1: "#84cc16", c2: "#0f172a", shape: "circle", pattern: "half", animal: "🦁" } }
    ];

    let teams = JSON.parse(JSON.stringify(defaultTeamsMaster.slice(0, playerCount)));

    let currentDeck = [];
    let rejectedQueue = [];
    let usedPlayerNames = new Set(); 
    let currentPlayerCard = null;
    let turnOrder = [];
    let activeTurnIndex = 0;
    let highestBid = -1;
    let highestBidderId = null;
    let activeBidders = [];
    let playersActedThisCard = new Set();
    let isAuctionStarted = false;
    let isDiceRolled = false;
    let isTransitioning = false;
    let currentSeason = 1;
    let season2DraftCount = 0;
    let tournamentStage = 'ESTADUALZAO_PHASE1';
    let tournamentData = { groups: {}, round: 1, maxRounds: 7, bracket: {} };
    let currentBrasfootState = { active: false, currentMatchMinute: 0, currentMatches: [], history: [] };
    let topScorers = {}; 
    let teamStats = {}; // estatísticas acumuladas (todas as temporadas) dos times dos jogadores: { id: { v, e, d, gp, gc } }
    let playoffResults = { champion: null, runnerUp: null, semifinalists: [] };

    let peer = null, connections = [], hostConn = null, isHost = true, myPlayerId = 0;

    let pendingSwap = null;      
    let swapModalKey = null;     
    let matchTimer = null;       
    const MATCH_DURATION_MS = 60000;        // mata-mata: 1 minuto por partida
    const GROUP_MATCH_DURATION_MS = 30000;  // fases de grupos (de 8 e de 4 times): 30 segundos por partida
    const HUMAN_TEAM_BONUS = 3;   // leve vantagem para os times dos jogadores (elencos montados no leilão)
    const BIG_TEAM_BONUS = 3;     // vantagem dos clubes grandes sobre os pequenos
    const SCORER_WEIGHTS = { ATA: 10, MC: 4, DEF: 0.25 }; // chance relativa de cada posição fazer gol (zagueiro bem raro) 

    /* ===== TÁTICAS, CARTÕES E PÊNALTIS (valem apenas para times de jogadores reais) ===== */
    const TACTICS = {
      DEF: { label: 'Defensivo',   icon: '🛡️', atk: 0.70, opp: 0.70, poss: -6, desc: 'Menos chances de fazer gol, mas também de tomar gol.' },
      BAL: { label: 'Equilibrado', icon: '⚖️', atk: 1.00, opp: 1.00, poss: 0,  desc: 'Mantém as chances normais de fazer e de tomar gol.' },
      OFF: { label: 'Ofensivo',    icon: '⚔️', atk: 1.35, opp: 1.30, poss: 6,  desc: 'Mais chances de fazer gol, mas também de tomar gol.' }
    };
    const YELLOW_PER_MIN = 1 / 90;                        // média de 1 amarelo por jogo, por equipe
    const RED_PER_MIN = 1 - Math.pow(0.95, 1 / 90);       // 1 vermelho a cada 20 jogos (5% por jogo), por equipe
    const RED_ATK_MULT = 0.78;                            // cada expulso reduz as chances de ataque do próprio time...
    const RED_OPP_MULT = 1.28;                            // ...e aumenta as chances de ataque do adversário
    const MAX_RED_STACK = 3;
    const YELLOW_POS_WEIGHT = { GOL: 0.2, DEF: 1.3, MC: 1.2, ATA: 0.8 };
    const SHOOTOUT_INTRO_MS = 3800;   // sorteio da moeda antes da 1ª cobrança
    const SHOOTOUT_STEP_MS = 3000;    // tempo da animação de cada cobrança
    const SHOOTOUT_CHOICE_MS = 5000;  // tempo para escolher o canto (chutar ou defender)
    const SHOOTOUT_MISS_CHANCE = 0.05; // chance de cada chute ir para fora
    const DRAW_INTRO_MS = 2000;       // pausa antes da 1ª bola do sorteio
    const DRAW_STEP_MS = 5000;        // 5 segundos por time sorteado
    const DRAW_END_MS = 6000;         // tempo mostrando a chave completa
    const SEASON_PRIZES = {           // prêmios da temporada (só para times de jogadores reais)
      1: { tokens: 50, swaps: 1, passes: 2 },   // campeão
      2: { tokens: 25, swaps: 1, passes: 0 },   // vice
      3: { tokens: 10, swaps: 0, passes: 0 }    // 3º lugar (semifinalistas)
    };
    const SHOOTOUT_END_MS = 5500;     // tempo mostrando o vencedor
    let shootoutState = null;         // estado visível para todos (sincronizado)
    let shootoutScript = null;        // roteiro completo (apenas no host)
    let shootoutTimer = null;
    let shootoutCtx = null;           // host: contexto da disputa em andamento (motor interativo)
    const shootoutLocal = { id: null, handled: 0, shown: 0, timers: [], pendingSeq: null, role: null, chosen: false, deadline: 0, countInt: null };
    let drawState = null;             // estado do sorteio das oitavas (sincronizado)
    let drawTimer = null;
    const drawLocal = { id: null, handled: 0, placed: 0, timers: [] };

    /* ===== CALENDÁRIO DA TEMPORADA (Estadual, Nacionalzão, Continentais e Estadualzão) ===== */
    const NACIONAL_MATCH_DURATION_MS = 30000;   // Série A/B: duração de cada rodada (38 rodadas por temporada)
    const COMP_PRIZES = {                        // prêmios por campeonato (só times de jogadores reais; se acumulam)
      ESTADUAL: { 1: { tokens: 30, swaps: 0, passes: 1 }, 2: { tokens: 15, swaps: 0, passes: 0 }, 3: { tokens: 5, swaps: 0, passes: 0 } },
      SERIE_A:  { 1: { tokens: 50, swaps: 1, passes: 1 }, 2: { tokens: 30, swaps: 0, passes: 0 }, 3: { tokens: 20, swaps: 0, passes: 0 }, 4: { tokens: 10, swaps: 0, passes: 0 } },
      SERIE_B:  { 1: { tokens: 20, swaps: 0, passes: 0 }, 2: { tokens: 10, swaps: 0, passes: 0 }, 3: { tokens: 5, swaps: 0, passes: 0 } },
      CONT_A:   { 1: { tokens: 50, swaps: 1, passes: 2 }, 2: { tokens: 30, swaps: 1, passes: 0 }, 3: { tokens: 15, swaps: 0, passes: 0 } },
      CONT_B:   { 1: { tokens: 30, swaps: 1, passes: 1 }, 2: { tokens: 15, swaps: 0, passes: 0 }, 3: { tokens: 5, swaps: 0, passes: 0 } }
    };
    let teamTitles = {};      // títulos acumulados dos times dos jogadores: { id: { total, list: [] } } (sincronizado)
    let seasonPrizes = [];    // prêmios da temporada, de todos os campeonatos (sincronizado)
    let seasonLog = [];       // campeões de cada campeonato da temporada (sincronizado)
    let compSummary = null;   // resumo exibido entre os campeonatos (sincronizado)
    let seasonCalendar = null;  // host: ordem dos campeonatos da temporada
    let worldState = null;      // host: clubes do mundo, forças e divisões (Série A/B)
    let compCtl = null;         // host: controle do campeonato em andamento
