    // ===== MOTOR DOS CAMPEONATOS DA TEMPORADA (fases ao vivo ou simuladas na hora) =====
    // Uma fase só é mostrada ao vivo se tiver ao menos um time de jogador real; senão é simulada em silêncio.

    function isCompStage() { return tournamentStage === 'COMP_LEAGUE' || tournamentStage === 'COMP_KO'; }

    function compBaseDuration() { return (compCtl && compCtl.duration) || MATCH_DURATION_MS; }

    function showLeagueScreenForComp() {
      document.getElementById('game-arena').style.display = 'none';
      document.getElementById('podium-screen').style.display = 'none';
      document.getElementById('league-screen').style.display = 'flex';
    }

    // Time de jogador real ainda vivo na fase atual? (usado para acelerar 2x quando todos já caíram)
    function compHumanAlive(teamId) {
      if (tournamentStage === 'COMP_KO') {
        return currentBrasfootState.currentMatches.some(m => m.home.id === teamId || m.away.id === teamId);
      }
      const groups = tournamentData.groups || {};
      for (const g in groups) {
        const list = groups[g];
        const t = list.find(x => x.id === teamId);
        if (!t) continue;
        const meta = (tournamentData.groupMeta || {})[g] || {};
        if (!meta.qualify) return true;
        const maxPts = t.pts + 3 * ((tournamentData.maxRounds || 0) - t.pj);
        return list.filter(x => x.id !== teamId && x.pts > maxPts).length < meta.qualify;
      }
      return false;
    }

    function compAllHumansEliminated() {
      if (!playerCount) return false;
      for (let i = 0; i < playerCount; i++) {
        if (compHumanAlive(teams[i].id)) return false;
      }
      return true;
    }

    // ---------- Fase de pontos corridos / grupos ----------
    // spec: { title, duration, tables: [{ key, label, teams, rounds, qualify, zones, legend }] }
    // Ao terminar, cada tabela recebe t.table (classificação final) e done() é chamado.
    function runLeaguePhase(spec, done) {
      const liveTables = spec.tables.filter(t => t.teams.some(x => x.isHuman));
      spec.tables.forEach(t => { if (!liveTables.includes(t)) silentLeagueTable(t); });
      if (!liveTables.length) { done(); return; }
      seasonCalendar.live = true;
      liveLeague(spec, liveTables, done);
    }

    function liveLeague(spec, tables, done) {
      const groups = {}, meta = {};
      tables.forEach(t => {
        groups[t.key] = t.teams.map(newStatsEntry);
        meta[t.key] = { label: t.label, zones: t.zones || [], qualify: t.qualify || 0, legend: t.legend || '' };
      });
      compCtl = { kind: 'league', spec, tables, done, duration: spec.duration || GROUP_MATCH_DURATION_MS };
      tournamentStage = 'COMP_LEAGUE';
      tournamentData = {
        groups, groupMeta: meta, round: 1,
        maxRounds: Math.max(...tables.map(t => t.rounds.length)),
        bracket: {}, title: spec.title, roundLabel: null
      };
      showLeagueScreenForComp();
      setupCompLeagueRound();
      broadcastState();
      runCurrentMatchesLoop();
    }

    function setupCompLeagueRound() {
      const r = tournamentData.round;
      const matches = [];
      compCtl.tables.forEach(t => {
        const list = tournamentData.groups[t.key];
        (t.rounds[r - 1] || []).forEach(([h, a]) => {
          const H = list.find(x => x.id === h), A = list.find(x => x.id === a);
          if (H && A) matches.push(createMatchObj(H, A, t.key));
        });
      });
      currentBrasfootState = { active: true, currentMatchMinute: 0, currentMatches: matches, history: currentBrasfootState.history || [] };
    }

    // ---------- Mata-mata ----------
    // spec: { title, teams, pairs?, draw?, legs(n), stageName(n), singleRound? }
    // done recebe { champion, runnerUp, semifinalists, winners, losers }
    function runKOPhase(spec, done) {
      const live = spec.teams.some(t => t.isHuman);
      if (!live) { koSilent(spec, done); return; }
      seasonCalendar.live = true;
      liveKO(spec, done);
    }

    function liveKO(spec, done) {
      compCtl = { kind: 'ko', spec, done, duration: MATCH_DURATION_MS, firstRound: true, champion: null, runnerUp: null, semifinalists: [] };
      tournamentStage = 'COMP_KO';
      tournamentData = { groups: {}, groupMeta: {}, bracket: { matches: [] }, title: spec.title, roundLabel: 'Preparando o mata-mata...', round: 1, maxRounds: 1 };
      currentBrasfootState = { active: true, currentMatchMinute: 0, currentMatches: [], history: currentBrasfootState.history || [] };
      showLeagueScreenForComp();
      koBeginRound(spec.teams, spec.pairs || null);
    }

    function koMatchObj(h, a, stageName, leg) {
      const m = createMatchObj(h, a, '');
      m.stageName = stageName;
      if (leg) m.leg = leg;
      return m;
    }

    function koBeginRound(teamList, pairsOverride) {
      const c = compCtl;
      const n = teamList.length;
      c.legs = c.spec.legs(n);
      c.stageName = c.spec.stageName(n);
      const go = (order) => {
        const pairs = [];
        for (let i = 0; i < order.length; i += 2) pairs.push([order[i], order[i + 1]]);
        c.pairs = pairs;
        koPlayLeg(1);
      };
      if (pairsOverride) { c.pairs = pairsOverride; koPlayLeg(1); return; }
      if (c.spec.draw && c.firstRound) {
        c.firstRound = false;
        tournamentData.roundLabel = `Sorteio — ${c.stageName}`;
        broadcastState();
        runOitavasDraw(teamList, go, c.stageName);
      } else {
        c.firstRound = false;
        go(teamList);
      }
    }

    function koPlayLeg(leg) {
      const c = compCtl;
      let matches;
      if (leg === 1) {
        matches = c.pairs.map(([h, a]) => koMatchObj(h, a, c.stageName, c.legs === 2 ? 1 : 0));
        c.leg1 = matches;
      } else {
        matches = c.leg1.map(m1 => {
          const m2 = koMatchObj(m1.away, m1.home, c.stageName, 2);
          m2.firstLeg = { homeScore: m1.homeScore, awayScore: m1.awayScore };
          m2.events = [`↩️ Jogo de ida: ${m1.home.name} ${m1.homeScore} x ${m1.awayScore} ${m1.away.name}`];
          return m2;
        });
      }
      c.curLeg = leg;
      tournamentData.bracket.matches = matches;
      tournamentData.roundLabel = c.stageName + (c.legs === 2 ? (leg === 1 ? ' — Jogo de Ida' : ' — Jogo de Volta') : '');
      currentBrasfootState = { active: true, currentMatchMinute: 0, currentMatches: matches, history: currentBrasfootState.history || [] };
      broadcastState();
      runCurrentMatchesLoop();
    }

    function koRoundFinished() {
      const c = compCtl;
      const ms = currentBrasfootState.currentMatches;
      const winners = ms.map(m => matchHomeWon(m) ? m.home : m.away);
      const losers = ms.map(m => matchHomeWon(m) ? m.away : m.home);
      if (ms.length === 2) c.semifinalists = losers;
      if (ms.length === 1) { c.champion = winners[0]; c.runnerUp = losers[0]; }
      if (c.spec.singleRound || winners.length === 1) {
        const res = { champion: c.champion, runnerUp: c.runnerUp, semifinalists: c.semifinalists, winners, losers };
        const done = c.done;
        done(res);
      } else {
        koBeginRound(winners, null);
      }
    }

    // ---------- Fim de cada rodada (chamado por finishCurrentBatch) ----------
    function compBatchDone() {
      if (!isHost || !compCtl) return;
      const matches = currentBrasfootState.currentMatches;

      if (tournamentStage === 'COMP_LEAGUE') {
        matches.forEach(m => {
          recordHumanMatchStats(m);
          updateGroupStats(m.group, m.home.id, m.homeScore, m.awayScore);
          updateGroupStats(m.group, m.away.id, m.awayScore, m.homeScore);
        });
        if (tournamentData.round < tournamentData.maxRounds) {
          tournamentData.round++;
          setupCompLeagueRound();
          broadcastState();
          runCurrentMatchesLoop();
        } else {
          const c = compCtl;
          c.tables.forEach(t => { t.table = tournamentData.groups[t.key].map(x => ({ ...x })); });
          tournamentData.roundLabel = '✅ Fase encerrada — classificação definida!';
          broadcastState();
          setTimeout(() => { if (compCtl === c) c.done(); }, 6000);
        }
        return;
      }

      if (tournamentStage === 'COMP_KO') {
        matches.forEach(m => recordHumanMatchStats(m));
        const c = compCtl;
        if (c.legs === 2 && c.curLeg === 1) { koPlayLeg(2); return; }   // terminou a ida: joga a volta
        const humanTied = [];
        matches.forEach(m => {
          if (!matchIsTied(m)) return;
          if (m.home.isHuman || m.away.isHuman) humanTied.push(m);
          else resolveShootoutInstantly(m);
        });
        runShootoutQueue(humanTied, koRoundFinished);
      }
    }
