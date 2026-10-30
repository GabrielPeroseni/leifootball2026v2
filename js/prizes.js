    // Prêmios da temporada: campeão, vice e 3º (os dois semifinalistas). Só times de jogadores reais.
    function awardSeasonPrizes() {
      if (playoffResults.prizes) return;
      const list = [];
      const give = (teamId, place) => {
        if (teamId === null || teamId === undefined) return;
        const t = teams.find(x => x.id === teamId);          // bots não estão em "teams"
        if (!t) return;
        const pz = SEASON_PRIZES[place];
        t.tokens += pz.tokens;
        t.bonusSwaps = (t.bonusSwaps || 0) + pz.swaps;
        t.bonusPasses = (t.bonusPasses || 0) + pz.passes;
        list.push({ teamId: t.id, name: t.name, place, tokens: pz.tokens, swaps: pz.swaps, passes: pz.passes });
      };
      give(playoffResults.championId, 1);
      give(playoffResults.runnerUpId, 2);
      (playoffResults.semifinalistIds || []).forEach(id => give(id, 3));
      playoffResults.prizes = list;
      list.forEach(p => seasonPrizes.push({ comp: 'Estadualzão', ...p }));   // entra no acumulado da temporada
      list.filter(p => p.place === 1).forEach(p => addTitle(p.teamId, 'Estadualzão'));
    }

    function renderPodiumPrizes() {
      const box = document.getElementById('podium-prizes');
      if (!box) return;
      const list = seasonPrizes || [];
      if (!list.length) { box.style.display = 'none'; box.innerHTML = ''; return; }
      const label = { 1: '🥇 Campeão', 2: '🥈 Vice', 3: '🥉 3º lugar', 4: '4º lugar' };
      const comps = [];
      list.forEach(p => { if (!comps.includes(p.comp)) comps.push(p.comp); });
      box.style.display = 'block';
      box.innerHTML = `<div class="podium-prizes-title">🎁 Prêmios da Temporada (acumulados)</div>` +
        comps.map(c => `<div class="prize-comp">${soEsc(c)}</div>` + list.filter(p => p.comp === c).map(p => {
          const parts = [`+${p.tokens} tokens`];
          if (p.swaps) parts.push(`+${p.swaps} troca${p.swaps > 1 ? 's' : ''}`);
          if (p.passes) parts.push(`+${p.passes} recusas`);
          return `<div class="prize-row"><span>${label[p.place] || (p.place + 'º')} — <b>${soEsc(p.name)}</b></span><span class="prize-val">${parts.join(' • ')}</span></div>`;
        }).join('')).join('') +
        `<div class="prize-note">Os tokens entram na hora; as trocas e recusas extras valem a partir da próxima temporada.</div>`;
    }
