// Estadualzão 5x5 — torneio de até 128 times (chaveamento e simulação)
    /* =====================================================================
       ESTADUALZÃO 5x5 — TORNEIO (128 times, mata-mata)
       ===================================================================== */
    const FS_BOT_OVR = {
      "Real Madrid": 89, "Manchester City": 89, "Bayern de Munique": 87, "PSG": 86, "Barcelona": 87, "Liverpool": 87,
      "Arsenal": 86, "Inter de Milão": 86, "Juventus": 84, "Bayer Leverkusen": 85, "Borussia Dortmund": 83,
      "Atlético de Madrid": 85, "Chelsea": 83, "Milan": 82, "Manchester United": 82, "Tottenham": 82, "Napoli": 82,
      "Benfica": 81, "Porto": 80, "Sporting": 80, "Ajax": 79, "PSV": 79, "Roma": 80, "Corinthians": 77, "Flamengo": 79,
      "Palmeiras": 79, "River Plate": 78, "Boca Juniors": 78, "São Paulo": 77, "Santos": 74, "Grêmio": 77, "Internacional": 76
    };
    const FS_ALIASES = ['internazionale', 'parissaintgermain', 'acmilan', 'tottenhamhotspur', 'psveindhoven', 'sportingcp', 'fcporto', 'sllbenfica', 'sportingclubedeportugal'];

    function fsNormName(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
    function fsHex(h, s, l) {
      const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(255 * c).toString(16).padStart(2, '0'); };
      return '#' + f(0) + f(8) + f(4);
    }
    function fsKitFor(name) { const h = crHash(name) % 360; return [fsHex(h, 0.62, 0.42), fsHex((h + 45) % 360, 0.68, 0.3)]; }
    function fsRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    function fsColorClose(a, b) { const x = fsRgb(a), y = fsRgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 110; }

    function fsRoundName(n) {
      if (n === 2) return 'Final';
      if (n === 4) return 'Semifinal';
      if (n === 8) return 'Quartas de Final';
      if (n === 16) return 'Oitavas de Final';
      return (n / 2) + '-avos de Final';
    }

    function fsBuildOpponents(count) {
      if (!crAllTeams.length) crBuildTeams();
      const need = count - 1;
      const bots = BOT_TEAMS_32.map(n => ({ name: n, ovr: FS_BOT_OVR[n] || 78 }));
      const taken = new Set(bots.map(b => fsNormName(b.name)).concat(FS_ALIASES));
      const seen = new Set();
      const pool = crShuffle(crAllTeams.filter(t => {
        const k = fsNormName(t.name); if (taken.has(k) || seen.has(k)) return false; seen.add(k); return true;
      })).map(t => ({ name: t.name, ovr: t.ovr }));
      let chosen;
      if (need >= bots.length) chosen = bots.concat(pool.slice(0, need - bots.length));
      else chosen = crShuffle(bots).slice(0, need);
      return crShuffle(chosen).map(t => { const k = fsKitFor(t.name); return { name: t.name, short: crShort(t.name), ovr: t.ovr, c1: k[0], c2: k[1], icon: null }; });
    }

    function fsNewTournament(cfg, myTeam) {
      const opps = fsBuildOpponents(cfg.teams);
      const teams = [{ id: 0, name: myTeam.name, short: myTeam.short, c1: myTeam.c1, c2: myTeam.c2, icon: myTeam.icon, ovr: 78, isUser: true }];
      opps.forEach((t, i) => {
        const o = { id: i + 1, name: t.name, short: t.short, c1: t.c1, c2: t.c2, icon: null, ovr: t.ovr, isUser: false };
        if (fsColorClose(o.c1, myTeam.c1)) { o.c1 = o.c2; o.c2 = '#f1f5f9'; if (fsColorClose(o.c1, myTeam.c1)) o.c1 = '#e2e8f0'; }
        teams.push(o);
      });
      const order = crShuffle(teams.map(t => t.id));
      const matches = [];
      for (let i = 0; i < order.length; i += 2) matches.push({ a: order[i], b: order[i + 1], ga: 0, gb: 0, pen: null, w: null, played: false });
      return { size: teams.length, teams, rounds: [{ name: fsRoundName(teams.length), matches }], r: 0, over: false, champion: null, hist: [], eliminated: false };
    }

    function fsUserMatch(T) { return T.rounds[T.r].matches.find(m => m.a === 0 || m.b === 0); }
    function fsOpponent(T) { const m = fsUserMatch(T); return T.teams[m.a === 0 ? m.b : m.a]; }

    function fsSimQuickMatch(T, m) {
      const A = T.teams[m.a], B = T.teams[m.b];
      const [ga, gb] = fsQuickScore(A.ovr, B.ovr);
      m.ga = ga; m.gb = gb; m.played = true;
      if (ga === gb) { m.pen = fsPenalties(0.75 + (A.ovr - B.ovr) * 0.003, 0.75 - (A.ovr - B.ovr) * 0.003); m.w = m.pen[0] > m.pen[1] ? m.a : m.b; }
      else m.w = ga > gb ? m.a : m.b;
    }

    function fsNextRound(T) {
      const R = T.rounds[T.r], winners = R.matches.map(m => m.w);
      const next = [];
      for (let i = 0; i < winners.length; i += 2) next.push({ a: winners[i], b: winners[i + 1], ga: 0, gb: 0, pen: null, w: null, played: false });
      T.rounds.push({ name: fsRoundName(next.length * 2), matches: next });
      T.r++;
    }

    // resultado da partida jogada ao vivo pelo seu time: (gols seus, gols do adversário, pênaltis [seus, deles] ou null)
    function fsFinishUserMatch(T, gu, go, pen) {
      const R = T.rounds[T.r], um = fsUserMatch(T), opp = fsOpponent(T);
      const userIsA = um.a === 0;
      um.ga = userIsA ? gu : go; um.gb = userIsA ? go : gu; um.played = true;
      let userWon = gu > go;
      if (gu === go) {
        const p = pen || fsPenalties(0.78, 0.72);
        um.pen = userIsA ? p : [p[1], p[0]];
        userWon = p[0] > p[1]; pen = p;
      }
      um.w = userWon ? 0 : opp.id;
      T.hist.push({ round: R.name, opp: opp.name, oppId: opp.id, gu, go, pen: pen || null, won: userWon });
      R.matches.forEach(m => { if (!m.played) fsSimQuickMatch(T, m); });
      if (R.matches.length === 1) { T.over = true; T.champion = R.matches[0].w; return; }
      fsNextRound(T);
      if (!userWon) {
        T.eliminated = true;
        while (!T.over) {
          T.rounds[T.r].matches.forEach(m => fsSimQuickMatch(T, m));
          if (T.rounds[T.r].matches.length === 1) { T.over = true; T.champion = T.rounds[T.r].matches[0].w; }
          else fsNextRound(T);
        }
      }
    }
