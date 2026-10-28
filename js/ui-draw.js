    // ---------- Sorteio das oitavas (bolas e papéis) ----------
    const DR_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#eab308'];

    function drawBowlBalls(n) {
      let html = '';
      for (let i = 0; i < n; i++) {
        const left = 6 + ((i * 37) % 70), top = 12 + ((i * 53) % 68);
        html += `<span class="dr-mini" style="left:${left}%; top:${top}%; --c:${DR_COLORS[i % DR_COLORS.length]}; animation-delay:${(i % 6) * -0.18}s"></span>`;
      }
      soEl('dr-bowl').innerHTML = html;
    }

    function renderDrawOverlay() {
      const ov = soEl('draw-overlay');
      if (!ov) return;
      const st = drawState, L = drawLocal;

      if (!st || !st.active) {
        ov.style.display = 'none';
        L.timers.forEach(clearTimeout);
        L.timers = []; L.id = null; L.handled = 0; L.placed = 0;
        return;
      }
      ov.style.display = 'flex';

      if (L.id !== st.id) {   // novo sorteio
        L.timers.forEach(clearTimeout);
        L.timers = []; L.id = st.id; L.handled = 0; L.placed = 0;
        soEl('dr-sub').textContent = `${st.total} classificados • uma bola por vez • os confrontos saem na ordem do sorteio`;
        soEl('dr-status').textContent = 'O sorteio vai começar...';
        soEl('dr-banner').className = 'dr-banner';
        soEl('dr-banner').textContent = '';
        let html = '';
        for (let m = 0; m < st.total / 2; m++) {
          html += `<div class="dr-match"><div class="dr-match-title">Jogo ${m + 1}</div>` +
                  `<div class="dr-slot" id="dr-slot-${2 * m}"><span>?</span></div><div class="dr-vs">x</div>` +
                  `<div class="dr-slot" id="dr-slot-${2 * m + 1}"><span>?</span></div></div>`;
        }
        soEl('dr-bracket').innerHTML = html;
        drawBowlBalls(st.total);
        soEl('dr-paper').style.opacity = '0';
        soEl('dr-ball').style.opacity = '0';
      }

      for (let i = L.handled; i < st.teams.length; i++) {
        L.handled = i + 1;
        if (i === st.teams.length - 1) startDrawPick(i);
        else L.placed = Math.max(L.placed, i + 1);   // chegou atrasado: coloca direto na chave
      }
      drawBracketSlots();
    }

    function startDrawPick(i) {
      const st = drawState, L = drawLocal;
      const t = st.teams[i];
      const matchNo = Math.floor(i / 2) + 1;
      const role = i % 2 === 0 ? 'mandante' : 'visitante';
      const ball = soEl('dr-ball'), inner = soEl('dr-ball-in'), paper = soEl('dr-paper');

      soEl('dr-status').textContent = `Sorteando o time ${i + 1} de ${st.total}…`;
      drawBowlBalls(st.total - (i + 1));
      paper.innerHTML = `${getTeamLogoHTML(t.name, t.badge)}<div class="p-name">${soEsc(t.name)}</div><div class="p-info">Jogo ${matchNo} • ${role}</div>`;

      // posição inicial: dentro do globo
      paper.style.transition = 'none';
      paper.style.opacity = '0';
      paper.style.transform = 'translate(-50%, -50%) scale(0.2) rotate(-6deg)';
      ball.style.transition = 'none';
      ball.style.left = 'calc(4% + 65px)';
      ball.style.top = '115px';
      ball.style.opacity = '0';
      ball.style.transform = 'translate(-50%, -50%) scale(0.35)';
      ball.style.setProperty('--bc', DR_COLORS[i % DR_COLORS.length]);
      inner.className = 'dr-ball-in';
      void ball.offsetWidth;

      // 1) a bola sai do globo e vai ao centro
      L.timers.push(setTimeout(() => {
        ball.style.transition = 'left .9s ease-in-out, top .9s ease-in-out, transform .9s ease-in-out, opacity .3s';
        ball.style.left = '66%';
        ball.style.top = '125px';
        ball.style.opacity = '1';
        ball.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 150));
      // 2) a bola balança
      L.timers.push(setTimeout(() => { inner.className = 'dr-ball-in wiggle'; }, 1250));
      // 3) a bola abre e o papel com o nome aparece
      L.timers.push(setTimeout(() => {
        inner.className = 'dr-ball-in open';
        paper.style.transition = 'transform .6s ease-out, opacity .5s';
        paper.style.opacity = '1';
        paper.style.transform = 'translate(-50%, -50%) scale(1) rotate(-2deg)';
        soEl('dr-status').textContent = `🎉 ${t.name} — Jogo ${matchNo} (${role})`;
      }, 1900));
      L.timers.push(setTimeout(() => { ball.style.opacity = '0'; }, 2600));
      // 4) o papel voa até a chave
      L.timers.push(setTimeout(() => {
        const slot = soEl('dr-slot-' + i);
        if (!slot) return;
        slot.classList.add('target');
        const pr = paper.getBoundingClientRect(), sr = slot.getBoundingClientRect();
        const dx = (sr.left + sr.width / 2) - (pr.left + pr.width / 2);
        const dy = (sr.top + sr.height / 2) - (pr.top + pr.height / 2);
        paper.style.transition = 'transform .9s ease-in, opacity .9s ease-in';
        paper.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.18) rotate(0deg)`;
        paper.style.opacity = '0.9';
      }, 3700));
      // 5) o time entra na chave
      L.timers.push(setTimeout(() => {
        const slot = soEl('dr-slot-' + i);
        if (slot) slot.classList.remove('target');
        paper.style.transition = 'none';
        paper.style.opacity = '0';
        L.placed = Math.max(L.placed, i + 1);
        drawBracketSlots();
      }, 4700));
    }

    function drawBracketSlots() {
      const st = drawState, L = drawLocal;
      if (!st) return;
      const myTeamId = teams[myPlayerId] ? teams[myPlayerId].id : null;
      for (let i = 0; i < st.total; i++) {
        const el = soEl('dr-slot-' + i);
        const t = st.teams[i];
        if (!el || !t || i >= L.placed || el.dataset.f === '1') continue;
        el.dataset.f = '1';
        el.className = 'dr-slot filled' + ((t.isHuman && t.id === myTeamId) ? ' mine' : '');
        el.innerHTML = `${getTeamLogoHTML(t.name, t.badge)}<span>${t.isHuman ? '⭐ ' : ''}${soEsc(t.name)}</span>`;
      }
      const banner = soEl('dr-banner');
      if (st.finished && L.placed >= st.teams.length) {
        soEl('dr-status').textContent = 'Chave completa!';
        banner.textContent = '✅ Chave das oitavas definida! Que comecem os jogos!';
        banner.className = 'dr-banner show';
      }
    }
