    // ===== MUNDO DO JOGO: força dos clubes e escudos =====
    // Todos os clubes dos campeonatos da temporada vêm da MESMA lista do Estadualzão (RAW_ESTADUALZAO_LIST).
    // Nenhum clube novo é criado: eles apenas são sorteados entre os campeonatos, sem repetir.

    // Clubes de nível intermediário (um pouco acima dos demais, abaixo dos grandes de BIG_TEAMS)
    const MID_TIER_CLUBS = new Set([
      "Athletico Paranaense", "Bahia", "Sport", "Racing Club", "Estudiantes de La Plata", "Independiente", "Olimpia",
      "Atlético Nacional", "Tottenham Hotspur", "AS Roma", "Napoli", "Borussia Dortmund", "AFC Ajax", "SL Benfica",
      "FC Porto", "Sporting CP", "PSV Eindhoven", "Bayer Leverkusen"
    ]);

    const BADGE_COLORS = [
      ['#ef4444', '#ffffff'], ['#2563eb', '#ffffff'], ['#16a34a', '#ffffff'], ['#facc15', '#111827'],
      ['#111827', '#ffffff'], ['#7c3aed', '#ffffff'], ['#ea580c', '#ffffff'], ['#0891b2', '#ffffff'],
      ['#be123c', '#fde68a'], ['#065f46', '#fde68a'], ['#1e3a8a', '#fbbf24'], ['#f3f4f6', '#111827']
    ];

    // Escudo reserva (só aparece se algum clube ficar sem logo): sempre o mesmo para o mesmo nome
    function badgeForClub(name) {
      let h = 0;
      for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
      const col = BADGE_COLORS[h % BADGE_COLORS.length];
      return {
        c1: col[0], c2: col[1],
        shape: ['shield', 'circle', 'diamond'][(h >> 3) % 3],
        pattern: ['solid', 'stripes', 'half'][(h >> 5) % 3],
        animal: '⚽'
      };
    }
