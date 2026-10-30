    // ===== TELA DE RESUMO ENTRE OS CAMPEONATOS DA TEMPORADA =====
    function renderCompSummary() {
      const ov = document.getElementById('comp-summary-screen');
      if (!ov) return;
      if (!compSummary) { ov.style.display = 'none'; return; }
      ov.style.display = 'flex';

      document.getElementById('cs-title').innerText = compSummary.title || '';
      document.getElementById('cs-sub').innerText = compSummary.sub || '';

      let html = (compSummary.sections || []).map(sec => `
        <div class="cs-section">
          <div class="cs-section-title">${soEsc(sec.h)}</div>
          ${sec.rows.map(r => `
            <div class="cs-row${r.isHuman ? ' human' : ''}">
              <span class="cs-label">${soEsc(r.label)}</span>
              <span class="cs-team"><span class="cs-badge">${getTeamLogoHTML(r.name, r.badge)}</span>${r.isHuman ? '⭐ ' : ''}${soEsc(r.name)}</span>
            </div>
          `).join('')}
        </div>
      `).join('');

      const prizes = compSummary.prizes || [];
      if (prizes.length) {
        const label = { 1: '🥇 Campeão', 2: '🥈 Vice', 3: '🥉 3º lugar', 4: '4º lugar' };
        html += `<div class="cs-section cs-prizes"><div class="cs-section-title">🎁 Prêmios conquistados</div>` +
          prizes.map(p => {
            const parts = [`+${p.tokens} tokens`];
            if (p.swaps) parts.push(`+${p.swaps} troca${p.swaps > 1 ? 's' : ''}`);
            if (p.passes) parts.push(`+${p.passes} recusa${p.passes > 1 ? 's' : ''}`);
            return `<div class="cs-row human"><span class="cs-label">${label[p.place] || (p.place + 'º')}</span><span class="cs-team"><b>${soEsc(p.name)}</b> — ${parts.join(' • ')}</span></div>`;
          }).join('') +
          `<div class="cs-note">Os tokens entram agora; as trocas e recusas extras valem a partir da próxima temporada. Os prêmios se acumulam entre os campeonatos.</div></div>`;
      } else {
        html += `<div class="cs-note">Nenhum time de jogador conquistou prêmios neste campeonato.</div>`;
      }

      document.getElementById('cs-body').innerHTML = html;
      document.getElementById('cs-next').innerText = '▶️ Continuar';
    }

    function handleCompNext() {
      if (!compSummary) return;
      sendActionToHost('NEXT_COMP', { id: compSummary.id });
    }

    // Campeões de todos os campeonatos da temporada (mostrado no pódio final)
    function renderSeasonLog() {
      const box = document.getElementById('season-log-box');
      if (!box) return;
      const rows = (seasonLog || []).map(l => ({ comp: l.comp, champion: l.champion, human: l.championHuman, vice: l.runnerUp }));
      if (playoffResults && playoffResults.champion) {
        const humanIds = teams.slice(0, playerCount).map(t => t.id);
        rows.push({ comp: 'Estadualzão', champion: playoffResults.champion, human: humanIds.includes(playoffResults.championId), vice: playoffResults.runnerUp });
      }
      if (!rows.length) { box.style.display = 'none'; box.innerHTML = ''; return; }
      box.style.display = 'block';
      box.innerHTML = `<div class="season-stats-title">🏆 Campeões da ${currentSeason}ª Temporada</div>` +
        rows.map(r => `<div class="log-row"><span class="log-comp">${soEsc(r.comp)}</span><span class="log-champ">${r.human ? '⭐ ' : ''}${soEsc(r.champion)}${r.vice ? ` <small>(vice: ${soEsc(r.vice)})</small>` : ''}</span></div>`).join('');
    }
