// Estadualzão 5x5 — escudos dos times (static + busca automática com cache + escudo gerado como reserva)
    /* =====================================================================
       ESTADUALZÃO 5x5 — ESCUDOS
       Ordem de busca de cada escudo:
         1) FS_CRESTS_EXTRA (seus links, ver abaixo)
         2) TEAM_LOGOS do Leilão (os 32 times do leilão)
         3) busca automática na internet (TheSportsDB), salva no navegador (localStorage)
         4) escudo desenhado (cores + sigla) — sempre funciona, sem internet
       ===================================================================== */

    // >>> Quer um escudo específico? Cole o link aqui. Exemplo:
    //     'Cruzeiro': 'https://site.com/cruzeiro.png',
    const FS_CRESTS_EXTRA = {
    };

    const FS_CREST_STORE = 'fm26_fs_crests_v1';
    const FS_CREST_API = 'https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=';
    const FS_CREST_GAP = 2200;   // ms entre buscas (a API gratuita aceita ~30 por minuto)

    // país (como a API escreve) de cada liga da base — evita pegar o "Everton" do Chile no lugar do inglês
    const FS_LEAGUE_COUNTRY = {
      'Premier League': ['England'], 'EFL Championship': ['England'], 'La Liga (Espanha)': ['Spain'], 'La Liga 2 (Espanha)': ['Spain'],
      'Ligue 1 (França)': ['France'], 'Ligue 2 (França)': ['France'], 'Série A (Itália)': ['Italy'], 'Serie B (Itália)': ['Italy'],
      'Eredivisie (Países Baixos)': ['Netherlands'], 'Austrian Bundesliga (Áustria)': ['Austria'], 'Super League Greece (Grécia)': ['Greece'],
      'Danish Superliga (Dinamarca)': ['Denmark'], 'Ukrainian Premier League (Ucrânia)': ['Ukraine'], 'Russian Premier League (Rússia)': ['Russia'],
      'Nemzeti Bajnokság I (Hungria)': ['Hungary'], 'MLS Conferência Leste': ['United States', 'USA', 'Canada'], 'MLS Conferência Oeste': ['United States', 'USA', 'Canada'],
      'Liga MX (México)': ['Mexico'], 'Brasileirão Série A': ['Brazil'], 'Brasileirão Série B': ['Brazil'], 'Brasileirão Série C': ['Brazil'],
      'Liga Profesional (Argentina)': ['Argentina'], 'Primera Nacional (Argentina)': ['Argentina'], 'Primera División (Uruguai)': ['Uruguay'],
      'Categoría Primera A (Colômbia)': ['Colombia'], 'Liga 1 (Peru)': ['Peru'], 'Primera División (Chile)': ['Chile'], 'Primera División (Paraguai)': ['Paraguay'],
      'División Profesional (Bolívia)': ['Bolivia'], 'Liga FUTVE (Venezuela)': ['Venezuela'], 'LigaPro Serie A (Equador)': ['Ecuador'],
      'Bundesliga (Alemanha)': ['Germany'], '2. Bundesliga (Alemanha)': ['Germany'], 'Jupiler Pro League (Bélgica)': ['Belgium'],
      'Süper Lig (Turquia)': ['Turkey'], 'Saudi Pro League (Arábia Saudita)': ['Saudi Arabia']
    };

    // nome em português (ou com sufixo) -> como a API chama o clube
    const FS_CREST_ALIAS = {
      'Bayern de Munique': 'Bayern Munich', 'PSG': 'Paris SG', 'Paris Saint-Germain': 'Paris SG', 'Inter de Milão': 'Inter Milan', 'Internazionale': 'Inter Milan',
      'Milan': 'AC Milan', 'Atlético de Madrid': 'Atletico Madrid', 'Grêmio': 'Gremio', 'Sporting': 'Sporting CP', 'Porto': 'FC Porto', 'Tottenham': 'Tottenham Hotspur',
      'PSV': 'PSV Eindhoven', 'Roma': 'AS Roma', 'Mônaco': 'Monaco', 'FC Copenhague': 'FC Copenhagen', 'AEK Atenas': 'AEK Athens', 'CSKA Moscou': 'CSKA Moscow',
      'Dinamo Moscou': 'Dynamo Moscow', 'Lokomotiv Moscou': 'Lokomotiv Moscow', 'Spartak Moscou': 'Spartak Moscow', 'Olympique de Marseille': 'Marseille',
      'Olympique Lyonnais': 'Lyon', 'Red Bull Salzburg': 'Salzburg', 'Austria Wien': 'Austria Vienna', 'Rapid Wien': 'Rapid Vienna', 'Odense BK (OB)': 'Odense',
      'Guadalajara (Chivas)': 'Chivas Guadalajara', 'Sint-Truiden (STVV)': 'Sint-Truiden', 'Standard Liège': 'Standard Liege', 'Liga de Quito (LDU)': 'LDU Quito',
      'Torque (Montevideo City)': 'Montevideo City Torque', 'Hellas Verona': 'Verona', 'Real Betis': 'Real Betis', 'Valladolid': 'Real Valladolid',
      'Athletico Paranaense': 'Athletico Paranaense', 'São Paulo': 'Sao Paulo', 'Vasco da Gama': 'Vasco da Gama', 'Zenit St. Petersburg': 'Zenit Saint Petersburg',
      'Universitario de Deportes': 'Universitario', 'Universidad de Chile': 'Universidad de Chile', 'Colo-Colo': 'Colo-Colo'
    };

    const FS_CREST_STATIC = {};
    BOT_TEAMS_32.forEach(n => { const u = TEAM_LOGOS[n.toLowerCase().trim()]; if (u) FS_CREST_STATIC[fsNormName(n)] = u; });
    const FS_CREST_EXTRA = {};
    Object.keys(FS_CRESTS_EXTRA).forEach(n => { FS_CREST_EXTRA[fsNormName(n)] = FS_CRESTS_EXTRA[n]; });

    let fsCrestCache = {};   // chave -> url | 0 (0 = a busca não achou)
    try { fsCrestCache = JSON.parse(localStorage.getItem(FS_CREST_STORE) || '{}') || {}; } catch (e) { fsCrestCache = {}; }
    function fsCrestSave() { try { localStorage.setItem(FS_CREST_STORE, JSON.stringify(fsCrestCache)); } catch (e) { } }

    const fsCrestTeams = {};      // chave -> time (para redesenhar o escudo reserva)
    const fsCrestQueued = new Set(), fsCrestFailed = new Set(), fsCrestQ = [];
    let fsCrestBusy = false, fsCrestOffline = 0;

    function fsCrestKey(t) { return fsNormName(t.name); }
    function fsCrestUrl(t) {
      if (!t || t.isUser) return null;
      const k = fsCrestKey(t);
      if (fsCrestFailed.has(k)) return null;
      return FS_CREST_EXTRA[k] || FS_CREST_STATIC[k] || fsCrestCache[k] || null;
    }

    function fsCrestFallback(t, size) { return fsBadgeOf(t, size); }

    /* escudo pronto para usar em qualquer tela: <span class="fs-crest"> com imagem ou escudo desenhado */
    function fsCrestHTML(t, size) {
      size = size || 28;
      const k = fsCrestKey(t), url = fsCrestUrl(t);
      fsCrestTeams[k] = t;
      let inner;
      if (url) inner = `<img src="${crEsc(url)}" alt="" decoding="async" data-ck="${k}" onerror="fsCrestErr(this)">`;
      else { inner = fsCrestFallback(t, size); fsCrestEnsure(t); }
      return `<span class="fs-crest" data-ck="${k}" style="--s:${size}px">${inner}</span>`;
    }

    function fsCrestApply(k, url) {
      document.querySelectorAll('.fs-crest[data-ck="' + k + '"]').forEach(sp => {
        sp.innerHTML = `<img src="${crEsc(url)}" alt="" decoding="async" data-ck="${k}" onerror="fsCrestErr(this)">`;
      });
    }

    // a imagem não carregou: tenta a versão original, depois a busca automática, por fim o escudo desenhado
    const fsCrestApiTried = new Set();
    function fsCrestErr(img) {
      const k = img.dataset.ck, t = fsCrestTeams[k]; if (!t) return;
      const src = img.getAttribute('src') || '', sized = /\/(small|tiny|medium)$/;
      if (sized.test(src) && !img.dataset.retry) { img.dataset.retry = 1; img.src = src.replace(sized, ''); return; }
      const showFallback = () => document.querySelectorAll('.fs-crest[data-ck="' + k + '"]').forEach(sp => {
        sp.innerHTML = fsCrestFallback(t, parseInt(getComputedStyle(sp).getPropertyValue('--s')) || 28);
      });
      if (FS_CREST_STATIC[k] && !fsCrestApiTried.has(k)) {      // link do leilão quebrado: procura outro
        fsCrestApiTried.add(k); FS_CREST_STATIC[k] = null; showFallback(); fsCrestEnsure(t, true); return;
      }
      fsCrestFailed.add(k); if (fsCrestCache[k]) { fsCrestCache[k] = 0; fsCrestSave(); }
      showFallback();
    }

    function fsCrestEnsure(t, force) {
      if (!t || t.isUser) return;
      const k = fsCrestKey(t); fsCrestTeams[k] = t;
      if (FS_CREST_EXTRA[k] || fsCrestQueued.has(k) || fsCrestOffline >= 3) return;
      if (!force && (FS_CREST_STATIC[k] || fsCrestCache[k] !== undefined)) return;
      fsCrestQueued.add(k); fsCrestQ.push(t); fsCrestPump();
    }

    // coloca os times na fila de busca (os mais importantes primeiro)
    function fsCrestPreload(list) { (list || []).forEach(t => fsCrestEnsure(t)); }

    function fsCrestTerms(t) {
      const out = [];
      const a = FS_CREST_ALIAS[t.name];
      if (a) out.push(a);
      const noPar = t.name.replace(/\s*\(.*?\)\s*/g, ' ').trim();
      if (!out.includes(noPar)) out.push(noPar);
      const simple = noPar.replace(/\b(FC|CF|SC|AC|AS|SK|FK|SV|VfL|BSC|1\.|Club de|Clube de)\b/gi, ' ').replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
      if (simple && !out.includes(simple)) out.push(simple);
      return out.slice(0, 2);
    }

    async function fsCrestSearch(t) {
      const countries = FS_LEAGUE_COUNTRY[t.lg] || null;
      for (const term of fsCrestTerms(t)) {
        const r = await fetch(FS_CREST_API + encodeURIComponent(term));
        if (!r.ok) throw new Error('http ' + r.status);
        const j = await r.json();
        const list = ((j && j.teams) || []).filter(x => x.strSport === 'Soccer' && (x.strBadge || x.strTeamBadge));
        if (!list.length) { await new Promise(res => setTimeout(res, FS_CREST_GAP)); continue; }
        const want = fsNormName(term);
        const inCountry = x => !countries || countries.includes(x.strCountry);
        const pick = list.find(x => inCountry(x) && fsNormName(x.strTeam) === want) || list.find(x => inCountry(x) && countries) || (!countries ? list[0] : null);
        if (pick) return (pick.strBadge || pick.strTeamBadge) + '/small';
        await new Promise(res => setTimeout(res, FS_CREST_GAP));
      }
      return null;
    }

    async function fsCrestPump() {
      if (fsCrestBusy) return; fsCrestBusy = true;
      while (fsCrestQ.length && fsCrestOffline < 3) {
        const t = fsCrestQ.shift(), k = fsCrestKey(t);
        try {
          const url = await fsCrestSearch(t);
          fsCrestOffline = 0;
          fsCrestCache[k] = url || 0; fsCrestSave();
          if (url) fsCrestApply(k, url);
        } catch (e) { fsCrestOffline++; }
        fsCrestQueued.delete(k);
        await new Promise(res => setTimeout(res, FS_CREST_GAP));
      }
      fsCrestBusy = false;
    }

    /* imagem para desenhar no canvas (campo). Devolve null enquanto não carregou. */
    const fsCrestImgs = {};
    function fsCrestImg(t) {
      const url = fsCrestUrl(t);
      let im;
      if (url) im = fsCrestImgs[url] || (fsCrestImgs[url] = Object.assign(new Image(), { src: url }));
      else {   // sem imagem ainda: usa o escudo desenhado
        const k = 'svg|' + t.name + t.c1 + t.c2 + (t.icon || '');
        im = fsCrestImgs[k];
        if (!im) { im = fsCrestImgs[k] = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fsBadgeOf(t, 120).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); }
        return (im.complete && im.naturalWidth) ? im : null;
      }
      if (!im.onerror) im.onerror = () => { im.bad = true; };
      return (im.complete && im.naturalWidth && !im.bad) ? im : null;
    }
