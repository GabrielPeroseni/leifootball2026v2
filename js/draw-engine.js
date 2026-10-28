    // Host: sorteio das oitavas — uma bola por vez, 5 segundos por time, montando a chave
    function runOitavasDraw(winners, done) {
      if (drawTimer) { clearTimeout(drawTimer); drawTimer = null; }
      const order = winners.slice();
      for (let i = order.length - 1; i > 0; i--) {          // embaralha (Fisher-Yates)
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      drawState = {
        active: true,
        id: 'dr_' + Date.now() + '_' + Math.floor(Math.random() * 1e6),
        total: order.length,
        teams: [],
        finished: false
      };
      broadcastState();

      let i = 0;
      const step = () => {
        if (i < order.length) {
          const t = order[i];
          drawState.teams = drawState.teams.concat([{ id: t.id, name: t.name, badge: t.badge, isHuman: !!t.isHuman }]);
          i++;
          broadcastState();
          drawTimer = setTimeout(step, DRAW_STEP_MS);
        } else {
          drawState.finished = true;
          broadcastState();
          drawTimer = setTimeout(() => {
            drawState = null;
            drawTimer = null;
            broadcastState();
            done(order);
          }, DRAW_END_MS);
        }
      };
      drawTimer = setTimeout(step, DRAW_INTRO_MS);
    }

    function stopDraw() {
      if (drawTimer) { clearTimeout(drawTimer); drawTimer = null; }
      drawState = null;
      renderDrawOverlay();
    }
