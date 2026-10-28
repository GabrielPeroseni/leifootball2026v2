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
    }

    function renderPodiumPrizes() {
      const box = document.getElementById('podium-prizes');
      if (!box) return;
      const list = playoffResults.prizes || [];
      if (!list.length) { box.style.display = 'none'; box.innerHTML = ''; return; }
      const label = { 1: '🥇 Campeão', 2: '🥈 Vice', 3: '🥉 3º lugar' };
      box.style.display = 'block';
      box.innerHTML = `<div class="podium-prizes-title">🎁 Prêmios da Temporada</div>` +
        list.map(p => {
          const parts = [`+${p.tokens} tokens`];
          if (p.swaps) parts.push(`+${p.swaps} troca${p.swaps > 1 ? 's' : ''}`);
          if (p.passes) parts.push(`+${p.passes} recusas`);
          return `<div class="prize-row"><span>${label[p.place]} — <b>${soEsc(p.name)}</b></span><span class="prize-val">${parts.join(' • ')}</span></div>`;
        }).join('') +
        `<div class="prize-note">Os tokens entram agora; as trocas e recusas extras valem a partir da próxima temporada.</div>`;
    }
