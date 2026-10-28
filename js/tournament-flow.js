    function finishCurrentBatch() {
      if (!isHost) return;

      if (tournamentStage === 'ESTADUALZAO_PHASE1') {
        currentBrasfootState.currentMatches.forEach(m => {
          recordHumanMatchStats(m);
          updateGroupStats(m.group, m.home.id, m.homeScore, m.awayScore);
          updateGroupStats(m.group, m.away.id, m.awayScore, m.homeScore);
        });

        if (tournamentData.round < tournamentData.maxRounds) {
          tournamentData.round++;
          setupPhase1RoundMatches();
          broadcastState();
          runCurrentMatchesLoop();
        } else {
          startEstadualzaoPhase2();
        }
      } else if (tournamentStage === 'ESTADUALZAO_PHASE2') {
        currentBrasfootState.currentMatches.forEach(m => {
          recordHumanMatchStats(m);
          updateGroupStats(m.group, m.home.id, m.homeScore, m.awayScore);
          updateGroupStats(m.group, m.away.id, m.awayScore, m.homeScore);
        });

        if (tournamentData.round < tournamentData.maxRounds) {
          tournamentData.round++;
          setupPhase2RoundMatches();
          broadcastState();
          runCurrentMatchesLoop();
        } else {
          startEstadualzaoPlayoffs();
        }
      } else if (tournamentStage === 'PLAYOFFS') {
        currentBrasfootState.currentMatches.forEach(m => recordHumanMatchStats(m));

        // FINAL em dois jogos: terminou a IDA -> monta a VOLTA (mando invertido), sem pênaltis ainda
        const playing = currentBrasfootState.currentMatches;
        if (playing.length === 1 && playing[0].leg === 1) {
          startFinalSecondLeg(playing[0]);
          return;
        }

        // Empates (no agregado, na final): jogos com jogador real têm disputa animada; os demais são resolvidos na hora
        const humanTied = [];
        currentBrasfootState.currentMatches.forEach(m => {
          if (!matchIsTied(m)) return;
          if (m.home.isHuman || m.away.isHuman) humanTied.push(m);
          else resolveShootoutInstantly(m);
        });
        runShootoutQueue(humanTied, finishPlayoffRound);
      }
    }

    function finishPlayoffRound() {
      const currentMatches = currentBrasfootState.currentMatches;

      if (currentMatches.length === 2) {
        playoffResults.semifinalists = currentMatches.map(m => matchHomeWon(m) ? m.away.name : m.home.name);
        playoffResults.semifinalistIds = currentMatches.map(m => matchHomeWon(m) ? m.away.id : m.home.id);
      }

      let winners = currentMatches.map(m => matchHomeWon(m) ? m.home : m.away);

      if (currentMatches.length === 1) {
        const finalMatch = currentMatches[0];
        if (matchHomeWon(finalMatch)) {
          playoffResults.champion = finalMatch.home.name;
          playoffResults.runnerUp = finalMatch.away.name;
          playoffResults.championId = finalMatch.home.id;
          playoffResults.runnerUpId = finalMatch.away.id;
        } else {
          playoffResults.champion = finalMatch.away.name;
          playoffResults.runnerUp = finalMatch.home.name;
          playoffResults.championId = finalMatch.away.id;
          playoffResults.runnerUpId = finalMatch.home.id;
        }
        showPodiumScreen();
      } else if (winners.length > 1) {
        const startRound = (list) => {
          tournamentData.bracket.matches = createKnockoutPairings(list);
          setupPlayoffRoundMatches();
          broadcastState();
          runCurrentMatchesLoop();
        };
        // Só as OITAVAS DE FINAL (16 classificados) têm sorteio com bolas e papéis
        if (winners.length === 16) runOitavasDraw(winners, startRound);
        else startRound(winners);
      }
    }

    // Soma V/E/D/gols dos times dos jogadores (placar do tempo normal; decisão nos pênaltis conta como empate)
    function recordHumanMatchStats(m) {
      [[m.home, m.homeScore, m.awayScore], [m.away, m.awayScore, m.homeScore]].forEach(([t, gPro, gContra]) => {
        if (!t || !t.isHuman) return;
        if (!teamStats[t.id]) teamStats[t.id] = { v: 0, e: 0, d: 0, gp: 0, gc: 0 };
        const st = teamStats[t.id];
        st.gp += gPro;
        st.gc += gContra;
        if (gPro > gContra) st.v++;
        else if (gPro === gContra) st.e++;
        else st.d++;
      });
    }

    function updateGroupStats(groupKey, teamId, gPro, gContra) {
      const team = tournamentData.groups[groupKey].find(t => t.id === teamId);
      if (!team) return;

      team.pj++;
      team.gp += gPro;
      team.gc += gContra;
      team.sg = team.gp - team.gc;

      if (gPro > gContra) { team.v++; team.pts += 3; }
      else if (gPro === gContra) { team.e++; team.pts += 1; }
      else { team.d++; }

      tournamentData.groups[groupKey].sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp);
    }

    function startEstadualzaoPhase2() {
      let qualified64 = [];
      Object.keys(tournamentData.groups).forEach(gKey => {
        const sorted = tournamentData.groups[gKey];
        for (let i = 0; i < 4; i++) {
          if (sorted[i]) {
            qualified64.push({
              id: sorted[i].id,
              name: sorted[i].name,
              badge: sorted[i].badge,
              ovr: sorted[i].ovr,
              isHuman: sorted[i].isHuman
            });
          }
        }
      });

      qualified64 = qualified64.sort(() => Math.random() - 0.5);
      const groups = {};
      const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
      groupLetters.forEach((gLetter, idx) => {
        groups[gLetter] = qualified64.slice(idx * 4, idx * 4 + 4).map(t => ({
          ...t, pts: 0, pj: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0
        }));
      });

      tournamentStage = 'ESTADUALZAO_PHASE2';
      tournamentData = {
        groups: groups,
        round: 1,
        maxRounds: 6,
        bracket: {}
      };

      setupPhase2RoundMatches();
      broadcastState();
      runCurrentMatchesLoop();
    }

    function setupPhase2RoundMatches() {
      let roundMatches = [];
      const groupKeys = Object.keys(tournamentData.groups);
      const r = tournamentData.round;

      groupKeys.forEach(gKey => {
        const list = tournamentData.groups[gKey];
        let pairings = [];
        if (r === 1) pairings = [[0,1], [2,3]];
        if (r === 2) pairings = [[0,2], [1,3]];
        if (r === 3) pairings = [[0,3], [1,2]];
        if (r === 4) pairings = [[1,0], [3,2]];
        if (r === 5) pairings = [[2,0], [3,1]];
        if (r === 6) pairings = [[3,0], [2,1]];

        pairings.forEach(p => {
          roundMatches.push(createMatchObj(list[p[0]], list[p[1]], gKey));
        });
      });

      currentBrasfootState = {
        active: true,
        currentMatchMinute: 0,
        currentMatches: roundMatches,
        history: currentBrasfootState.history || []
      };
    }

    function startEstadualzaoPlayoffs() {
      let qualified32 = [];
      Object.keys(tournamentData.groups).forEach(gKey => {
        const sorted = tournamentData.groups[gKey];
        for (let i = 0; i < 2; i++) {
          if (sorted[i]) {
            qualified32.push({
              id: sorted[i].id,
              name: sorted[i].name,
              badge: sorted[i].badge,
              ovr: sorted[i].ovr,
              isHuman: sorted[i].isHuman
            });
          }
        }
      });

      qualified32 = qualified32.sort(() => Math.random() - 0.5);

      tournamentStage = 'PLAYOFFS';
      tournamentData = {
        groups: {},
        bracket: {
          matches: createKnockoutPairings(qualified32)
        }
      };

      setupPlayoffRoundMatches();
      broadcastState();
      runCurrentMatchesLoop();
    }

    function createKnockoutPairings(teamList) {
      let matches = [];
      for (let i = 0; i < teamList.length; i += 2) {
        const match = {
          home: teamList[i],
          away: teamList[i+1],
          homeScore: 0,
          awayScore: 0,
          events: [],
          stats: { homeShots: 0, awayShots: 0, homePossession: 50, awayPossession: 50 }
        };
        // A FINAL (só 2 times) é disputada em dois jogos: ida e volta
        if (teamList.length === 2) match.leg = 1;
        matches.push(match);
      }
      return matches;
    }

    // Jogo de VOLTA da final: o mando se inverte e o jogo de ida entra no agregado
    function startFinalSecondLeg(first) {
      const second = {
        home: first.away,
        away: first.home,
        homeScore: 0,
        awayScore: 0,
        events: [`↩️ Jogo de ida: ${first.home.name} ${first.homeScore} x ${first.awayScore} ${first.away.name}`],
        stats: { homeShots: 0, awayShots: 0, homePossession: 50, awayPossession: 50 },
        leg: 2,
        firstLeg: { homeScore: first.homeScore, awayScore: first.awayScore }
      };
      tournamentData.bracket.matches = [second];
      setupPlayoffRoundMatches();
      broadcastState();
      runCurrentMatchesLoop();
    }

    function setupPlayoffRoundMatches() {
      currentBrasfootState = {
        active: true,
        currentMatchMinute: 0,
        currentMatches: tournamentData.bracket.matches,
        history: currentBrasfootState.history || []
      };
    }

    function showPodiumScreen() {
      currentBrasfootState.active = false;
      awardSeasonPrizes();
      document.getElementById('league-screen').style.display = 'none';
      document.getElementById('podium-screen').style.display = 'flex';
      renderPodium();
      broadcastState();
    }
