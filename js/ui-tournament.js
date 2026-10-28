    function renderSeasonStatsTable() {
      const box = document.getElementById('season-stats-box');
      if (!box) return;

      const rows = [];
      for (let i = 0; i < playerCount; i++) {
        const t = teams[i];
        if (!t) continue;
        const st = teamStats[t.id] || { v: 0, e: 0, d: 0, gp: 0, gc: 0 };
        const j = st.v + st.e + st.d;
        const apr = j > 0 ? ((st.v * 3 + st.e) / (j * 3)) * 100 : 0;
        rows.push({ team: t, st, j, apr, sg: st.gp - st.gc });
      }
      rows.sort((a, b) => b.apr - a.apr || b.sg - a.sg || b.st.gp - a.st.gp);

      const title = currentSeason === 1
        ? '📊 Desempenho dos Jogadores - 1ª Temporada'
        : `📊 Desempenho Acumulado - 1ª até ${currentSeason}ª Temporada`;

      box.innerHTML = `
        <div class="season-stats-title">${title}</div>
        <div class="season-stats-scroll">
          <table class="season-stats-table">
            <thead>
              <tr><th style="text-align:left;">Jogador</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GM</th><th>GS</th><th>Aprov.</th></tr>
            </thead>
            <tbody>
              ${rows.map((r, idx) => `
                <tr>
                  <td class="team-cell"><span>${idx + 1}. <span style="width:20px; height:20px; display:inline-block;">${getTeamLogoHTML(r.team.name, r.team.badge)}</span> ${r.team.name}</span></td>
                  <td>${r.j}</td>
                  <td>${r.st.v}</td>
                  <td>${r.st.e}</td>
                  <td>${r.st.d}</td>
                  <td>${r.st.gp}</td>
                  <td>${r.st.gc}</td>
                  <td class="apr">${r.apr.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    function renderPodium() {
      renderSeasonStatsTable();
      renderPodiumPrizes();
      const champ = playoffResults.champion || (teams[0] ? teams[0].name : "Time Campeão");
      const vice = playoffResults.runnerUp || (teams[1] ? teams[1].name : "Vice-Campeão");
      const semiText = playoffResults.semifinalists && playoffResults.semifinalists.length > 0 
        ? playoffResults.semifinalists.join(" / ") 
        : "Semifinalistas";

      document.getElementById('podium-name-1').innerText = champ;
      document.getElementById('podium-badge-1').innerHTML = getTeamLogoHTML(champ);
      document.getElementById('podium-name-2').innerText = vice;
      document.getElementById('podium-badge-2').innerHTML = getTeamLogoHTML(vice);
      document.getElementById('podium-name-3').innerText = semiText;
      document.getElementById('podium-badge-3').innerHTML = getTeamLogoHTML(playoffResults.semifinalists[0] || semiText);

      setTimeout(() => {
        document.getElementById('step-1').classList.add('show');
        document.getElementById('step-2').classList.add('show');
        document.getElementById('step-3').classList.add('show');
      }, 300);

      const btnNext = document.getElementById('btn-next-phase');
      btnNext.onclick = handlePodiumNextPhase;
      btnNext.innerText = currentSeason < MAX_SEASONS
        ? `Avançar para a ${currentSeason + 1}ª Temporada (Reforços)`
        : "Voltar ao Menu Principal";
    }

    function handlePodiumNextPhase() {
      if (currentSeason < MAX_SEASONS) sendActionToHost('NEXT_SEASON');
      else backToMainMenu();
    }

    function renderTournamentUI() {
      const container = document.getElementById('matches-broadcast-container');
      if (!container) return;
      container.innerHTML = '';

      let titleStage = "🏆 ESTADUALZÃO - FASE DE GRUPOS (16x8)";
      if (tournamentStage === 'ESTADUALZAO_PHASE2') titleStage = "🏆 ESTADUALZÃO - SEGUNDA FASE (16x4)";
      if (tournamentStage === 'PLAYOFFS') titleStage = "🏆 ESTADUALZÃO - MATA-MATA (32 TIMES)";

      document.getElementById('phase-indicator').innerText = titleStage;
      document.getElementById('round-indicator').innerText = tournamentStage === 'PLAYOFFS' ? ((currentBrasfootState.currentMatches.length === 1 && currentBrasfootState.currentMatches[0].leg) ? (currentBrasfootState.currentMatches[0].leg === 1 ? 'FINAL - Jogo de Ida' : 'FINAL - Jogo de Volta') : 'Mata-Mata em Tempo Real') : `Rodada ${tournamentData.round} de ${tournamentData.maxRounds}`;

      // O jogo do próprio jogador aparece primeiro e destacado
      const myTeamId = teams[myPlayerId] ? teams[myPlayerId].id : null;
      const isMine = m => (m.home.isHuman && m.home.id === myTeamId) || (m.away.isHuman && m.away.id === myTeamId);
      const orderedMatches = [...currentBrasfootState.currentMatches].sort((a, b) => (isMine(b) ? 1 : 0) - (isMine(a) ? 1 : 0));

      orderedMatches.forEach(m => {
        const box = document.createElement('div');
        const mine = isMine(m);
        box.className = 'match-box active' + (mine ? ' mine' : '');
        const anyHuman = m.home.isHuman || m.away.isHuman;
        box.innerHTML = `
          ${mine ? '<div class="match-mine-tag">⭐ SEU JOGO</div>' : ''}
          ${m.leg ? `<div class="leg-tag">🏆 Final — ${m.leg === 1 ? 'Jogo de Ida' : 'Jogo de Volta'}</div>` : ''}
          <div class="match-time">${currentBrasfootState.currentMatchMinute}' MIN</div>
          <div class="match-teams">
            <div class="team-display home">
              ${getTeamLogoHTML(m.home.name, m.home.badge)}
              <span>${m.home.name}</span>
            </div>
            <div class="match-score">${m.homeScore} - ${m.awayScore}${m.firstLeg ? `<small class="pen-note">agregado ${getAggregate(m).home}-${getAggregate(m).away}</small>` : ''}${m.penalties ? `<small class="pen-note">pên. ${m.penalties.home}-${m.penalties.away}</small>` : ''}</div>
            <div class="team-display away">
              <span>${m.away.name}</span>
              ${getTeamLogoHTML(m.away.name, m.away.badge)}
            </div>
          </div>
          <div class="match-stats-panel">
            <div class="stat-row"><span class="stat-label">Chutes</span><span class="stat-val">${m.stats.homeShots} - ${m.stats.awayShots}</span></div>
            <div class="stat-row"><span class="stat-label">Posse</span><span class="stat-val">${m.stats.homePossession}% - ${m.stats.awayPossession}%</span></div>
            ${anyHuman ? `<div class="stat-row"><span class="stat-label">Cartões</span><span class="stat-val">${matchCardsText(m, 'home')} | ${matchCardsText(m, 'away')}</span></div>` : ''}
          </div>
          <div class="match-events">${m.events.map(e => `<div>${e}</div>`).join('')}</div>
        `;
        container.appendChild(box);
      });

      renderTopScorersUI();
      renderTournamentSidePanel();
      updateTacticsPanel();
    }

    function renderTopScorersUI() {
      const listEl = document.getElementById('top-scorers-list');
      if (!listEl) return;

      const sortedScorers = Object.keys(topScorers)
        .map(name => ({ name, ...topScorers[name] }))
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 5);

      if (sortedScorers.length === 0) {
        listEl.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted);">Nenhum gol marcado ainda.</div>`;
        return;
      }

      listEl.innerHTML = sortedScorers.map((s, idx) => `
        <div class="scorer-row">
          <span><b>${idx + 1}. ${s.name}</b> <small style="color:var(--text-muted);">(${s.team})</small></span>
          <span style="color:var(--accent-gold); font-weight:bold;">${s.goals} ⚽</span>
        </div>
      `).join('');
    }

    function renderTournamentSidePanel() {
      const groupsDiv = document.getElementById('groups-container');
      const bracketDiv = document.getElementById('bracket-list-container');

      if (tournamentStage !== 'PLAYOFFS') {
        groupsDiv.style.display = 'grid';
        bracketDiv.style.display = 'none';
        groupsDiv.innerHTML = '';

        Object.keys(tournamentData.groups).forEach(gKey => {
          const card = document.createElement('div');
          card.className = 'group-card';
          let rowsHTML = tournamentData.groups[gKey].map((t, idx) => `
            <tr>
              <td class="team-cell">${idx + 1}. ${getTeamLogoHTML(t.name, t.badge)} ${t.name}</td>
              <td><b>${t.pts}</b></td>
              <td>${t.pj}</td>
              <td>${t.sg}</td>
            </tr>
          `).join('');

          card.innerHTML = `
            <div class="group-card-title">Grupo ${gKey}</div>
            <table>
              <thead><tr><th style="text-align:left;">Time</th><th>P</th><th>J</th><th>SG</th></tr></thead>
              <tbody>${rowsHTML}</tbody>
            </table>
          `;
          groupsDiv.appendChild(card);
        });
      } else {
        groupsDiv.style.display = 'none';
        bracketDiv.style.display = 'flex';
        bracketDiv.innerHTML = '';

        const title = document.createElement('div');
        title.className = 'bracket-phase-title';
        title.innerText = 'Chaveamento Mata-Mata';
        bracketDiv.appendChild(title);

        if (tournamentData.bracket && tournamentData.bracket.matches) {
          tournamentData.bracket.matches.forEach(m => {
            const item = document.createElement('div');
            item.className = 'bracket-match-item';
            const agg = getAggregate(m);
            const decided = m.leg === 1 ? false : (agg.home !== agg.away || !!m.penWinner);
            const homeWin = decided && matchHomeWon(m);
            const awayWin = decided && !homeWin;
            item.innerHTML = `
              <div class="bracket-row">
                <span class="bracket-side home ${homeWin ? 'winner' : ''}">${getTeamLogoHTML(m.home.name, m.home.badge)} <span class="bracket-name">${m.home.name}</span></span>
                <span class="bracket-score">${m.homeScore} - ${m.awayScore}${m.penalties ? ` <small style="color:var(--accent-gold);">(${m.penalties.home}-${m.penalties.away} pen.)</small>` : ''}</span>
                <span class="bracket-side away ${awayWin ? 'winner' : ''}"><span class="bracket-name">${m.away.name}</span> ${getTeamLogoHTML(m.away.name, m.away.badge)}</span>
              </div>
              ${m.leg ? `<div style="text-align:center; font-size:0.7rem; color:var(--text-muted); margin-top:4px;">Final • ${m.leg === 1 ? 'Jogo de Ida' : `Volta • Ida: ${m.away.name} ${m.firstLeg.homeScore} x ${m.firstLeg.awayScore} ${m.home.name} • Agregado: ${agg.home} - ${agg.away}`}</div>` : ''}
            `;
            bracketDiv.appendChild(item);
          });
        }
      }
    }
