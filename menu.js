    function getTeamLogoHTML(teamName, badgeObj) {
      if (!teamName) return `<span class="badge-inline-svg">${generateBadgeSVG(badgeObj)}</span>`;
      const cleanName = teamName.toLowerCase().replace(/^[a-z]{2}\s*-\s*/, '').trim();
      const logoUrl = TEAM_LOGOS[teamName.toLowerCase().trim()] || TEAM_LOGOS[cleanName];
      if (logoUrl) {
        return `<img src="${logoUrl}" class="team-badge-icon" alt="${teamName}">`;
      }
      return `<span class="badge-inline-svg">${generateBadgeSVG(badgeObj)}</span>`;
    }

    function selectGameMode(mode) {
      if (mode === 'leilao') {
        document.getElementById('main-menu-screen').style.display = 'none';
        document.getElementById('setup-screen').style.display = 'flex';
      } else {
        alert('Este modo de jogo será criado em breve!');
      }
    }

    function backToMainMenu() {
      stopShootout();
      document.getElementById('setup-screen').style.display = 'none';
      document.getElementById('main-menu-screen').style.display = 'flex';
    }
