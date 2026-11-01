// Estadualzão 5x5 — motor da partida (física, bola, IA). Roda no host.
    /* =====================================================================
       ESTADUALZÃO 5x5 (CO-OP) — MOTOR DA PARTIDA (roda no host)
       ===================================================================== */
    const FS_W = 900, FS_H = 500, FS_GW = 150, FS_GD = 38, FS_PR = 15, FS_BR = 8;
    const FS_GOAL_TOP = (FS_H - FS_GW) / 2, FS_GOAL_BOT = (FS_H + FS_GW) / 2;
    const FS_SPEED = 140, FS_SPRINT = 184;
    const FS_CTRL = FS_PR + FS_BR + 4, FS_KICKR = FS_PR + FS_BR + 13;
    const FS_ROLE_ORDER = ['GK', 'FX', 'AE', 'AD', 'PV'];
    const FS_ROLES = {
      GK: { name: 'Goleiro', short: 'GOL', desc: 'Defende o gol e inicia as jogadas' },
      FX: { name: 'Fixo', short: 'FIX', desc: 'Último homem da defesa' },
      AE: { name: 'Ala Esquerda', short: 'ALE', desc: 'Corre pela esquerda, apoia e cruza' },
      AD: { name: 'Ala Direita', short: 'ALD', desc: 'Corre pela direita, apoia e cruza' },
      PV: { name: 'Pivô', short: 'PIV', desc: 'Referência do ataque e finalizador' }
    };
    const FS_FORM = { GK: [0.05, 0.5], FX: [0.27, 0.5], AE: [0.5, 0.2], AD: [0.5, 0.8], PV: [0.7, 0.5] };

    const fsClamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const fsDist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
    function fsNorm(x, y) { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; }
    function fsSegDist(px, py, ax, ay, bx, by) {
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
      const t = fsClamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
      return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
    }

    function fsFormPos(p, mode) {
      const f = FS_FORM[p.role];
      const att = { GK: 0.02, FX: 0.16, AE: 0.14, AD: 0.14, PV: 0.15 }, def = { GK: 0, FX: -0.12, AE: -0.16, AD: -0.16, PV: -0.18 };
      let fx = f[0] + (mode === 'attack' ? att[p.role] : mode === 'defend' ? def[p.role] : 0);
      fx = fsClamp(fx, 0.05, 0.93);
      let x = fx * FS_W, y = f[1] * FS_H;
      if (p.team === 1) { x = FS_W - x; y = FS_H - y; }
      return [x, y];
    }

    function fsMakePlayer(i, team, role, sk, human, name) {
      return { i, team, role, x: 0, y: 0, vx: 0, vy: 0, fx: team === 0 ? 1 : -1, fy: 0,
        h: human, name: name || null, sk, spd: human !== null ? 1 : (team === 0 ? 0.96 : 0.84 + 0.2 * sk),
        inp: { mx: 0, my: 0, sp: 0, sh: 0, pa: 0 }, prevSh: 0, lastPa: 0, charge: 0, charging: false,
        ctrlCd: 0, tkT: 0, stamina: 1, sprintOn: false, recv: 0, ai: { t: Math.random() * 0.3, hold: 0, react: 0, gy: FS_H / 2, plan: null } };
    }

    /* o: { dur, sk0, sk1, humans: {role:{id,name}} } */
    function fsCreateMatch(o) {
      const G = { dur: o.dur || 120, clock: 0, phase: 'kickoff', phaseT: 3.2, golden: false, goldenLeft: 0,
        score: [0, 0], ball: { x: FS_W / 2, y: FS_H / 2, vx: 0, vy: 0, owner: -1 }, players: [], msg: '', msgT: 0,
        over: false, lastTouch: -1, touchLog: [], events: [], allowDraw: !!o.allowDraw, concede: 0, t: 0, sfx: [], stillT: 0 };
      for (let tm = 0; tm < 2; tm++) {
        FS_ROLE_ORDER.forEach((role, k) => {
          const hm = tm === 0 && o.humans && o.humans[role] ? o.humans[role] : null;
          G.players.push(fsMakePlayer(tm * 5 + k, tm, role, tm === 0 ? o.sk0 : o.sk1, hm ? hm.id : null, hm ? hm.name : null));
        });
      }
      fsPlaceKickoff(G, 0, 3.2);
      return G;
    }

    function fsPlaceKickoff(G, kickTeam, wait) {
      G.players.forEach(p => {
        const base = fsFormPos(p, 'neutral');
        p.x = base[0]; p.y = base[1];
        if (p.team === 0) p.x = Math.min(p.x, FS_W / 2 - 40); else p.x = Math.max(p.x, FS_W / 2 + 40);
        if (p.role === 'PV' && p.team === kickTeam) { p.x = FS_W / 2 + (p.team === 0 ? -26 : 26); p.y = FS_H / 2; }
        p.vx = p.vy = 0; p.fx = p.team === 0 ? 1 : -1; p.fy = 0; p.ctrlCd = 0; p.tkT = 0; p.charging = false; p.charge = 0; p.recv = 0;
      });
      const b = G.ball; b.x = FS_W / 2; b.y = FS_H / 2; b.vx = b.vy = 0; b.owner = -1;
      G.phase = 'kickoff'; G.phaseT = wait || 2.2;
    }

    function fsKick(G, p, dx, dy, speed) {
      const [nx, ny] = fsNorm(dx, dy), b = G.ball;
      b.owner = -1;
      b.x = p.x + nx * (FS_PR + FS_BR + 2); b.y = p.y + ny * (FS_PR + FS_BR + 2);
      b.vx = nx * speed + p.vx * 0.25; b.vy = ny * speed + p.vy * 0.25;
      p.ctrlCd = 0.32; p.tkT = 0; fsTouch(G, p.i);
      G.sfx.push('kick');
    }

    function fsShoot(G, p, charge, err, aim) {
      const b = G.ball;
      if (!(b.owner === p.i || fsDist(p.x, p.y, b.x, b.y) < FS_KICKR)) return false;
      const att = p.team === 0 ? 1 : -1, gx = att > 0 ? FS_W : 0;
      let dx = p.fx, dy = p.fy;
      const dg = fsDist(p.x, p.y, gx, FS_H / 2);
      const toG = fsNorm(gx - p.x, FS_H / 2 - p.y);
      const cosA = dx * toG[0] + dy * toG[1];
      if (aim) { [dx, dy] = fsNorm(aim[0] - p.x, aim[1] - p.y); }
      else if (dg < 470 && cosA > 0.72) {
        const gk = G.players.find(q => q.team !== p.team && q.role === 'GK');
        const yT = FS_H / 2 + (gk && gk.y > FS_H / 2 ? -1 : 1) * FS_GW * 0.3;
        const tv = fsNorm(gx - p.x, yT - p.y);
        [dx, dy] = fsNorm(dx * 0.2 + tv[0] * 0.8, dy * 0.2 + tv[1] * 0.8);
      }
      if (err) { const a = (Math.random() * 2 - 1) * err, c = Math.cos(a), s = Math.sin(a); [dx, dy] = [dx * c - dy * s, dx * s + dy * c]; }
      fsKick(G, p, dx, dy, 330 + fsClamp(charge, 0, 1) * 340);
      return true;
    }

    function fsBestPassHuman(G, p) {
      let best = null, bs = -1e9;
      G.players.forEach(q => {
        if (q.team !== p.team || q === p) return;
        const d = fsDist(p.x, p.y, q.x, q.y); if (d < 40 || d > 560) return;
        const cos = ((q.x - p.x) * p.fx + (q.y - p.y) * p.fy) / d;
        if (cos < 0.5) return;
        const sc = cos * 1.3 - d / 1400;
        if (sc > bs) { bs = sc; best = q; }
      });
      return best;
    }

    function fsPass(G, p, toIdx) {
      const b = G.ball;
      if (!(b.owner === p.i || fsDist(p.x, p.y, b.x, b.y) < FS_KICKR)) return false;
      const t = toIdx !== undefined && toIdx !== null && toIdx >= 0 ? G.players[toIdx] : fsBestPassHuman(G, p);
      if (!t) { fsKick(G, p, p.fx, p.fy, 270); return true; }
      const d = fsDist(p.x, p.y, t.x, t.y), lead = Math.min(0.5, d / 450);
      const tx = fsClamp(t.x + t.vx * lead, 20, FS_W - 20), ty = fsClamp(t.y + t.vy * lead, 20, FS_H - 20);
      fsKick(G, p, tx - p.x, ty - p.y, fsClamp(170 + d * 1.15, 230, 560));
      t.recv = 1.2;
      return true;
    }

    /* ---------- IA ---------- */
    function fsSeek(out, p, tx, ty, arrive) {
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      if (d < 5) return d;
      const m = arrive ? fsClamp(d / arrive, 0, 1) : 1;
      out.mx = dx / d * m; out.my = dy / d * m;
      return d;
    }

    function fsAIPassTarget(G, p) {
      const att = p.team === 0 ? 1 : -1; let best = -1, bs = -1e9;
      G.players.forEach(q => {
        if (q.team !== p.team || q === p) return;
        const d = fsDist(p.x, p.y, q.x, q.y); if (d < 60 || d > 520) return;
        let blocked = false;
        G.players.forEach(o => { if (o.team !== p.team && fsSegDist(o.x, o.y, p.x, p.y, q.x, q.y) < 34) blocked = true; });
        if (blocked) return;
        const sc = ((q.x - p.x) * att) / FS_W * 2 + (q.role === 'PV' ? 0.2 : 0) - d / 1500 + Math.random() * 0.15 - (q.role === 'GK' ? 0.9 : 0);
        if (sc > bs) { bs = sc; best = q.i; }
      });
      return best;
    }

    function fsAIGK(G, p, dt, out) {
      const b = G.ball, a = p.ai, sk = p.sk, att = p.team === 0 ? 1 : -1, gl = att > 0 ? 0 : FS_W;
      if (b.owner === p.i) {
        a.hold -= dt;
        if (a.hold <= 0) {
          const idx = fsAIPassTarget(G, p);
          out.act = idx >= 0 ? { k: 'pass', idx } : { k: 'pass', idx: -1 };
          a.hold = 0.7;
        }
        return out;
      }
      if (b.owner < 0) a.hold = 0.45 + Math.random() * 0.35;
      const gkx = gl + att * 20, dBall = fsDist(p.x, p.y, b.x, b.y);
      const inArea = Math.abs(b.x - gl) < 135 && Math.abs(b.y - FS_H / 2) < 175;
      const owner = b.owner >= 0 ? G.players[b.owner] : null;
      const slow = Math.hypot(b.vx, b.vy) < 150;
      let tx = gkx, ty = a.gy;
      a.react -= dt;
      if (a.react <= 0) {
        a.react = 0.26 - 0.2 * sk;
        let yt = FS_H / 2 + (b.y - FS_H / 2) * 0.5;
        if (b.vx * att < -70) {
          const t = (gkx - b.x) / b.vx;
          if (t > 0 && t < 1.6) yt = b.y + b.vy * t;
        }
        a.gy = fsClamp(yt, FS_GOAL_TOP + 6, FS_GOAL_BOT - 6);
      }
      ty = a.gy;
      const oppCloser = G.players.some(q => q.team !== p.team && fsDist(q.x, q.y, b.x, b.y) < dBall - 6);
      if (inArea && slow && (!owner || owner.team === p.team ? true : false) && !oppCloser && dBall < 120) { tx = b.x; ty = b.y; out.sp = true; }
      else if (owner && owner.team !== p.team && Math.abs(owner.x - gl) < 190) {
        // atacante dentro da área com a bola: sai para fechar o ângulo
        tx = gkx + att * fsClamp((190 - Math.abs(owner.x - gl)) * 0.5, 0, 60);
        ty = fsClamp(owner.y, FS_GOAL_TOP + 6, FS_GOAL_BOT - 6);
      }
      if (b.vx * att < -200) out.sp = true;
      fsSeek(out, p, tx, ty, 18);
      return out;
    }

    function fsAI(G, p, dt) {
      const b = G.ball, ps = G.players, a = p.ai, sk = p.sk;
      const out = { mx: 0, my: 0, sp: false, act: null };
      if (p.role === 'GK') return fsAIGK(G, p, dt, out);
      const att = p.team === 0 ? 1 : -1, goalX = att > 0 ? FS_W : 0, ownX = att > 0 ? 0 : FS_W;
      const owner = b.owner >= 0 ? ps[b.owner] : null;
      const mine = owner && owner.team === p.team, theirs = owner && owner.team !== p.team;

      // quem corre atrás da bola
      let near = null, nd = 1e9, nearAI = null, ndAI = 1e9;
      ps.forEach(q => {
        if (q.team !== p.team || q.role === 'GK') return;
        const d = fsDist(q.x, q.y, b.x, b.y);
        if (d < nd) { nd = d; near = q; }
        if (q.h === null && d < ndAI) { ndAI = d; nearAI = q; }
      });
      const humanHandles = near && near.h !== null && nd < 190;
      const chaser = humanHandles ? null : nearAI;
      const isChaser = chaser === p;

      if (owner === p) {
        a.t -= dt;
        if (a.t <= 0) {
          a.t = 0.28 - 0.14 * sk + Math.random() * 0.14;
          const dg = fsDist(p.x, p.y, goalX, FS_H / 2);
          let nearOpp = 1e9;
          ps.forEach(q => { if (q.team !== p.team) nearOpp = Math.min(nearOpp, fsDist(p.x, p.y, q.x, q.y)); });
          if (dg < 330 + 110 * sk && Math.abs(p.y - FS_H / 2) < 230 && Math.random() < 0.9) a.plan = { k: 'shoot' };
          else if (nearOpp < 80 || Math.random() < 0.2) {
            const idx = fsAIPassTarget(G, p);
            if (idx >= 0) a.plan = { k: 'pass', idx };
          }
        }
        if (a.plan) {
          const [gx0, gy0] = fsNorm(goalX - p.x, FS_H / 2 - p.y);
          if (a.plan.k === 'shoot') {
            p.fx = gx0; p.fy = gy0;
            const ty = FS_H / 2 + (Math.random() * 2 - 1) * FS_GW * 0.42;
            out.act = { k: 'shoot', pw: 0.45 + 0.5 * sk, err: 0.2 - 0.12 * sk, aim: [goalX, ty] };
          }
          else out.act = { k: 'pass', idx: a.plan.idx };
          a.plan = null; a.t = 0.45;
          return out;
        }
        let [vx, vy] = fsNorm(goalX - att * 30 - p.x, FS_H / 2 - p.y);
        let nearOpp = 1e9;
        ps.forEach(q => {
          if (q.team === p.team) return;
          const d = fsDist(p.x, p.y, q.x, q.y); nearOpp = Math.min(nearOpp, d);
          if (d < 100) { const w = (100 - d) / 100 * 1.5, [ax, ay] = fsNorm(p.x - q.x, p.y - q.y); vx += ax * w; vy += ay * w; }
        });
        const [nx, ny] = fsNorm(vx, vy); out.mx = nx; out.my = ny; out.sp = nearOpp > 75 && p.stamina > 0.3;
        return out;
      }

      if (p.recv > 0 && !theirs && b.owner !== p.i) {   // recebendo um passe
        fsSeek(out, p, b.x + b.vx * 0.25, b.y + b.vy * 0.25, 0);
        out.sp = p.stamina > 0.3; return out;
      }

      if (mine) {
        const base = fsFormPos(p, 'attack');
        let tx = base[0], ty = base[1];
        if (p.role === 'PV') { tx = fsClamp(owner.x + att * 110, 120, FS_W - 120); ty = FS_H / 2 + Math.sin(G.t * 0.9 + p.i) * 70; }
        else if (p.role === 'AE' || p.role === 'AD') tx = fsClamp(owner.x + att * 70, 100, FS_W - 120);
        else if (p.role === 'FX') tx = fsClamp(owner.x - att * 110, 120, FS_W - 120);
        const d = fsSeek(out, p, tx, ty, 45);
        out.sp = d > 160 && p.stamina > 0.35;
        return out;
      }

      if (theirs) {
        if (isChaser) {
          const d = fsSeek(out, p, b.x + owner.vx * 0.2, b.y + owner.vy * 0.2, 0);
          out.sp = d > 70 && p.stamina > 0.25; return out;
        }
        const base = fsFormPos(p, 'defend');
        let tx = base[0], ty = base[1] * 0.55 + b.y * 0.45;
        if (p.role === 'FX') { tx = ownX + att * 190; ty = FS_H / 2 * 0.4 + b.y * 0.6; }
        const d = fsSeek(out, p, tx, ty, 40);
        out.sp = d > 170 && p.stamina > 0.35;
        return out;
      }

      // bola livre
      if (isChaser) {
        const d = fsSeek(out, p, b.x + b.vx * 0.25, b.y + b.vy * 0.25, 0);
        out.sp = d > 60 && p.stamina > 0.25;
        return out;
      }
      const base = fsFormPos(p, (b.x - FS_W / 2) * att > 0 ? 'attack' : 'defend');
      fsSeek(out, p, base[0], base[1] * 0.6 + b.y * 0.4, 40);
      return out;
    }

    /* ---------- física ---------- */
    function fsApplyInput(G, p, inp, dt) {
      const len = Math.hypot(inp.mx, inp.my);
      const moving = len > 0.08;
      const wantSp = inp.sp && moving && p.stamina > 0.03;
      p.sprintOn = wantSp;
      const maxV = (wantSp ? FS_SPRINT : FS_SPEED) * p.spd;
      const k = len > 1 ? 1 / len : 1;
      const tx = moving ? inp.mx * k * maxV : 0, ty = moving ? inp.my * k * maxV : 0;
      const f = Math.min(1, dt * 9);
      p.vx += (tx - p.vx) * f; p.vy += (ty - p.vy) * f;
      if (moving) {
        const [nx, ny] = fsNorm(inp.mx, inp.my);
        const [fx, fy] = fsNorm(p.fx + (nx - p.fx) * 0.4, p.fy + (ny - p.fy) * 0.4);
        p.fx = fx; p.fy = fy;
      }
      p.stamina = wantSp ? Math.max(0, p.stamina - dt * 0.3) : Math.min(1, p.stamina + dt * 0.17);
      p.x += p.vx * dt; p.y += p.vy * dt;
      fsClampPlayer(p);
      if (p.recv > 0) p.recv -= dt;
    }

    function fsClampPlayer(p) {
      p.x = fsClamp(p.x, FS_PR, FS_W - FS_PR); p.y = fsClamp(p.y, FS_PR, FS_H - FS_PR);
      if (p.role === 'GK') {   // goleiro fica na sua área
        if (p.team === 0) p.x = fsClamp(p.x, FS_PR, 150); else p.x = fsClamp(p.x, FS_W - 150, FS_W - FS_PR);
        p.y = fsClamp(p.y, FS_H / 2 - 175, FS_H / 2 + 175);
      }
    }

    function fsHumanActions(G, p, dt) {
      const i = p.inp;
      if (i.sh && !p.prevSh) { p.charging = true; p.charge = 0; }
      if (i.sh && p.charging) p.charge = Math.min(1, p.charge + dt / 0.75);
      if (!i.sh && p.prevSh && p.charging) { p.charging = false; fsShoot(G, p, Math.max(0.2, p.charge), 0); p.charge = 0; }
      p.prevSh = i.sh ? 1 : 0;
      if (i.pa !== p.lastPa) { p.lastPa = i.pa; fsPass(G, p, null); }
    }

    function fsAIActions(G, p, act) {
      if (!act) return;
      if (act.k === 'shoot') fsShoot(G, p, act.pw, act.err, act.aim);
      else if (act.k === 'pass') {
        if (!fsPass(G, p, act.idx)) { /* sem bola */ }
      }
    }

    function fsSeparate(G) {
      const ps = G.players;
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d > 0 && d < FS_PR * 2) {
          const o = (FS_PR * 2 - d) / 2, nx = dx / d, ny = dy / d;
          a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
        }
      }
      ps.forEach(fsClampPlayer);
    }

    function fsControl(G, dt) {
      const b = G.ball, ps = G.players;
      ps.forEach(p => { if (p.ctrlCd > 0) p.ctrlCd -= dt; });
      if (b.shield > 0) b.shield -= dt;
      let o = b.owner >= 0 ? ps[b.owner] : null;
      if (o && fsDist(o.x, o.y, b.x, b.y) > FS_CTRL + 18) { b.owner = -1; o = null; }
      if (!o) {
        let best = null, bd = 1e9;
        ps.forEach(p => {
          if (p.ctrlCd > 0) return;
          const d = fsDist(p.x, p.y, b.x, b.y);
          if (d < FS_CTRL && d < bd && Math.hypot(b.vx - p.vx, b.vy - p.vy) < 330) { best = p; bd = d; }
        });
        if (best) { b.owner = best.i; fsTouch(G, best.i); best.tkT = 0; b.shield = 0.55; }
      } else {
        ps.forEach(p => {
          if (p.team === o.team) return;
          const d = fsDist(p.x, p.y, o.x, o.y);
          if (d < FS_PR * 2 + 5 && p.ctrlCd <= 0 && !(b.shield > 0)) {
            p.tkT += dt * (o.sprintOn && !p.sprintOn ? 0.5 : 1);
            const need = p.h !== null ? 0.26 : 0.55 - 0.18 * p.sk;
            if (p.tkT > need) {
              b.owner = p.i; fsTouch(G, p.i); o.ctrlCd = 0.7; p.tkT = 0; b.shield = 0.55;
              b.vx += (p.x - o.x) * 0.5; b.vy += (p.y - o.y) * 0.5;
              G.sfx.push('tackle');
            }
          } else p.tkT = Math.max(0, p.tkT - dt * 2);
        });
      }
      if (b.owner >= 0) {
        const c = ps[b.owner], tx = c.x + c.fx * (FS_PR + FS_BR + 1), ty = c.y + c.fy * (FS_PR + FS_BR + 1);
        const k = Math.min(1, dt * 16);
        b.x += (tx - b.x) * k; b.y += (ty - b.y) * k; b.vx = c.vx; b.vy = c.vy;
      }
    }

    function fsBallPhysics(G, dt) {
      const b = G.ball;
      if (b.owner < 0) {
        b.x += b.vx * dt; b.y += b.vy * dt;
        const f = Math.exp(-1.15 * dt); b.vx *= f; b.vy *= f;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp < 4) { b.vx = b.vy = 0; } else if (sp > 720) { b.vx *= 720 / sp; b.vy *= 720 / sp; }
        // traves
        [[0, FS_GOAL_TOP], [0, FS_GOAL_BOT], [FS_W, FS_GOAL_TOP], [FS_W, FS_GOAL_BOT]].forEach(([px, py]) => {
          const dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy);
          if (d < FS_BR + 4 && d > 0) {
            const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny;
            b.x = px + nx * (FS_BR + 4); b.y = py + ny * (FS_BR + 4);
            if (vn < 0) { b.vx -= 1.7 * vn * nx; b.vy -= 1.7 * vn * ny; }
          }
        });
      }
      const gy = b.y > FS_GOAL_TOP && b.y < FS_GOAL_BOT;
      // esquerda
      if (b.x < FS_BR) {
        if (!gy) { b.x = FS_BR; if (b.vx < 0) b.vx = -b.vx * 0.7; }
        else {
          if (b.x < -FS_GD + FS_BR) { b.x = -FS_GD + FS_BR; if (b.vx < 0) b.vx = -b.vx * 0.35; }
          if (b.x < 0) { b.y = fsClamp(b.y, FS_GOAL_TOP + FS_BR, FS_GOAL_BOT - FS_BR); }
        }
      }
      if (b.x > FS_W - FS_BR) {
        if (!gy) { b.x = FS_W - FS_BR; if (b.vx > 0) b.vx = -b.vx * 0.7; }
        else {
          if (b.x > FS_W + FS_GD - FS_BR) { b.x = FS_W + FS_GD - FS_BR; if (b.vx > 0) b.vx = -b.vx * 0.35; }
          if (b.x > FS_W) { b.y = fsClamp(b.y, FS_GOAL_TOP + FS_BR, FS_GOAL_BOT - FS_BR); }
        }
      }
      if (b.x >= 0 && b.x <= FS_W) {
        if (b.y < FS_BR) { b.y = FS_BR; if (b.vy < 0) b.vy = -b.vy * 0.7; }
        if (b.y > FS_H - FS_BR) { b.y = FS_H - FS_BR; if (b.vy > 0) b.vy = -b.vy * 0.7; }
      }
      if (b.x < 0 && gy) return 1;
      if (b.x > FS_W && gy) return 0;
      return -1;
    }

    function fsBallPlayerCollide(G) {
      const b = G.ball;
      G.players.forEach(p => {
        if (b.owner === p.i) return;
        const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy), md = FS_PR + FS_BR;
        if (d < md && d > 0) {
          const nx = dx / d, ny = dy / d;
          b.x = p.x + nx * md; b.y = p.y + ny * md;
          const rv = (b.vx - p.vx) * nx + (b.vy - p.vy) * ny;
          if (rv < 0) { const j = -(1 + 0.55) * rv * 0.85; b.vx += nx * j; b.vy += ny * j; fsTouch(G, p.i); }
        }
      });
      if (b.x >= 0 && b.x <= FS_W) b.y = fsClamp(b.y, FS_BR, FS_H - FS_BR);
    }

    // histórico de toques: quem pegou/chutou a bola por último (para dar gol e assistência ao jogador certo)
    function fsTouch(G, i) {
      const L = G.touchLog;
      if (!L.length || L[L.length - 1].i !== i) { L.push({ i, t: G.t }); if (L.length > 8) L.shift(); }
      G.lastTouch = i;
    }

    function fsGoal(G, scoringTeam) {
      G.score[scoringTeam]++;
      const L = G.touchLog; let si = -1;
      for (let k = L.length - 1; k >= 0; k--) if (G.players[L[k].i].team === scoringTeam) { si = k; break; }
      let sc = null, asst = null, own = false;
      if (si >= 0 && G.t - L[si].t < 10) {
        sc = G.players[L[si].i];   // defesa do goleiro/zagueiro que desvia a bola para dentro não tira o gol de quem chutou
        const pv = si > 0 ? G.players[L[si - 1].i] : null;
        if (pv && pv.team === scoringTeam && pv.i !== sc.i && G.t - L[si].t < 6) asst = pv;   // passe de companheiro até 6s antes
      } else if (L.length && G.players[L[L.length - 1].i].team !== scoringTeam) own = true;     // sem chute recente: gol contra
      const last = L.length ? G.players[L[L.length - 1].i] : null;
      G.events.push({ team: scoringTeam, g: sc ? sc.i : -1, a: asst ? asst.i : -1, og: own ? 1 : 0, clk: Math.round(G.clock) });
      G.msg = '⚽ GOOOL! ' + (sc ? (sc.name || FS_ROLES[sc.role].name) : own && last ? (last.name || FS_ROLES[last.role].name) + ' (contra)' : '');
      G.lastTouch = -1; G.touchLog = [];
      G.msgT = 2.6; G.phase = 'goal'; G.phaseT = 2.6; G.concede = 1 - scoringTeam;
      G.ball.owner = -1; G.ball.vx *= 0.3; G.ball.vy *= 0.3;
      G.sfx.push('goal');
      if (G.golden) G.over = true;
    }

    function fsEnd(G) { G.phase = 'end'; G.over = true; G.msg = 'Fim de jogo!'; G.msgT = 99; G.sfx.push('whistle'); }

    function fsStep(G, dt) {
      G.t += dt;
      if (G.msgT > 0 && G.phase !== 'end') { G.msgT -= dt; if (G.msgT <= 0) G.msg = ''; }
      if (G.phase === 'kickoff') {
        G.phaseT -= dt;
        if (G.phaseT <= 0) { G.phase = 'play'; G.msg = ''; G.sfx.push('whistle'); }
        return;
      }
      if (G.phase === 'goal') {
        G.phaseT -= dt;
        const b = G.ball; b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 0.96; b.vy *= 0.96;
        fsBallPhysics(G, 0);
        if (G.phaseT <= 0) { if (G.over) fsEnd(G); else fsPlaceKickoff(G, G.concede, 2.2); }
        return;
      }
      if (G.phase !== 'play') return;

      if (!G.golden) {
        G.clock += dt;
        if (G.clock >= G.dur) {
          if (G.score[0] !== G.score[1] || G.allowDraw) { fsEnd(G); return; }
          G.golden = true; G.goldenLeft = Math.min(45, G.dur * 0.4); G.msg = '🥇 Gol de ouro! Quem marcar vence'; G.msgT = 3;
          G.sfx.push('whistle');
        }
      } else {
        G.goldenLeft -= dt;
        if (G.goldenLeft <= 0) { fsEnd(G); return; }
      }

      G.players.forEach(p => {
        let inp;
        if (p.h !== null) { inp = p.inp; fsApplyInput(G, p, inp, dt); fsHumanActions(G, p, dt); }
        else { const o = fsAI(G, p, dt); fsApplyInput(G, p, o, dt); fsAIActions(G, p, o.act); }
      });
      fsSeparate(G);
      fsControl(G, dt);
      const g = fsBallPhysics(G, dt);
      fsBallPlayerCollide(G);
      if (g >= 0) { fsGoal(G, g); return; }

      // bola parada fora de alcance: dá um empurrãozinho
      const b = G.ball;
      if (b.owner < 0 && Math.hypot(b.vx, b.vy) < 2 && (b.x < 40 || b.x > FS_W - 40) && (b.y < 40 || b.y > FS_H - 40)) {
        G.stillT += dt;
        if (G.stillT > 5) { b.vx = (b.x < FS_W / 2 ? 1 : -1) * 90; b.vy = (b.y < FS_H / 2 ? 1 : -1) * 90; G.stillT = 0; }
      } else G.stillT = 0;
    }

    /* ---------- partidas rápidas (adversários) e pênaltis ---------- */
    function fsQuickScore(ovrA, ovrB) {
      const d = ovrA - ovrB;
      const la = fsClamp(2.2 + d * 0.07, 0.4, 6), lb = fsClamp(2.2 - d * 0.07, 0.4, 6);
      const pois = l => { let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; };
      return [pois(la), pois(lb)];
    }
    function fsPenalties(pa, pb) {
      pa = fsClamp(pa, 0.55, 0.9); pb = fsClamp(pb, 0.55, 0.9);
      let a = 0, b = 0;
      for (let i = 0; i < 5; i++) { if (Math.random() < pa) a++; if (Math.random() < pb) b++; }
      while (a === b) { if (Math.random() < pa) a++; if (Math.random() < pb) b++; }
      return [a, b];
    }
    function fsSkillFromOvr(ovr, diff) { return fsClamp((ovr - 58) / 36 + (diff || 0), 0.05, 1); }

    function fsSnapshot(G) {
      const r = v => Math.round(v);
      return {
        ph: ['kickoff', 'play', 'goal', 'end'].indexOf(G.phase), pt: Math.round(G.phaseT * 10) / 10,
        ck: G.golden ? Math.ceil(G.goldenLeft) : Math.max(0, Math.ceil(G.dur - G.clock)), g: G.golden ? 1 : 0,
        sc: G.score, b: [r(G.ball.x), r(G.ball.y), G.ball.owner],
        p: G.players.map(p => [r(p.x), r(p.y), r(Math.atan2(p.fy, p.fx) * 57.3), r(p.stamina * 100), p.charging ? r(p.charge * 100) : 0]),
        m: G.msg, s: G.sfx.splice(0)
      };
    }
