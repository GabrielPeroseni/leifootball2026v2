    // ===== CALENDÁRIO DA TEMPORADA =====
    // Estadual -> Nacionalzão (Série A e B) -> Continental A -> Continental B -> Estadualzão (campeonato final)

    function lowerName(n) { return String(n).toLowerCase().trim(); }

    function humanNameSet() {
      return new Set(teams.slice(0, playerCount).map(t => lowerName(t.name)));
    }

    function worldBaseOvr(name) {
      if (BIG_TEAMS.has(name)) return 80 + rndInt(8);
      if (MID_TIER_CLUBS.has(name)) return 72 + rndInt(8);
      return 64 + rndInt(11);
    }

    // Cria (uma vez por jogo) a lista de clubes (os mesmos 125 do Estadualzão), suas forças e as divisões iniciais
    function initWorldIfNeeded() {
      if (worldState) return;
      const allClubs = Array.from(new Set(RAW_ESTADUALZAO_LIST));
      const ovr = {};
      allClubs.forEach(n => { ovr[n] = worldBaseOvr(n); });

      const hn = humanNameSet();
      const pool = shuffleArr(allClubs.filter(n => !hn.has(lowerName(n))));   // sorteio de clubes de qualquer nacionalidade
      const slotsA = Math.max(0, 20 - playerCount);
      const humanDiv = {};
      for (let i = 0; i < playerCount; i++) humanDiv[teams[i].id] = 'A';   // todos os jogadores começam na Série A

      worldState = {
        ovr, allClubs, humanDiv,
        serieABots: pool.slice(0, slotsA),
        serieBBots: pool.slice(slotsA, slotsA + 20),
        estadualOut: []
      };
    }

    // Sorteia, a cada temporada, os clubes de cada campeonato SEM REPETIR clube entre eles:
    //   Nacionalzão (Série A + Série B, persistente) | Continental A e B | Estadual
    function planSeasonClubs(ctx) {
      composeDivisions();   // garante Série A e B completas e sem repetição
      const hn = humanNameSet();
      const inNacional = new Set(worldState.serieABots.concat(worldState.serieBBots));
      const free = worldState.allClubs.filter(n => !hn.has(lowerName(n)) && !inNacional.has(n));

      // Continentais: os mais fortes entre os clubes que não estão no Nacionalzão (A primeiro, depois B)
      const byPower = free.map(n => ({ n, s: worldState.ovr[n] + Math.random() * 3 })).sort((a, b) => b.s - a.s).map(x => x.n);
      const needA = 32 - 5, needB = 32 - 5;   // 5 vagas do Continental A e 5 do B vêm da Série A
      ctx.contAFillers = byPower.slice(0, needA);
      ctx.contBFillers = byPower.slice(needA, needA + needB);

      // Estadual: sorteio entre os clubes que sobraram (quem caiu para a Série A2 só volta se faltar clube)
      const rest = byPower.slice(needA + needB);
      const out = new Set(worldState.estadualOut);
      let estPool = shuffleArr(rest.filter(n => !out.has(n)));
      if (estPool.length < 16) estPool = estPool.concat(shuffleArr(rest.filter(n => out.has(n))));
      ctx.estadualBots = estPool.slice(0, Math.max(0, 16 - playerCount));
    }

    // Pequena variação de força dos clubes a cada temporada
    function driftWorldOvr() {
      Object.keys(worldState.ovr).forEach(n => {
        worldState.ovr[n] = Math.max(60, Math.min(90, worldState.ovr[n] + rndInt(5) - 2));
      });
    }

    function botTeam(name) {
      return { id: 'w_' + name, name: name, badge: badgeForClub(name), isHuman: false, ovr: worldState.ovr[name] };
    }

    function humanTeam(i) {
      const t = teams[i];
      return { id: t.id, name: t.name, badge: t.badge, isHuman: true, ovr: calculateTeamOvr(t) };
    }

    function startSeasonCalendar() {
      if (!isHost) return;
      initWorldIfNeeded();
      if (currentSeason > 1) driftWorldOvr();
      seasonLog = [];
      seasonPrizes = [];
      compSummary = null;
      seasonCalendar = {
        queue: ['ESTADUAL', 'NACIONAL', 'CONT_A', 'CONT_B', 'ESTADUALZAO'],
        idx: -1,
        live: false,
        ctx: { contAQualified: [], contBQualified: [], contAThird: [], contAFillers: [], contBFillers: [], estadualBots: [] }
      };
      planSeasonClubs(seasonCalendar.ctx);
      advanceCalendar();
    }

    function advanceCalendar() {
      if (!isHost || !seasonCalendar) return;
      compSummary = null;
      seasonCalendar.idx++;
      seasonCalendar.live = false;
      const key = seasonCalendar.queue[seasonCalendar.idx];
      if (key === 'ESTADUAL') startEstadual();
      else if (key === 'NACIONAL') startNacional();
      else if (key === 'CONT_A') startContinentalA();
      else if (key === 'CONT_B') startContinentalB();
      else {
        compCtl = null;
        startEstadualzaoPhase1();   // campeonato final da temporada (como já era)
      }
    }

    // ---------- Prêmios e títulos ----------
    function addTitle(teamId, compName) {
      const t = teams.slice(0, playerCount).find(x => x.id === teamId);
      if (!t) return;
      if (!teamTitles[teamId]) teamTitles[teamId] = { total: 0, list: [] };
      teamTitles[teamId].total++;
      teamTitles[teamId].list.push(`${currentSeason}ª Temp: ${compName}`);
    }

    // placeMap: { 1: [times], 2: [times], 3: [times] } -> premia só os times de jogadores reais
    function awardComp(compKey, compName, placeMap) {
      const given = [];
      Object.keys(placeMap).forEach(place => {
        (placeMap[place] || []).forEach(t => {
          if (!t) return;
          const team = teams.slice(0, playerCount).find(x => x.id === t.id);
          if (!team) return;
          const pz = (COMP_PRIZES[compKey] || {})[place];
          if (pz) {
            team.tokens += pz.tokens;
            team.bonusSwaps = (team.bonusSwaps || 0) + pz.swaps;
            team.bonusPasses = (team.bonusPasses || 0) + pz.passes;
            const entry = { comp: compName, teamId: team.id, name: team.name, place: Number(place), tokens: pz.tokens, swaps: pz.swaps, passes: pz.passes };
            given.push(entry);
            seasonPrizes.push(entry);
          }
          if (Number(place) === 1) addTitle(team.id, compName);
        });
      });
      return given;
    }

    function logSeason(compName, champion, runnerUp) {
      seasonLog.push({
        comp: compName,
        champion: champion ? champion.name : '—',
        championHuman: !!(champion && champion.isHuman),
        runnerUp: runnerUp ? runnerUp.name : null
      });
    }

    function sRow(label, t) {
      return { label, name: t.name, badge: t.badge, isHuman: !!t.isHuman };
    }

    // Mostra o resumo do campeonato (se houve fase ao vivo) ou segue direto (se foi tudo simulado em silêncio)
    function finishCompetition(summary) {
      if (seasonCalendar && seasonCalendar.live) {
        compSummary = { id: `${currentSeason}_${seasonCalendar.idx}`, ...summary };
        currentBrasfootState.active = false;
        broadcastState();
      } else {
        advanceCalendar();
      }
    }

    function podiumSection(ko) {
      const rows = [sRow('🥇 Campeão', ko.champion), sRow('🥈 Vice', ko.runnerUp)];
      (ko.semifinalists || []).forEach(t => rows.push(sRow('🥉 Semifinalista', t)));
      return { h: '🏆 Pódio', rows };
    }

    // ---------- 1) ESTADUAL: 16 clubes, fase única (potes) + mata-mata dos 8 melhores ----------
    function startEstadual() {
      const parts = [];
      for (let i = 0; i < playerCount; i++) parts.push(humanTeam(i));
      seasonCalendar.ctx.estadualBots.forEach(n => parts.push(botTeam(n)));

      const spec = {
        title: '🏆 ESTADUAL - FASE ÚNICA (16 CLUBES)',
        duration: GROUP_MATCH_DURATION_MS,
        tables: [{
          key: 'EST', label: 'Classificação Geral', teams: parts, rounds: buildSwissRounds(parts), qualify: 8,
          zones: [{ from: 1, to: 8, cls: 'z-up' }, { from: 15, to: 16, cls: 'z-down' }],
          legend: '🟢 8 melhores: mata-mata • 🔴 2 últimos: rebaixados para a Série A2'
        }]
      };

      runLeaguePhase(spec, () => {
        const table = spec.tables[0].table;
        const qualified = table.slice(0, 8).map(plainTeam);
        const relegated = table.slice(table.length - 2).map(plainTeam);
        runKOPhase({
          title: '🏆 ESTADUAL - MATA-MATA', teams: qualified, draw: true,
          legs: () => 1, stageName: koStageName
        }, ko => finishEstadual(ko, relegated));
      });
    }

    function finishEstadual(ko, relegated) {
      worldState.estadualOut = relegated.filter(t => !t.isHuman).map(t => t.name);
      const prizes = awardComp('ESTADUAL', 'Estadual', { 1: [ko.champion], 2: [ko.runnerUp], 3: ko.semifinalists });
      logSeason('Estadual', ko.champion, ko.runnerUp);
      finishCompetition({
        title: '🏆 ESTADUAL ENCERRADO',
        sub: 'Próximo campeonato: Nacionalzão (Série A e Série B)',
        sections: [
          podiumSection(ko),
          { h: '🔴 Rebaixados para a Série A2', rows: relegated.map(t => sRow('Rebaixado', t)) }
        ],
        prizes
      });
    }

    // ---------- 2) NACIONALZÃO: Série A e Série B (20 clubes, turno e returno, 38 rodadas) ----------
    function composeDivisions() {
      const hn = humanNameSet();
      const ok = n => !hn.has(lowerName(n));
      const humansA = [], humansB = [];
      for (let i = 0; i < playerCount; i++) {
        (worldState.humanDiv[teams[i].id] === 'B' ? humansB : humansA).push(i);
      }
      const slotsA = 20 - humansA.length, slotsB = 20 - humansB.length;
      let botsA = worldState.serieABots.filter(ok).slice(0, slotsA);
      let botsB = worldState.serieBBots.filter(ok).slice(0, slotsB);
      const used = new Set(botsA.concat(botsB));
      const spare = shuffleArr(worldState.allClubs.filter(n => ok(n) && !used.has(n)));
      while (botsA.length < slotsA && spare.length) botsA.push(spare.pop());
      while (botsB.length < slotsB && spare.length) botsB.push(spare.pop());
      worldState.serieABots = botsA;
      worldState.serieBBots = botsB;
      return { humansA, humansB, botsA, botsB };
    }

    function startNacional() {
      const dv = composeDivisions();
      const partsA = dv.humansA.map(humanTeam).concat(dv.botsA.map(botTeam));
      const partsB = dv.humansB.map(humanTeam).concat(dv.botsB.map(botTeam));
      const duration = NACIONAL_MATCH_DURATION_MS;
      const live = (dv.humansA.length && dv.humansB.length) ? 'Série A e Série B' : (dv.humansA.length ? 'Série A' : 'Série B');

      const spec = {
        title: `🏆 NACIONALZÃO - ${live.toUpperCase()}`,
        duration,
        tables: [
          {
            key: 'SA', label: 'Série A', teams: partsA, rounds: doubleRoundRobin(partsA.map(t => t.id)),
            zones: [{ from: 1, to: 5, cls: 'z-up' }, { from: 6, to: 10, cls: 'z-mid' }, { from: 17, to: 20, cls: 'z-down' }],
            legend: '🟢 1º-5º: Continental A • 🔵 6º-10º: Continental B • 🔴 17º-20º: rebaixados'
          },
          {
            key: 'SB', label: 'Série B', teams: partsB, rounds: doubleRoundRobin(partsB.map(t => t.id)),
            zones: [{ from: 1, to: 4, cls: 'z-up' }],
            legend: '🟢 1º-4º: sobem para a Série A'
          }
        ]
      };

      runLeaguePhase(spec, () => {
        const A = spec.tables[0].table, B = spec.tables[1].table;
        const ctx = seasonCalendar.ctx;
        ctx.contAQualified = A.slice(0, 5).map(plainTeam);
        ctx.contBQualified = A.slice(5, 10).map(plainTeam);
        const relegated = A.slice(16, 20).map(plainTeam);
        const promoted = B.slice(0, 4).map(plainTeam);

        // promoção e rebaixamento
        relegated.forEach(t => {
          if (t.isHuman) worldState.humanDiv[t.id] = 'B';
          else { worldState.serieABots = worldState.serieABots.filter(n => n !== t.name); worldState.serieBBots.push(t.name); }
        });
        promoted.forEach(t => {
          if (t.isHuman) worldState.humanDiv[t.id] = 'A';
          else { worldState.serieBBots = worldState.serieBBots.filter(n => n !== t.name); worldState.serieABots.push(t.name); }
        });

        const prizes = awardComp('SERIE_A', 'Nacionalzão Série A', { 1: [A[0]], 2: [A[1]], 3: [A[2]], 4: [A[3]] })
          .concat(awardComp('SERIE_B', 'Nacionalzão Série B', { 1: [B[0]], 2: [B[1]], 3: [B[2]] }));
        logSeason('Nacionalzão Série A', A[0], A[1]);
        logSeason('Nacionalzão Série B', B[0], B[1]);

        finishCompetition({
          title: '🏆 NACIONALZÃO ENCERRADO',
          sub: 'Próximo campeonato: Continental A',
          sections: [
            { h: '🏆 Série A', rows: [sRow('🥇 Campeão', A[0]), sRow('🥈 Vice', A[1]), sRow('🥉 3º', A[2])] },
            { h: '🌎 Classificados ao Continental A (1º-5º)', rows: A.slice(0, 5).map((t, i) => sRow(`${i + 1}º`, t)) },
            { h: '🌍 Classificados ao Continental B (6º-10º)', rows: A.slice(5, 10).map((t, i) => sRow(`${i + 6}º`, t)) },
            { h: '🔴 Rebaixados para a Série B', rows: relegated.map(t => sRow('Rebaixado', t)) },
            { h: '🏆 Série B', rows: [sRow('🥇 Campeão', B[0]), sRow('🥈 Vice', B[1])] },
            { h: '⬆️ Sobem para a Série A', rows: promoted.map((t, i) => sRow(`${i + 1}º`, t)) }
          ],
          prizes
        });
      });
    }

    // ---------- Continentais ----------
    function continentalTables(parts, opts) {
      const letters = 'ABCDEFGH';
      return drawGroupsFromPots(parts, 8).map((g, i) => ({
        key: letters[i], label: `Grupo ${letters[i]}`, teams: g,
        rounds: doubleRoundRobin(g.map(t => t.id)),
        qualify: opts.qualify, zones: opts.zones, legend: opts.legend
      }));
    }

    function contLegs(n) { return n === 2 ? 1 : 2; }   // ida e volta; a final é em jogo único

    // ---------- 3) CONTINENTAL A: os clubes mais fortes ----------
    function startContinentalA() {
      const ctx = seasonCalendar.ctx;
      const parts = ctx.contAQualified.map(t => ({ ...t })).concat(ctx.contAFillers.map(botTeam));
      const spec = {
        title: '🏆 CONTINENTAL A - FASE DE GRUPOS',
        duration: GROUP_MATCH_DURATION_MS,
        tables: continentalTables(parts, {
          qualify: 3,
          zones: [{ from: 1, to: 2, cls: 'z-up' }, { from: 3, to: 3, cls: 'z-mid' }],
          legend: '🟢 1º-2º: oitavas • 🔵 3º: vai ao Playoff do Continental B'
        })
      };

      runLeaguePhase(spec, () => {
        const firsts = [], seconds = [], thirds = [];
        spec.tables.forEach(t => { firsts.push(t.table[0]); seconds.push(t.table[1]); thirds.push(t.table[2]); });
        ctx.contAThird = thirds.map(plainTeam);
        runKOPhase({
          title: '🏆 CONTINENTAL A - MATA-MATA',
          teams: shuffleArr(firsts.concat(seconds).map(plainTeam)), draw: true,
          legs: contLegs, stageName: koStageName
        }, ko => {
          const prizes = awardComp('CONT_A', 'Continental A', { 1: [ko.champion], 2: [ko.runnerUp], 3: ko.semifinalists });
          logSeason('Continental A', ko.champion, ko.runnerUp);
          finishCompetition({
            title: '🏆 CONTINENTAL A ENCERRADO',
            sub: 'Próximo campeonato: Continental B',
            sections: [podiumSection(ko)],
            prizes
          });
        });
      });
    }

    // ---------- 4) CONTINENTAL B: fortes que não estão no A + playoff com os 3ºs do A ----------
    function startContinentalB() {
      const ctx = seasonCalendar.ctx;
      const parts = ctx.contBQualified.map(t => ({ ...t })).concat(ctx.contBFillers.map(botTeam));
      const spec = {
        title: '🏆 CONTINENTAL B - FASE DE GRUPOS',
        duration: GROUP_MATCH_DURATION_MS,
        tables: continentalTables(parts, {
          qualify: 2,
          zones: [{ from: 1, to: 1, cls: 'z-up' }, { from: 2, to: 2, cls: 'z-mid' }],
          legend: '🟢 1º: oitavas • 🔵 2º: Playoff contra o 3º do Continental A'
        })
      };

      runLeaguePhase(spec, () => {
        const firsts = spec.tables.map(t => plainTeam(t.table[0]));
        const seconds = shuffleArr(spec.tables.map(t => plainTeam(t.table[1])));
        const thirds = shuffleArr(ctx.contAThird);
        const pairs = seconds.map((s, i) => [thirds[i], s]);   // o 3º do A recebe a ida; o 2º do B decide em casa
        const playoffTeams = [];
        pairs.forEach(p => playoffTeams.push(p[0], p[1]));

        runKOPhase({
          title: '🏆 CONTINENTAL B - PLAYOFFS (REPESCAGEM)',
          teams: playoffTeams, pairs, singleRound: true,
          legs: () => 2, stageName: () => 'Playoff (Repescagem)'
        }, po => {
          runKOPhase({
            title: '🏆 CONTINENTAL B - MATA-MATA',
            teams: shuffleArr(firsts.concat(po.winners.map(plainTeam))), draw: true,
            legs: contLegs, stageName: koStageName
          }, ko => {
            const prizes = awardComp('CONT_B', 'Continental B', { 1: [ko.champion], 2: [ko.runnerUp], 3: ko.semifinalists });
            logSeason('Continental B', ko.champion, ko.runnerUp);
            finishCompetition({
              title: '🏆 CONTINENTAL B ENCERRADO',
              sub: 'Próximo campeonato: Estadualzão (decisão da temporada)',
              sections: [podiumSection(ko)],
              prizes
            });
          });
        });
      });
    }
