    // ===== UTILITÁRIOS DE CALENDÁRIO E SIMULAÇÃO SILENCIOSA =====
    function rndInt(n) { return Math.floor(Math.random() * n); }

    function shuffleArr(a) {
      const r = a.slice();
      for (let i = r.length - 1; i > 0; i--) {
        const j = rndInt(i + 1);
        [r[i], r[j]] = [r[j], r[i]];
      }
      return r;
    }

    function plainTeam(t) {
      return { id: t.id, name: t.name, badge: t.badge, isHuman: !!t.isHuman, ovr: t.ovr };
    }

    function newStatsEntry(t) {
      return { ...plainTeam(t), pts: 0, pj: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0 };
    }

    // Rodadas de pontos corridos (método do círculo): cada time enfrenta todos os outros uma vez
    function circleRounds(ids) {
      const arr = ids.slice();
      const n = arr.length;
      const rounds = [];
      for (let r = 0; r < n - 1; r++) {
        const matches = [];
        for (let i = 0; i < n / 2; i++) {
          const a = arr[i], b = arr[n - 1 - i];
          matches.push(((r + i) % 2 === 0) ? [a, b] : [b, a]);   // [mandante, visitante]
        }
        rounds.push(matches);
        arr.splice(1, 0, arr.pop());
      }
      return rounds;
    }

    // Turno e returno: no returno o mando de campo se inverte
    function doubleRoundRobin(ids) {
      const first = circleRounds(shuffleArr(ids));
      const second = first.map(r => r.map(([h, a]) => [a, h]));
      return first.concat(second);
    }

    // Colore as partidas (arestas) com R rodadas: cada time joga uma vez por rodada
    function colorEdges(edges, R, nodeLimit) {
      const m = edges.length, full = (1 << R) - 1;
      const color = new Array(m).fill(-1);
      const used = {};
      edges.forEach(e => { used[e[0]] = 0; used[e[1]] = 0; });
      let nodes = 0, failed = false;
      const popcnt = x => { let c = 0; while (x) { x &= x - 1; c++; } return c; };

      function dfs(left) {
        if (left === 0) return true;
        if (++nodes > nodeLimit) { failed = true; return false; }
        let best = -1, bestCnt = 99, bestMask = 0;
        for (let i = 0; i < m; i++) {
          if (color[i] >= 0) continue;
          const mask = full & ~(used[edges[i][0]] | used[edges[i][1]]);
          const cnt = popcnt(mask);
          if (cnt === 0) return false;
          if (cnt < bestCnt) { best = i; bestCnt = cnt; bestMask = mask; if (cnt === 1) break; }
        }
        const opts = [];
        for (let c = 0; c < R; c++) if (bestMask & (1 << c)) opts.push(c);
        const order = shuffleArr(opts);
        const h = edges[best][0], a = edges[best][1];
        for (const c of order) {
          color[best] = c; used[h] |= (1 << c); used[a] |= (1 << c);
          if (dfs(left - 1)) return true;
          if (failed) return false;
          color[best] = -1; used[h] &= ~(1 << c); used[a] &= ~(1 << c);
        }
        return false;
      }

      if (!dfs(m)) return null;
      const rounds = Array.from({ length: R }, () => []);
      edges.forEach((e, i) => rounds[color[i]].push(e));
      return shuffleArr(rounds);
    }

    // Fase única estilo Champions League: 16 times em 4 potes (por força).
    // Cada time enfrenta 2 adversários de cada pote (1 em casa e 1 fora) = 8 jogos (4 em casa e 4 fora).
    function buildSwissRounds(parts) {
      const sorted = parts.slice().sort((a, b) => b.ovr - a.ovr);
      for (let attempt = 0; attempt < 400; attempt++) {
        const pots = [0, 1, 2, 3].map(p => shuffleArr(sorted.slice(p * 4, p * 4 + 4)));
        const edges = [];
        for (let i = 0; i < 4; i++) {
          for (let j = i; j < 4; j++) {
            if (i === j) {
              const a = pots[i];
              for (let k = 0; k < 4; k++) edges.push([a[k].id, a[(k + 1) % 4].id]);
            } else {
              const X = pots[i], Y = shuffleArr(pots[j]);
              for (let k = 0; k < 4; k++) {
                edges.push([X[k].id, Y[k].id]);
                edges.push([Y[(k + 1) % 4].id, X[k].id]);
              }
            }
          }
        }
        const rounds = colorEdges(edges, 8, 30000);
        if (rounds) return rounds;
      }
      return circleRounds(shuffleArr(parts.map(t => t.id))).slice(0, 8);   // plano B (praticamente nunca usado)
    }

    // Sorteio de grupos com potes: 4 potes por força, um time de cada pote em cada grupo
    function drawGroupsFromPots(parts, nGroups) {
      const sorted = parts.slice().sort((a, b) => getEffectiveOvr(b) - getEffectiveOvr(a));
      const pots = [];
      for (let p = 0; p < 4; p++) pots.push(shuffleArr(sorted.slice(p * nGroups, (p + 1) * nGroups)));
      const groups = Array.from({ length: nGroups }, () => []);
      pots.forEach(pot => pot.forEach((t, i) => groups[i].push(t)));
      return groups;
    }

    function koStageName(teamCount) {
      const map = { 32: '16-avos de final', 16: 'Oitavas de final', 8: 'Quartas de final', 4: 'Semifinal', 2: 'Final' };
      return map[teamCount] || 'Mata-mata';
    }

    // ---------- Simulação silenciosa (campeonatos sem jogadores reais) ----------
    function simulateMatchInstant(home, away) {
      const m = createMatchObj(home, away, '');
      for (let min = 1; min <= 90; min++) simulateMatchMinute(m, min);
      m.events = [];
      return m;
    }

    function tableApply(list, teamId, gPro, gContra) {
      const t = list.find(x => x.id === teamId);
      if (!t) return;
      t.pj++; t.gp += gPro; t.gc += gContra; t.sg = t.gp - t.gc;
      if (gPro > gContra) { t.v++; t.pts += 3; }
      else if (gPro === gContra) { t.e++; t.pts += 1; }
      else t.d++;
    }

    function sortTable(list) {
      list.sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp || b.v - a.v);
    }

    function silentLeagueTable(t) {
      const list = t.teams.map(newStatsEntry);
      const byId = {};
      list.forEach(x => byId[x.id] = x);
      t.rounds.forEach(round => {
        round.forEach(([h, a]) => {
          const m = simulateMatchInstant(byId[h], byId[a]);
          tableApply(list, h, m.homeScore, m.awayScore);
          tableApply(list, a, m.awayScore, m.homeScore);
        });
      });
      sortTable(list);
      t.table = list;
    }

    // Um confronto de mata-mata simulado na hora (1 ou 2 jogos; empate no agregado vai aos pênaltis)
    function koTieSilent(h, a, legs) {
      const m1 = simulateMatchInstant(h, a);
      if (legs === 1) {
        if (m1.homeScore === m1.awayScore) resolveShootoutInstantly(m1);
        return matchHomeWon(m1) ? h : a;
      }
      const m2 = createMatchObj(a, h, '');
      m2.firstLeg = { homeScore: m1.homeScore, awayScore: m1.awayScore };
      for (let min = 1; min <= 90; min++) simulateMatchMinute(m2, min);
      if (matchIsTied(m2)) resolveShootoutInstantly(m2);
      return matchHomeWon(m2) ? m2.home : m2.away;
    }

    function koSilent(spec, done) {
      let pairs;
      if (spec.pairs) pairs = spec.pairs.map(p => p.slice());
      else {
        const order = shuffleArr(spec.teams);
        pairs = [];
        for (let i = 0; i < order.length; i += 2) pairs.push([order[i], order[i + 1]]);
      }
      const res = { champion: null, runnerUp: null, semifinalists: [], winners: [], losers: [] };
      for (let guard = 0; guard < 10; guard++) {
        const legs = spec.legs(pairs.length * 2);
        const winners = [], losers = [];
        pairs.forEach(([h, a]) => {
          const w = koTieSilent(h, a, legs);
          winners.push(w);
          losers.push(w === h ? a : h);
        });
        if (pairs.length === 2) res.semifinalists = losers;
        if (pairs.length === 1) { res.champion = winners[0]; res.runnerUp = losers[0]; }
        res.winners = winners;
        res.losers = losers;
        if (spec.singleRound || winners.length === 1) break;
        pairs = [];
        for (let i = 0; i < winners.length; i += 2) pairs.push([winners[i], winners[i + 1]]);
      }
      done(res);
    }
