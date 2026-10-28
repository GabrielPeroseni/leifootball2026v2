    // ---------- Animação da disputa (todos os jogadores veem) ----------
    const SO_X = { L: 20, C: 50, R: 80 };
    const SO_SPOT_Y = 232;
    const SO_RESULT_TEXT = { goal: 'GOL!', save: 'DEFENDEU!', miss: 'PRA FORA!', post: 'NA TRAVE!' };

    function soEsc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function soEl(id) { return document.getElementById(id); }

    function resetShootoutScene() {
      const ball = soEl('so-ball'), keeper = soEl('so-keeper'), flash = soEl('so-flash');
      ball.style.transition = 'none';
      ball.style.left = '50%';
      ball.style.top = SO_SPOT_Y + 'px';
      ball.style.transform = 'translate(-50%, -50%) scale(1)';
      keeper.style.transition = 'none';
      keeper.style.left = '50%';
      keeper.style.top = '78px';
      keeper.style.transform = 'translateX(-50%) rotate(0deg)';
      flash.className = 'so-flash';
      flash.textContent = '';
      void ball.offsetWidth;
    }

    function renderShootoutOverlay() {
      const ov = soEl('shootout-overlay');
      if (!ov) return;
      const st = shootoutState, L = shootoutLocal;

      if (!st || !st.active) {
        ov.style.display = 'none';
        L.timers.forEach(clearTimeout);
        endShootoutChoice();
        L.timers = []; L.id = null; L.handled = 0; L.shown = 0;
        return;
      }
      ov.style.display = 'flex';

      if (L.id !== st.id) {   // nova disputa
        L.timers.forEach(clearTimeout);
        endShootoutChoice();
        L.timers = []; L.id = st.id; L.handled = 0; L.shown = 0;
        soEl('so-stage').textContent = '⚽ Disputa de Pênaltis';
        soEl('so-sub').textContent = `${st.stageLabel} • Tempo normal: ${st.home.name} ${st.regularScore} ${st.away.name} • 5 cobranças alternadas, morte súbita se persistir o empate • Batedor e goleiro escolhem o canto em 5s`;
        soEl('so-home').innerHTML = `${getTeamLogoHTML(st.home.name, st.home.badge)}<span class="so-team-name">${soEsc(st.home.name)}</span>`;
        soEl('so-away').innerHTML = `<span class="so-team-name">${soEsc(st.away.name)}</span>${getTeamLogoHTML(st.away.name, st.away.badge)}`;
        soEl('so-row-home-name').textContent = st.home.name;
        soEl('so-row-away-name').textContent = st.away.name;
        soEl('so-banner').className = 'so-banner';
        soEl('so-banner').innerHTML = '';
        soEl('so-kicker').textContent = `🪙 Sorteio da moeda: ${st[st.first].name} cobra primeiro`;
        resetShootoutScene();
      }

      // escolha do canto (chutar / defender)
      if (st.pending) {
        if (L.pendingSeq !== st.pending.seq) startShootoutChoice(st.pending);
        else updateShootoutPrompt();
      } else if (L.pendingSeq !== null) {
        endShootoutChoice();
      }

      for (let i = L.handled; i < st.kicks.length; i++) {
        L.handled = i + 1;
        if (i === st.kicks.length - 1 && !st.pending) startShootoutKick(i);
        else L.shown = Math.max(L.shown, i + 1);   // chegou atrasado (ou já há nova escolha): mostra o resultado direto
      }
      drawShootoutBoard();
    }

    // ---- fase de escolha: 6 cantos, 5 segundos ----
    function startShootoutChoice(p) {
      const st = shootoutState, L = shootoutLocal;
      const myTeamId = teams[myPlayerId] ? teams[myPlayerId].id : null;
      L.pendingSeq = p.seq;
      L.chosen = false;
      L.deadline = Date.now() + p.ms;
      L.role = (myTeamId !== null && p.kickTeamId === myTeamId) ? 'kick'
             : ((myTeamId !== null && p.keepTeamId === myTeamId) ? 'keep' : null);

      const kickTeam = st[p.side], defTeam = st[p.side === 'home' ? 'away' : 'home'];
      const nth = st.kicks.filter(x => x.side === p.side).length + 1;
      resetShootoutScene();
      soEl('so-keeper').style.background = (defTeam.badge && defTeam.badge.c1) || '#f59e0b';
      soEl('so-kicker').innerHTML = `🦵 ${soEsc(p.kicker)} <span style="color:#94a3b8; font-weight:600;">(${soEsc(kickTeam.name)}) • ${nth}ª cobrança</span>`;

      const zones = soEl('so-zones');
      zones.className = 'so-zones ' + (L.role === 'keep' ? 'keep' : 'kick');
      zones.style.display = L.role ? 'grid' : 'none';
      zones.querySelectorAll('.so-zone').forEach(z => z.classList.remove('picked', 'locked'));

      const bar = soEl('so-timerbar'), fill = soEl('so-timerfill');
      bar.style.display = 'block';
      fill.style.transition = 'none';
      fill.style.width = '100%';
      void fill.offsetWidth;
      fill.style.transition = `width ${p.ms}ms linear`;
      fill.style.width = '0%';

      if (L.countInt) clearInterval(L.countInt);
      L.countInt = setInterval(updateShootoutPrompt, 150);
      updateShootoutPrompt();
    }

    function updateShootoutPrompt() {
      const st = shootoutState, L = shootoutLocal;
      const el = soEl('so-prompt');
      if (!el) return;
      const p = st && st.pending;
      if (!p) { el.textContent = ''; el.className = 'so-prompt'; return; }
      const left = Math.max(0, Math.ceil((L.deadline - Date.now()) / 1000));
      let txt;
      if (L.role === 'kick') txt = L.chosen ? '✅ Chute escolhido! Aguardando o goleiro...' : `🦵 VOCÊ CHUTA! Escolha o canto (${left}s)`;
      else if (L.role === 'keep') txt = L.chosen ? '✅ Pulo escolhido! Aguardando o batedor...' : `🧤 VOCÊ DEFENDE! Escolha para onde pular (${left}s)`;
      else txt = `⏳ Batedor e goleiro estão escolhendo... (${left}s)`;
      el.textContent = txt;
      el.className = 'so-prompt ' + (L.role || '');
    }

    function endShootoutChoice() {
      const L = shootoutLocal;
      if (L.countInt) { clearInterval(L.countInt); L.countInt = null; }
      L.pendingSeq = null;
      L.role = null;
      L.chosen = false;
      const zones = soEl('so-zones'), bar = soEl('so-timerbar'), prompt = soEl('so-prompt');
      if (zones) { zones.style.display = 'none'; zones.className = 'so-zones'; }
      if (bar) bar.style.display = 'none';
      if (prompt) { prompt.textContent = ''; prompt.className = 'so-prompt'; }
    }

    // clique do jogador em um dos 6 cantos
    function soChoose(dir, height) {
      const st = shootoutState, L = shootoutLocal;
      if (!st || !st.pending || !L.role || L.chosen) return;
      L.chosen = true;
      const zones = soEl('so-zones');
      zones.querySelectorAll('.so-zone').forEach(z => z.classList.add('locked'));
      zones.classList.add('locked-all');
      const z = soEl(`so-zone-${dir}-${height}`);
      if (z) z.classList.add('picked');
      sendActionToHost('SO_CHOICE', { seq: st.pending.seq, dir, height });
      updateShootoutPrompt();
    }

    function startShootoutKick(i) {
      const st = shootoutState, L = shootoutLocal;
      const k = st.kicks[i];
      const kickTeam = st[k.side], defTeam = st[k.side === 'home' ? 'away' : 'home'];
      const nth = st.kicks.slice(0, i + 1).filter(x => x.side === k.side).length;

      soEl('so-kicker').innerHTML = `🦵 ${soEsc(k.kicker)} <span style="color:#94a3b8; font-weight:600;">(${soEsc(kickTeam.name)}) • ${nth}ª cobrança</span>`;
      resetShootoutScene();
      const keeperEl = soEl('so-keeper');
      keeperEl.style.background = (defTeam.badge && defTeam.badge.c1) || '#f59e0b';

      // 1) preparação  2) chute e pulo do goleiro  3) resultado
      L.timers.push(setTimeout(() => {
        const ball = soEl('so-ball'), keeper = soEl('so-keeper');
        let x = SO_X[k.dir], y = k.height === 'T' ? 40 : 118;
        if (k.outcome === 'miss') {
          if (k.missType === 'over') y = -30;
          else { x = k.dir === 'L' ? -6 : 106; y = 70; }
        } else if (k.outcome === 'post') {
          x = k.dir === 'L' ? 6 : 94; y = 70;
        }
        ball.style.transition = 'left .6s ease-out, top .6s ease-in-out, transform .6s ease-out';
        ball.style.left = x + '%';
        ball.style.top = y + 'px';
        ball.style.transform = 'translate(-50%, -50%) scale(0.62)';

        const kx = { L: 22, C: 50, R: 78 }[k.keeperDir];
        const rot = { L: -65, C: 0, R: 65 }[k.keeperDir];
        const kh = k.keeperHeight || k.height;
        keeper.style.transition = 'left .55s ease-out, top .55s ease-out, transform .55s ease-out';
        keeper.style.left = kx + '%';
        keeper.style.top = (kh === 'T' ? 52 : 90) + 'px';
        keeper.style.transform = `translateX(-50%) rotate(${rot}deg)`;
      }, 700));

      if (k.outcome === 'post') {   // bate na trave e volta
        L.timers.push(setTimeout(() => {
          const ball = soEl('so-ball');
          ball.style.transition = 'left .4s ease-out, top .4s ease-in';
          ball.style.left = (k.dir === 'L' ? 22 : 78) + '%';
          ball.style.top = '150px';
        }, 700 + 600));
      }

      L.timers.push(setTimeout(() => revealShootoutKick(i), 700 + 800));
    }

    function revealShootoutKick(i) {
      const st = shootoutState, L = shootoutLocal;
      if (!st || !st.active || !st.kicks[i]) return;
      L.shown = Math.max(L.shown, i + 1);
      const k = st.kicks[i];
      const flash = soEl('so-flash');
      flash.textContent = SO_RESULT_TEXT[k.outcome];
      flash.className = 'so-flash show ' + (k.outcome === 'goal' ? 'goal' : 'bad');
      drawShootoutBoard();
    }

    function drawShootoutBoard() {
      const st = shootoutState, L = shootoutLocal;
      if (!st) return;

      let gh = 0, ga = 0;
      st.kicks.forEach((k, idx) => {
        if (idx < L.shown && k.outcome === 'goal') { if (k.side === 'home') gh++; else ga++; }
      });
      soEl('so-score').textContent = `${gh} - ${ga}`;

      ['home', 'away'].forEach(side => {
        const mine = [];
        st.kicks.forEach((k, idx) => { if (k.side === side) mine.push({ k, idx }); });
        const total = Math.max(5, mine.length);
        let html = '';
        for (let j = 0; j < total; j++) {
          const e = mine[j];
          if (!e) html += '<span class="so-slot"></span>';
          else if (e.idx < L.shown) html += e.k.outcome === 'goal' ? '<span class="so-slot ok">✓</span>' : '<span class="so-slot bad">✗</span>';
          else html += '<span class="so-slot live">⚽</span>';
        }
        soEl('so-slots-' + side).innerHTML = html;
      });

      const banner = soEl('so-banner');
      if (st.finished && L.shown >= st.kicks.length) {
        const w = st[st.winner];
        banner.innerHTML = `🏆 ${soEsc(w.name)} vence nos pênaltis!<small>${st.homeGoals} x ${st.awayGoals}</small>`;
        banner.className = 'so-banner show';
      } else {
        banner.className = 'so-banner';
        banner.innerHTML = '';
      }
    }
