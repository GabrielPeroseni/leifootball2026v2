// Modo Carreira — treinador, escolha de clube, liga, mata-mata, temporadas e salvamento
    /* =====================================================================
       MODO CARREIRA
       ===================================================================== */
    const CR_SAVE_KEY = 'futmanager2026_career_v1';
    const CR_MATCH_MS = 60000; // toda partida ao vivo dura 60 segundos reais (90 minutos virtuais)

    
    // Faixa de overall por liga (o overall de cada clube é fixo, calculado pelo nome)
    const CR_TIERS = {
      "Premier League": [77, 84], "La Liga (Espanha)": [76, 84], "Série A (Itália)": [75, 83],
      "Bundesliga (Alemanha)": [74, 82], "Ligue 1 (França)": [72, 80], "Eredivisie (Países Baixos)": [71, 79],
      "Saudi Pro League (Arábia Saudita)": [72, 80], "Brasileirão Série A": [73, 80],
      "Liga Profesional (Argentina)": [71, 78], "Liga MX (México)": [71, 78], "Süper Lig (Turquia)": [70, 78],
      "Jupiler Pro League (Bélgica)": [69, 77], "Russian Premier League (Rússia)": [69, 76],
      "Super League Greece (Grécia)": [67, 75], "Ukrainian Premier League (Ucrânia)": [66, 74],
      "Austrian Bundesliga (Áustria)": [66, 74], "Danish Superliga (Dinamarca)": [66, 73],
      "MLS Conferência Leste": [67, 75], "MLS Conferência Oeste": [67, 75],
      "Primera División (Uruguai)": [66, 73], "Categoría Primera A (Colômbia)": [66, 73],
      "Primera División (Chile)": [65, 72], "LigaPro Serie A (Equador)": [65, 72],
      "Primera División (Paraguai)": [64, 71], "Liga 1 (Peru)": [62, 69], "División Profesional (Bolívia)": [60, 67],
      "Liga FUTVE (Venezuela)": [60, 66], "Nemzeti Bajnokság I (Hungria)": [62, 69],
      "EFL Championship": [69, 75], "La Liga 2 (Espanha)": [67, 73], "Ligue 2 (França)": [65, 71],
      "Serie B (Itália)": [66, 72], "2. Bundesliga (Alemanha)": [67, 73], "Brasileirão Série B": [64, 70],
      "Brasileirão Série C": [58, 64], "Primera Nacional (Argentina)": [58, 65]
    };

    // Clubes de elite: [overall, liga onde ele realmente joga]
    const CR_BENCH = {
      "Real Madrid": [89, "La Liga (Espanha)"], "Manchester City": [89, "Premier League"],
      "Bayern de Munique": [87, "Bundesliga (Alemanha)"], "Barcelona": [87, "La Liga (Espanha)"],
      "Liverpool": [87, "Premier League"], "Arsenal": [86, "Premier League"],
      "Paris Saint-Germain": [86, "Ligue 1 (França)"], "Internazionale": [86, "Série A (Itália)"],
      "Bayer Leverkusen": [85, "Bundesliga (Alemanha)"], "Atlético de Madrid": [85, "La Liga (Espanha)"],
      "Juventus": [84, "Série A (Itália)"], "Chelsea": [83, "Premier League"],
      "Flamengo": [79, "Brasileirão Série A"], "Palmeiras": [79, "Brasileirão Série A"],
      "Al-Hilal": [81, "Saudi Pro League (Arábia Saudita)"], "Al-Nassr": [80, "Saudi Pro League (Arábia Saudita)"],
      "River Plate": [78, "Liga Profesional (Argentina)"], "Boca Juniors": [78, "Liga Profesional (Argentina)"]
    };

    let crSetupReady = false, crClubMode = null;
    let crAllTeams = [], crLeagueTeams = [], crCarouselIdx = 0;
    let career = null, crLive = null, crToastTimer = null, crSesiTimer = null;

    const crEl = id => document.getElementById(id);
    function crEsc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
    function crClamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function crShuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function crHash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

    function crToast(msg) {
      const t = crEl('cr-toast');
      t.textContent = msg; t.classList.add('show');
      clearTimeout(crToastTimer);
      crToastTimer = setTimeout(() => t.classList.remove('show'), 3200);
    }

    function crConfetti() {
      const items = ['🎉', '⭐', '🏆', '✨', '⚽', '🎊'];
      for (let i = 0; i < 46; i++) {
        const s = document.createElement('span');
        s.className = 'cr-confetti';
        s.textContent = items[i % items.length];
        s.style.left = (Math.random() * 100) + 'vw';
        s.style.animationDuration = (2.4 + Math.random() * 2.4) + 's';
        s.style.animationDelay = (Math.random() * 0.8) + 's';
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 6000);
      }
    }

    /* ---------- dados dos clubes ---------- */
    function crTeamOvr(name, league) {
      const b = CR_BENCH[name];
      if (b && b[1] === league) return b[0];
      const t = CR_TIERS[league] || [64, 72];
      return t[0] + (crHash(name + '|' + league) % (t[1] - t[0] + 1));
    }

    function crStars(ovr) { return ovr >= 85 ? 5 : ovr >= 80 ? 4.5 : ovr >= 76 ? 4 : ovr >= 72 ? 3.5 : ovr >= 68 ? 3 : ovr >= 64 ? 2.5 : 2; }
    function crStarsHTML(n) {
      const full = Math.floor(n), half = n % 1 !== 0;
      return '★'.repeat(full) + (half ? '½' : '') + '<span style="color:#475569">' + '★'.repeat(5 - full - (half ? 1 : 0)) + '</span>';
    }

    function crShort(name) {
      const clean = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 ]/g, ' ');
      const stop = /^(FC|CF|SC|AC|AS|SK|FK|DE|DA|DO|DEL|OF|THE|1|2|SV|VFL|BSC)$/i;
      const w = clean.split(/\s+/).filter(x => x && !stop.test(x));
      let s;
      if (w.length >= 3) s = w.slice(0, 3).map(x => x[0]).join('');
      else if (w.length === 2) s = w[0][0] + w[1].slice(0, 2);
      else if (w.length === 1) s = w[0].slice(0, 3);
      else s = clean.replace(/\s/g, '').slice(0, 3);
      return (s || 'FC').toUpperCase().padEnd(3, 'X').slice(0, 3);
    }

    function crBuildTeams() {
      crAllTeams = [];
      for (const league in CR_DB) {
        const seen = new Set();
        CR_DB[league].forEach(name => {
          if (seen.has(name)) return; seen.add(name);
          const ovr = crTeamOvr(name, league);
          const h = crHash(name) % 360;
          crAllTeams.push({ name, league, ovr, stars: crStars(ovr), short: crShort(name),
            c1: `hsl(${h},62%,42%)`, c2: `hsl(${(h + 45) % 360},68%,28%)`, icon: null });
        });
      }
    }

    function crBadge(c, size) {
      size = size || 36;
      const inner = c.icon
        ? `<text x="50" y="72" font-size="40" text-anchor="middle">${c.icon}</text>`
        : `<text x="50" y="70" font-size="30" font-weight="800" text-anchor="middle" fill="#fff" font-family="Segoe UI,Arial,sans-serif">${crEsc(c.short)}</text>`;
      return `<svg class="cr-badge" width="${size}" height="${Math.round(size * 1.15)}" viewBox="0 0 100 115"><path d="M50 4 L92 18 V58 C92 86 70 104 50 111 C30 104 8 86 8 58 V18 Z" fill="${c.c1}" stroke="${c.c2}" stroke-width="6"/><path d="M50 4 L92 18 V58 C92 86 70 104 50 111 Z" fill="${c.c2}" opacity=".45"/>${inner}</svg>`;
    }

    /* ---------- avatar do treinador ---------- */
    function crReadManager() {
      return {
        first: crEl('cr-first').value.trim() || 'Carlos', last: crEl('cr-last').value.trim() || 'Ancelotti',
        nat: crEl('cr-nat').value, age: parseInt(crEl('cr-age').value) || 48,
        skin: crEl('cr-skin').value, outfit: crEl('cr-outfit').value, hair: crEl('cr-hair').value,
        hairColor: crEl('cr-hair-color').value, beard: crEl('cr-beard').value, glasses: crEl('cr-glasses').value
      };
    }

    function crAvatarSVG(m) {
      const skin = m.skin, hc = m.hairColor;
      let outfit;
      if (m.outfit === 'tracksuit') outfit = `<path d="M18 100 Q18 68 50 68 Q82 68 82 100Z" fill="#2563eb"/><path d="M32 72 L30 100 M68 72 L70 100" stroke="#fff" stroke-width="2.5"/><path d="M44 68 L50 76 L56 68" fill="none" stroke="#fff" stroke-width="2"/>`;
      else if (m.outfit === 'casual') outfit = `<path d="M18 100 Q18 68 50 68 Q82 68 82 100Z" fill="#334155"/><path d="M42 68 L50 80 L58 68Z" fill="#e2e8f0"/><circle cx="50" cy="88" r="1.3" fill="#94a3b8"/><circle cx="50" cy="94" r="1.3" fill="#94a3b8"/>`;
      else if (m.outfit === 'coat') outfit = `<path d="M14 100 Q14 66 50 66 Q86 66 86 100Z" fill="#4b5563"/><path d="M38 66 L50 98 L62 66 L56 66 L50 82 L44 66Z" fill="#374151"/><path d="M44 66 L50 76 L56 66Z" fill="#e5e7eb"/>`;
      else if (m.outfit === 'jacket') outfit = `<path d="M18 100 Q18 68 50 68 Q82 68 82 100Z" fill="#1f2937"/><path d="M50 70 V100" stroke="#9ca3af" stroke-width="1.8"/><path d="M40 68 L50 76 L60 68" fill="none" stroke="#111827" stroke-width="3"/>`;
      else outfit = `<path d="M18 100 Q18 68 50 68 Q82 68 82 100Z" fill="#0b1220"/><polygon points="42,68 58,68 50,90" fill="#fff"/><polygon points="48,72 52,72 51,86 50,88 49,86" fill="#3b82f6"/>`;

      let hair = '';
      if (m.hair === 'short') hair = `<path d="M33 40 Q33 22 50 22 Q67 22 67 40 Q60 31 50 31 Q40 31 33 40Z" fill="${hc}"/>`;
      else if (m.hair === 'fade') hair = `<path d="M34 41 Q34 25 50 24 Q66 25 66 41 Q62 33 50 33 Q38 33 34 41Z" fill="${hc}"/><path d="M33 42 Q32 34 36 31 L36 44Z M67 42 Q68 34 64 31 L64 44Z" fill="${hc}" opacity=".45"/>`;
      else if (m.hair === 'pompadour') hair = `<path d="M31 41 Q27 14 52 14 Q73 15 69 41 Q62 27 50 27 Q40 27 31 41Z" fill="${hc}"/>`;
      else if (m.hair === 'long') hair = `<path d="M33 40 Q33 20 50 20 Q67 20 67 40 Q60 30 50 30 Q40 30 33 40Z" fill="${hc}"/><path d="M33 38 Q27 60 33 76 L39 72 Q36 56 38 40Z M67 38 Q73 60 67 76 L61 72 Q64 56 62 40Z" fill="${hc}"/>`;
      else if (m.hair === 'dreads') {
        hair = `<path d="M33 40 Q33 21 50 21 Q67 21 67 40 Q60 31 50 31 Q40 31 33 40Z" fill="${hc}"/>`;
        [31, 36, 64, 69].forEach((x, i) => { hair += `<rect x="${x - 2}" y="${34 + (i % 2) * 2}" width="4.2" height="${28 + (i % 2) * 6}" rx="2.1" fill="${hc}"/>`; });
      }

      let beard = '';
      if (m.beard === 'stubble') beard = `<path d="M34 47 C34 66 66 66 66 47 Q50 58 34 47Z" fill="${hc}" opacity=".32"/>`;
      else if (m.beard === 'full') beard = `<path d="M34 46 C34 70 66 70 66 46 Q50 59 34 46Z" fill="${hc}"/>`;
      else if (m.beard === 'goatee') beard = `<path d="M44 58 Q50 70 56 58 Q50 54 44 58Z" fill="${hc}"/><path d="M42 55 Q50 52 58 55 Q50 57 42 55Z" fill="${hc}"/>`;

      let glasses = '';
      if (m.glasses === 'square') glasses = `<rect x="35" y="39" width="13" height="9" rx="1.5" fill="none" stroke="#111827" stroke-width="1.6"/><rect x="52" y="39" width="13" height="9" rx="1.5" fill="none" stroke="#111827" stroke-width="1.6"/><path d="M48 43 H52" stroke="#111827" stroke-width="1.6"/>`;
      else if (m.glasses === 'round') glasses = `<circle cx="41.5" cy="43.5" r="6" fill="none" stroke="#111827" stroke-width="1.6"/><circle cx="58.5" cy="43.5" r="6" fill="none" stroke="#111827" stroke-width="1.6"/><path d="M47.5 43.5 H52.5" stroke="#111827" stroke-width="1.6"/>`;
      else if (m.glasses === 'sun') glasses = `<rect x="35" y="39" width="13" height="9" rx="2" fill="#0b0f19" stroke="#3b82f6" stroke-width="1"/><rect x="52" y="39" width="13" height="9" rx="2" fill="#0b0f19" stroke="#3b82f6" stroke-width="1"/><path d="M48 42 H52" stroke="#3b82f6" stroke-width="1.3"/>`;
      const eyes = m.glasses === 'sun' ? '' : `<circle cx="42" cy="43.5" r="1.5" fill="#1e293b"/><circle cx="58" cy="43.5" r="1.5" fill="#1e293b"/><path d="M38 38.5 Q42 37 46 38.5 M54 38.5 Q58 37 62 38.5" stroke="${hc}" stroke-width="1.3" fill="none" opacity=".85"/>`;
      const mouth = `<path d="M45 55 Q50 58 55 55" stroke="#7c2d12" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;

      return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#10151d"/>${outfit}<rect x="43" y="55" width="14" height="16" fill="${skin}"/><rect x="43" y="55" width="14" height="6" fill="#000" opacity=".12"/><circle cx="34" cy="45" r="3.2" fill="${skin}"/><circle cx="66" cy="45" r="3.2" fill="${skin}"/><ellipse cx="50" cy="44" rx="16" ry="19" fill="${skin}"/>${beard}${mouth}${eyes}${hair}${glasses}</svg>`;
    }

    function crUpdateAvatar() {
      const m = crReadManager();
      crEl('cr-prev-name').textContent = `${m.first} ${m.last}`;
      crEl('cr-prev-detail').textContent = `${m.nat} • ${m.age} Anos`;
      crEl('cr-avatar').innerHTML = crAvatarSVG(m);
    }

    /* ---------- fluxo de configuração ---------- */
    function crShowOnly(id) {
      ['career-setup-screen', 'career-hub-screen', 'main-menu-screen'].forEach(s => { crEl(s).style.display = 'none'; });
      crEl(id).style.display = 'flex';
    }

    function crOpenSetup() {
      crEnsureSetup();
      crShowOnly('career-setup-screen');
      crGoStep(1);
      crRefreshContinueBox();
    }

    function crEnsureSetup() {
      if (crSetupReady) return;
      crBuildTeams();
      const leagues = Object.keys(CR_DB);
      crEl('cr-league-select').innerHTML = leagues.map(l => `<option value="${crEsc(l)}">${crEsc(l)}</option>`).join('');
      crEl('cr-c-league').innerHTML = '<option value="__WORLD__">🌍 Liga Mundial (clubes de vários países)</option>' + leagues.map(l => `<option value="${crEsc(l)}">${crEsc(l)}</option>`).join('');
      crSetupReady = true;
      crUpdateAvatar();
      crUpdateCustom();
      crOnLeagueChange();
    }

    function crGoStep(n) {
      crEl('cr-step1').style.display = n === 1 ? 'flex' : 'none';
      crEl('cr-step2').style.display = n === 2 ? 'flex' : 'none';
      crEl('cr-step1-ind').className = 'cr-step' + (n === 1 ? ' active' : '');
      crEl('cr-step2-ind').className = 'cr-step' + (n === 2 ? ' active' : '');
    }

    function crSelectClubMode(mode) {
      crClubMode = mode;
      crEl('cr-choice-create').classList.toggle('selected', mode === 'CREATE');
      crEl('cr-choice-existing').classList.toggle('selected', mode === 'EXISTING');
      crEl('cr-create-panel').style.display = mode === 'CREATE' ? 'flex' : 'none';
      crEl('cr-existing-panel').style.display = mode === 'EXISTING' ? 'flex' : 'none';
      if (mode === 'CREATE') crUpdateCustom(); else crOnLeagueChange();
    }

    function crOnLeagueChange(keepSearch) {
      const league = crEl('cr-league-select').value;
      const q = (crEl('cr-team-search').value || '').trim().toLowerCase();
      crLeagueTeams = crAllTeams.filter(t => t.league === league && (!q || t.name.toLowerCase().includes(q)))
        .sort((a, b) => a.name.localeCompare(b.name));
      crCarouselIdx = 0;
      crRenderCarousel();
    }

    function crNavTeam(d) {
      if (!crLeagueTeams.length) return;
      crCarouselIdx = (crCarouselIdx + d + crLeagueTeams.length) % crLeagueTeams.length;
      crRenderCarousel();
    }

    function crRenderCarousel() {
      const box = crEl('cr-team-card');
      if (!crLeagueTeams.length) { box.innerHTML = '<div class="cr-empty">Nenhum time encontrado nesta liga.</div>'; return; }
      const t = crLeagueTeams[crCarouselIdx];
      box.innerHTML = `
        <span class="cr-tag">Time ${crCarouselIdx + 1} de ${crLeagueTeams.length}</span>
        ${crBadge(t, 84)}
        <div class="cr-team-name">${crEsc(t.name)}</div>
        <div class="cr-stars">${crStarsHTML(t.stars)}</div>
        <div class="cr-stat-grid">
          <div class="cr-stat"><span>Média OVR</span><b>${t.ovr}</b></div>
          <div class="cr-stat"><span>Liga</span><b style="font-size:0.8rem">${crEsc(t.league.replace(/\s*\(.*\)/, ''))}</b></div>
        </div>`;
    }

    function crUpdateCustom() {
      const c = crCustomClub();
      crEl('cr-c-badge').innerHTML = crBadge(c, 80);
      crEl('cr-c-prev-name').textContent = c.name;
      crEl('cr-c-stars').innerHTML = crStarsHTML(c.stars);
    }

    function crCustomClub() {
      const ovr = crClamp(parseInt(crEl('cr-c-ovr').value) || 78, 60, 95);
      const name = crEl('cr-c-name').value.trim() || 'Apex FC';
      const short = (crEl('cr-c-short').value.trim() || crShort(name)).toUpperCase().slice(0, 3);
      return { name, short, ovr, stars: crStars(ovr), c1: crEl('cr-c-col1').value, c2: crEl('cr-c-col2').value, icon: crEl('cr-c-icon').value, league: crEl('cr-c-league').value };
    }

    /* ---------- criação da carreira ---------- */
    function crMakeClub(src, id, isUser) {
      return { id, name: src.name, short: src.short || crShort(src.name), ovr: src.ovr, stars: crStars(src.ovr),
        league: src.league, c1: src.c1, c2: src.c2, icon: src.icon || null, isUser: !!isUser,
        p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
    }

    function crStartCareer() {
      if (!crClubMode) { crToast('Escolha "Crie Seu Time" ou "Time Existente".'); return; }
      const manager = crReadManager();
      let list = [], leagueName = '';

      if (crClubMode === 'CREATE') {
        const mine = crCustomClub();
        let others;
        if (mine.league === '__WORLD__') {
          leagueName = 'Liga Mundial';
          others = crShuffle(crAllTeams.filter(t => t.ovr >= 66)).slice(0, 19);
        } else {
          leagueName = mine.league;
          others = crAllTeams.filter(t => t.league === mine.league);
        }
        list = [mine, ...others];
      } else {
        if (!crLeagueTeams.length) { crToast('Nenhum time selecionado.'); return; }
        const picked = crLeagueTeams[crCarouselIdx];
        leagueName = picked.league;
        const all = crAllTeams.filter(t => t.league === picked.league);
        list = [picked, ...all.filter(t => t.name !== picked.name)];
      }

      const clubs = list.map((c, i) => crMakeClub(c, i, i === 0));
      career = { v: 1, manager, userId: 0, leagueName, clubs, season: 1, phase: 'LEAGUE',
        rounds: crRoundRobin(clubs.length), roundIdx: 0, po: null, history: [] };
      crSave();
      crShowHub();
      crToast(`Bem-vindo ao ${career.clubs[0].name}, ${manager.first}!`);
    }

    // Todos contra todos (turno único). Alterna mandos para equilibrar os jogos em casa.
    function crRoundRobin(n) {
      const ids = [...Array(n).keys()];
      if (n % 2) ids.push(-1);
      const m = ids.length, rounds = [];
      for (let r = 0; r < m - 1; r++) {
        const matches = [];
        for (let i = 0; i < m / 2; i++) {
          let h = ids[i], a = ids[m - 1 - i];
          if (h === -1 || a === -1) continue;
          if ((r + i) % 2 === 1) [h, a] = [a, h];
          matches.push({ h, a, hg: 0, ag: 0, played: false });
        }
        rounds.push({ n: r + 1, matches });
        ids.splice(1, 0, ids.pop());
      }
      return rounds;
    }

    /* ---------- salvar / carregar ---------- */
    function crSave() {
      try { localStorage.setItem(CR_SAVE_KEY, JSON.stringify(career)); } catch (e) { /* sem armazenamento disponível */ }
    }
    function crLoad() {
      try { const raw = localStorage.getItem(CR_SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    }
    function crRefreshContinueBox() {
      const s = crLoad(), box = crEl('cr-continue-box');
      if (!s || !s.clubs) { box.style.display = 'none'; return; }
      box.style.display = 'flex';
      crEl('cr-continue-info').textContent = `${s.clubs[s.userId].name} • Temporada ${s.season} • Treinador ${s.manager.first} ${s.manager.last}`;
    }
    function crDeleteSave() {
      if (!confirm('Apagar a carreira salva? Essa ação não pode ser desfeita.')) return;
      try { localStorage.removeItem(CR_SAVE_KEY); } catch (e) { }
      crRefreshContinueBox();
    }
    function crContinueCareer() {
      const s = crLoad();
      if (!s) { crToast('Nenhuma carreira salva.'); return; }
      career = s;
      if (career.phase === 'LEAGUE_END') crStartPlayoffs();
      crShowHub();
    }

    function crShowHub() {
      crShowOnly('career-hub-screen');
      const u = career.clubs[career.userId];
      crEl('cr-hub-badge').innerHTML = crBadge(u, 40);
      crEl('cr-hub-club-name').textContent = u.name;
      crEl('cr-hub-short').textContent = u.short;
      crEl('cr-hub-avatar').innerHTML = crAvatarSVG(career.manager);
      crSwitchTab('central');
      crRenderAll();
    }

    function crBackToMenu() {
      if (crLive) {
        if (!confirm('Existe uma partida em andamento. Sair agora cancela essa rodada. Deseja sair?')) return;
        clearInterval(crLive.timer); crLive = null;
      }
      crCloseSesi(true);
      crEl('cr-champ-overlay').classList.remove('show');
      crShowOnly('main-menu-screen');
    }

    /* ---------- motor de partidas ---------- */
    function crRates(H, A) {
      const d = H.ovr - A.ovr;
      return [crClamp(1.37 + d * 0.05, 0.2, 3.8), crClamp(1.25 - d * 0.05, 0.2, 3.8)];
    }

    function crPenalties(H, A) {
      const pH = crClamp(0.75 + (H.ovr - A.ovr) * 0.003, 0.6, 0.88);
      const pA = crClamp(0.75 - (H.ovr - A.ovr) * 0.003, 0.6, 0.88);
      let h = 0, a = 0;
      for (let i = 0; i < 5; i++) { if (Math.random() < pH) h++; if (Math.random() < pA) a++; }
      while (h === a) { if (Math.random() < pH) h++; if (Math.random() < pA) a++; }
      return [h, a];
    }

    function crApplyResult(m) {
      const H = career.clubs[m.h], A = career.clubs[m.a];
      H.p++; A.p++; H.gf += m.hg; H.ga += m.ag; A.gf += m.ag; A.ga += m.hg;
      if (m.hg > m.ag) { H.w++; H.pts += 3; A.l++; }
      else if (m.hg < m.ag) { A.w++; A.pts += 3; H.l++; }
      else { H.d++; A.d++; H.pts++; A.pts++; }
    }

    function crResolvePlayoff(m) {
      const H = career.clubs[m.h], A = career.clubs[m.a];
      if (m.hg > m.ag) m.w = m.h;
      else if (m.ag > m.hg) m.w = m.a;
      else { m.pen = crPenalties(H, A); m.w = m.pen[0] > m.pen[1] ? m.h : m.a; }
    }

    function crCommit(m, hg, ag) {
      m.hg = hg; m.ag = ag; m.played = true;
      if (career.phase === 'PLAYOFFS') crResolvePlayoff(m); else crApplyResult(m);
    }

    function crSimInstant(m) {
      const [lh, la] = crRates(career.clubs[m.h], career.clubs[m.a]);
      let hg = 0, ag = 0;
      for (let i = 0; i < 90; i++) { if (Math.random() < lh / 90) hg++; if (Math.random() < la / 90) ag++; }
      crCommit(m, hg, ag);
    }

    function crCurrentBatch() {
      if (career.phase === 'LEAGUE') return career.rounds[career.roundIdx].matches;
      if (career.phase === 'PLAYOFFS') return career.po.rounds[career.po.idx].matches;
      return null;
    }
    function crBatchName() {
      if (career.phase === 'LEAGUE') return `Rodada ${career.roundIdx + 1} de ${career.rounds.length}`;
      if (career.phase === 'PLAYOFFS') return career.po.rounds[career.po.idx].name;
      return 'Temporada encerrada';
    }
    function crIsUser(m) { return m.h === career.userId || m.a === career.userId; }

    const CR_GOAL_TEXTS = ['Chute colocado no canto!', 'Cabeçada certeira após o escanteio!', 'Que golaço de fora da área!', 'Contra-ataque fulminante!', 'Finalização cruzada, sem chances pro goleiro!', 'Bola na rede após confusão na área!', 'Cobrança de falta perfeita!', 'Toque sutil por cobertura!'];

    function crPlayBatch() {
      if (crLive || !career) return;
      const batch = crCurrentBatch();
      if (!batch) return;
      const pending = batch.filter(m => !m.played);
      if (!pending.length) { crAfterBatch(); return; }
      const feat = pending.find(crIsUser) || pending[0];
      crLive = {
        start: Date.now(), minute: 0, events: [], timer: null, feat,
        items: pending.map(m => { const [lh, la] = crRates(career.clubs[m.h], career.clubs[m.a]); return { m, hg: 0, ag: 0, lh, la }; })
      };
      crLive.fi = crLive.items.find(it => it.m === feat);
      crSetBusy(true);
      crRenderLive();
      crLive.timer = setInterval(crLiveTick, 250);
    }

    function crLiveTick() {
      const L = crLive; if (!L) return;
      const target = Math.min(90, Math.floor((Date.now() - L.start) / CR_MATCH_MS * 90));
      while (L.minute < target) {
        L.minute++;
        L.items.forEach(it => {
          ['h', 'a'].forEach(side => {
            const rate = side === 'h' ? it.lh : it.la;
            if (Math.random() < rate / 90) {
              if (side === 'h') it.hg++; else it.ag++;
              if (it === L.fi) {
                const club = career.clubs[side === 'h' ? it.m.h : it.m.a];
                L.events.unshift({ min: L.minute, text: `⚽ GOL DO ${club.name.toUpperCase()}! ${CR_GOAL_TEXTS[Math.floor(Math.random() * CR_GOAL_TEXTS.length)]}`, mine: club.id === career.userId });
              }
            }
          });
        });
      }
      crRenderLive();
      if (L.minute >= 90) crFinishLive();
    }

    function crFinishLive() {
      const L = crLive; clearInterval(L.timer);
      L.items.forEach(it => crCommit(it.m, it.hg, it.ag));
      const pen = L.feat.pen;
      if (pen) L.events.unshift({ min: 90, text: `🥅 Pênaltis: ${pen[0]} x ${pen[1]} — classifica ${career.clubs[L.feat.w].name}`, mine: false });
      L.events.unshift({ min: 90, text: '🏁 Fim de jogo!', mine: false });
      crRenderLive();
      setTimeout(() => { crLive = null; crSetBusy(false); crAfterBatch(); }, pen ? 2200 : 1400);
    }

    function crSimBatchInstant() {
      if (crLive || !career) return;
      const batch = crCurrentBatch(); if (!batch) return;
      batch.forEach(m => { if (!m.played) crSimInstant(m); });
      crAfterBatch();
    }

    function crSimRest() {
      if (crLive || !career) return;
      if (career.phase === 'LEAGUE') {
        while (career.phase === 'LEAGUE') {
          career.rounds[career.roundIdx].matches.forEach(m => { if (!m.played) crSimInstant(m); });
          crAfterBatchCore();
        }
        crSave(); crRenderAll();
      } else if (career.phase === 'PLAYOFFS') {
        while (career.phase === 'PLAYOFFS') {
          career.po.rounds[career.po.idx].matches.forEach(m => { if (!m.played) crSimInstant(m); });
          crAfterBatchCore();
        }
        crSave(); crRenderAll();
      }
    }

    // Avança fase/rodada depois que todos os jogos de um bloco terminaram (sem renderizar)
    function crAfterBatchCore() {
      if (career.phase === 'LEAGUE') {
        career.roundIdx++;
        if (career.roundIdx >= career.rounds.length) crLeagueFinished();
      } else if (career.phase === 'PLAYOFFS') {
        crAdvancePlayoffs();
      }
    }
    function crAfterBatch() { crAfterBatchCore(); crSave(); crRenderAll(); }

    /* ---------- fim da liga e mata-mata ---------- */
    function crSorted() {
      return [...career.clubs].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name));
    }
    function crPlayoffSize() {
      const n = career.clubs.length; let s = 2;
      while (s * 2 <= Math.min(16, n)) s *= 2;
      return s;
    }
    function crStageName(teams) { return { 2: 'Final', 4: 'Semifinais', 8: 'Quartas de Final', 16: 'Oitavas de Final' }[teams] || `Fase de ${teams}`; }

    // Ordem clássica de chaveamento (1x16, 8x9, 5x12, 4x13, ...)
    function crSeedOrder(n) {
      let o = [1, 2];
      while (o.length < n) { const sum = o.length * 2 + 1; o = o.flatMap(x => [x, sum - x]); }
      return o;
    }

    function crLeagueFinished() {
      career.phase = 'LEAGUE_END';
      const champ = crSorted()[0];
      crEl('cr-champ-title').textContent = 'Campeão da Liga!';
      crEl('cr-champ-badge').innerHTML = crBadge(champ, 34);
      crEl('cr-champ-name').textContent = champ.name;
      crEl('cr-champ-sub').textContent = 'Avançando para a fase final em instantes...';
      crEl('cr-champ-overlay').classList.add('show');
      crConfetti();
      crSave();
      setTimeout(() => {
        crEl('cr-champ-overlay').classList.remove('show');
        if (!career || career.phase !== 'LEAGUE_END') return;
        crStartPlayoffs();
        crSave(); crRenderAll();
        const qualified = career.po.rounds[0].matches.some(crIsUser);
        crToast(qualified ? 'Seu time está no mata-mata! 🏆' : 'Seu time não se classificou ao mata-mata.');
      }, 5000);
    }

    function crStartPlayoffs() {
      const size = crPlayoffSize();
      const top = crSorted().slice(0, size).map(c => c.id);
      const order = crSeedOrder(size), matches = [];
      for (let i = 0; i < size; i += 2) {
        matches.push({ h: top[order[i] - 1], a: top[order[i + 1] - 1], hg: 0, ag: 0, played: false, w: null, pen: null });
      }
      career.po = { size, idx: 0, champion: null, rounds: [{ name: crStageName(size), matches }] };
      career.phase = 'PLAYOFFS';
    }

    function crAdvancePlayoffs() {
      const po = career.po, r = po.rounds[po.idx];
      if (!r.matches.every(m => m.played)) return;
      const winners = r.matches.map(m => m.w);
      if (r.matches.length === 1) { po.champion = winners[0]; crFinishSeason(); return; }
      const next = [];
      for (let i = 0; i < winners.length; i += 2) next.push({ h: winners[i], a: winners[i + 1], hg: 0, ag: 0, played: false, w: null, pen: null });
      po.rounds.push({ name: crStageName(next.length * 2), matches: next });
      po.idx++;
    }

    function crUserPlayoffResult() {
      const po = career.po, uid = career.userId;
      if (!po || !po.rounds[0].matches.some(m => m.h === uid || m.a === uid)) return 'Não classificado';
      for (const r of po.rounds) {
        const m = r.matches.find(x => x.h === uid || x.a === uid);
        if (!m) continue;
        if (m.w !== uid) return r.matches.length === 1 ? 'Vice-campeão' : 'Eliminado: ' + r.name;
      }
      return 'Campeão';
    }

    function crFinishSeason() {
      career.phase = 'DONE';
      const sorted = crSorted();
      const pos = sorted.findIndex(c => c.id === career.userId) + 1;
      const u = career.clubs[career.userId];
      const result = crUserPlayoffResult();
      career.history.push({ season: career.season, pos, pts: u.pts, playoff: result, champion: career.clubs[career.po.champion].name, leagueChampion: sorted[0].name });
      if (result === 'Campeão') {
        crConfetti();
        crToast('🏆 Seu time é o campeão da temporada!');
      }
      const fin = career.po.rounds[career.po.rounds.length - 1].matches[0];
      if (fin.h === career.userId || fin.a === career.userId) setTimeout(crShowSesi, 1400);
    }

    function crNextSeason() {
      if (!career || career.phase !== 'DONE') return;
      career.season++;
      career.clubs.forEach(c => {
        // pequena evolução anual (+1 para o campeão do usuário)
        let drift = Math.floor(Math.random() * 3) - 1;
        if (c.isUser && career.po && career.po.champion === c.id) drift = 1;
        c.ovr = crClamp(c.ovr + drift, 55, 95); c.stars = crStars(c.ovr);
        c.p = c.w = c.d = c.l = c.gf = c.ga = c.pts = 0;
      });
      career.rounds = crRoundRobin(career.clubs.length);
      career.roundIdx = 0; career.po = null; career.phase = 'LEAGUE';
      crSave(); crSwitchTab('central'); crRenderAll();
      crToast(`Temporada ${career.season} iniciada. Boa sorte!`);
    }

    /* ---------- interface da central ---------- */
    function crSwitchTab(id) {
      ['central', 'standings', 'calendar', 'playoffs', 'history'].forEach(t => {
        crEl('cr-content-' + t).classList.toggle('active', t === id);
        crEl('cr-tab-' + t).classList.toggle('active', t === id);
      });
    }

    function crSetBusy(b) {
      ['cr-btn-play', 'cr-btn-instant', 'cr-btn-sim-season', 'cr-btn-next-season'].forEach(id => { crEl(id).disabled = b; });
      crEl('cr-live-box').classList.toggle('on', b);
    }

    function crRenderAll() {
      if (!career) return;
      crEl('cr-hub-sub').textContent = `${career.manager.first} ${career.manager.last} • ${career.leagueName} • Temporada ${career.season}`;
      crRenderControls(); crRenderIdle(); crRenderSide();
      crRenderStandings(); crRenderCalendar(); crRenderPlayoffs(); crRenderHistory();
    }

    function crRenderControls() {
      const ph = career.phase, busy = !!crLive, active = ph === 'LEAGUE' || ph === 'PLAYOFFS';
      const play = crEl('cr-btn-play'), inst = crEl('cr-btn-instant'), season = crEl('cr-btn-sim-season'), next = crEl('cr-btn-next-season');
      play.style.display = inst.style.display = season.style.display = active ? '' : 'none';
      next.style.display = ph === 'DONE' ? '' : 'none';
      play.disabled = inst.disabled = season.disabled = next.disabled = busy;
      if (ph === 'LEAGUE') {
        play.textContent = `▶ Jogar Rodada ${career.roundIdx + 1} (60s)`;
        inst.textContent = '⏩ Simular Rodada';
        season.textContent = '⏩ Simular Resto da Liga';
      } else if (ph === 'PLAYOFFS') {
        const nm = career.po.rounds[career.po.idx].name;
        play.textContent = `▶ Jogar ${nm} (60s)`;
        inst.textContent = '⏩ Simular ' + nm;
        season.textContent = '⏩ Simular Mata-Mata';
      }
    }

    function crSetLiveTeams(H, A) {
      crEl('cr-live-home-badge').innerHTML = crBadge(H, 52);
      crEl('cr-live-away-badge').innerHTML = crBadge(A, 52);
      crEl('cr-live-home-name').textContent = H.name;
      crEl('cr-live-away-name').textContent = A.name;
    }

    function crRenderIdle() {
      if (crLive) return;
      const ph = career.phase, banner = crEl('cr-banner');
      let m = null, notice = '', tag = crBatchName(), title = 'Próximo Confronto do Seu Time';
      if (ph === 'LEAGUE') {
        const batch = career.rounds[career.roundIdx].matches;
        m = batch.find(crIsUser) || batch[0];
        notice = batch.find(crIsUser) ? 'Próximo confronto do seu time' : 'Seu time folga nesta rodada';
      } else if (ph === 'PLAYOFFS') {
        const batch = career.po.rounds[career.po.idx].matches;
        m = batch.find(crIsUser) || batch[0];
        notice = batch.find(crIsUser) ? 'Mata-mata • seu jogo' : 'Seu time está fora — acompanhe a fase';
      } else if (ph === 'DONE') {
        m = career.po.rounds[career.po.rounds.length - 1].matches[0];
        notice = 'Grande Final'; title = 'Final da Temporada';
      }
      crEl('cr-live-title').textContent = title;
      crEl('cr-stage-tag').textContent = tag;
      crEl('cr-live-progress').style.width = (m && m.played ? 100 : 0) + '%';
      const evs = crEl('cr-live-events');
      if (m) {
        crSetLiveTeams(career.clubs[m.h], career.clubs[m.a]);
        crEl('cr-live-home-score').textContent = m.played ? m.hg : 0;
        crEl('cr-live-away-score').textContent = m.played ? m.ag : 0;
        crEl('cr-live-timer').textContent = m.played ? "90'" : "00'";
        crEl('cr-live-notice').textContent = notice;
        let msg = '<div class="cr-ev"><span>Aguardando apito inicial...</span></div>';
        if (m.played) msg = `<div class="cr-ev"><span>🏁 Fim de jogo: ${crEsc(career.clubs[m.h].name)} ${m.hg} x ${m.ag} ${crEsc(career.clubs[m.a].name)}${m.pen ? ` (pên. ${m.pen[0]} x ${m.pen[1]})` : ''}</span></div>`;
        evs.innerHTML = msg;
      } else {
        crEl('cr-live-notice').textContent = 'Liga encerrada';
        evs.innerHTML = '<div class="cr-ev"><span>Preparando o mata-mata...</span></div>';
      }

      // faixa de informação
      const sorted = crSorted(), pos = sorted.findIndex(c => c.id === career.userId) + 1, u = career.clubs[career.userId];
      banner.style.display = '';
      banner.className = 'cr-banner';
      if (ph === 'LEAGUE') {
        const size = crPlayoffSize();
        banner.textContent = `Você está em ${pos}º lugar com ${u.pts} pts • os ${size} primeiros disputam o mata-mata.`;
      } else if (ph === 'PLAYOFFS') {
        const out = career.po.rounds.some(r => r.matches.some(x => x.played && crIsUser(x) && x.w !== career.userId));
        const inFirst = career.po.rounds[0].matches.some(crIsUser);
        if (!inFirst) { banner.className = 'cr-banner red'; banner.textContent = 'Seu time não se classificou ao mata-mata. Você pode acompanhar ou simular.'; }
        else if (out) { banner.className = 'cr-banner red'; banner.textContent = 'Seu time foi eliminado do mata-mata.'; }
        else banner.textContent = 'Mata-mata em andamento. Vença para avançar!';
      } else if (ph === 'DONE') {
        banner.className = 'cr-banner gold';
        banner.textContent = `🏆 ${career.clubs[career.po.champion].name} é o campeão da temporada! Seu resultado: ${career.history[career.history.length - 1].playoff}.`;
      } else {
        banner.textContent = 'Liga encerrada. Preparando o mata-mata...';
      }
    }

    function crSideItem(m, live) {
      const H = career.clubs[m.h], A = career.clubs[m.a];
      const hg = live ? live.hg : m.hg, ag = live ? live.ag : m.ag, shown = live || m.played;
      return `<div class="cr-side-item ${crIsUser(m) ? 'user' : ''}">
        <span class="${H.isUser ? 'me' : ''}">${crEsc(H.name)}</span>
        <span class="cr-side-score">${shown ? hg + ' - ' + ag : 'vs'}</span>
        <span class="away ${A.isUser ? 'me' : ''}">${crEsc(A.name)}</span></div>`;
    }

    function crRenderSide() {
      if (crLive) return;
      const list = crEl('cr-side-list'), ph = career.phase;
      let batch = null;
      if (ph === 'LEAGUE' || ph === 'PLAYOFFS') batch = crCurrentBatch();
      else if (ph === 'DONE') batch = career.po.rounds[career.po.rounds.length - 1].matches;
      crEl('cr-side-label').textContent = batch ? crBatchName() : '';
      list.innerHTML = batch ? batch.map(m => crSideItem(m)).join('') : '<div class="cr-empty">Sem jogos no momento.</div>';
    }

    function crRenderLive() {
      const L = crLive, it = L.fi, H = career.clubs[it.m.h], A = career.clubs[it.m.a];
      crEl('cr-live-title').textContent = crIsUser(it.m) ? 'Partida do Seu Time' : 'Partida em Destaque';
      crEl('cr-stage-tag').textContent = crBatchName();
      crEl('cr-live-notice').textContent = crIsUser(it.m) ? `SEU JOGO • ${crBatchName()}` : 'Jogo em destaque';
      crSetLiveTeams(H, A);
      crEl('cr-live-home-score').textContent = it.hg;
      crEl('cr-live-away-score').textContent = it.ag;
      crEl('cr-live-timer').textContent = L.minute + "'";
      crEl('cr-live-progress').style.width = (L.minute / 90 * 100) + '%';
      crEl('cr-live-events').innerHTML = L.events.length
        ? L.events.map(e => `<div class="cr-ev ${e.text.startsWith('⚽') ? 'goal' : ''} ${e.mine ? 'mine' : ''}"><span>${crEsc(e.text)}</span><span>${e.min}'</span></div>`).join('')
        : '<div class="cr-ev"><span>Bola rolando...</span></div>';
      crEl('cr-side-label').textContent = crBatchName();
      crEl('cr-side-list').innerHTML = L.items.map(x => crSideItem(x.m, x)).join('');
    }

    function crRenderStandings() {
      const sorted = crSorted(), size = crPlayoffSize();
      crEl('cr-standings-note').textContent = `Top ${size} classificam ao mata-mata`;
      crEl('cr-standings-body').innerHTML = sorted.map((c, i) => `
        <tr class="${c.isUser ? 'me' : ''} ${i < size ? 'in' : ''} ${i === 0 ? 'first' : ''} ${i === size - 1 ? 'cut' : ''}">
          <td class="pos">${i + 1}</td>
          <td class="club"><span>${crBadge(c, 20)} ${crEsc(c.name)} ${c.isUser ? '<span class="cr-you">Seu time</span>' : ''}</span></td>
          <td>${c.p}</td><td>${c.w}</td><td>${c.d}</td><td>${c.l}</td><td>${c.gf}</td><td>${c.ga}</td><td>${c.gf - c.ga}</td><td class="pts">${c.pts}</td>
        </tr>`).join('');
    }

    function crRenderCalendar() {
      crEl('cr-calendar-note').textContent = `${career.rounds.length} rodadas • turno único`;
      crEl('cr-calendar').innerHTML = career.rounds.map((r, i) => `
        <div class="cr-round ${career.phase === 'LEAGUE' && i === career.roundIdx ? 'current' : ''}">
          <div class="cr-round-title"><span>Rodada ${r.n}</span><span>${r.matches.every(m => m.played) ? '✔' : ''}</span></div>
          ${r.matches.map(m => crSideItem(m)).join('')}
        </div>`).join('');
    }

    function crNode(m) {
      const H = career.clubs[m.h], A = career.clubs[m.a];
      const hw = m.played && m.w === m.h, aw = m.played && m.w === m.a;
      return `<div class="cr-node ${crIsUser(m) ? 'user' : ''}">
        <div class="cr-node-team ${hw ? 'win' : ''}"><span>${crBadge(H, 16)} ${crEsc(H.name)}</span><b>${m.played ? m.hg : ''}</b></div>
        <div class="cr-node-team ${aw ? 'win' : ''}"><span>${crBadge(A, 16)} ${crEsc(A.name)}</span><b>${m.played ? m.ag : ''}</b></div>
        ${m.pen ? `<div class="cr-pen">Pênaltis: ${m.pen[0]} x ${m.pen[1]}</div>` : ''}</div>`;
    }

    function crRenderPlayoffs() {
      const wrap = crEl('cr-playoff-wrap'), note = crEl('cr-playoff-note');
      if (!career.po) {
        note.textContent = '';
        wrap.innerHTML = `<div class="cr-empty">O mata-mata será montado automaticamente após o fim da liga.<br>Classificam-se os ${crPlayoffSize()} primeiros colocados.</div>`;
        return;
      }
      const po = career.po;
      note.textContent = po.champion !== null ? `🏆 Campeão: ${career.clubs[po.champion].name}` : `${po.size} clubes • jogo único (pênaltis em caso de empate)`;
      let count = po.rounds[0].matches.length, ri = 0, cols = '';
      while (count >= 1) {
        const r = po.rounds[ri];
        cols += `<div class="cr-col"><div class="cr-col-title">${crStageName(count * 2)}</div>`;
        for (let i = 0; i < count; i++) {
          const m = r && r.matches[i];
          cols += m ? crNode(m) : '<div class="cr-node tbd">A definir</div>';
        }
        cols += '</div>';
        count = count / 2; ri++;
      }
      const trophy = po.champion !== null
        ? `<div class="cr-col" style="justify-content:center;align-items:center;min-width:150px;text-align:center"><div class="cr-trophy">🏆</div><b>${crEsc(career.clubs[po.champion].name)}</b></div>` : '';
      wrap.innerHTML = `<div class="cr-bracket">${cols}${trophy}</div>`;
    }

    function crRenderHistory() {
      const h = career.history;
      const leagueTitles = h.filter(x => x.pos === 1).length;
      const cups = h.filter(x => x.playoff === 'Campeão').length;
      const best = h.length ? Math.min(...h.map(x => x.pos)) : '-';
      crEl('cr-history-summary').innerHTML = `
        <div class="cr-sum"><b>${career.season}</b><span>Temporada atual</span></div>
        <div class="cr-sum"><b>${h.length}</b><span>Temporadas jogadas</span></div>
        <div class="cr-sum"><b>${leagueTitles}</b><span>Títulos de liga</span></div>
        <div class="cr-sum"><b>${cups}</b><span>Títulos mata-mata</span></div>
        <div class="cr-sum"><b>${best === '-' ? '-' : best + 'º'}</b><span>Melhor posição</span></div>`;
      crEl('cr-history-body').innerHTML = h.length
        ? [...h].reverse().map(x => `<tr><td>${x.season}</td><td>${x.pos}º</td><td>${x.pts}</td><td>${crEsc(x.playoff)}</td><td style="text-align:left">${crEsc(x.champion)}</td></tr>`).join('')
        : '<tr><td colspan="5" class="cr-empty">Nenhuma temporada concluída ainda.</td></tr>';
    }

    /* ---------- EASTER EGG: COPA SESI (60s reais / 90 min virtuais) ---------- */
    function crShowSesi() {
      if (!career) return;
      crEl('cr-sesi-user').textContent = career.clubs[career.userId].name.toUpperCase();
      crEl('cr-sesi-timer').textContent = "00'";
      crEl('cr-sesi-score').textContent = '0 - 0';
      crEl('cr-sesi-logs').innerHTML = '<span>Aguardando apito inicial para a simulação de 60 segundos...</span>';
      crEl('cr-sesi-play').disabled = false;
      crEl('cr-sesi-modal').classList.add('show');
    }

    function crCloseSesi(force) {
      clearInterval(crSesiTimer); crSesiTimer = null;
      crEl('cr-sesi-modal').classList.remove('show');
    }

    function crRunSesi() {
      if (crSesiTimer) return;
      const btn = crEl('cr-sesi-play'), logs = crEl('cr-sesi-logs');
      btn.disabled = true;
      logs.innerHTML = '<span style="color:#fca5a5;font-weight:700">A partida contra o SESI FC começou!</span>';
      const userWins = Math.random() < 0.01;
      let pg = 0, sg = 0, minute = 0;
      const fired = {}, start = Date.now();
      const add = (html) => { logs.insertAdjacentHTML('beforeend', html); logs.scrollTop = logs.scrollHeight; };
      crSesiTimer = setInterval(() => {
        minute = Math.min(90, Math.floor((Date.now() - start) / CR_MATCH_MS * 90));
        crEl('cr-sesi-timer').textContent = minute + "'";
        if (!userWins && minute >= 30 && !fired[30]) { fired[30] = 1; sg++; add('<span>30\' - GOL DO SESI FC! Chute devastador do meio-campo.</span>'); }
        if (!userWins && minute >= 60 && !fired[60]) { fired[60] = 1; sg++; add('<span>60\' - GOL DO SESI FC! Jogada coletiva perfeita.</span>'); }
        if (userWins && minute >= 85 && !fired[85]) { fired[85] = 1; pg++; add('<span style="color:#10b981;font-weight:700">85\' - MILAGRE! GOL DO SEU TIME!</span>'); }
        crEl('cr-sesi-score').textContent = `${pg} - ${sg}`;
        if (minute >= 90) {
          clearInterval(crSesiTimer); crSesiTimer = null;
          if (userWins && pg > sg) { add('<span style="color:#fbbf24;font-weight:800">🏆 FEITO HISTÓRICO! Você venceu o invencível SESI FC!</span>'); crConfetti(); }
          else add('<span style="color:#fca5a5;font-weight:700">Fim de jogo. O SESI FC mantém sua hegemonia lendária.</span>');
        }
      }, 250);
    }
