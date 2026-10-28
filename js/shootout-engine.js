    // ---------- Pênaltis (regras oficiais) ----------
    // - sorteio decide quem cobra primeiro; cobranças alternadas
    // - 5 cobranças por time; decisão antecipada quando um time não pode mais ser alcançado
    // - empate: morte súbita (decide ao final de cada par de cobranças)
    // - cada jogador cobra uma vez antes de qualquer um repetir
    // - expulsos não cobram; se um time tem mais jogadores, reduz para igualar
    function getPenaltyTakers(match, side) {
      const t = match[side];
      const reds = match.cards ? match.cards[side].red : [];
      let list = getTeamPlayers(t)
        .filter(p => !reds.includes(p.name))
        .map(p => ({ name: p.name, skill: p.ovr + (p.pos === 'ATA' ? 3 : p.pos === 'MC' ? 1.5 : p.pos === 'DEF' ? -1 : -8) }))
        .sort((a, b) => b.skill - a.skill);
      if (list.length === 0) list = [{ name: 'Jogador 1', skill: t.ovr }];
      return list;
    }

    function getPenaltyKeeperSkill(match, side) {
      const t = match[side];
      const gk = getTeamPlayers(t).find(p => p.pos === 'GOL');
      if (gk) {
        const sentOff = match.cards && match.cards[side].red.includes(gk.name);
        return sentOff ? 60 : gk.ovr;
      }
      return t.ovr;
    }

    function shootoutDecided(goals, taken) {
      if (taken.home >= 5 && taken.away >= 5) {
        if (taken.home === taken.away && goals.home !== goals.away) return goals.home > goals.away ? 'home' : 'away';
        return null;
      }
      const remH = Math.max(0, 5 - taken.home);
      const remA = Math.max(0, 5 - taken.away);
      if (goals.home > goals.away + remA) return 'home';
      if (goals.away > goals.home + remH) return 'away';
      return null;
    }

    function simulateShootout(match) {
      const takers = { home: getPenaltyTakers(match, 'home'), away: getPenaltyTakers(match, 'away') };
      const n = Math.max(1, Math.min(takers.home.length, takers.away.length));
      takers.home = takers.home.slice(0, n);
      takers.away = takers.away.slice(0, n);
      const keeper = { home: getPenaltyKeeperSkill(match, 'home'), away: getPenaltyKeeperSkill(match, 'away') };

      const first = Math.random() < 0.5 ? 'home' : 'away';
      const goals = { home: 0, away: 0 };
      const taken = { home: 0, away: 0 };
      const kicks = [];
      let side = first, winner = null, guard = 0;

      while (!winner && guard++ < 80) {
        const def = side === 'home' ? 'away' : 'home';
        const taker = takers[side][taken[side] % takers[side].length];
        const pGoal = Math.min(0.9, Math.max(0.55, 0.77 + (taker.skill - keeper[def]) * 0.004));

        let outcome;
        if (Math.random() < pGoal) outcome = 'goal';
        else { const q = Math.random(); outcome = q < 0.55 ? 'save' : (q < 0.85 ? 'miss' : 'post'); }

        const rd = Math.random();
        let dir = rd < 0.4 ? 'L' : (rd < 0.6 ? 'C' : 'R');
        const height = Math.random() < 0.4 ? 'T' : 'B';
        let missType = null;
        if (outcome === 'post') dir = Math.random() < 0.5 ? 'L' : 'R';
        if (outcome === 'miss') {
          missType = Math.random() < 0.5 ? 'over' : 'wide';
          if (missType === 'wide') dir = Math.random() < 0.5 ? 'L' : 'R';
        }

        const others = ['L', 'C', 'R'].filter(d => d !== dir);
        let keeperDir;
        if (outcome === 'save') keeperDir = dir;
        else if (outcome === 'goal' && height === 'T' && Math.random() < 0.25) keeperDir = dir;
        else keeperDir = others[Math.floor(Math.random() * others.length)];

        taken[side]++;
        if (outcome === 'goal') goals[side]++;
        kicks.push({ side, kicker: taker.name, outcome, dir, height, keeperDir, missType });

        winner = shootoutDecided(goals, taken);
        side = def;
      }
      if (!winner) winner = Math.random() < 0.5 ? 'home' : 'away';
      return { first, kicks, homeGoals: goals.home, awayGoals: goals.away, winner };
    }

    // Disputa sem animação (jogos entre times controlados pelo computador)
    function resolveShootoutInstantly(m) {
      const s = simulateShootout(m);
      m.penalties = { home: s.homeGoals, away: s.awayGoals };
      m.penWinner = s.winner;
      m.events.unshift(`🚩 Pênaltis ${m.home.name} ${s.homeGoals} x ${s.awayGoals} ${m.away.name} — Vencedor: ${s.winner === 'home' ? m.home.name : m.away.name}`);
    }

    function shootoutStageLabel(n) {
      const map = { 16: '16-avos de final', 8: 'Oitavas de final', 4: 'Quartas de final', 2: 'Semifinal', 1: 'Final' };
      return map[n] || 'Mata-mata';
    }

    // Jogador real conectado controla o time? (times sem ninguém conectado agem como o computador)
    function isTeamControlled(teamObj) {
      if (!teamObj || !teamObj.isHuman) return false;
      const id = teamObj.id;
      return id === 0 || !!(connections[id - 1] && connections[id - 1].open);
    }

    // Host: executa (e transmite) as disputas de pênaltis dos jogos com jogadores reais, uma por vez.
    // Cada cobrança: o batedor escolhe 1 de 6 cantos e o goleiro escolhe 1 de 6 cantos (5s para cada).
    //  - 5% de chance de o chute ir para fora (qualquer canto)
    //  - goleiro no mesmo canto do chute = defesa garantida; canto diferente = gol garantido
    function runShootoutQueue(list, done) {
      if (shootoutTimer) { clearTimeout(shootoutTimer); shootoutTimer = null; }
      if (!list.length) { shootoutCtx = null; done(); return; }

      const m = list[0];
      const rest = list.slice(1);
      const takers = { home: getPenaltyTakers(m, 'home'), away: getPenaltyTakers(m, 'away') };
      const n = Math.max(1, Math.min(takers.home.length, takers.away.length));   // times com número diferente de jogadores igualam
      takers.home = takers.home.slice(0, n);
      takers.away = takers.away.slice(0, n);
      const first = Math.random() < 0.5 ? 'home' : 'away';

      shootoutCtx = {
        m, rest, done,
        eng: { takers, side: first, goals: { home: 0, away: 0 }, taken: { home: 0, away: 0 }, kicks: [], seq: 0, phase: null }
      };
      shootoutState = {
        active: true,
        id: 'so_' + Date.now() + '_' + Math.floor(Math.random() * 1e6),
        stageLabel: shootoutStageLabel(currentBrasfootState.currentMatches.length),
        regularScore: `${m.homeScore} x ${m.awayScore}`,
        home: { name: m.home.name, badge: m.home.badge },
        away: { name: m.away.name, badge: m.away.badge },
        first: first,
        kicks: [],
        pending: null,
        finished: false,
        winner: null,
        homeGoals: 0,
        awayGoals: 0
      };
      broadcastState();
      shootoutTimer = setTimeout(soBeginKick, SHOOTOUT_INTRO_MS);
    }

    function soBeginKick() {
      const ctx = shootoutCtx;
      if (!ctx || !shootoutState) return;
      const { m, eng } = ctx;
      const side = eng.side, def = side === 'home' ? 'away' : 'home';
      const taker = eng.takers[side][eng.taken[side] % eng.takers[side].length];
      const kickCtl = isTeamControlled(m[side]);
      const keepCtl = isTeamControlled(m[def]);

      eng.phase = { seq: ++eng.seq, side, def, taker, kickCtl, keepCtl, kickChoice: null, keepChoice: null };

      if (!kickCtl && !keepCtl) { soResolveKick(); return; }   // ninguém para escolher: sorteio automático

      shootoutState.pending = {
        seq: eng.phase.seq,
        side: side,
        kicker: taker.name,
        ms: SHOOTOUT_CHOICE_MS,
        kickTeamId: kickCtl ? m[side].id : null,
        keepTeamId: keepCtl ? m[def].id : null,
        kickDone: false,
        keepDone: false
      };
      broadcastState();
      shootoutTimer = setTimeout(soResolveKick, SHOOTOUT_CHOICE_MS + 400);   // tempo esgotado: escolha aleatória
    }

    // Host: recebe a escolha (canto) de um jogador real
    function soSubmitChoice(senderId, p) {
      const ctx = shootoutCtx;
      if (!ctx || !ctx.eng.phase || !shootoutState || !shootoutState.pending || !p) return;
      const ph = ctx.eng.phase, pend = shootoutState.pending;
      if (p.seq !== ph.seq) return;
      if (!['L', 'C', 'R'].includes(p.dir) || !['T', 'B'].includes(p.height)) return;
      const team = teams[senderId];
      if (!team) return;

      if (ph.kickCtl && pend.kickTeamId === team.id) {
        if (ph.kickChoice) return;
        ph.kickChoice = { dir: p.dir, height: p.height };
        pend.kickDone = true;
      } else if (ph.keepCtl && pend.keepTeamId === team.id) {
        if (ph.keepChoice) return;
        ph.keepChoice = { dir: p.dir, height: p.height };
        pend.keepDone = true;
      } else {
        return;
      }
      if ((!ph.kickCtl || ph.kickChoice) && (!ph.keepCtl || ph.keepChoice)) soResolveKick();
    }

    function soRandomCorner() {
      return { dir: ['L', 'C', 'R'][Math.floor(Math.random() * 3)], height: Math.random() < 0.5 ? 'T' : 'B' };
    }

    function soResolveKick() {
      const ctx = shootoutCtx;
      if (!ctx || !shootoutState) return;
      if (shootoutTimer) { clearTimeout(shootoutTimer); shootoutTimer = null; }
      const { eng } = ctx;
      const ph = eng.phase;
      if (!ph) return;
      eng.phase = null;

      // quem não escolheu (computador ou tempo esgotado) tem canto aleatório
      const kc = ph.kickChoice || soRandomCorner();
      const gc = ph.keepChoice || soRandomCorner();

      let outcome, missType = null;
      if (Math.random() < SHOOTOUT_MISS_CHANCE) {
        outcome = 'miss';                                   // 5%: foi para fora
        missType = (kc.dir === 'C' || Math.random() < 0.5) ? 'over' : 'wide';
      } else if (kc.dir === gc.dir && kc.height === gc.height) {
        outcome = 'save';                                   // goleiro pulou no canto certo: defende sempre
      } else {
        outcome = 'goal';                                   // canto diferente do goleiro: gol sempre
      }

      eng.taken[ph.side]++;
      if (outcome === 'goal') eng.goals[ph.side]++;
      eng.kicks.push({
        side: ph.side, kicker: ph.taker.name, outcome,
        dir: kc.dir, height: kc.height,
        keeperDir: gc.dir, keeperHeight: gc.height,
        missType
      });
      shootoutState.kicks = eng.kicks.slice();
      shootoutState.pending = null;

      let winner = shootoutDecided(eng.goals, eng.taken);
      if (!winner && eng.kicks.length >= 60) winner = eng.goals.home >= eng.goals.away ? 'home' : 'away';   // trava de segurança
      eng.side = ph.def;
      broadcastState();

      if (winner) shootoutTimer = setTimeout(() => soFinish(winner), SHOOTOUT_STEP_MS);
      else shootoutTimer = setTimeout(soBeginKick, SHOOTOUT_STEP_MS);
    }

    function soFinish(winner) {
      const ctx = shootoutCtx;
      if (!ctx || !shootoutState) return;
      const { m, rest, done, eng } = ctx;
      shootoutState.finished = true;
      shootoutState.winner = winner;
      shootoutState.homeGoals = eng.goals.home;
      shootoutState.awayGoals = eng.goals.away;
      broadcastState();
      shootoutTimer = setTimeout(() => {
        m.penalties = { home: eng.goals.home, away: eng.goals.away };
        m.penWinner = winner;
        m.events.unshift(`🚩 Pênaltis ${m.home.name} ${eng.goals.home} x ${eng.goals.away} ${m.away.name} — Vencedor: ${winner === 'home' ? m.home.name : m.away.name}`);
        shootoutState = null;
        shootoutCtx = null;
        shootoutTimer = null;
        broadcastState();
        runShootoutQueue(rest, done);
      }, SHOOTOUT_END_MS);
    }

    function stopShootout() {
      if (shootoutTimer) { clearTimeout(shootoutTimer); shootoutTimer = null; }
      shootoutState = null;
      shootoutScript = null;
      shootoutCtx = null;
      renderShootoutOverlay();
      stopDraw();
    }
