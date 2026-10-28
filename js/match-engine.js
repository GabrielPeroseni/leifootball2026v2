    // 2. RETORNA ARTILHEIRO SE FOR HUMANO (RETORNA NULL PARA BOTS)
    function getRandomScorerName(teamObj, excludedNames = []) {
      if (teamObj.isHuman) {
        const humanTeam = teams.find(t => t.id === teamObj.id || t.name === teamObj.name);
        if (humanTeam && humanTeam.lineup) {
          const availablePlayers = [];
          let totalWeight = 0;
          for (let key in humanTeam.lineup) {
            if (humanTeam.lineup[key] && key !== 'GOL' && !excludedNames.includes(humanTeam.lineup[key].name)) {
              const posKey = key.replace(/[0-9]/g, '');
              const w = SCORER_WEIGHTS[posKey] !== undefined ? SCORER_WEIGHTS[posKey] : 1;
              availablePlayers.push({ name: humanTeam.lineup[key].name, w: w });
              totalWeight += w;
            }
          }
          if (availablePlayers.length > 0) {
            let r = Math.random() * totalWeight;
            for (let p of availablePlayers) {
              r -= p.w;
              if (r <= 0) return p.name;
            }
            return availablePlayers[availablePlayers.length - 1].name;
          }
        }
      }
      return null;
    }

    // 3. ARTILHARIA APENAS DOS JOGADORES REAIS
    function isScorerHumanPlayer(scorerName) {
      for (let t of teams) {
        if (t.lineup) {
          for (let key in t.lineup) {
            if (t.lineup[key] && t.lineup[key].name === scorerName) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function recordGoal(scorerName, teamName) {
      if (!scorerName || !isScorerHumanPlayer(scorerName)) return;

      if (!topScorers[scorerName]) {
        topScorers[scorerName] = { goals: 0, team: teamName };
      }
      topScorers[scorerName].goals++;
      topScorers[scorerName].team = teamName;
    }

    // 4. SIMULAÇÃO DO MINUTO E FORMATAÇÃO DO LOG DO GOL
    function getEffectiveOvr(t) {
      return t.ovr + (BIG_TEAMS.has(t.name) ? BIG_TEAM_BONUS : 0) + (t.isHuman ? HUMAN_TEAM_BONUS : 0);
    }

    // Verdadeiro quando TODOS os times dos jogadores já estão eliminados (partidas passam a 2x)
    function isHumanEliminated(teamId) {
      let found = null, groupList = null;
      const groups = tournamentData.groups || {};
      for (let g in groups) {
        const t = groups[g].find(x => x.id === teamId);
        if (t) { found = t; groupList = groups[g]; break; }
      }
      if (tournamentStage === 'PLAYOFFS') {
        return !currentBrasfootState.currentMatches.some(m => m.home.id === teamId || m.away.id === teamId);
      }
      if (!found) return tournamentStage === 'ESTADUALZAO_PHASE2';
      const vagas = tournamentStage === 'ESTADUALZAO_PHASE1' ? 4 : 2;
      const maxPts = found.pts + 3 * ((tournamentData.maxRounds || 0) - found.pj);
      const acima = groupList.filter(x => x.id !== teamId && x.pts > maxPts).length;
      return acima >= vagas;
    }

    function allHumansEliminated() {
      if (!playerCount) return false;
      for (let i = 0; i < playerCount; i++) {
        if (!isHumanEliminated(teams[i].id)) return false;
      }
      return true;
    }

    // ---------- Extras de partida (táticas e cartões) ----------
    function ensureMatchExtras(m) {
      if (!m.tactics) m.tactics = { home: 'BAL', away: 'BAL' };
      if (!m.cards) m.cards = { home: { yellow: [], red: [] }, away: { yellow: [], red: [] } };
    }

    // Jogadores do time real que estão em campo (11 do elenco)
    function getHumanLineupPlayers(teamObj) {
      const ht = teams.find(t => t.id === teamObj.id) || teams.find(t => t.name === teamObj.name);
      const list = [];
      if (ht && ht.lineup) {
        for (let key in ht.lineup) {
          const c = ht.lineup[key];
          if (c) list.push({ name: c.name, pos: key.replace(/[0-9]/g, ''), ovr: c.ovr });
        }
      }
      return list;
    }

    function pickWeightedPlayer(list) {
      if (!list.length) return null;
      const w = p => (YELLOW_POS_WEIGHT[p.pos] !== undefined ? YELLOW_POS_WEIGHT[p.pos] : 1);
      let total = 0;
      list.forEach(p => total += w(p));
      let r = Math.random() * total;
      for (const p of list) { r -= w(p); if (r <= 0) return p; }
      return list[list.length - 1];
    }

    // Partida em que ao menos um time é de jogador real (nelas os DOIS times levam cartões)
    function matchHasHuman(m) { return !!(m.home.isHuman || m.away.isHuman); }

    // 11 em campo: elenco real para jogadores; adversários controlados pelo computador recebem um elenco genérico
    function getTeamPlayers(teamObj) {
      if (teamObj.isHuman) {
        const list = getHumanLineupPlayers(teamObj);
        if (list.length) return list;
      }
      const posOf = n => (n === 1 ? 'GOL' : n <= 5 ? 'DEF' : n <= 8 ? 'MC' : 'ATA');
      const list = [];
      for (let n = 1; n <= 11; n++) list.push({ name: `Jogador ${n}`, pos: posOf(n), ovr: teamObj.ovr });
      return list;
    }

    // Cartões: times de jogadores reais e seus adversários
    function processMatchCards(match, min) {
      if (!matchHasHuman(match)) return;
      ['home', 'away'].forEach(side => {
        const t = match[side];
        if (!t) return;
        const c = match.cards[side];
        const onField = getTeamPlayers(t).filter(p => !c.red.includes(p.name));
        if (onField.length === 0) return;

        if (Math.random() < YELLOW_PER_MIN) {
          const p = pickWeightedPlayer(onField.filter(x => !c.yellow.includes(x.name)));
          if (p) {
            c.yellow.push(p.name);
            match.events.unshift(`🟨 ${min}' Cartão amarelo para ${p.name} (${t.name})`);
          }
        }
        if (Math.random() < RED_PER_MIN) {
          const p = pickWeightedPlayer(onField);
          if (p) {
            c.red.push(p.name);
            match.events.unshift(`🟥 ${min}' EXPULSÃO! ${p.name} (${t.name}) — ${t.name} fica com ${Math.max(1, 11 - c.red.length)} jogadores!`);
          }
        }
      });
    }

    // Multiplicadores de tática + expulsões (só em partidas com jogador real; tática dos bots é sempre equilibrada)
    function getTeamModifiers(match, side) {
      if (!matchHasHuman(match)) return { atk: 1, opp: 1, poss: 0 };
      const tac = TACTICS[match.tactics[side]] || TACTICS.BAL;
      const reds = Math.min(MAX_RED_STACK, match.cards[side].red.length);
      return {
        atk: tac.atk * Math.pow(RED_ATK_MULT, reds),
        opp: tac.opp * Math.pow(RED_OPP_MULT, reds),
        poss: tac.poss - reds * 6
      };
    }

    function simulateMatchMinute(match, min) {
      ensureMatchExtras(match);
      processMatchCards(match, min);

      const ovrDiff = getEffectiveOvr(match.home) - getEffectiveOvr(match.away);

      let homeChance = Math.min(0.065, Math.max(0.012, 0.03 + (ovrDiff * 0.003)));
      let awayChance = Math.min(0.065, Math.max(0.012, 0.03 - (ovrDiff * 0.003)));
      const homeConv = Math.min(0.5, Math.max(0.25, 0.38 + (ovrDiff * 0.004)));
      const awayConv = Math.min(0.5, Math.max(0.25, 0.38 - (ovrDiff * 0.004)));

      // tática e expulsões (só afetam times de jogadores reais)
      const hm = getTeamModifiers(match, 'home');
      const am = getTeamModifiers(match, 'away');
      homeChance = Math.min(0.12, homeChance * hm.atk * am.opp);
      awayChance = Math.min(0.12, awayChance * am.atk * hm.opp);

      match.stats.homePossession = Math.min(80, Math.max(20, 50 + Math.round(ovrDiff * 1.8) + Math.floor(Math.random() * 5 - 2) + hm.poss - am.poss));
      match.stats.awayPossession = 100 - match.stats.homePossession;

      if (Math.random() < homeChance) {
        match.stats.homeShots++;
        if (Math.random() < homeConv) {
          match.homeScore++;
          const scorer = getRandomScorerName(match.home, match.cards.home.red);
          if (scorer) {
            recordGoal(scorer, match.home.name);
            match.events.unshift(`⚽ ${min}' GOL do ${scorer} (${match.home.name})! (${match.homeScore}-${match.awayScore})`);
          } else {
            match.events.unshift(`⚽ ${min}' GOL do ${match.home.name}! (${match.homeScore}-${match.awayScore})`);
          }
        }
      }

      if (Math.random() < awayChance) {
        match.stats.awayShots++;
        if (Math.random() < awayConv) {
          match.awayScore++;
          const scorer = getRandomScorerName(match.away, match.cards.away.red);
          if (scorer) {
            recordGoal(scorer, match.away.name);
            match.events.unshift(`⚽ ${min}' GOL do ${scorer} (${match.away.name})! (${match.homeScore}-${match.awayScore})`);
          } else {
            match.events.unshift(`⚽ ${min}' GOL do ${match.away.name}! (${match.homeScore}-${match.awayScore})`);
          }
        }
      }
    }

    // ---------- Tática escolhida pelo jogador ----------
    function setTactic(t) { sendActionToHost('SET_TACTIC', { tactic: t }); }

    function setTacticLogic(tactic, senderId) {
      if (!TACTICS[tactic]) return;
      const team = teams[senderId];
      if (!team || !currentBrasfootState || !currentBrasfootState.active) return;
      if (shootoutState && shootoutState.active) return;
      if (currentBrasfootState.currentMatchMinute >= 90) return;
      currentBrasfootState.currentMatches.forEach(m => {
        ['home', 'away'].forEach(side => {
          if (m[side].isHuman && m[side].id === team.id) {
            ensureMatchExtras(m);
            m.tactics[side] = tactic;
          }
        });
      });
    }

    function getMyMatchInfo() {
      const my = teams[myPlayerId];
      if (!my || !currentBrasfootState || !currentBrasfootState.currentMatches) return null;
      for (const m of currentBrasfootState.currentMatches) {
        if (m.home.isHuman && m.home.id === my.id) return { m, side: 'home' };
        if (m.away.isHuman && m.away.id === my.id) return { m, side: 'away' };
      }
      return null;
    }

    function updateTacticsPanel() {
      const panel = document.getElementById('tactics-panel');
      if (!panel) return;
      const info = getMyMatchInfo();
      if (!info || !currentBrasfootState.active) { panel.style.display = 'none'; return; }
      const { m, side } = info;
      const tactic = (m.tactics && m.tactics[side]) || 'BAL';
      const cards = m.cards ? m.cards[side] : { yellow: [], red: [] };
      const minute = currentBrasfootState.currentMatchMinute;
      const reds = cards.red.length;

      panel.style.display = 'block';
      document.getElementById('tp-match').textContent = `⏱️ ${minute}'  •  ${m.home.name} ${m.homeScore} x ${m.awayScore} ${m.away.name}`;
      document.getElementById('tp-cards').textContent = `🟨 ${cards.yellow.length}   🟥 ${reds}` + (reds ? `   ⚠️ ${reds} jogador(es) a menos!` : '');
      Object.keys(TACTICS).forEach(k => {
        const b = document.getElementById('tp-' + k);
        if (!b) return;
        b.classList.toggle('active', k === tactic);
        b.disabled = minute >= 90;
      });
      document.getElementById('tp-desc').textContent = TACTICS[tactic].desc;
    }

    function matchCardsText(m, side) {
      if (!matchHasHuman(m)) return '—';
      const c = m.cards ? m.cards[side] : { yellow: [], red: [] };
      return `🟨 ${c.yellow.length} 🟥 ${c.red.length}`;
    }

    // Placar agregado: na FINAL (jogo de volta) soma o jogo de ida; nos demais jogos é o próprio placar
    function getAggregate(m) {
      if (!m.firstLeg) return { home: m.homeScore, away: m.awayScore };
      return { home: m.homeScore + m.firstLeg.awayScore, away: m.awayScore + m.firstLeg.homeScore };
    }

    function matchIsTied(m) {
      const a = getAggregate(m);
      return a.home === a.away;
    }

    // Vencedor de um jogo de mata-mata (placar, agregado ou pênaltis)
    function matchHomeWon(m) {
      const a = getAggregate(m);
      if (a.home !== a.away) return a.home > a.away;
      return m.penWinner === 'home';
    }
