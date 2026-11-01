// Estadualzão 5x5 — campeonato de até 128 times: sorteio por potes, fase de grupos, mata-mata, temporadas e estatísticas
    /* =====================================================================
       ESTADUALZÃO 5x5 — CAMPEONATO (até 128 times: sorteio → grupos → mata-mata)
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

    function fsGroupName(k) { const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return k < 26 ? L[k] : L[k - 26] + '2'; }

    function fsBuildOpponents(count) {
      if (!crAllTeams.length) crBuildTeams();
      const need = count - 1;
      const league = {}; crAllTeams.forEach(t => { league[fsNormName(t.name)] = t.league; });
      const bots = BOT_TEAMS_32.map(n => ({ name: n, ovr: FS_BOT_OVR[n] || 78, lg: league[fsNormName(n)] || null }));
      const taken = new Set(bots.map(b => fsNormName(b.name)).concat(FS_ALIASES));
      const seen = new Set();
      const pool = crShuffle(crAllTeams.filter(t => {
        const k = fsNormName(t.name); if (taken.has(k) || seen.has(k)) return false; seen.add(k); return true;
      })).map(t => ({ name: t.name, ovr: t.ovr, lg: t.league }));
      let chosen;
      if (need >= bots.length) chosen = bots.concat(pool.slice(0, need - bots.length));
      else chosen = crShuffle(bots).slice(0, need);
      return crShuffle(chosen).map(t => { const k = fsKitFor(t.name); return { name: t.name, short: crShort(t.name), ovr: t.ovr, lg: t.lg, c1: k[0], c2: k[1], icon: null }; });
    }

    function fsEmptyStats() { const s = {}; FS_ROLE_ORDER.forEach(r => { s[r] = { j: 0, g: 0, a: 0, name: null }; }); return s; }

    /* novo campeonato (temporada). prev = campeonato anterior da mesma sala (mantém histórico de temporadas) */
    function fsNewTournament(cfg, myTeam, prev) {
      const opps = fsBuildOpponents(cfg.teams);
      const teams = [{ id: 0, name: myTeam.name, short: myTeam.short, c1: myTeam.c1, c2: myTeam.c2, icon: myTeam.icon, ovr: 78, lg: null, isUser: true }];
      opps.forEach((t, i) => {
        const o = { id: i + 1, name: t.name, short: t.short, c1: t.c1, c2: t.c2, icon: null, ovr: t.ovr, lg: t.lg, isUser: false };
        if (fsColorClose(o.c1, myTeam.c1)) { o.c1 = o.c2; o.c2 = '#f1f5f9'; if (fsColorClose(o.c1, myTeam.c1)) o.c1 = '#e2e8f0'; }
        teams.push(o);
      });
      // SORTEIO: 4 potes por força (OVR); cada grupo recebe um time de cada pote
      const nG = teams.length / 4;
      const sorted = crShuffle(teams.map(t => t.id)).sort((a, b) => teams[b].ovr - teams[a].ovr);
      const pots = [0, 1, 2, 3].map(j => crShuffle(sorted.slice(j * nG, (j + 1) * nG)));
      const groups = [], gm = [];
      for (let k = 0; k < nG; k++) {
        const ids = pots.map(p => p[k]);
        groups.push({ name: fsGroupName(k), ids });
        [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]].forEach((pairs, r) => pairs.forEach(([x, y]) =>
          gm.push({ g: k, r, a: ids[x], b: ids[y], ga: 0, gb: 0, played: false })));
      }
      return { size: teams.length, ko: teams.length / 2, teams, season: prev ? prev.season + 1 : 1, seasons: prev ? prev.seasons : [],
        stage: 'DRAW', groups, gm, gr: 0, qual: [], rounds: [], r: 0, over: false, champion: null, vice: null, thirdMatch: null,
        hist: [], eliminated: false, elimGroup: false, stats: fsEmptyStats(), archived: false };
    }

    /* ---------- fase de grupos ---------- */
    function fsGroupTable(T, gi) {
      const g = T.groups[gi];
      const rows = g.ids.map((id, i) => ({ id, i, pts: 0, pj: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0 }));
      const by = {}; rows.forEach(r => { by[r.id] = r; });
      T.gm.forEach(m => {
        if (m.g !== gi || !m.played) return;
        const A = by[m.a], B = by[m.b];
        A.pj++; B.pj++; A.gp += m.ga; A.gc += m.gb; B.gp += m.gb; B.gc += m.ga;
        if (m.ga > m.gb) { A.v++; A.pts += 3; B.d++; } else if (m.ga < m.gb) { B.v++; B.pts += 3; A.d++; } else { A.e++; B.e++; A.pts++; B.pts++; }
      });
      rows.forEach(r => { r.sg = r.gp - r.gc; });
      return rows.sort((x, y) => y.pts - x.pts || y.sg - x.sg || y.gp - x.gp || x.i - y.i);
    }

    function fsSimGroupMatch(T, m) { const A = T.teams[m.a], B = T.teams[m.b]; const [ga, gb] = fsQuickScore(A.ovr, B.ovr); m.ga = ga; m.gb = gb; m.played = true; }

    function fsUserMatch(T) {
      if (T.stage === 'GROUPS') return T.gm.find(m => m.r === T.gr && !m.played && (m.a === 0 || m.b === 0));
      return T.rounds[T.r].matches.find(m => m.a === 0 || m.b === 0);
    }
    function fsOpponent(T) { const m = fsUserMatch(T); return T.teams[m.a === 0 ? m.b : m.a]; }
    function fsUserGroup(T) { return T.groups.findIndex(g => g.ids.includes(0)); }
    function fsMatchLabel(T) {
      if (T.stage === 'GROUPS') return `Grupo ${T.groups[fsUserGroup(T)].name} • Rodada ${T.gr + 1} de 3`;
      return T.rounds[T.r].name;
    }

    function fsFinishGroups(T) {
      const tables = T.groups.map((g, gi) => fsGroupTable(T, gi));
      T.qual = []; tables.forEach(tb => { T.qual.push(tb[0].id, tb[1].id); });
      const matches = [];
      for (let p = 0; p < T.groups.length; p += 2) {
        const A = tables[p], B = tables[p + 1];
        matches.push({ a: A[0].id, b: B[1].id, ga: 0, gb: 0, pen: null, w: null, played: false });
        matches.push({ a: B[0].id, b: A[1].id, ga: 0, gb: 0, pen: null, w: null, played: false });
      }
      T.stage = 'KO';
      T.rounds = [{ name: fsRoundName(matches.length * 2), matches }]; T.r = 0;
      if (!T.qual.includes(0)) { T.eliminated = true; T.elimGroup = true; fsSimRest(T); }
    }

    /* ---------- mata-mata ---------- */
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
      if (next.length === 1) {   // final: os perdedores das semifinais disputam o 3º lugar (simulado)
        const l = R.matches.map(m => m.w === m.a ? m.b : m.a);
        T.thirdMatch = { a: l[0], b: l[1], ga: 0, gb: 0, pen: null, w: null, played: false };
        fsSimQuickMatch(T, T.thirdMatch);
      }
      T.rounds.push({ name: fsRoundName(next.length * 2), matches: next });
      T.r++;
    }

    function fsSimRest(T) {
      while (!T.over) {
        const R = T.rounds[T.r];
        R.matches.forEach(m => { if (!m.played) fsSimQuickMatch(T, m); });
        if (R.matches.length === 1) { T.over = true; T.champion = R.matches[0].w; T.vice = R.matches[0].w === R.matches[0].a ? R.matches[0].b : R.matches[0].a; }
        else fsNextRound(T);
      }
      fsArchiveSeason(T);
    }

    function fsUserResultText(T) {
      if (T.champion === 0) return 'Campeão 🏆';
      if (T.elimGroup) return 'Eliminado na fase de grupos';
      const h = T.hist[T.hist.length - 1];
      if (T.vice === 0) return 'Vice-campeão';
      if (T.thirdMatch && T.thirdMatch.w === 0) return '3º lugar';
      return h ? 'Eliminado: ' + h.round : '-';
    }

    function fsArchiveSeason(T) {
      if (T.archived) return;
      T.archived = true; T.stage = 'END';
      const third = T.thirdMatch ? T.thirdMatch.w : null;
      T.seasons.push({ n: T.season, champion: T.champion, vice: T.vice, third, result: fsUserResultText(T), stats: JSON.parse(JSON.stringify(T.stats)) });
    }

    // soma jogos/gols/assistências das temporadas anteriores + a atual
    function fsCareerStats(T) {
      const tot = fsEmptyStats();
      T.seasons.forEach(se => FS_ROLE_ORDER.forEach(r => { const e = se.stats[r]; tot[r].j += e.j; tot[r].g += e.g; tot[r].a += e.a; if (e.name) tot[r].name = e.name; }));
      if (!T.archived) FS_ROLE_ORDER.forEach(r => { const e = T.stats[r]; tot[r].j += e.j; tot[r].g += e.g; tot[r].a += e.a; if (e.name) tot[r].name = e.name; });
      return tot;
    }

    // sum = { g: {GK:n..}, a: {..}, n: {papel: apelido|null} } — resumo do jogo ao vivo do seu time
    function fsAddStats(T, sum) {
      FS_ROLE_ORDER.forEach(r => {
        const e = T.stats[r]; e.j++; e.g += (sum.g[r] || 0); e.a += (sum.a[r] || 0);
        if (sum.n && sum.n[r]) e.name = sum.n[r];
      });
    }

    // resultado da partida jogada ao vivo pelo seu time: (gols seus, gols do adversário, pênaltis [seus, deles] ou null, resumo de estatísticas)
    function fsFinishUserMatch(T, gu, go, pen, sum) {
      if (sum) fsAddStats(T, sum);
      const opp = fsOpponent(T), um = fsUserMatch(T), userIsA = um.a === 0;
      if (T.stage === 'GROUPS') {
        um.ga = userIsA ? gu : go; um.gb = userIsA ? go : gu; um.played = true;
        T.hist.push({ round: fsMatchLabel(T), opp: opp.name, oppId: opp.id, gu, go, pen: null, won: gu > go, draw: gu === go });
        T.gm.forEach(m => { if (m.r === T.gr && !m.played) fsSimGroupMatch(T, m); });
        if (T.gr < 2) T.gr++; else fsFinishGroups(T);
        return;
      }
      const R = T.rounds[T.r];
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
      if (R.matches.length === 1) { T.over = true; T.champion = R.matches[0].w; T.vice = R.matches[0].w === R.matches[0].a ? R.matches[0].b : R.matches[0].a; fsArchiveSeason(T); return; }
      fsNextRound(T);
      if (!userWon) { T.eliminated = true; fsSimRest(T); }
    }
