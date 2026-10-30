    function calculateTeamOvr(team) {
      let total = 0, count = 0;
      for (let k in team.lineup) {
        if (team.lineup[k]) { total += team.lineup[k].ovr; count++; }
      }
      return count > 0 ? Math.round(total / count) : 80;
    }

    // 1. INÍCIO DO CAMPEONATO (SEM DUPLICAÇÕES DE TIMES)
    function startEstadualzaoPhase1() {
      document.getElementById('game-arena').style.display = 'none';
      document.getElementById('league-screen').style.display = 'flex';

      if (!isHost) return;

      let allParticipants = [];
      const humanTeamNames = new Set();

      for (let i = 0; i < playerCount; i++) {
        allParticipants.push({
          id: teams[i].id,
          name: teams[i].name,
          badge: teams[i].badge,
          isHuman: true,
          ovr: calculateTeamOvr(teams[i])
        });
        humanTeamNames.add(teams[i].name.toLowerCase().trim());
      }

      // Filtra lista removendo duplicatas entre si e com os times reais
      let uniqueTeamNames = Array.from(new Set(RAW_ESTADUALZAO_LIST)).filter(name => 
        !humanTeamNames.has(name.toLowerCase().trim())
      );

      let availableTeamNames = uniqueTeamNames.sort(() => Math.random() - 0.5);
      let listIndex = 0;

      while (allParticipants.length < 128) {
        if (listIndex >= availableTeamNames.length) {
          availableTeamNames.push(`Clube ${listIndex + 1}`);
        }

        const teamName = availableTeamNames[listIndex];
        const isBig = BIG_TEAMS.has(teamName);
        const baseOvr = isBig ? (Math.floor(Math.random() * 8) + 80) : (Math.floor(Math.random() * 12) + 66);

        allParticipants.push({
          id: `est_${listIndex}_${teamName}`,
          name: teamName,
          badge: { c1: "#475569", c2: "#ffffff", shape: "shield", pattern: "solid", animal: "⚽" },
          isHuman: false,
          ovr: baseOvr
        });
        listIndex++;
      }

      allParticipants = allParticipants.sort(() => Math.random() - 0.5);

      const groups = {};
      const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
      groupLetters.forEach((gLetter, idx) => {
        groups[gLetter] = allParticipants.slice(idx * 8, idx * 8 + 8).map(t => ({
          ...t, pts: 0, pj: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0
        }));
      });

      tournamentStage = 'ESTADUALZAO_PHASE1';
      tournamentData = {
        groups: groups,
        round: 1,
        maxRounds: 7,
        bracket: {}
      };

      setupPhase1RoundMatches();
      broadcastState();
      runCurrentMatchesLoop();
    }

    function setupPhase1RoundMatches() {
      let roundMatches = [];
      const groupKeys = Object.keys(tournamentData.groups);

      groupKeys.forEach(gKey => {
        const list = tournamentData.groups[gKey];
        const r = tournamentData.round;
        for (let i = 0; i < 4; i++) {
          let homeIdx = (r - 1 + i) % 7;
          let awayIdx = (7 - i + r - 1) % 7;
          if (i === 0) awayIdx = 7;
          
          roundMatches.push(createMatchObj(list[homeIdx], list[awayIdx], gKey));
        }
      });

      currentBrasfootState = {
        active: true,
        currentMatchMinute: 0,
        currentMatches: roundMatches,
        history: currentBrasfootState.history || []
      };
    }

    function createMatchObj(home, away, groupLabel = '') {
      return {
        home: home,
        away: away,
        homeScore: 0,
        awayScore: 0,
        group: groupLabel,
        events: [],
        stats: { homeShots: 0, awayShots: 0, homePossession: 50, awayPossession: 50 }
      };
    }

    function runCurrentMatchesLoop() {
      if (!isHost) return;
      if (matchTimer) { clearInterval(matchTimer); matchTimer = null; }

      const startTime = Date.now();
      const baseDurationMs = isCompStage() ? compBaseDuration() : ((tournamentStage === 'ESTADUALZAO_PHASE1' || tournamentStage === 'ESTADUALZAO_PHASE2') ? GROUP_MATCH_DURATION_MS : MATCH_DURATION_MS);
      const matchDurationMs = allHumansEliminated() ? baseDurationMs / 2 : baseDurationMs;

      matchTimer = setInterval(() => {
        if (!currentBrasfootState.active) {
          clearInterval(matchTimer);
          matchTimer = null;
          return;
        }

        const elapsed = Date.now() - startTime;
        const targetMinute = Math.min(90, Math.floor((elapsed / matchDurationMs) * 90));
        if (targetMinute <= currentBrasfootState.currentMatchMinute) return;

        while (currentBrasfootState.currentMatchMinute < targetMinute) {
          currentBrasfootState.currentMatchMinute++;
          currentBrasfootState.currentMatches.forEach(m => {
            simulateMatchMinute(m, currentBrasfootState.currentMatchMinute);
          });
        }

        broadcastState();

        if (currentBrasfootState.currentMatchMinute >= 90) {
          clearInterval(matchTimer);
          matchTimer = null;
          setTimeout(() => { finishCurrentBatch(); }, 1500);
        }
      }, 250);
    }
