    function switchSetupTab(tab) {
      const tabHost = document.getElementById('tab-host');
      const tabJoin = document.getElementById('tab-join');
      const hostCtrls = document.getElementById('host-controls');
      const joinCtrls = document.getElementById('join-controls');
      const btnHostStart = document.getElementById('btn-host-start');

      if (tab === 'host') {
        tabHost.classList.add('active');
        tabJoin.classList.remove('active');
        hostCtrls.style.display = 'flex';
        joinCtrls.style.display = 'none';
        btnHostStart.style.display = 'inline-block';
        isHost = true;
      } else {
        tabJoin.classList.add('active');
        tabHost.classList.remove('active');
        hostCtrls.style.display = 'none';
        joinCtrls.style.display = 'flex';
        btnHostStart.style.display = 'none';
        isHost = false;
      }
    }

    function changePlayerCount(count) {
      playerCount = parseInt(count);
      teams = defaultTeamsMaster.slice(0, playerCount).map(t => JSON.parse(JSON.stringify(t)));
      
      for (let i = 0; i < 8; i++) {
        const card = document.getElementById(`card-t${i}`);
        const panel = document.getElementById(`panel-${i}`);
        if (i < playerCount) {
          if (card) card.style.display = 'flex';
          if (panel) panel.style.display = 'flex';
        } else {
          if (card) card.style.display = 'none';
          if (panel) panel.style.display = 'none';
        }
      }
      updateBadgePreviews();
      if (isHost) broadcastState();
    }

    function saveBadgesToStorage() {
      const savedBadges = teams.map(t => ({ name: t.name, badge: t.badge }));
      localStorage.setItem('auction_saved_teams_5p_v3', JSON.stringify(savedBadges));
    }

    function loadBadgesFromStorage() {
      const stored = localStorage.getItem('auction_saved_teams_5p_v3');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.forEach((item, i) => {
            if (teams[i]) {
              if (item.name) teams[i].name = item.name;
              if (item.badge) teams[i].badge = item.badge;
              const nameEl = document.getElementById(`t${i}-name`);
              if (nameEl) nameEl.value = teams[i].name;
              const c1El = document.getElementById(`t${i}-c1`);
              if (c1El) c1El.value = teams[i].badge.c1;
              const c2El = document.getElementById(`t${i}-c2`);
              if (c2El) c2El.value = teams[i].badge.c2;
              const shapeEl = document.getElementById(`t${i}-shape`);
              if (shapeEl) shapeEl.value = teams[i].badge.shape;
              const patternEl = document.getElementById(`t${i}-pattern`);
              if (patternEl) patternEl.value = teams[i].badge.pattern;
              const animalEl = document.getElementById(`t${i}-animal`);
              if (animalEl) animalEl.value = teams[i].badge.animal;
            }
          });
        } catch (e) { console.error(e); }
      }
    }

    function generateBadgeSVG(badgeObj) {
      if (!badgeObj) return '';
      const { c1, c2, shape, pattern, animal } = badgeObj;
      let shapePath = "M 5,5 L 45,5 L 45,35 L 25,48 L 5,35 Z";
      if (shape === 'circle') shapePath = "M 25,5 A 20,20 0 1,0 25,45 A 20,20 0 1,0 25,5";
      if (shape === 'diamond') shapePath = "M 25,2 L 48,25 L 25,48 L 2,25 Z";

      let fillContent = `<path d="${shapePath}" fill="${c1 || '#3b82f6'}" stroke="${c2 || '#fff'}" stroke-width="2"/>`;

      if (pattern === 'stripes') {
        fillContent = `
          <defs><clipPath id="clip-${shape}"><path d="${shapePath}"/></clipPath></defs>
          <path d="${shapePath}" fill="${c1}" stroke="${c2}" stroke-width="2"/>
          <g clip-path="url(#clip-${shape})">
            <rect x="10" y="0" width="6" height="50" fill="${c2}"/>
            <rect x="22" y="0" width="6" height="50" fill="${c2}"/>
            <rect x="34" y="0" width="6" height="50" fill="${c2}"/>
          </g>
        `;
      } else if (pattern === 'half') {
        fillContent = `
          <defs><clipPath id="clip-${shape}"><path d="${shapePath}"/></clipPath></defs>
          <path d="${shapePath}" fill="${c1}" stroke="${c2}" stroke-width="2"/>
          <g clip-path="url(#clip-${shape})"><rect x="25" y="0" width="25" height="50" fill="${c2}"/></g>
        `;
      } else if (pattern === 'stars') {
        fillContent += `<text x="25" y="15" font-size="8" fill="${c2}" text-anchor="middle">★</text>`;
      }

      return `
        <svg viewBox="0 0 50 50" width="100%" height="100%">
          ${fillContent}
          <text x="25" y="${pattern === 'stars' ? '32' : '29'}" font-size="16" text-anchor="middle" dominant-baseline="central">${animal || '🦅'}</text>
        </svg>
      `;
    }

    function updateBadgePreviews() {
      for (let i = 0; i < playerCount; i++) {
        const nameInput = document.getElementById(`t${i}-name`);
        if (nameInput) teams[i].name = nameInput.value || `Time ${i+1}`;
        
        const c1El = document.getElementById(`t${i}-c1`);
        if (c1El) {
          teams[i].badge = {
            c1: c1El.value,
            c2: document.getElementById(`t${i}-c2`).value,
            shape: document.getElementById(`t${i}-shape`).value,
            pattern: document.getElementById(`t${i}-pattern`).value,
            animal: document.getElementById(`t${i}-animal`).value
          };
        }
        const prevBox = document.getElementById(`badge-prev-${i}`);
        if (prevBox) prevBox.innerHTML = generateBadgeSVG(teams[i].badge);
      }
      saveBadgesToStorage();
    }
