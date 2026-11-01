// Estadualzão 5x5 — sala, rede (PeerJS), telas, controles e desenho
    /* =====================================================================
       ESTADUALZÃO 5x5 — SALA, REDE, TELAS, CONTROLES E DESENHO
       ===================================================================== */
    let fsRoom = null, fsPeer = null, fsConns = {}, fsHostConn = null, fsIsHost = true, fsMyId = 0, fsNextId = 1;
    let fsG = null, fsLoop = null, fsEnded = false, fsView = null, fsSnaps = [], fsRAF = null, fsInputTimer = null;
    let fsKeys = {}, fsPaSeq = 0, fsJoyV = [0, 0], fsTouchShoot = false, fsTouchSprint = false, fsKeysBound = false;
    let fsPred = null, fsAcc = 0, fsLastLoop = 0, fsSnapN = 0, fsInGame = false, fsAudio = null, fsLastSent = '', fsLastSentT = 0;
    let fsHudCache = {}, fsRetry = 0, fsTimers = [];

    const fsEl = id => document.getElementById(id);
    const FS_SCREENS = ['main-menu-screen', 'career-setup-screen', 'career-hub-screen', 'fs-setup-screen', 'fs-hub-screen', 'setup-screen'];
    function fsShowOnly(id) {
      FS_SCREENS.forEach(s => { const e = fsEl(s); if (e) e.style.display = 'none'; });
      fsEl('fs-game-screen').style.display = 'none';
      if (id) fsEl(id).style.display = 'flex';
    }
    function fsLater(fn, ms) { const t = setTimeout(fn, ms); fsTimers.push(t); return t; }

    /* ---------- formulários ---------- */
    function fsNick() { return (fsEl('fs-nick').value.trim() || 'Craque').slice(0, 14); }
    function fsTeamForm() {
      const name = fsEl('fs-t-name').value.trim() || 'Estrelas FC';
      return { name, short: (fsEl('fs-t-short').value.trim() || crShort(name)).toUpperCase().slice(0, 3),
        c1: fsEl('fs-t-c1').value, c2: fsEl('fs-t-c2').value, icon: fsEl('fs-t-icon').value };
    }
    function fsCfgForm() { return { teams: +fsEl('fs-cfg-teams').value, dur: +fsEl('fs-cfg-dur').value, diff: +fsEl('fs-cfg-diff').value }; }
    function fsUpdateTeamPreview() {
      const t = fsTeamForm();
      fsEl('fs-t-badge').innerHTML = crBadge({ short: t.short, c1: t.c1, c2: t.c2, icon: t.icon }, 44);
      fsEl('fs-t-prev').textContent = t.name;
    }
    function fsBadgeOf(t, size) { return crBadge({ short: t.short, c1: t.c1, c2: t.c2, icon: t.icon || null }, size || 36); }

    function fsOpenSetup() {
      if (!crAllTeams.length) crBuildTeams();
      fsShowOnly('fs-setup-screen');
      fsEl('fs-stage-connect').style.display = 'flex';
      fsEl('fs-stage-lobby').style.display = 'none';
      fsUpdateTeamPreview();
    }

    /* ---------- sala ---------- */
    function fsInitRoom(mode) {
      fsRoom = { mode, code: '', cfg: fsCfgForm(), team: fsTeamForm(), players: { 0: { name: fsNick(), role: null } }, phase: 'LOBBY', tourney: null };
      fsIsHost = true; fsMyId = 0; fsNextId = 1; fsConns = {};
    }

    function fsSolo() { fsInitRoom('solo'); fsRoom.code = 'SOLO'; fsRoute(); }

    function fsRandomCode() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }

    function fsHostRoom() {
      if (typeof Peer === 'undefined') { crToast('Não foi possível carregar a biblioteca de rede (PeerJS). Verifique a internet.'); return; }
      fsInitRoom('host'); fsRetry = 0;
      fsEl('fs-conn-status').textContent = 'Criando sala...';
      fsOpenPeerAsHost();
    }
    function fsOpenPeerAsHost() {
      const code = fsRandomCode();
      try { if (fsPeer) fsPeer.destroy(); } catch (e) { }
      fsPeer = new Peer('fm26fs-' + code);
      fsPeer.on('open', () => { fsRoom.code = code; fsEl('fs-conn-status').textContent = ''; fsRoute(); });
      fsPeer.on('error', e => {
        if (e.type === 'unavailable-id' && fsRetry++ < 6) { fsOpenPeerAsHost(); return; }
        fsEl('fs-conn-status').textContent = 'Erro de rede: ' + e.type;
      });
      fsPeer.on('connection', conn => conn.on('open', () => fsOnConn(conn)));
    }

    function fsOnConn(conn) {
      if (!fsRoom || fsRoom.phase === 'MATCH') { conn.send({ t: 'deny', msg: 'Partida em andamento. Tente entrar quando ela acabar.' }); fsLater(() => conn.close(), 400); return; }
      if (Object.keys(fsRoom.players).length >= 5) { conn.send({ t: 'deny', msg: 'Sala cheia (máximo de 5 jogadores).' }); fsLater(() => conn.close(), 400); return; }
      const id = fsNextId++;
      fsConns[id] = conn;
      fsRoom.players[id] = { name: 'Jogador ' + id, role: null };
      conn.send({ t: 'welcome', id });
      conn.on('data', d => fsHostOnData(id, d));
      conn.on('close', () => fsDropPlayer(id));
      conn.on('error', () => fsDropPlayer(id));
      fsPush();
    }

    function fsDropPlayer(id) {
      if (!fsRoom || !fsRoom.players[id]) return;
      delete fsRoom.players[id]; delete fsConns[id];
      if (fsG) fsG.players.forEach(p => { if (p.h === id) { p.h = null; p.name = null; p.spd = 0.96; } });
      fsPush();
    }

    function fsJoinRoom() {
      if (typeof Peer === 'undefined') { crToast('Não foi possível carregar a biblioteca de rede (PeerJS). Verifique a internet.'); return; }
      const code = fsEl('fs-join-code').value.trim().toUpperCase();
      if (!code) { crToast('Digite o código da sala.'); return; }
      fsIsHost = false; fsMyId = -1;
      fsEl('fs-conn-status').textContent = 'Conectando...';
      try { if (fsPeer) fsPeer.destroy(); } catch (e) { }
      fsPeer = new Peer();
      fsPeer.on('open', () => {
        fsHostConn = fsPeer.connect('fm26fs-' + code, { reliable: true });
        fsHostConn.on('open', () => fsHostConn.send({ t: 'hello', name: fsNick() }));
        fsHostConn.on('data', fsClientOnData);
        fsHostConn.on('close', () => { if (fsRoom) { crToast('A conexão com o host foi encerrada.'); fsExit(); } });
      });
      fsPeer.on('error', e => { fsEl('fs-conn-status').textContent = e.type === 'peer-unavailable' ? 'Sala não encontrada. Confira o código.' : 'Erro de rede: ' + e.type; });
    }

    function fsSend(conn, msg) { try { conn.send(msg); } catch (e) { } }
    function fsBroadcast(msg) { Object.values(fsConns).forEach(c => fsSend(c, msg)); }
    function fsPublic() { return { code: fsRoom.code, cfg: fsRoom.cfg, team: fsRoom.team, players: fsRoom.players, phase: fsRoom.phase, tourney: fsRoom.tourney, mode: fsRoom.mode }; }
    function fsPush() { fsBroadcast({ t: 'room', room: fsPublic() }); fsRoute(); }

    function fsHostOnData(id, d) {
      if (!d || !fsRoom || !fsRoom.players[id]) return;
      if (d.t === 'hello') { fsRoom.players[id].name = String(d.name || 'Jogador').slice(0, 14); fsPush(); }
      else if (d.t === 'claim') fsHostClaim(id, d.role);
      else if (d.t === 'in' && fsG) {
        const p = fsG.players.find(q => q.h === id);
        if (p && d.i) p.inp = { mx: +d.i.mx || 0, my: +d.i.my || 0, sp: d.i.sp ? 1 : 0, sh: d.i.sh ? 1 : 0, pa: d.i.pa | 0 };
      }
    }

    function fsClientOnData(d) {
      if (!d) return;
      if (d.t === 'welcome') fsMyId = d.id;
      else if (d.t === 'deny') { crToast(d.msg); fsEl('fs-conn-status').textContent = d.msg; }
      else if (d.t === 'room') { fsRoom = d.room; fsRoute(); }
      else if (d.t === 'mstart') { fsView = d.view; fsStartClientMatch(); }
      else if (d.t === 'snap' && fsInGame) { fsSnaps.push({ t: performance.now(), s: d.s }); if (fsSnaps.length > 30) fsSnaps.shift(); (d.s.s || []).forEach(fsSfx); }
      else if (d.t === 'mend') fsShowEnd(d.gu, d.go, d.pen);
    }

    function fsClaim(role) {
      if (!fsRoom) return;
      if (fsIsHost) fsHostClaim(fsMyId, role);
      else if (fsHostConn) fsSend(fsHostConn, { t: 'claim', role });
    }
    function fsHostClaim(id, role) {
      const pl = fsRoom.players[id]; if (!pl) return;
      if (pl.role === role) { pl.role = null; fsPush(); return; }
      const holder = Object.entries(fsRoom.players).find(([k, v]) => v.role === role);
      if (holder) return;
      pl.role = role; fsPush();
    }

    /* ---------- roteamento de telas ---------- */
    function fsRoute() {
      if (!fsRoom) return;
      if (fsInGame) { return; }
      if (fsRoom.phase === 'LOBBY') {
        fsShowOnly('fs-setup-screen');
        fsEl('fs-stage-connect').style.display = 'none';
        fsEl('fs-stage-lobby').style.display = 'flex';
        fsRenderLobby();
      } else if (fsRoom.phase === 'HUB' || fsRoom.phase === 'MATCH') {
        fsShowOnly('fs-hub-screen');
        fsRenderHub();
      }
    }

    function fsRenderLobby() {
      const R = fsRoom, icons = { GK: '🧤', FX: '🛡️', AE: '⬅️', AD: '➡️', PV: '🎯' };
      fsEl('fs-room-code').textContent = R.code || '-----';
      fsEl('fs-room-mode').textContent = R.mode === 'solo' ? 'Solo' : (fsIsHost ? 'Você é o host' : 'Convidado');
      fsEl('fs-roles').innerHTML = FS_ROLE_ORDER.map(role => {
        const h = Object.entries(R.players).find(([k, v]) => v.role === role);
        const mine = h && +h[0] === fsMyId;
        return `<div class="fs-role ${mine ? 'mine' : ''} ${h && !mine ? 'taken' : ''}" onclick="fsClaim('${role}')">
          <div class="ico">${icons[role]}</div><div class="rn">${FS_ROLES[role].name}</div><div class="rd">${FS_ROLES[role].desc}</div>
          <div class="who">${h ? (mine ? '✔ ' : '') + crEsc(h[1].name) : '🤖 IA'}</div></div>`;
      }).join('');
      const n = Object.keys(R.players).length;
      fsEl('fs-lobby-info').textContent = `${n} jogador${n > 1 ? 'es' : ''} • ${R.cfg.teams} times • partidas de ${R.cfg.dur >= 120 ? (R.cfg.dur / 60) + ' min' : R.cfg.dur + 's'} • time: ${R.team.name}`;
      fsEl('fs-btn-start').style.display = fsIsHost ? '' : 'none';
      fsEl('fs-room-hint').textContent = R.mode === 'solo'
        ? 'Escolha sua posição. Os outros postos ficam com a IA.'
        : (fsIsHost ? 'Escolha sua posição e passe o código para seus amigos entrarem. Mantenha esta aba aberta durante as partidas.' : 'Escolha sua posição. O host inicia o torneio.');
    }

    function fsStartTournament() {
      if (!fsIsHost || !fsRoom) return;
      // quem não escolheu posição recebe uma livre
      const order = ['PV', 'AE', 'AD', 'FX', 'GK'];
      Object.values(fsRoom.players).forEach(pl => {
        if (!pl.role) { const free = order.find(r => !Object.values(fsRoom.players).some(q => q.role === r)); if (free) pl.role = free; }
      });
      fsRoom.tourney = fsNewTournament(fsRoom.cfg, fsRoom.team);
      fsRoom.phase = 'HUB';
      fsPush();
    }

    function fsNewTournamentSameRoom() {
      if (!fsIsHost) return;
      fsRoom.tourney = null; fsRoom.phase = 'LOBBY'; fsPush();
    }

    /* ---------- chaveamento ---------- */
    function strengthLabel(ovr) { return ovr >= 86 ? ['Gigante', '#ef4444'] : ovr >= 80 ? ['Forte', '#f59e0b'] : ovr >= 74 ? ['Equilibrado', '#60a5fa'] : ['Mais fraco', '#10b981']; }

    function fsRenderHub() {
      const R = fsRoom, T = R.tourney; if (!T) return;
      fsEl('fs-hub-code').textContent = R.mode === 'solo' ? 'Solo' : 'Sala ' + R.code;
      const ban = fsEl('fs-hub-banner'); ban.style.display = '';
      const alive = T.teams.length;
      const roundTeams = T.rounds[T.r].matches.length * 2;
      let card = '';
      if (T.over) {
        const champ = T.teams[T.champion];
        if (T.champion === 0) { ban.className = 'cr-banner gold'; ban.textContent = `🏆 CAMPEÕES! ${R.team.name} venceu o Estadualzão!`; }
        else { ban.className = 'cr-banner red'; ban.textContent = `Vocês foram eliminados na fase: ${T.hist[T.hist.length - 1].round}. Campeão: ${champ.name}.`; }
        card = `<div class="cr-panel-head"><h3>Torneio encerrado</h3></div>
          <div class="fs-vs" style="grid-template-columns:1fr"><div class="tm">${fsBadgeOf(champ, 56)}<span>Campeão: ${crEsc(champ.name)}</span></div></div>
          ${fsIsHost ? '<button class="btn-start" onclick="fsNewTournamentSameRoom()">🔁 Novo Torneio</button>' : '<p class="cr-muted" style="text-align:center">Aguardando o host iniciar um novo torneio.</p>'}`;
      } else {
        const opp = fsOpponent(T), st = strengthLabel(opp.ovr), me = T.teams[0];
        ban.className = 'cr-banner';
        ban.textContent = R.phase === 'MATCH' ? 'Partida em andamento...' : `${T.rounds[T.r].name} • ${roundTeams} times restantes`;
        card = `<div class="cr-panel-head"><h3>Próxima partida • ${crEsc(T.rounds[T.r].name)}</h3><span class="cr-tag" style="color:${st[1]};border-color:${st[1]}">${st[0]} • OVR ${opp.ovr}</span></div>
          <div class="fs-vs"><div class="tm">${fsBadgeOf(me, 56)}<span>${crEsc(me.name)}</span></div><div class="x">VS</div><div class="tm">${fsBadgeOf(opp, 56)}<span>${crEsc(opp.name)}</span></div></div>
          ${fsIsHost ? '<button class="btn-start" onclick="fsPlayMatch()">▶ Jogar Partida</button>' : '<p class="cr-muted" style="text-align:center">Aguardando o host iniciar a partida...</p>'}`;
      }
      fsEl('fs-next-card').innerHTML = card;
      fsEl('fs-hist').innerHTML = T.hist.length ? T.hist.map(h => `
        <div class="fs-hist-row ${h.won ? 'w' : 'l'}"><span>${crEsc(h.round)}</span><span>${crEsc(R.team.short)} ${h.gu} x ${h.go} ${crEsc(h.opp)}${h.pen ? ` (pên. ${h.pen[0]}x${h.pen[1]})` : ''}</span><b>${h.won ? 'V' : 'D'}</b></div>`).join('')
        : '<div class="cr-empty">Nenhuma partida disputada ainda.</div>';
      const sel = fsEl('fs-round-select'), prev = sel.value;
      sel.innerHTML = T.rounds.map((r, i) => `<option value="${i}">${crEsc(r.name)}</option>`).join('');
      sel.value = (prev !== '' && +prev < T.rounds.length && sel.dataset.sz === String(T.rounds.length)) ? prev : String(T.r);
      sel.dataset.sz = String(T.rounds.length);
      fsRenderBracket();
    }

    function fsRenderBracket() {
      const T = fsRoom && fsRoom.tourney; if (!T) return;
      const r = T.rounds[+fsEl('fs-round-select').value || 0]; if (!r) return;
      fsEl('fs-bracket').innerHTML = r.matches.map(m => {
        const A = T.teams[m.a], B = T.teams[m.b], u = m.a === 0 || m.b === 0;
        return `<div class="fs-m ${u ? 'user' : ''}">
          <div class="${m.played && m.w === m.a ? 'win' : ''}"><span>${crEsc(A.name)}</span><b>${m.played ? m.ga : ''}</b></div>
          <div class="${m.played && m.w === m.b ? 'win' : ''}"><span>${crEsc(B.name)}</span><b>${m.played ? m.gb : ''}</b></div>
          ${m.pen ? `<div style="color:var(--text-muted);font-size:.7rem"><span>Pênaltis</span><span>${m.pen[0]} x ${m.pen[1]}</span></div>` : ''}</div>`;
      }).join('');
    }

    /* ---------- partida (host) ---------- */
    function fsPlayMatch() {
      if (!fsIsHost || !fsRoom || fsRoom.phase !== 'HUB') return;
      const T = fsRoom.tourney; if (T.over) return;
      const opp = fsOpponent(T), cfg = fsRoom.cfg;
      const humans = {};
      Object.entries(fsRoom.players).forEach(([id, pl]) => { if (pl.role) humans[pl.role] = { id: +id, name: pl.name }; });
      fsG = fsCreateMatch({ dur: cfg.dur, sk0: 0.55, sk1: fsSkillFromOvr(opp.ovr, [-0.15, 0, 0.12][cfg.diff] || 0), humans });
      fsView = { teams: [T.teams[0], opp], round: T.rounds[T.r].name, dur: cfg.dur,
        players: fsG.players.map(p => ({ team: p.team, role: p.role, name: p.name, h: p.h })) };
      fsRoom.phase = 'MATCH';
      fsBroadcast({ t: 'mstart', view: fsView });
      fsBroadcast({ t: 'room', room: fsPublic() });
      fsEnded = false; fsAcc = 0; fsSnapN = 0; fsLastLoop = performance.now();
      fsEnterGame();
      fsLoop = setInterval(fsHostTick, 16);
    }

    function fsHostTick() {
      if (!fsG) return;
      const now = performance.now();
      let dt = (now - fsLastLoop) / 1000; fsLastLoop = now;
      fsAcc += Math.min(dt, 0.25);
      const me = fsG.players.find(p => p.h === fsMyId);
      let steps = 0;
      while (fsAcc >= 1 / 60 && steps < 15) {
        if (me) me.inp = fsReadInput();
        fsStep(fsG, 1 / 60); fsAcc -= 1 / 60; steps++;
        if (++fsSnapN % 3 === 0 && Object.keys(fsConns).length) fsBroadcast({ t: 'snap', s: fsSnapshot(fsG) });
      }
      fsG.sfx.splice(0).forEach(fsSfx);
      if (fsG.phase === 'end' && !fsEnded) { fsEnded = true; fsLater(fsHostFinish, 1800); }
    }

    function fsHostFinish() {
      if (!fsG) return;
      clearInterval(fsLoop); fsLoop = null;
      const T = fsRoom.tourney, opp = fsOpponent(T);
      const gu = fsG.score[0], go = fsG.score[1];
      let pen = null;
      if (gu === go) pen = fsPenalties(0.78, fsClamp(0.72 + (opp.ovr - 78) * 0.004, 0.6, 0.85));
      fsBroadcast({ t: 'mend', gu, go, pen });
      fsShowEnd(gu, go, pen);
      fsLater(() => {
        fsFinishUserMatch(T, gu, go, pen);
        fsG = null; fsRoom.phase = 'HUB';
        fsLeaveGame();
        fsPush();
      }, 4200);
    }

    /* ---------- partida (convidado) ---------- */
    function fsStartClientMatch() {
      fsSnaps = []; fsPred = null; fsEnded = false;
      fsEnterGame();
      if (fsInputTimer) clearInterval(fsInputTimer);
      fsInputTimer = setInterval(() => {
        const i = fsReadInput(), s = JSON.stringify(i), now = performance.now();
        if (s !== fsLastSent || now - fsLastSentT > 250) { fsLastSent = s; fsLastSentT = now; if (fsHostConn) fsSend(fsHostConn, { t: 'in', i }); }
      }, 33);
    }

    /* ---------- entrar/sair da tela de jogo ---------- */
    function fsEnterGame() {
      fsInGame = true;
      fsShowOnly(null);
      fsEl('fs-game-screen').style.display = 'block';
      fsEl('fs-end').classList.remove('show');
      fsBindInput();
      const touch = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
      fsEl('fs-touch').classList.toggle('on', !!touch);
      const t = fsView.teams;
      fsEl('fs-hud-b0').innerHTML = fsBadgeOf(t[0], 30); fsEl('fs-hud-b1').innerHTML = fsBadgeOf(t[1], 30);
      fsEl('fs-hud-n0').textContent = t[0].name; fsEl('fs-hud-n1').textContent = t[1].name;
      fsEl('fs-hud-round').textContent = fsView.round;
      const mine = fsView.players.findIndex(p => p.h === fsMyId);
      fsEl('fs-role-tag').textContent = mine >= 0 ? `Você: ${FS_ROLES[fsView.players[mine].role].name}` : 'Você está assistindo (sem posição)';
      fsHudCache = {};
      fsResize();
      if (fsRAF) cancelAnimationFrame(fsRAF);
      fsRAF = requestAnimationFrame(fsFrame);
      fsAudioInit();
    }

    function fsLeaveGame() {
      fsInGame = false;
      if (fsRAF) cancelAnimationFrame(fsRAF); fsRAF = null;
      if (fsInputTimer) clearInterval(fsInputTimer); fsInputTimer = null;
      fsEl('fs-game-screen').style.display = 'none';
      fsEl('fs-end').classList.remove('show');
      fsKeys = {}; fsJoyV = [0, 0]; fsTouchShoot = fsTouchSprint = false;
    }

    function fsShowEnd(gu, go, pen) {
      const won = gu > go || (gu === go && pen && pen[0] > pen[1]);
      fsEl('fs-end-title').textContent = won ? '✅ Vitória!' : '❌ Eliminados';
      fsEl('fs-end-score').textContent = `${gu} x ${go}${pen ? `  (pên. ${pen[0]} x ${pen[1]})` : ''}`;
      fsEl('fs-end-sub').textContent = won ? 'Avançando no torneio...' : 'Fim da campanha...';
      fsEl('fs-end').classList.add('show');
    }

    function fsQuitMatch() {
      if (!confirm(fsIsHost ? 'Sair da partida encerra a sala para todos. Deseja sair?' : 'Sair da partida e da sala?')) return;
      fsExit();
    }

    function fsLeaveRoom() { if (fsRoom && fsRoom.phase !== 'LOBBY' && !confirm('Sair do torneio? O progresso será perdido.')) return; fsExit(); }

    function fsExit() {
      if (fsLoop) clearInterval(fsLoop); fsLoop = null;
      fsTimers.forEach(clearTimeout); fsTimers = [];
      fsG = null; fsLeaveGame();
      try { Object.values(fsConns).forEach(c => c.close()); } catch (e) { }
      try { if (fsHostConn) fsHostConn.close(); } catch (e) { }
      try { if (fsPeer) fsPeer.destroy(); } catch (e) { }
      fsPeer = null; fsConns = {}; fsHostConn = null; fsRoom = null; fsView = null; fsSnaps = [];
      fsShowOnly('main-menu-screen');
    }

    /* ---------- entrada: teclado e toque ---------- */
    function fsBindInput() {
      if (fsKeysBound) return; fsKeysBound = true;
      const names = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'];
      window.addEventListener('keydown', e => {
        if (!fsInGame) return;
        const k = e.key.toLowerCase();
        if (names.includes(k) || 'wasdjkle'.includes(k) && k.length === 1) e.preventDefault();
        if (!fsKeys[k] && (k === 'k' || k === 'e')) fsPaSeq++;
        fsKeys[k] = true;
        fsAudioInit();
      });
      window.addEventListener('keyup', e => { fsKeys[e.key.toLowerCase()] = false; });
      window.addEventListener('blur', () => { fsKeys = {}; });
      window.addEventListener('resize', () => { if (fsInGame) fsResize(); });

      const joy = fsEl('fs-joy'), knob = fsEl('fs-joy-knob'); let jid = null, jo = null;
      joy.addEventListener('pointerdown', e => { jid = e.pointerId; jo = [e.clientX, e.clientY]; joy.setPointerCapture(jid); knob.style.display = 'block'; knob.style.left = jo[0] - joy.getBoundingClientRect().left + 'px'; knob.style.top = jo[1] - joy.getBoundingClientRect().top + 'px'; fsAudioInit(); });
      joy.addEventListener('pointermove', e => {
        if (e.pointerId !== jid) return;
        let dx = e.clientX - jo[0], dy = e.clientY - jo[1]; const L = Math.hypot(dx, dy), R = 55;
        if (L > R) { dx = dx / L * R; dy = dy / L * R; }
        fsJoyV = [dx / R, dy / R];
        const r = joy.getBoundingClientRect(); knob.style.left = (jo[0] - r.left + dx) + 'px'; knob.style.top = (jo[1] - r.top + dy) + 'px';
      });
      const end = e => { if (e.pointerId !== jid) return; jid = null; fsJoyV = [0, 0]; knob.style.display = 'none'; };
      joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);

      const hold = (id, on, off) => {
        const b = fsEl(id);
        b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); b.classList.add('down'); on(); fsAudioInit(); });
        const up = () => { b.classList.remove('down'); off(); };
        b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
      };
      hold('fs-btn-shoot', () => { fsTouchShoot = true; }, () => { fsTouchShoot = false; });
      hold('fs-btn-sprint', () => { fsTouchSprint = true; }, () => { fsTouchSprint = false; });
      hold('fs-btn-pass', () => { fsPaSeq++; }, () => { });
    }

    function fsReadInput() {
      let mx = 0, my = 0;
      if (fsKeys.arrowleft || fsKeys.a) mx -= 1; if (fsKeys.arrowright || fsKeys.d) mx += 1;
      if (fsKeys.arrowup || fsKeys.w) my -= 1; if (fsKeys.arrowdown || fsKeys.s) my += 1;
      mx += fsJoyV[0]; my += fsJoyV[1];
      const L = Math.hypot(mx, my); if (L > 1) { mx /= L; my /= L; }
      return { mx: Math.round(mx * 100) / 100, my: Math.round(my * 100) / 100,
        sp: (fsKeys.shift || fsKeys.l || fsTouchSprint) ? 1 : 0, sh: (fsKeys[' '] || fsKeys.j || fsTouchShoot) ? 1 : 0, pa: fsPaSeq };
    }

    /* ---------- som ---------- */
    function fsAudioInit() {
      try { if (!fsAudio) fsAudio = new (window.AudioContext || window.webkitAudioContext)(); if (fsAudio.state === 'suspended') fsAudio.resume(); } catch (e) { }
    }
    function fsBeep(f, d, type, vol, delay) {
      if (!fsAudio) return;
      try {
        const o = fsAudio.createOscillator(), g = fsAudio.createGain(), t = fsAudio.currentTime + (delay || 0);
        o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(vol || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(fsAudio.destination); o.start(t); o.stop(t + d);
      } catch (e) { }
    }
    function fsSfx(n) {
      if (n === 'kick') fsBeep(180, 0.07, 'triangle', 0.09);
      else if (n === 'tackle') fsBeep(110, 0.09, 'sawtooth', 0.05);
      else if (n === 'whistle') { fsBeep(1900, 0.18, 'sine', 0.05); fsBeep(2100, 0.25, 'sine', 0.05, 0.2); }
      else if (n === 'goal') { [523, 659, 784, 1046].forEach((f, i) => fsBeep(f, 0.22, 'square', 0.06, i * 0.12)); }
    }

    /* ---------- estado para desenhar ---------- */
    function fsLiveState(G) {
      return { ph: ['kickoff', 'play', 'goal', 'end'].indexOf(G.phase), pt: G.phaseT, ck: G.golden ? Math.ceil(G.goldenLeft) : Math.max(0, Math.ceil(G.dur - G.clock)), g: G.golden ? 1 : 0,
        sc: G.score, b: [G.ball.x, G.ball.y, G.ball.owner],
        p: G.players.map(p => [p.x, p.y, Math.atan2(p.fy, p.fx) * 57.3, p.stamina * 100, p.charging ? p.charge * 100 : 0]), m: G.msg };
    }

    function fsClientState() {
      if (!fsSnaps.length) return null;
      const rt = performance.now() - 110, last = fsSnaps[fsSnaps.length - 1].s;
      let a = fsSnaps[0], b = fsSnaps[0];
      for (let i = 0; i < fsSnaps.length; i++) { if (fsSnaps[i].t <= rt) a = fsSnaps[i]; if (fsSnaps[i].t > rt) { b = fsSnaps[i]; break; } b = fsSnaps[i]; }
      const k = b.t > a.t ? fsClamp((rt - a.t) / (b.t - a.t), 0, 1) : 1, A = a.s, B = b.s;
      const lerp = (x, y) => x + (y - x) * k;
      let dang = (u, v) => { let d = v - u; while (d > 180) d -= 360; while (d < -180) d += 360; return u + d * k; };
      return { ph: last.ph, pt: last.pt, ck: last.ck, g: last.g, sc: last.sc, m: last.m,
        b: [lerp(A.b[0], B.b[0]), lerp(A.b[1], B.b[1]), last.b[2]],
        p: A.p.map((q, i) => [lerp(q[0], B.p[i][0]), lerp(q[1], B.p[i][1]), dang(q[2], B.p[i][2]), last.p[i][3], last.p[i][4]]) };
    }

    /* ---------- desenho ---------- */
    function fsResize() {
      const c = fsEl('fs-canvas'), dpr = window.devicePixelRatio || 1;
      c.width = Math.floor(c.clientWidth * dpr); c.height = Math.floor(c.clientHeight * dpr);
    }

    function fsFrame(ts) {
      if (!fsInGame) return;
      fsRAF = requestAnimationFrame(fsFrame);
      let st;
      if (fsIsHost) { if (!fsG) return; st = fsLiveState(fsG); }
      else {
        st = fsClientState(); if (!st) return;
        const mi = fsView.players.findIndex(p => p.h === fsMyId);
        if (mi >= 0) {
          const auth = st.p[mi];
          if (!fsPred) { fsPred = fsMakePlayer(mi, 0, fsView.players[mi].role, 0.5, fsMyId, ''); fsPred.x = auth[0]; fsPred.y = auth[1]; }
          const last = fsSnaps[fsSnaps.length - 1].s.p[mi];
          fsApplyInput(null, fsPred, st.ph === 1 ? fsReadInput() : { mx: 0, my: 0, sp: 0 }, 1 / 60);
          const err = Math.hypot(last[0] - fsPred.x, last[1] - fsPred.y);
          if (err > 70) { fsPred.x = last[0]; fsPred.y = last[1]; fsPred.vx = fsPred.vy = 0; }
          else { fsPred.x += (last[0] - fsPred.x) * 0.08; fsPred.y += (last[1] - fsPred.y) * 0.08; }
          st.p[mi] = [fsPred.x, fsPred.y, st.p[mi][2], last[3], last[4]];
        }
      }
      fsUpdateHud(st);
      fsDraw(st);
    }

    function fsUpdateHud(st) {
      const set = (id, v) => { if (fsHudCache[id] !== v) { fsHudCache[id] = v; fsEl(id).textContent = v; } };
      set('fs-hud-s0', st.sc[0]); set('fs-hud-s1', st.sc[1]);
      const m = Math.floor(st.ck / 60), s = st.ck % 60;
      set('fs-hud-clock', (st.g ? '🥇 ' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'));
      fsEl('fs-hud-clock').classList.toggle('gold', !!st.g);
    }

    function fsDraw(st) {
      const c = fsEl('fs-canvas'), ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1;
      const cw = c.clientWidth, ch = c.clientHeight;
      if (c.width !== Math.floor(cw * dpr)) fsResize();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#0b1410'; ctx.fillRect(0, 0, cw, ch);
      const topPad = 70, availW = cw - 16, availH = ch - topPad - 8;
      const s = Math.min(availW / (FS_W + 2 * FS_GD), availH / FS_H);
      const ox = (cw - FS_W * s) / 2, oy = topPad + (availH - FS_H * s) / 2;
      ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s);

      // gramado
      ctx.fillStyle = '#16301d'; ctx.fillRect(-FS_GD - 6, -8, FS_W + 2 * FS_GD + 12, FS_H + 16);
      for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#2f7d3a' : '#348a41'; ctx.fillRect(i * FS_W / 12, 0, FS_W / 12 + 1, FS_H); }
      // linhas
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, FS_W, FS_H);
      ctx.beginPath(); ctx.moveTo(FS_W / 2, 0); ctx.lineTo(FS_W / 2, FS_H); ctx.stroke();
      ctx.beginPath(); ctx.arc(FS_W / 2, FS_H / 2, 62, 0, 7); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(FS_W / 2, FS_H / 2, 4, 0, 7); ctx.fill();
      ctx.strokeRect(0, FS_H / 2 - 150, 150, 300); ctx.strokeRect(FS_W - 150, FS_H / 2 - 150, 150, 300);
      ctx.beginPath(); ctx.arc(150, FS_H / 2, 40, -1.2, 1.2); ctx.stroke(); ctx.beginPath(); ctx.arc(FS_W - 150, FS_H / 2, 40, Math.PI - 1.2, Math.PI + 1.2); ctx.stroke();
      // gols
      [[-FS_GD, 0], [FS_W, 1]].forEach(([gx]) => {
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(gx, FS_GOAL_TOP, FS_GD, FS_GW);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
        for (let y = FS_GOAL_TOP; y <= FS_GOAL_BOT; y += 12) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + FS_GD, y); ctx.stroke(); }
        for (let x = gx; x <= gx + FS_GD; x += 12) { ctx.beginPath(); ctx.moveTo(x, FS_GOAL_TOP); ctx.lineTo(x, FS_GOAL_BOT); ctx.stroke(); }
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(gx, FS_GOAL_TOP, FS_GD, FS_GW);
      });

      // jogadores
      const V = fsView, fnt = Math.max(11, 10 / s);
      const order = st.p.map((p, i) => i).sort((a, b) => st.p[a][1] - st.p[b][1]);
      const mine = V.players.findIndex(p => p.h === fsMyId);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      // sombra da bola e jogadores
      st.p.forEach(p => { ctx.beginPath(); ctx.ellipse(p[0] + 3, p[1] + 5, FS_PR, FS_PR * 0.7, 0, 0, 7); ctx.fill(); });
      ctx.beginPath(); ctx.ellipse(st.b[0] + 2, st.b[1] + 4, FS_BR, FS_BR * 0.6, 0, 0, 7); ctx.fill();

      order.forEach(i => {
        const p = st.p[i], meta = V.players[i], kit = V.teams[meta.team];
        let c1 = kit.c1, c2 = kit.c2;
        if (meta.role === 'GK') { c1 = meta.team === 0 ? '#f59e0b' : '#22c55e'; }
        ctx.fillStyle = c1; ctx.strokeStyle = c2; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p[0], p[1], FS_PR, 0, 7); ctx.fill(); ctx.stroke();
        const a = p[2] / 57.3;
        ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(p[0] + Math.cos(a) * 8, p[1] + Math.sin(a) * 8, 4.2, 0, 7); ctx.fill();   // frente do jogador
        ctx.font = `800 ${fnt - 2}px "Segoe UI", sans-serif`; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
        const lt = FS_ROLES[meta.role].short[0] + (meta.role === 'AE' ? 'E' : meta.role === 'AD' ? 'D' : '');
        if (meta.role !== 'GK') { ctx.strokeText(lt, p[0] - Math.cos(a) * 3, p[1] + 4); ctx.fillText(lt, p[0] - Math.cos(a) * 3, p[1] + 4); }
        else { ctx.strokeText('G', p[0] - Math.cos(a) * 3, p[1] + 4); ctx.fillText('G', p[0] - Math.cos(a) * 3, p[1] + 4); }
        if (meta.h !== null && meta.name) {
          ctx.font = `700 ${fnt}px "Segoe UI", sans-serif`; ctx.fillStyle = i === mine ? '#fde047' : '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 3;
          ctx.strokeText(meta.name, p[0], p[1] - FS_PR - 8); ctx.fillText(meta.name, p[0], p[1] - FS_PR - 8);
        }
        if (i === mine) {
          ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p[0], p[1], FS_PR + 5, 0, 7); ctx.stroke();
          ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.moveTo(p[0], p[1] - FS_PR - 26); ctx.lineTo(p[0] - 6, p[1] - FS_PR - 36); ctx.lineTo(p[0] + 6, p[1] - FS_PR - 36); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(p[0] - 16, p[1] + FS_PR + 7, 32, 4);
          ctx.fillStyle = '#38bdf8'; ctx.fillRect(p[0] - 16, p[1] + FS_PR + 7, 32 * fsClamp(p[3] / 100, 0, 1), 4);
          if (p[4] > 0) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(p[0] - 16, p[1] + FS_PR + 13, 32, 4); ctx.fillStyle = '#ef4444'; ctx.fillRect(p[0] - 16, p[1] + FS_PR + 13, 32 * fsClamp(p[4] / 100, 0, 1), 4); }
        }
      });

      // bola
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(st.b[0], st.b[1], FS_BR, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(st.b[0], st.b[1], 2.6, 0, 7); ctx.fill();
      ctx.restore();

      // mensagens
      ctx.textAlign = 'center';
      let big = '', sub = '';
      if (st.ph === 0) { const n = Math.ceil(st.pt); big = n > 3 ? 'PREPARE-SE' : String(n); sub = st.pt > 2.9 ? 'Cada amigo controla um jogador' : ''; }
      else if (st.m) big = st.m;
      if (big) {
        ctx.font = `900 ${Math.min(64, cw / 12)}px "Segoe UI", sans-serif`;
        ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.fillStyle = st.ph === 2 ? '#fde047' : '#fff';
        ctx.strokeText(big, cw / 2, oy + FS_H * s / 2 - 10); ctx.fillText(big, cw / 2, oy + FS_H * s / 2 - 10);
        if (sub) { ctx.font = `600 ${Math.min(22, cw / 36)}px "Segoe UI", sans-serif`; ctx.lineWidth = 4; ctx.strokeText(sub, cw / 2, oy + FS_H * s / 2 + 28); ctx.fillText(sub, cw / 2, oy + FS_H * s / 2 + 28); }
      }
    }
