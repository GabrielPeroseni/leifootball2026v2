// FutManager 2026 — Modo Leilão (jogadores, times, rede PeerJS, torneio, menu principal)
    // MAPEAMENTO DE LOGOS
    const TEAM_LOGOS = {
      "real madrid": "https://logopng.com.br/logos/real-madrid-174.png",
      "manchester city": "https://upload.wikimedia.org/wikipedia/pt/0/02/Manchester_City_Football_Club.png",
      "bayern de munique": "https://1000logos.net/wp-content/uploads/2018/05/Bayern-Munchen-Logo.png",
      "bayern munchen": "https://1000logos.net/wp-content/uploads/2018/05/Bayern-Munchen-Logo.png",
      "psg": "https://thumb.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/330px-Paris_Saint-Germain_F.C..svg.png",
      "paris saint-germain": "https://thumb.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/330px-Paris_Saint-Germain_F.C..svg.png",
      "barcelona": "https://thumb.wikimedia.org/wikipedia/pt/thumb/4/43/FCBarcelona.svg/3840px-FCBarcelona.svg.png",
      "liverpool": "https://thumb.wikimedia.org/wikipedia/pt/thumb/0/0c/Liverpool_FC.svg/1920px-Liverpool_FC.svg.png",
      "arsenal": "https://thumb.wikimedia.org/wikipedia/pt/thumb/5/53/Arsenal_FC.svg/1280px-Arsenal_FC.svg.png",
      "inter de milão": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/3840px-FC_Internazionale_Milano_2021.svg.png",
      "inter de milao": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/3840px-FC_Internazionale_Milano_2021.svg.png",
      "inter milan": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/3840px-FC_Internazionale_Milano_2021.svg.png",
      "juventus": "https://upload.wikimedia.org/wikipedia/commons/5/51/Juventus_FC_2017_logo.png",
      "bayer leverkusen": "https://upload.wikimedia.org/wikipedia/pt/a/a2/Bayer_Leverkusen.png",
      "borussia dortmund": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/250px-Borussia_Dortmund_logo.svg.png",
      "atletico de madrid": "https://upload.wikimedia.org/wikipedia/pt/1/19/AtleticoMadrid2017.png",
      "atlético de madrid": "https://upload.wikimedia.org/wikipedia/pt/1/19/AtleticoMadrid2017.png",
      "chelsea": "https://thumb.wikimedia.org/wikipedia/pt/thumb/c/cc/Chelsea_FC.svg/1280px-Chelsea_FC.svg.png",
      "milan": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/AC_Milan.png/330px-AC_Milan.png",
      "ac milan": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/AC_Milan.png/330px-AC_Milan.png",
      "manchester united": "https://upload.wikimedia.org/wikipedia/pt/b/b6/Manchester_United_FC_logo.png",
      "tottenham": "https://upload.wikimedia.org/wikipedia/pt/6/6d/Tottenham_Hotspur.png",
      "napoli": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/SSC_Napoli.svg/500px-SSC_Napoli.svg.png",
      "benfica": "https://thumb.wikimedia.org/wikipedia/pt/thumb/d/de/Sport_Lisboa_e_Benfica.svg/330px-Sport_Lisboa_e_Benfica.svg.png",
      "porto": "https://upload.wikimedia.org/wikipedia/pt/c/c5/F.C._Porto_logo.png",
      "sporting": "https://upload.wikimedia.org/wikipedia/pt/3/3e/Sporting_Clube_de_Portugal.png",
      "ajax": "https://thumb.wikimedia.org/wikipedia/pt/thumb/b/b8/AFC_Ajax_Amsterdam.svg/3840px-AFC_Ajax_Amsterdam.svg.png",
      "psv": "https://upload.wikimedia.org/wikipedia/pt/c/ca/PSV_Eindhoven_escudo.png",
      "roma": "https://upload.wikimedia.org/wikipedia/pt/8/8c/AS_Roma_logo.png",
      "corinthians": "https://thumb.wikimedia.org/wikipedia/pt/thumb/b/b4/Corinthians_simbolo.png/250px-Corinthians_simbolo.png",
      "flamengo": "https://upload.wikimedia.org/wikipedia/commons/9/93/Flamengo-RJ_%28BRA%29.png",
      "palmeiras": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Palmeiras_logo.svg/500px-Palmeiras_logo.svg.png",
      "river plate": "https://upload.wikimedia.org/wikipedia/commons/f/f1/River_Plate.png",
      "boca juniors": "https://upload.wikimedia.org/wikipedia/commons/c/c9/Boca_escudo.png",
      "sao paulo": "https://upload.wikimedia.org/wikipedia/commons/4/4b/S%C3%A3o_Paulo_Futebol_Clube.png",
      "são paulo": "https://upload.wikimedia.org/wikipedia/commons/4/4b/S%C3%A3o_Paulo_Futebol_Clube.png",
      "santos": "https://upload.wikimedia.org/wikipedia/commons/1/15/Santos_Logo.png",
      "gremio": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Gremio_logo.svg/1280px-Gremio_logo.svg.png",
      "grêmio": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Gremio_logo.svg/1280px-Gremio_logo.svg.png",
      "internacional": "https://upload.wikimedia.org/wikipedia/commons/f/f1/Escudo_do_Sport_Club_Internacional.svg"
    };

    const BOT_TEAMS_32 = [
      "Real Madrid", "Manchester City", "Bayern de Munique", "PSG", "Barcelona", "Liverpool", "Arsenal", "Inter de Milão",
      "Juventus", "Bayer Leverkusen", "Borussia Dortmund", "Atlético de Madrid", "Chelsea", "Milan", "Manchester United", "Tottenham",
      "Napoli", "Benfica", "Porto", "Sporting", "Ajax", "PSV", "Roma", "Corinthians",
      "Flamengo", "Palmeiras", "River Plate", "Boca Juniors", "São Paulo", "Santos", "Grêmio", "Internacional"
    ];

    function getTeamLogoHTML(teamName, badgeObj) {
      if (!teamName) return `<span class="badge-inline-svg">${generateBadgeSVG(badgeObj)}</span>`;
      const cleanName = teamName.toLowerCase().trim();
      if (TEAM_LOGOS[cleanName]) {
        return `<img src="${TEAM_LOGOS[cleanName]}" class="team-badge-icon" alt="${teamName}">`;
      }
      return `<span class="badge-inline-svg">${generateBadgeSVG(badgeObj)}</span>`;
    }

    function selectGameMode(mode) {
      if (mode === 'leilao') {
        document.getElementById('main-menu-screen').style.display = 'none';
        document.getElementById('setup-screen').style.display = 'flex';
      } else if (mode === 'carreira') {
        crOpenSetup();
      } else if (mode === 'estadualzao') {
        fsOpenSetup();
      } else {
        alert('Este modo de jogo será criado em breve!');
      }
    }

    function backToMainMenu() {
      document.getElementById('setup-screen').style.display = 'none';
      document.getElementById('main-menu-screen').style.display = 'flex';
    }

    const database = {
      GOL: [
        { name: "Thibaut Courtois", ovr: 91, photo: "https://cdn-img.staticzz.com/img/planteis/new/13/56/6981356_thibaut_courtois_20250113131353.png" },
        { name: "Alisson Becker", ovr: 89, photo: "https://cdn-img.staticzz.com/img/planteis/new/14/64/8721464_alisson_becker_20240419091353.png" },
        { name: "Ederson", ovr: 88, photo: "https://www.ogol.com.br/img/jogadores/new/68/85/136885_ederson_moraes_20250618210458.png" },
        { name: "Mike Maignan", ovr: 88, photo: "https://www.ogol.com.br/img/jogadores/new/88/10/168810_mike_maignan_20251228124300.png" },
        { name: "Gianluigi Donnarumma", ovr: 89, photo: "https://cdn-img.staticzz.com/img/planteis/new/44/60/8684460_gigi_donnarumma_20250206035904.png" },
        { name: "Emiliano Martínez", ovr: 88, photo: "https://cdn-img.staticzz.com/img/planteis/new/50/91/16565091_emiliano_martinez_20260617131340.png" },
        { name: "Unai Simón", ovr: 86, photo: "https://www.ogol.com.br/img/jogadores/new/90/56/439056_unai_simon_20260128225626.png" },
        { name: "Oliver Kahn", ovr: 91, photo: "https://www.ogol.com.br/img/jogadores/new/25/91/2591_oliver_kahn_20250101181633.png" },
        { name: "Gregor Kobel", ovr: 87, photo: "https://www.ogol.com.br/img/jogadores/new/93/06/1499306_gregor_kobel_20260602013547.png" },
        { name: "David Raya", ovr: 87, photo: "https://www.ogol.com.br/img/jogadores/new/76/92/397692_david_raya_20260511135256.png" },
        { name: "Gabriel Peroseni", ovr: 99, photo: "https://cdnstatic.tencentcs.com/edgeone/pages/assets/1790457802926-Z4Jh.png" },
        { name: "Jan Oblak", ovr: 89, photo: "https://cdn-img.staticzz.com/img/planteis/new/96/92/14899692_jan_oblak_20260127193140.png" },
        { name: "Marc-André ter Stegen", ovr: 90, photo: "https://cdn-img.staticzz.com/img/planteis/new/94/77/11229477_marc_andre_ter_stegen_20251223225657.png" },
        { name: "Manuel Neuer", ovr: 93, photo: "https://cdn-img.staticzz.com/img/planteis/new/61/01/6106101_manuel_neuer_20250129232414.png" },
        { name: "Gianluigi Buffon", ovr: 92, photo: "https://www.ogol.com.br/img/jogadores/new/19/79/1979_gianluigi_buffon_20250409143104.png" },
        { name: "Cássio", ovr: 86, photo: "https://www.ogol.com.br/img/jogadores/new/14/50/31450_cassio_20240627125554.png" },
        { name: "Lev Yashin", ovr: 93, photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-L_q7jJsRy4w5-d0yz4pnuWuDktLpPT5QNP0ESMdswQ&s=10" },
        { name: "Iker Casillas", ovr: 92, photo: "https://www.ogol.com.br/img/jogadores/14/771714_med__20210411193746_iker_casillas.png" },
        { name: "Petr Čech", ovr: 90, photo: "https://www.ogol.com.br/img/jogadores/38/766438_ori__20210327022445_petr_cech.png" },
        { name: "Marcos", ovr: 87, photo: "https://www.palmeiras.com.br/wp-content/uploads/2019/08/marcos-pagina-de-craques-2.png" },
        { name: "Edwin van der Sar", ovr: 90, photo: "https://fifarosters.com/assets/players/fifa23/dynamic/50383187.png" },
        { name: "Claudio Taffarel", ovr: 87, photo: "https://fussball-legende.de/wp-content/uploads/2025/03/Taffarel.png" },
        { name: "Júlio César", ovr: 89, photo: "https://cdn-img.staticzz.com/img/planteis/new/64/08/4296408_julio_cesar_20241226174717.png" },
        { name: "Carlos Miguel", ovr: 84, photo: "https://www.verdazzo.com.br/wp-content/uploads/2025/08/carlosmiguel.png" },
        { name: "Hugo Souza", ovr: 84, photo: "https://cdn-img.staticzz.com/img/planteis/new/72/46/14167246_hugo_souza_20250505162035.png" }
      ],
      DEF: [
        { name: "Rúben Dias", ovr: 89, photo: "https://cdn-img.staticzz.com/img/planteis/new/79/34/11527934_ruben_dias_20240816210746.png" },
        { name: "Virgil van Dijk", ovr: 89, photo: "https://www.ogol.com.br/img/jogadores/new/45/93/194593_virgil_van_dijk_20251022235737.png" },
        { name: "William Saliba", ovr: 88, photo: "https://cdn-img.staticzz.com/img/planteis/504/7367504_.png" },
        { name: "Marquinhos", ovr: 87, photo: "https://cdn-img.staticzz.com/img/planteis/new/99/21/14899921_marquinhos_20260901203314.png" },
        { name: "Gabriel Magalhães", ovr: 89, photo: "https://www.ogol.com.br/img/jogadores/new/98/52/499852_gabriel_magalhaes_20250928235227.png" },
        { name: "Alessandro Bastoni", ovr: 87, photo: "https://www.ogol.com.br/img/jogadores/new/18/64/511864_alessandro_bastoni_20250904233014.png" },
        { name: "Theo Hernández", ovr: 86, photo: "https://cdn-img.staticzz.com/img/planteis/new/24/67/11232467_theo_hernandez_20250714145950.png" },
        { name: "Achraf Hakimi", ovr: 90, photo: "https://www.ogol.com.br/img/jogadores/new/86/25/478625_achraf_hakimi_20260217234110.png" },
        { name: "Trent Alexander-Arnold", ovr: 86, photo: "https://www.ogol.com.br/img/jogadores/new/97/52/449752_trent_alexander_arnold_20260217194323.png" },
        { name: "Thiago Silva", ovr: 89, photo: "https://cdn-img.staticzz.com/img/planteis/new/62/38/14226238_thiago_silva_20251220230859.png" },
        { name: "Paolo Maldini", ovr: 93, photo: "https://www.ogol.com.br/img/jogadores/new/19/47/1947_paolo_maldini_20251010135723.png" },
        { name: "Thiago Martins", ovr: 99, photo: "https://spare-chocolate-gv8z7xch.edgeone.dev/file.png" },
        { name: "Octavio Moreira", ovr: 99, photo: "https://cdnstatic.tencentcs.com/edgeone/pages/assets/1790457963815-WA04.png" },
        { name: "Antonio Rüdiger", ovr: 87, photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1VoMXpZusvIsXwi-yHN90ZkOpA8GNtQazqigRc0I4Jw&s=10" },
        { name: "Jules Koundé", ovr: 86, photo: "https://cdn-img.staticzz.com/img/planteis/526/7367526_.png" },
        { name: "Franz Beckenbauer", ovr: 93, photo: "https://sportal365images.com/process/smp-images-production/assets/25032026/f04dcf54-8d03-47f3-886d-202bd82fad55.png?operations=crop(11:100:271:360)" },
        { name: "Ronald Araújo", ovr: 86, photo: "https://www.ogol.com.br/img/jogadores/new/17/42/591742_ronald_araujo_20260824100530.png" },
        { name: "Éder Militão", ovr: 87, photo: "https://www.ogol.com.br/img/jogadores/new/48/29/484829_eder_militao_20240809095340.png" },
        { name: "Franco Baresi", ovr: 92, photo: "https://s.hs-data.com/gfx/person/cropped/250x250/45216.png?fallback=male" },
        { name: "Sergio Ramos", ovr: 90, photo: "https://static.wikia.nocookie.net/fightclubchampfanom/images/5/51/Sergio_Ramos.png/revision/latest?cb=20201029180308" },
        { name: "Roberto Carlos", ovr: 91, photo: "https://www.ogol.com.br/img/jogadores/94/739894_ori__20210109014356_roberto_carlos.png" },
        { name: "Cafu", ovr: 91, photo: "https://cdn.soccerwiki.org/images/player/2467.png" },
        { name: "Carles Puyol", ovr: 90, photo: "https://cdn.futwiz.com/assets/img/fc24/faces/50570032.png" },
        { name: "Fabio Cannavaro", ovr: 91, photo: "https://game-assets.fut.gg/cdn-cgi/image/quality=85,width=300,format=auto/2026/player-item/26-1183.cbdf73a6855c3d8d4f8cfe24acc56fee80717baa7dacb4ca30156e63cac44a63.webp" },
        { name: "Philipp Lahm", ovr: 90, photo: "https://b.fssta.com/uploads/application/soccer/headshots/2253.png" },
        { name: "Marcelo", ovr: 88, photo: "https://cdn-img.staticzz.com/img/planteis/new/82/91/758291_marcelo_20240924143428.jpg" },
        { name: "Nuno Mendes", ovr: 86, photo: "https://cdn-img.staticzz.com/img/planteis/new/73/21/8727321_nuno_mendes_20250925203602.png" },
        { name: "Raphaël Varane", ovr: 88, photo: "https://www.teamtalk.com/content/themes/teamtalk2/img/png/player/headshots/raphael-xavier-varane.png" },
        { name: "Matheuzinho", ovr: 80, photo: "https://www.ogol.com.br/img/jogadores/new/01/64/1490164_matheuzinho_20260515150332.png" },
        { name: "Dayot Upamecano", ovr: 85, photo: "https://cdn.soccerwiki.org/images/player/82312-action.png" },
        { name: "Ibrahima Konaté", ovr: 85, photo: "https://assets.bundesliga.com/player/dfl-obj-0027sm-dfl-clu-000017-dfl-sea-0001k4-body.png?crop=0,0,100,55&fit=1200,630" },
        { name: "Jordi Alba", ovr: 86, photo: "https://cdn.futwiz.com/assets/img/fc25/faces/189332.png?25" },
        { name: "João Cancelo", ovr: 86, photo: "https://www.fcbarcelona.com/photo-resources/2026/08/19/7d3f20c8-d349-42e6-90a5-d70a6a2f86b7/00-Cancelo.png?width=670&height=790" },
        { name: "Patrice Evra", ovr: 85, photo: "https://static.wikia.nocookie.net/the-football-database/images/b/b0/ManUnited_P._Evra_001.png/revision/latest?cb=20131127214911" },
        { name: "Javier Zanetti", ovr: 88, photo: "https://www.ogol.com.br/img/jogadores/new/20/13/2013_javier_zanetti_20251010143134.png" },
        { name: "Rodinei", ovr: 80, photo: "https://assets.bundesliga.com/player/dfl-obj-j01e20-dfl-clu-j0003i-dfl-sea-0001k9.png?fit=256,256" },
        { name: "Gil", ovr: 80, photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrPf9vQpbKdHnh6UQuB-EP3t4_9ZDKD5lBosZAZCfwig&s=10" },
        { name: "Pau Cubarsí", ovr: 85, photo: "https://assets.bundesliga.com/player/dfl-obj-j01t3m-dfl-clu-j0002f-dfl-sea-0001ka.png" },
        { name: "Gustavo Gómez", ovr: 84, photo: "https://cdn.soccerwiki.org/images/player/50937.png" },
        { name: "Fagner", ovr: 80, photo: "https://www.diarioceleste.com.br/wp-content/uploads/2025/07/Fagner-01.png" }
      ],
      ATA: [
        { name: "Kylian Mbappé", ovr: 92, photo: "https://cdn-img.staticzz.com/img/planteis/new/82/60/16538260_kylian_mbappe_20260615102715.png" },
        { name: "Erling Haaland", ovr: 92, photo: "https://cdn-img.staticzz.com/img/planteis/new/64/23/14836423_erling_haaland_20260620022833.png" },
        { name: "Vinícius Jr", ovr: 91, photo: "https://www.ogol.com.br/img/jogadores/new/77/37/547737_vinicius_junior_20250923225603.png" },
        { name: "Jude Bellingham", ovr: 91, photo: "https://www.ogol.com.br/img/jogadores/new/75/32/737532_jude_bellingham_20250618231333.png" },
        { name: "Kevin De Bruyne", ovr: 91, photo: "https://cdn-img.staticzz.com/img/planteis/new/53/22/5805322_kevin_de_bruyne_20260515065922.png" },
        { name: "Harry Kane", ovr: 91, photo: "https://cdn-img.staticzz.com/img/planteis/new/44/67/8834467_harry_kane_20250507144126.png" },
        { name: "Mohamed Salah", ovr: 91, photo: "https://www.ogol.com.br/img/jogadores/new/75/88/207588_mohamed_salah_20260114143557.png" },
        { name: "Lamine Yamal", ovr: 89, photo: "https://cdn-img.staticzz.com/img/planteis/new/80/82/16558082_lamine_yamal_20260612140847.png" },
        { name: "Felipe Nogueira", ovr: 99, photo: "https://urgent-white-2wz5besk.edgeone.dev/file.png" },
        { name: "Kauã Romualdo", ovr: 99, photo: "https://cdnstatic.tencentcs.com/edgeone/pages/assets/1790457891071-A7fw.png" },
        { name: "Matheus Marques", ovr: 99, photo: "https://screeching-tomato-vwtvb9zm.edgeone.dev/file.png" },
        { name: "Lionel Messi", ovr: 94, photo: "https://cdn-img.staticzz.com/img/planteis/new/51/10/16565110_lionel_messi_20260615111812.png" },
        { name: "Cristiano Ronaldo", ovr: 94, photo: "https://cdn-img.staticzz.com/img/planteis/new/76/13/16547613_cristiano_ronaldo_20260615104221.png" },
        { name: "Neymar Jr", ovr: 93, photo: "https://cdn-img.staticzz.com/img/planteis/new/19/62/2551962_neymar_20240502170305.png" },
        { name: "Rodri", ovr: 91, photo: "https://www.ogol.com.br/img/jogadores/new/13/48/331348_rodri__20251110125120.png" },
        { name: "Lautaro Martínez", ovr: 88, photo: "https://www.ogol.com.br/img/jogadores/new/87/47/468747_lautaro_martinez_20260104222007.png" },
        { name: "Phil Foden", ovr: 89, photo: "https://www.ogol.com.br/img/jogadores/new/02/09/480209_phil_foden_20251110125327.png" },
        { name: "Florian Wirtz", ovr: 88, photo: "https://www.ogol.com.br/img/jogadores/new/25/25/782525_florian_wirtz_20260114143456.png" },
        { name: "Jamal Musiala", ovr: 88, photo: "https://cdn-img.staticzz.com/img/planteis/new/47/65/8754765_jamal_musiala_20260523001810.png" },
        { name: "Antoine Griezmann", ovr: 88, photo: "https://cdn-img.staticzz.com/img/planteis/new/79/49/11617949_antoine_griezmann_20260127192908.png" },
        { name: "Rafael Leão", ovr: 87, photo: "https://cdn-img.staticzz.com/img/planteis/new/76/14/16547614_rafael_leao_20260615104218.png" },
        { name: "Michael Olise", ovr: 87, photo: "https://cdn-img.staticzz.com/img/planteis/new/17/62/14901762_michael_olise_20260531112255.png" },
        { name: "Cole Palmer", ovr: 87, photo: "https://www.ogol.com.br/img/jogadores/new/90/19/659019_cole_palmer_20260207203123.png" },
        { name: "Ronaldinho Gaúcho", ovr: 94, photo: "https://cdn-img.staticzz.com/img/planteis/new/98/32/4279832_ronaldinho_gaucho_20250422142002.png" },
        { name: "Ronaldo Nazário", ovr: 95, photo: "https://cdn.futwiz.com/assets/img/fifa20/faces/237064.png" },
        { name: "Zinedine Zidane", ovr: 94, photo: "https://cdn.soccerwiki.org/images/player/2916.png" },
        { name: "Thierry Henry", ovr: 92, photo: "https://cdn.soccerwiki.org/images/player/27.png" },
        { name: "Kaká", ovr: 91, photo: "https://www.ogol.com.br/img/jogadores/new/19/63/1963_kaka_20260422183909.png" },
        { name: "Robert Lewandowski", ovr: 90, photo: "https://cdn-img.staticzz.com/img/planteis/new/66/10/8706610_robert_lewandowski_20251122055135.png" },
        { name: "Ousmane Dembélé", ovr: 89, photo: "https://www.ogol.com.br/img/jogadores/new/83/24/488324_ousmane_dembele_20260208232541.png" },
        { name: "Gareth Bale", ovr: 88, photo: "https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/77653.png&w=350&h=254" },
        { name: "Adriano Imperador", ovr: 90, photo: "https://cdn-img.staticzz.com/img/planteis/new/58/09/585809_adriano_20241121020837.jpg" },
        { name: "Luka Modrić", ovr: 90, photo: "https://cdn-img.staticzz.com/img/planteis/new/42/48/11524248_luka_modric_20250721164546.png" },
        { name: "Johan Cruyff", ovr: 94, photo: "https://static.wikia.nocookie.net/the-football-database/images/3/30/Johan-Cruyff_%282%29.png/revision/latest?cb=20130801202722" },
        { name: "Pelé", ovr: 97, photo: "https://crystalpng.com/wp-content/uploads/2025/02/Pele-png-02.png" },
        { name: "Diego Maradona", ovr: 96, photo: "https://crystalpng.com/wp-content/uploads/2025/02/Maradona-png-01.png" },
        { name: "Garrincha", ovr: 94, photo: "https://static.wikia.nocookie.net/the-football-database/images/7/71/Garrincha.png/revision/latest?cb=20241229093024" },
        { name: "Andrés Iniesta", ovr: 92, photo: "https://b.fssta.com/uploads/application/soccer/headshots/709.png" },
        { name: "Zico", ovr: 92, photo: "https://images.tcdn.com.br/files/311840/themes/5393/img/paginas-personalizadas/times/flamengo/idolos/zico.png?8ebe65019458cb68498c507a78506472" },
        { name: "Karim Benzema", ovr: 91, photo: "https://cdn-img.staticzz.com/img/planteis/new/72/61/11527261_karim_benzema_20240912121547.png" },
        { name: "Rivaldo", ovr: 91, photo: "https://cdn-img.staticzz.com/img/planteis/new/55/86/45586_rivaldo_20260218183741.png" },
        { name: "Romário", ovr: 92, photo: "https://r2.thesportsdb.com/images/media/player/render/1j5x171615744448.png" },
        { name: "Zlatan Ibrahimović", ovr: 90, photo: "https://a.espncdn.com/i/headshots/soccer/players/full/11001.png" },
        { name: "Didier Drogba", ovr: 89, photo: "https://cdn.soccerwiki.org/images/player/473-action.png" },
        { name: "Samuel Eto'o", ovr: 89, photo: "https://cdn.soccerwiki.org/images/player/2779.png" },
        { name: "Raphinha", ovr: 88, photo: "https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p233419.png?padding=0.7" },
        { name: "Arrascaeta", ovr: 85, photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBmZQ9Vf2pW-1vxXHnrcZWc78GcfLBWl9V6lasJY2ipg&s=10" },
        { name: "Breno Bidon", ovr: 78, photo: "https://cdn-img.staticzz.com/img/planteis/new/43/79/14254379_breno_bidon_20250507190426.png" },
        { name: "Vampeta", ovr: 82, photo: "https://d1x4bjge7r9nas.cloudfront.net/wp-content/uploads/2025/09/30165415/Vampeta.png" },
        { name: "Lucas Paquetá", ovr: 85, photo: "https://assets.bundesliga.com/player/dfl-obj-j01qxj-dfl-clu-j0008p-dfl-sea-0001ka.png" },
        { name: "Nico", ovr: 99, photo: "https://plain-enam-prod-public.komododecks.com/202610/01/m9YV62Pn7nzkRXeDd0sf/image.jpg" }
      ]
    };

    let playerCount = 5;

    let defaultTeamsMaster = [
      { id: 0, name: "Time 1", tokens: 100, passesLeft: 3, season2SwapsLeft: 2, lineup: { GOL: null, DEF1: null, DEF2: null, DEF3: null, ALA_PIVO1: null, ALA_PIVO2: null, ALA_PIVO3: null, ALA_PIVO4: null, ALA_PIVO5: null }, badge: { c1: "#3b82f6", c2: "#0f172a", shape: "shield", pattern: "solid", animal: "🦅" } },
      { id: 1, name: "Time 2", tokens: 100, passesLeft: 3, season2SwapsLeft: 2, lineup: { GOL: null, DEF1: null, DEF2: null, DEF3: null, ALA_PIVO1: null, ALA_PIVO2: null, ALA_PIVO3: null, ALA_PIVO4: null, ALA_PIVO5: null }, badge: { c1: "#10b981", c2: "#ffffff", shape: "circle", pattern: "solid", animal: "🟢" } },
      { id: 2, name: "Time 3", tokens: 100, passesLeft: 3, season2SwapsLeft: 2, lineup: { GOL: null, DEF1: null, DEF2: null, DEF3: null, ALA_PIVO1: null, ALA_PIVO2: null, ALA_PIVO3: null, ALA_PIVO4: null, ALA_PIVO5: null }, badge: { c1: "#f59e0b", c2: "#000000", shape: "diamond", pattern: "half", animal: "🦁" } },
      { id: 3, name: "Time 4", tokens: 100, passesLeft: 3, season2SwapsLeft: 2, lineup: { GOL: null, DEF1: null, DEF2: null, DEF3: null, ALA_PIVO1: null, ALA_PIVO2: null, ALA_PIVO3: null, ALA_PIVO4: null, ALA_PIVO5: null }, badge: { c1: "#8b5cf6", c2: "#ffffff", shape: "shield", pattern: "stripes", animal: "🦅" } },
      { id: 4, name: "Time 5", tokens: 100, passesLeft: 3, season2SwapsLeft: 2, lineup: { GOL: null, DEF1: null, DEF2: null, DEF3: null, ALA_PIVO1: null, ALA_PIVO2: null, ALA_PIVO3: null, ALA_PIVO4: null, ALA_PIVO5: null }, badge: { c1: "#06b6d4", c2: "#ffffff", shape: "circle", pattern: "stars", animal: "🐉" } },
      { id: 5, name: "Time 6", tokens: 100, passesLeft: 3, season2SwapsLeft: 2, lineup: { GOL: null, DEF1: null, DEF2: null, DEF3: null, ALA_PIVO1: null, ALA_PIVO2: null, ALA_PIVO3: null, ALA_PIVO4: null, ALA_PIVO5: null }, badge: { c1: "#ec4899", c2: "#ffffff", shape: "shield", pattern: "solid", animal: "🐺" } },
      { id: 6, name: "Time 7", tokens: 100, passesLeft: 3, season2SwapsLeft: 2, lineup: { GOL: null, DEF1: null, DEF2: null, DEF3: null, ALA_PIVO1: null, ALA_PIVO2: null, ALA_PIVO3: null, ALA_PIVO4: null, ALA_PIVO5: null }, badge: { c1: "#e11d48", c2: "#000000", shape: "diamond", pattern: "stripes", animal: "🐅" } },
      { id: 7, name: "Time 8", tokens: 100, passesLeft: 3, season2SwapsLeft: 2, lineup: { GOL: null, DEF1: null, DEF2: null, DEF3: null, ALA_PIVO1: null, ALA_PIVO2: null, ALA_PIVO3: null, ALA_PIVO4: null, ALA_PIVO5: null }, badge: { c1: "#84cc16", c2: "#0f172a", shape: "circle", pattern: "half", animal: "🦁" } }
    ];

    let teams = JSON.parse(JSON.stringify(defaultTeamsMaster.slice(0, playerCount)));

    let currentDeck = [];
    let rejectedQueue = [];
    let usedPlayerNames = new Set(); 
    let currentPlayerCard = null;
    let turnOrder = [];
    let activeTurnIndex = 0;
    let highestBid = -1;
    let highestBidderId = null;
    let activeBidders = [];
    let playersActedThisCard = new Set();
    let isAuctionStarted = false;
    let isDiceRolled = false;
    let isTransitioning = false;
    let currentSeason = 1;
    let season2DraftCount = 0;
    let tournamentStage = 'COPA';
    let tournamentData = { groups: {}, bracket: {}, currentPhase: 'GROUPS', groupRound: 1, currentMatchIndex: 0 };
    let currentBrasfootState = { active: false, currentMatchMinute: 0, currentMatches: [], history: [] };

    let peer = null, connections = [], hostConn = null, isHost = true, myPlayerId = 0;

    // Troca pendente da 2ª temporada (sincronizada para todos) e controle do modal local
    let pendingSwap = null;      // { teamId, card }
    let swapModalKey = null;     // evita reabrir o modal a cada sincronização
    let matchTimer = null;       // timer da simulação das partidas (host)
    const MATCH_DURATION_MS = 60000; // TODAS as partidas duram 60s reais

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

    function initPeer() {
      peer = new Peer();
      peer.on('open', (id) => {
        document.getElementById('host-id-display').innerHTML = `<b>ID da Sala:</b> <span style="user-select:all; background:var(--bg-input); padding:2px 6px; border-radius:4px; border:1px solid var(--border-color);">${id}</span>`;
      });

      peer.on('connection', (conn) => {
        if (connections.length >= playerCount - 1) return;
        connections.push(conn);
        const assignedId = connections.length;

        conn.on('open', () => {
          conn.send({ type: 'ASSIGN_PLAYER', playerId: assignedId, playerCount: playerCount });
          broadcastState();
        });

        conn.on('data', (data) => handleIncomingNetworkData(data, conn));
      });

      loadBadgesFromStorage();
      changePlayerCount(5);
    }

    function getLocalTeamData(slotIndex) {
      const idx = slotIndex !== undefined ? slotIndex : 1;
      return {
        name: document.getElementById(`t${idx}-name`) ? document.getElementById(`t${idx}-name`).value.trim() : `Time ${idx+1}`,
        badge: {
          c1: document.getElementById(`t${idx}-c1`) ? document.getElementById(`t${idx}-c1`).value : "#10b981",
          c2: document.getElementById(`t${idx}-c2`) ? document.getElementById(`t${idx}-c2`).value : "#ffffff",
          shape: document.getElementById(`t${idx}-shape`) ? document.getElementById(`t${idx}-shape`).value : "circle",
          pattern: document.getElementById(`t${idx}-pattern`) ? document.getElementById(`t${idx}-pattern`).value : "solid",
          animal: document.getElementById(`t${idx}-animal`) ? document.getElementById(`t${idx}-animal`).value : "🦅"
        }
      };
    }

    function joinRoom() {
      updateBadgePreviews();
      const hostId = document.getElementById('join-room-id').value.trim();
      const customNameInput = document.getElementById('join-team-name').value.trim();

      if (!hostId) return alert('Insira o ID da Sala!');

      hostConn = peer.connect(hostId);
      isHost = false;

      document.getElementById('status-conn').innerText = "Conectando ao Host...";

      hostConn.on('open', () => {
        document.getElementById('status-conn').innerText = "Conectado! Aguardando o Host iniciar.";
        document.getElementById('btn-join').disabled = true;

        const myData = getLocalTeamData(1);
        if (customNameInput) myData.name = customNameInput;

        hostConn.send({ type: 'SET_NAME', name: myData.name, badge: myData.badge });
      });

      hostConn.on('data', (data) => handleIncomingNetworkData(data, hostConn));
    }

    function sendActionToHost(actionType, payload = {}) {
      if (isHost) processActionHost(actionType, payload, myPlayerId);
      else if (hostConn) hostConn.send({ type: 'PLAYER_ACTION', action: actionType, payload: payload, senderId: myPlayerId });
    }

    function handleIncomingNetworkData(data, conn) {
      if (data.type === 'ASSIGN_PLAYER') {
        myPlayerId = data.playerId;
        if (data.playerCount) {
          playerCount = data.playerCount;
          changePlayerCount(playerCount);
        }
        const customNameInput = document.getElementById('join-team-name').value.trim();
        const myData = getLocalTeamData(myPlayerId);
        if (customNameInput) myData.name = customNameInput;

        if (hostConn) {
          hostConn.send({ type: 'SET_NAME', name: myData.name, badge: myData.badge, senderId: myPlayerId });
        }
      } 
      else if (data.type === 'SYNC_STATE') {
        applyStateSync(data.state);
      } 
      else if (data.type === 'SET_NAME' && isHost) {
        const pId = data.senderId !== undefined ? data.senderId : connections.indexOf(conn) + 1;
        if (pId !== undefined && teams[pId]) {
          teams[pId].name = data.name || teams[pId].name;
          if (data.badge) teams[pId].badge = data.badge;
          const inputEl = document.getElementById(`t${pId}-name`);
          if (inputEl) inputEl.value = teams[pId].name;
          broadcastState();
        }
      } 
      else if (data.type === 'PLAYER_ACTION' && isHost) {
        processActionHost(data.action, data.payload, data.senderId);
      }
    }

    function processActionHost(action, payload, senderId) {
      if (action === 'ROLL_DICE') rollDiceLogic();
      else if (action === 'BID') handleBidLogic(payload.amount, senderId);
      else if (action === 'PASS') handlePassLogic(senderId);
      else if (action === 'NEXT_SEASON') { if (currentSeason === 1) startSeason2Auction(); }
      else if (action === 'CONFIRM_SWAP') {
        // Só o jogador que ganhou o reforço pode confirmar a troca
        if (pendingSwap && senderId === pendingSwap.teamId &&
            teams[senderId] && teams[senderId].lineup[payload.targetSlot]) {
          const swapTeamId = pendingSwap.teamId;
          const swapCard = pendingSwap.card;
          pendingSwap = null;
          executeSwapInTeam(swapTeamId, payload.targetSlot, swapCard);
        }
      }
      broadcastState();
    }

    function broadcastState() {
      if (!isHost) return;
      updateBadgePreviews();

      const state = {
        playerCount, teams, currentDeck, rejectedQueue,
        usedPlayerNames: Array.from(usedPlayerNames),
        currentPlayerCard, turnOrder, activeTurnIndex, highestBid,
        highestBidderId, activeBidders, playersActedThisCard: Array.from(playersActedThisCard), isAuctionStarted, isDiceRolled, isTransitioning, currentSeason, season2DraftCount, tournamentStage, tournamentData,
        pendingSwap: pendingSwap,
        diceResultText: document.getElementById('dice-result').innerText,
        setupHidden: document.getElementById('setup-screen').style.display === 'none',
        menuHidden: document.getElementById('main-menu-screen').style.display === 'none',
        gameArenaVisible: document.getElementById('game-arena').style.display !== 'none',
        leagueScreenVisible: document.getElementById('league-screen').style.display !== 'none',
        podiumScreenVisible: document.getElementById('podium-screen').style.display !== 'none',
        brasfootState: currentBrasfootState
      };

      connections.forEach(conn => { if (conn.open) conn.send({ type: 'SYNC_STATE', state: state }); });
      applyStateSync(state);
    }

    function applyStateSync(state) {
      if (state.playerCount && state.playerCount !== playerCount) {
        changePlayerCount(state.playerCount);
      }
      teams = state.teams; 
      currentDeck = state.currentDeck; 
      rejectedQueue = state.rejectedQueue || [];
      usedPlayerNames = new Set(state.usedPlayerNames || []);
      currentPlayerCard = state.currentPlayerCard;
      turnOrder = state.turnOrder; 
      activeTurnIndex = state.activeTurnIndex; 
      highestBid = state.highestBid;
      highestBidderId = state.highestBidderId; 
      activeBidders = state.activeBidders;
      playersActedThisCard = new Set(state.playersActedThisCard || []);
      isAuctionStarted = state.isAuctionStarted; 
      isDiceRolled = state.isDiceRolled; 
      isTransitioning = state.isTransitioning;
      currentSeason = state.currentSeason || 1;
      season2DraftCount = state.season2DraftCount || 0;
      tournamentStage = state.tournamentStage || 'COPA';
      pendingSwap = state.pendingSwap || null;
      if (state.tournamentData) tournamentData = state.tournamentData;

      for (let i = 0; i < playerCount; i++) {
        const input = document.getElementById(`t${i}-name`);
        if (input && teams[i]) input.value = teams[i].name;
      }

      if (state.menuHidden) document.getElementById('main-menu-screen').style.display = 'none';
      if (state.setupHidden) document.getElementById('setup-screen').style.display = 'none';
      
      document.getElementById('game-arena').style.display = state.gameArenaVisible ? 'grid' : 'none';
      document.getElementById('league-screen').style.display = state.leagueScreenVisible ? 'flex' : 'none';
      document.getElementById('podium-screen').style.display = state.podiumScreenVisible ? 'flex' : 'none';
      
      if (currentPlayerCard) {
        document.getElementById('c-ovr').innerText = currentPlayerCard.ovr;
        document.getElementById('c-pos').innerText = currentPlayerCard.pos;
        document.getElementById('c-name').innerText = currentPlayerCard.name;
        document.getElementById('c-photo').src = currentPlayerCard.photo && currentPlayerCard.photo.trim() !== "" 
          ? currentPlayerCard.photo 
          : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text x='50%' y='55%' font-size='50' text-anchor='middle' dominant-baseline='central' fill='%23fff'>👤</text></svg>";
      }

      document.getElementById('current-bid-val').innerText = highestBid >= 0 ? `${highestBid} Tokens` : "0 Tokens";
      document.getElementById('highest-bidder-name').innerText = (highestBidderId !== null && teams[highestBidderId]) ? `Líder: ${teams[highestBidderId].name}` : "Nenhum lance";
      document.getElementById('dice-result').innerText = state.diceResultText || "";
      document.getElementById('my-passes-count').innerText = teams[myPlayerId] ? teams[myPlayerId].passesLeft : 0;
      document.getElementById('season-badge').innerText = `${currentSeason}ª Temp: ${currentSeason === 1 ? 'Leilão Principal' : 'Leilão de Reforços'}`;

      if (state.brasfootState && state.brasfootState.active) {
        currentBrasfootState = state.brasfootState;
        renderTournamentUI();
      }

      renderTeamPanels();
      updateTurnUI();
      if (state.podiumScreenVisible) renderPodium();
      syncSwapModal();
    }

    // Abre/fecha o modal de troca conforme a troca pendente (vale para HOST e CLIENTES)
    function syncSwapModal() {
      const overlay = document.getElementById('swap-modal-overlay');
      if (pendingSwap && pendingSwap.teamId === myPlayerId) {
        const key = `${pendingSwap.teamId}:${pendingSwap.card.name}`;
        if (swapModalKey !== key) {
          swapModalKey = key;
          openSwapModal(pendingSwap.teamId, pendingSwap.card);
        }
      } else {
        overlay.style.display = 'none';
        if (!pendingSwap) swapModalKey = null;
      }
    }

    window.onload = initPeer;

    function startGame() {
      if (!isHost) return;
      isHost = true; 
      myPlayerId = 0;
      currentSeason = 1;
      season2DraftCount = 0;
      tournamentStage = 'COPA';
      usedPlayerNames.clear();
      updateBadgePreviews();

      document.getElementById('main-menu-screen').style.display = 'none';
      document.getElementById('setup-screen').style.display = 'none';
      document.getElementById('game-arena').style.display = 'grid';

      buildDeck();
      renderTeamPanels();
      drawNextPlayer();
      broadcastState();
    }

    function buildDeck() {
      const fullList = [
        ...database.GOL.map(p => ({ ...p, pos: 'GOL' })),
        ...database.DEF.map(p => ({ ...p, pos: 'DEF' })),
        ...database.ATA.map(p => ({ ...p, pos: 'ALA/PIVÔ' }))
      ];
      const filtered = fullList.filter(p => !usedPlayerNames.has(p.name));
      currentDeck = filtered.sort(() => Math.random() - 0.5);
    }

    function startSeason2Auction() {
      currentSeason = 2;
      season2DraftCount = 0;
      pendingSwap = null;
      tournamentStage = 'LIGA';
      
      teams.forEach(t => {
        t.tokens += 100;
        t.passesLeft = 3;
        t.season2SwapsLeft = 2;
      });

      document.getElementById('league-screen').style.display = 'none';
      document.getElementById('podium-screen').style.display = 'none';
      document.getElementById('game-arena').style.display = 'grid';

      buildDeck();
      renderTeamPanels();
      drawNextPlayer();
      broadcastState();
    }

    function drawNextPlayer() {
      let allDone = true;

      if (currentSeason === 1) {
        for (let i = 0; i < playerCount; i++) {
          if (!isTeamFull(i)) { allDone = false; break; }
        }
        if (allDone) {
          startTournamentSim();
          return;
        }
      } else if (currentSeason === 2) {
        for (let i = 0; i < playerCount; i++) {
          if (teams[i].season2SwapsLeft > 0) { allDone = false; break; }
        }
        if (allDone) {
          startTournamentSim();
          return;
        }
      }

      if (currentDeck.length > 0) {
        currentPlayerCard = currentDeck.pop();
      } else if (rejectedQueue.length > 0) {
        currentPlayerCard = rejectedQueue.shift();
      } else {
        buildDeck();
        currentPlayerCard = currentDeck.pop();
      }

      document.getElementById('c-ovr').innerText = currentPlayerCard.ovr;
      document.getElementById('c-pos').innerText = currentPlayerCard.pos;
      document.getElementById('c-name').innerText = currentPlayerCard.name;
      document.getElementById('c-photo').src = currentPlayerCard.photo && currentPlayerCard.photo.trim() !== "" 
        ? currentPlayerCard.photo 
        : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text x='50%' y='55%' font-size='50' text-anchor='middle' dominant-baseline='central' fill='%23fff'>👤</text></svg>";

      pendingSwap = null;
      highestBid = -1; 
      highestBidderId = null; 
      isAuctionStarted = false; 
      isDiceRolled = false; 
      isTransitioning = false;
      activeBidders = []; 
      turnOrder = [];
      playersActedThisCard.clear();

      document.getElementById('current-bid-val').innerText = "0 Tokens";
      document.getElementById('highest-bidder-name').innerText = "Nenhum lance";
      document.getElementById('dice-result').innerText = "";
      document.getElementById('btn-roll-dice').disabled = false;
      document.getElementById('turn-indicator').innerText = "Role os dados para a ordem!";
      toggleBidButtons(false);
    }

    function isTeamFull(teamId) {
      return teams[teamId] && Object.values(teams[teamId].lineup).every(slot => slot !== null);
    }

    function rollDice() { sendActionToHost('ROLL_DICE'); }

    function rollDiceLogic() {
      let activeIndices = [];
      for (let i = 0; i < playerCount; i++) activeIndices.push(i);

      if (currentSeason === 1) {
        turnOrder = activeIndices.filter(id => !isTeamFull(id)).sort(() => Math.random() - 0.5);
      } else {
        turnOrder = activeIndices.filter(id => teams[id].season2SwapsLeft > 0).sort(() => Math.random() - 0.5);
      }
      activeBidders = [...turnOrder];
      activeTurnIndex = 0;
      isDiceRolled = true;
      document.getElementById('dice-result').innerText = `Ordem: ${turnOrder.map(i => teams[i].name).join(' ➔ ')}`;
      document.getElementById('btn-roll-dice').disabled = true;
      updateTurnUI();
    }

    function toggleBidButtons(enable) {
      document.getElementById('btn-pass').disabled = !enable;
      document.getElementById('btn-bid-0').disabled = !enable;
      document.getElementById('btn-bid-1').disabled = !enable;
      document.getElementById('btn-bid-2').disabled = !enable;
      document.getElementById('btn-bid-3').disabled = !enable;
    }

    function updateTurnUI() {
      document.querySelectorAll('.team-panel').forEach(p => p.classList.remove('active-turn'));
      document.getElementById('btn-roll-dice').disabled = isDiceRolled || (!isHost && myPlayerId !== turnOrder[0]);

      if (!isDiceRolled) {
        document.getElementById('turn-indicator').innerText = "Role os dados para ordem!";
        toggleBidButtons(false);
        return;
      }

      if (activeBidders.length === 0) {
        document.getElementById('turn-indicator').innerText = "Carta recusada! Indo para a sobra...";
        toggleBidButtons(false);
        if (isHost && !isTransitioning) {
          isTransitioning = true;
          rejectedQueue.push(currentPlayerCard);
          setTimeout(() => { drawNextPlayer(); broadcastState(); }, 1200);
        }
        return;
      }

      if (activeBidders.length === 1 && isAuctionStarted) {
        toggleBidButtons(false);
        const winnerId = activeBidders[0];
        if (pendingSwap) {
          document.getElementById('turn-indicator').innerText = pendingSwap.teamId === myPlayerId
            ? `Vendido para você! Escolha quem sai.`
            : `Vendido para ${teams[winnerId].name}! Aguardando a troca...`;
        } else {
          document.getElementById('turn-indicator').innerText = `Vendido para ${teams[winnerId].name}!`;
        }
        if (isHost && !isTransitioning) {
          isTransitioning = true;
          finishAuction(winnerId);
        }
        return;
      }

      const currentTeamId = activeBidders[activeTurnIndex % activeBidders.length];
      const activePanel = document.getElementById(`panel-${currentTeamId}`);
      if (activePanel) activePanel.classList.add('active-turn');

      if (teams[currentTeamId]) {
        document.getElementById('turn-indicator').innerText = `Vez de: ${teams[currentTeamId].name}`;
      }

      const isMyTurn = (currentTeamId === myPlayerId) && !isTransitioning;
      toggleBidButtons(isMyTurn);

      if (isMyTurn && teams[myPlayerId] && teams[myPlayerId].passesLeft <= 0 && highestBid < 0 && !playersActedThisCard.has(myPlayerId)) {
        document.getElementById('btn-pass').disabled = true;
      }

      if (!isAuctionStarted) {
        document.getElementById('btn-bid-0').style.display = 'inline-block';
        document.getElementById('btn-bid-1').innerText = "+1 Token";
        document.getElementById('btn-bid-2').disabled = true;
        document.getElementById('btn-bid-3').disabled = true;
      } else {
        document.getElementById('btn-bid-0').style.display = 'none';
        if (isMyTurn) {
          document.getElementById('btn-bid-2').disabled = false;
          document.getElementById('btn-bid-3').disabled = false;
        }
      }
    }

    function handleBid(amount) { sendActionToHost('BID', { amount: amount }); }

    function handleBidLogic(amount, senderId) {
      const currentTeamId = activeBidders[activeTurnIndex % activeBidders.length];
      if (senderId !== currentTeamId || isTransitioning) return;

      let newBid = !isAuctionStarted ? amount : highestBid + amount;
      
      if (teams[currentTeamId].tokens < newBid) {
        if (senderId === myPlayerId) alert("⚠️ Tokens insuficientes!");
        return;
      }

      highestBid = newBid;
      highestBidderId = currentTeamId;
      isAuctionStarted = true;
      playersActedThisCard.add(senderId);

      document.getElementById('current-bid-val').innerText = `${highestBid} Tokens`;
      document.getElementById('highest-bidder-name').innerText = `Líder: ${teams[currentTeamId].name}`;

      activeTurnIndex++;
      updateTurnUI();
    }

    function handlePass() {
      if (teams[myPlayerId] && teams[myPlayerId].passesLeft <= 0 && highestBid < 0 && !playersActedThisCard.has(myPlayerId)) {
        return alert("⚠️ Limite de recusas atingido!");
      }
      sendActionToHost('PASS');
    }

    function handlePassLogic(senderId) {
      const currentTeamId = activeBidders[activeTurnIndex % activeBidders.length];
      if (senderId !== currentTeamId || isTransitioning) return;

      if (highestBid < 0 && !playersActedThisCard.has(senderId)) {
        if (teams[senderId] && teams[senderId].passesLeft > 0) {
          teams[senderId].passesLeft--;
        }
      }

      playersActedThisCard.add(senderId);

      activeBidders.splice(activeTurnIndex % activeBidders.length, 1);
      if (activeBidders.length > 0) {
        activeTurnIndex = activeTurnIndex % activeBidders.length;
      }
      updateTurnUI();
    }

    function finishAuction(winnerId) {
      const winner = teams[winnerId];
      winner.tokens -= (highestBid > 0 ? highestBid : 0);
      usedPlayerNames.add(currentPlayerCard.name);
      
      if (currentSeason === 2) {
        winner.season2SwapsLeft--;
        promptSwapPlayerSelection(winnerId, currentPlayerCard);
      } else {
        assignPlayerToTeam(winnerId, currentPlayerCard);
        renderTeamPanels();
        setTimeout(() => { drawNextPlayer(); broadcastState(); }, 1200);
      }
    }

    function assignPlayerToTeam(teamId, card) {
      const winner = teams[teamId];
      let targetSlots = [];
      if (card.pos === 'GOL') targetSlots = ['GOL'];
      if (card.pos === 'DEF') targetSlots = ['DEF1', 'DEF2', 'DEF3'];
      if (card.pos === 'ALA/PIVÔ') targetSlots = ['ALA_PIVO1', 'ALA_PIVO2', 'ALA_PIVO3', 'ALA_PIVO4', 'ALA_PIVO5'];

      for (let s of targetSlots) {
        if (winner.lineup[s] === null) {
          winner.lineup[s] = card;
          break;
        }
      }
    }

    /* CORREÇÃO DO BUG DE TROCA DE JOGADORES NA TEMPORADA 2 */
    function promptSwapPlayerSelection(winnerId, card) {
      // Executado no host: registra a troca pendente; o broadcast abre o modal
      // no dispositivo do jogador que ganhou (seja o host ou um convidado).
      pendingSwap = { teamId: winnerId, card: card };
      renderTeamPanels();
    }

    function openSwapModal(teamId, card) {
      const winner = teams[teamId];
      const slotLabels = {
        GOL: 'GOL', DEF1: 'DEF 1', DEF2: 'DEF 2', DEF3: 'DEF 3',
        ALA_PIVO1: 'ALA/PIVÔ 1', ALA_PIVO2: 'ALA/PIVÔ 2', ALA_PIVO3: 'ALA/PIVÔ 3', ALA_PIVO4: 'ALA/PIVÔ 4', ALA_PIVO5: 'ALA/PIVÔ 5'
      };

      const overlay = document.getElementById('swap-modal-overlay');
      const listContainer = document.getElementById('swap-modal-list');
      document.getElementById('swap-modal-subtitle').innerText = `Escolha quem sai para a entrada de ${card.name} (${card.ovr}):`;
      
      listContainer.innerHTML = '';

      for (let slotKey in winner.lineup) {
        const p = winner.lineup[slotKey];
        if (p) {
          const item = document.createElement('div');
          item.className = 'swap-item';
          item.innerHTML = `
            <div>
              <div class="swap-item-name">${p.name} (${p.ovr})</div>
              <div class="swap-item-pos">Posição: ${slotLabels[slotKey]}</div>
            </div>
            <button class="btn-action btn-bid" style="padding:6px 10px; font-size:0.75rem;">Substituir</button>
          `;
          item.onclick = () => {
            overlay.style.display = 'none';
            sendActionToHost('CONFIRM_SWAP', { targetSlot: slotKey });
          };
          listContainer.appendChild(item);
        }
      }

      overlay.style.display = 'flex';
    }

    function executeSwapInTeam(teamId, slotKey, newCard) {
      if (teams[teamId]) {
        teams[teamId].lineup[slotKey] = newCard;
      }
      renderTeamPanels();
      setTimeout(() => { drawNextPlayer(); broadcastState(); }, 1200);
    }

    function renderTeamPanels() {
      for (let i = 0; i < playerCount; i++) {
        const panel = document.getElementById(`panel-${i}`);
        if (!panel) continue;

        const team = teams[i];
        const slotLabels = {
          GOL: 'GOL', DEF1: 'DEF 1', DEF2: 'DEF 2', DEF3: 'DEF 3',
          ALA_PIVO1: 'ALA/PIVÔ 1', ALA_PIVO2: 'ALA/PIVÔ 2', ALA_PIVO3: 'ALA/PIVÔ 3', ALA_PIVO4: 'ALA/PIVÔ 4', ALA_PIVO5: 'ALA/PIVÔ 5'
        };

        let html = `
          <div class="team-header">
            <div style="display:flex; align-items:center; gap:6px;">
              <div style="width:22px; height:22px;">${getTeamLogoHTML(team.name, team.badge)}</div>
              <strong>${team.name}</strong>
            </div>
            <div>
              <span class="team-tokens">${team.tokens} TK</span>
              <span class="passes-left">${team.passesLeft}x Rec.</span>
              ${currentSeason === 2 ? `<span style="background:#3b82f6; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.65rem; font-weight:bold; margin-left:2px;">${team.season2SwapsLeft} Trocas</span>` : ''}
            </div>
          </div>
          <div class="lineup-slots">
        `;

        for (let key in team.lineup) {
          const player = team.lineup[key];
          if (player) {
            html += `
              <div class="slot filled">
                <span class="slot-pos">${slotLabels[key]}</span>
                <span class="slot-player">${player.name} (${player.ovr})</span>
              </div>
            `;
          } else {
            html += `
              <div class="slot">
                <span class="slot-pos">${slotLabels[key]}</span>
                <span class="slot-player" style="color:var(--text-muted);">--</span>
              </div>
            `;
          }
        }
        html += `</div>`;
        panel.innerHTML = html;
      }
    }

    /* SISTEMA DE SIMULAÇÃO DA COPA DOS 32 E TEMPO DAS PARTIDAS */
    function calculateTeamOvr(team) {
      let total = 0, count = 0;
      for (let k in team.lineup) {
        if (team.lineup[k]) { total += team.lineup[k].ovr; count++; }
      }
      return count > 0 ? Math.round(total / count) : 80;
    }

    function startTournamentSim() {
      document.getElementById('game-arena').style.display = 'none';
      document.getElementById('league-screen').style.display = 'flex';

      if (!isHost) return;

      let allParticipants = [];
      for (let i = 0; i < playerCount; i++) {
        allParticipants.push({
          id: teams[i].id,
          name: teams[i].name,
          badge: teams[i].badge,
          isHuman: true,
          ovr: calculateTeamOvr(teams[i])
        });
      }

      let botIndex = 0;
      while (allParticipants.length < 32) {
        const botName = BOT_TEAMS_32[botIndex % BOT_TEAMS_32.length];
        allParticipants.push({
          id: `bot_${botIndex}`,
          name: botName,
          badge: { c1: "#475569", c2: "#ffffff", shape: "shield", pattern: "solid", animal: "⚽" },
          isHuman: false,
          ovr: Math.floor(Math.random() * 8) + 82
        });
        botIndex++;
      }

      allParticipants = allParticipants.sort(() => Math.random() - 0.5);

      const groups = {};
      const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      groupNames.forEach((g, idx) => {
        groups[g] = allParticipants.slice(idx * 4, idx * 4 + 4).map(t => ({
          ...t, pts: 0, pj: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0
        }));
      });

      tournamentData = {
        groups: groups,
        bracket: { OITAVAS: [], QUARTAS: [], SEMI: [], FINAL: [], THIRD: [] },
        currentPhase: 'GROUPS',
        groupRound: 1,
        currentMatchIndex: 0
      };

      setupGroupRoundMatches();
      broadcastState();
      runCurrentMatchesLoop();
    }

    function setupGroupRoundMatches() {
      const gNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      let roundMatches = [];

      gNames.forEach(gKey => {
        const teamList = tournamentData.groups[gKey];
        if (tournamentData.groupRound === 1) {
          roundMatches.push(createMatchObj(teamList[0], teamList[1], gKey));
          roundMatches.push(createMatchObj(teamList[2], teamList[3], gKey));
        } else if (tournamentData.groupRound === 2) {
          roundMatches.push(createMatchObj(teamList[0], teamList[2], gKey));
          roundMatches.push(createMatchObj(teamList[1], teamList[3], gKey));
        } else if (tournamentData.groupRound === 3) {
          roundMatches.push(createMatchObj(teamList[0], teamList[3], gKey));
          roundMatches.push(createMatchObj(teamList[1], teamList[2], gKey));
        }
      });

      currentBrasfootState = {
        active: true,
        currentMatchMinute: 0,
        currentMatches: roundMatches,
        history: currentBrasfootState.history || []
      };
    }

    function createMatchObj(home, away, groupLabel = '') {
      return {
        home: home,
        away: away,
        homeScore: 0,
        awayScore: 0,
        group: groupLabel,
        events: [],
        stats: {
          homeShots: 0, awayShots: 0,
          homePossession: 50, awayPossession: 50
        }
      };
    }

    /* TODAS AS PARTIDAS DURAM 60 SEGUNDOS REAIS (90 minutos simulados) */
    function runCurrentMatchesLoop() {
      if (!isHost) return;
      if (matchTimer) { clearInterval(matchTimer); matchTimer = null; }

      const startTime = Date.now();

      matchTimer = setInterval(() => {
        if (!currentBrasfootState.active) {
          clearInterval(matchTimer);
          matchTimer = null;
          return;
        }

        // Minuto calculado pelo relógio real, então sempre fecha em 60s,
        // mesmo se a aba do navegador ficar em segundo plano.
        const elapsed = Date.now() - startTime;
        const targetMinute = Math.min(90, Math.floor((elapsed / MATCH_DURATION_MS) * 90));
        if (targetMinute <= currentBrasfootState.currentMatchMinute) return;

        while (currentBrasfootState.currentMatchMinute < targetMinute) {
          currentBrasfootState.currentMatchMinute++;
          currentBrasfootState.currentMatches.forEach(m => {
            simulateMatchMinute(m, currentBrasfootState.currentMatchMinute);
          });
        }

        broadcastState();

        if (currentBrasfootState.currentMatchMinute >= 90) {
          clearInterval(matchTimer);
          matchTimer = null;
          setTimeout(() => { finishCurrentMatchesBatch(); }, 1500);
        }
      }, 250);
    }

    function simulateMatchMinute(match, min) {
      const ovrDiff = match.home.ovr - match.away.ovr;
      const homeChance = 0.03 + (ovrDiff * 0.002);
      const awayChance = 0.03 - (ovrDiff * 0.002);

      match.stats.homePossession = Math.min(75, Math.max(25, 50 + Math.round(ovrDiff * 1.5) + Math.floor(Math.random() * 5 - 2)));
      match.stats.awayPossession = 100 - match.stats.homePossession;

      if (Math.random() < homeChance) {
        match.stats.homeShots++;
        if (Math.random() < 0.35) {
          match.homeScore++;
          match.events.unshift(`⚽ ${min}' GOL do ${match.home.name}! (${match.homeScore}-${match.awayScore})`);
        }
      }

      if (Math.random() < awayChance) {
        match.stats.awayShots++;
        if (Math.random() < 0.35) {
          match.awayScore++;
          match.events.unshift(`⚽ ${min}' GOL do ${match.away.name}! (${match.homeScore}-${match.awayScore})`);
        }
      }
    }

    function finishCurrentMatchesBatch() {
      if (!isHost) return;

      if (tournamentData.currentPhase === 'GROUPS') {
        currentBrasfootState.currentMatches.forEach(m => {
          updateGroupStats(m.group, m.home.id, m.homeScore, m.awayScore);
          updateGroupStats(m.group, m.away.id, m.awayScore, m.homeScore);
        });

        if (tournamentData.groupRound < 3) {
          tournamentData.groupRound++;
          setupGroupRoundMatches();
          broadcastState();
          runCurrentMatchesLoop();
        } else {
          setupBracketPhase('OITAVAS');
        }
      } else {
        resolveKnockoutMatches();
      }
    }

    function updateGroupStats(groupKey, teamId, gPro, gContra) {
      const team = tournamentData.groups[groupKey].find(t => t.id === teamId);
      if (!team) return;

      team.pj++;
      team.gp += gPro;
      team.gc += gContra;
      team.sg = team.gp - team.gc;

      if (gPro > gContra) { team.v++; team.pts += 3; }
      else if (gPro === gContra) { team.e++; team.pts += 1; }
      else { team.d++; }

      tournamentData.groups[groupKey].sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp);
    }

    function setupBracketPhase(phase) {
      tournamentData.currentPhase = phase;
      let matches = [];

      if (phase === 'OITAVAS') {
        const gKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        for (let i = 0; i < 8; i += 2) {
          const g1 = tournamentData.groups[gKeys[i]];
          const g2 = tournamentData.groups[gKeys[i+1]];
          matches.push(createMatchObj(g1[0], g2[1]));
          matches.push(createMatchObj(g2[0], g1[1]));
        }
        tournamentData.bracket.OITAVAS = matches;
      } else if (phase === 'QUARTAS') {
        const prevWins = getPhaseWinners(tournamentData.bracket.OITAVAS);
        for (let i = 0; i < prevWins.length; i += 2) {
          matches.push(createMatchObj(prevWins[i], prevWins[i+1]));
        }
        tournamentData.bracket.QUARTAS = matches;
      } else if (phase === 'SEMI') {
        const prevWins = getPhaseWinners(tournamentData.bracket.QUARTAS);
        matches.push(createMatchObj(prevWins[0], prevWins[1]));
        matches.push(createMatchObj(prevWins[2], prevWins[3]));
        tournamentData.bracket.SEMI = matches;
      } else if (phase === 'FINAL') {
        const semiWins = getPhaseWinners(tournamentData.bracket.SEMI);
        const semiLoss = getPhaseLosers(tournamentData.bracket.SEMI);
        tournamentData.bracket.THIRD = [createMatchObj(semiLoss[0], semiLoss[1])];
        tournamentData.bracket.FINAL = [createMatchObj(semiWins[0], semiWins[1])];
        matches = [...tournamentData.bracket.THIRD, ...tournamentData.bracket.FINAL];
      }

      currentBrasfootState = {
        active: true,
        currentMatchMinute: 0,
        currentMatches: matches,
        history: currentBrasfootState.history || []
      };

      broadcastState();
      runCurrentMatchesLoop();
    }

    function resolveKnockoutMatches() {
      currentBrasfootState.currentMatches.forEach(m => {
        if (m.homeScore === m.awayScore) {
          if (Math.random() < 0.5) m.homeScore++;
          else m.awayScore++;
          m.events.unshift(`🚩 Decidido nas Penalidades! Vencedor: ${m.homeScore > m.awayScore ? m.home.name : m.away.name}`);
        }
      });

      if (tournamentData.currentPhase === 'OITAVAS') setupBracketPhase('QUARTAS');
      else if (tournamentData.currentPhase === 'QUARTAS') setupBracketPhase('SEMI');
      else if (tournamentData.currentPhase === 'SEMI') setupBracketPhase('FINAL');
      else if (tournamentData.currentPhase === 'FINAL') showPodiumScreen();
    }

    function getPhaseWinners(matches) {
      return matches.map(m => m.homeScore > m.awayScore ? m.home : m.away);
    }

    function getPhaseLosers(matches) {
      return matches.map(m => m.homeScore > m.awayScore ? m.away : m.home);
    }

    function showPodiumScreen() {
      currentBrasfootState.active = false;
      document.getElementById('league-screen').style.display = 'none';
      document.getElementById('podium-screen').style.display = 'flex';
      renderPodium();
      broadcastState();
    }

    // Desenha o pódio a partir dos dados sincronizados (host e convidados)
    function renderPodium() {
      const finalMatch = tournamentData.bracket && tournamentData.bracket.FINAL && tournamentData.bracket.FINAL[0];
      const thirdMatch = tournamentData.bracket && tournamentData.bracket.THIRD && tournamentData.bracket.THIRD[0];
      if (!finalMatch || !thirdMatch) return;

      const winner1 = finalMatch.homeScore > finalMatch.awayScore ? finalMatch.home : finalMatch.away;
      const winner2 = finalMatch.homeScore > finalMatch.awayScore ? finalMatch.away : finalMatch.home;
      const winner3 = thirdMatch.homeScore > thirdMatch.awayScore ? thirdMatch.home : thirdMatch.away;

      document.getElementById('podium-name-1').innerText = winner1.name;
      document.getElementById('podium-badge-1').innerHTML = getTeamLogoHTML(winner1.name, winner1.badge);
      document.getElementById('podium-name-2').innerText = winner2.name;
      document.getElementById('podium-badge-2').innerHTML = getTeamLogoHTML(winner2.name, winner2.badge);
      document.getElementById('podium-name-3').innerText = winner3.name;
      document.getElementById('podium-badge-3').innerHTML = getTeamLogoHTML(winner3.name, winner3.badge);

      setTimeout(() => {
        document.getElementById('step-1').classList.add('show');
        document.getElementById('step-2').classList.add('show');
        document.getElementById('step-3').classList.add('show');
      }, 300);

      const btnNext = document.getElementById('btn-next-phase');
      btnNext.onclick = handlePodiumNextPhase;
      btnNext.innerText = currentSeason === 1
        ? "Avançar para a 2ª Temporada (Reforços)"
        : "Voltar ao Menu Principal";
    }

    function handlePodiumNextPhase() {
      if (currentSeason === 1) sendActionToHost('NEXT_SEASON');
      else backToMainMenu();
    }

    function renderTournamentUI() {
      const container = document.getElementById('matches-broadcast-container');
      if (!container) return;
      container.innerHTML = '';

      document.getElementById('phase-indicator').innerText = `🏆 COPA DOS 32 - ${getPhaseNameTitle(tournamentData.currentPhase)}`;
      document.getElementById('round-indicator').innerText = tournamentData.currentPhase === 'GROUPS' ? `Rodada ${tournamentData.groupRound} de 3` : 'Mata-Mata em Tempo Real';

      currentBrasfootState.currentMatches.forEach(m => {
        const box = document.createElement('div');
        box.className = 'match-box active';
        box.innerHTML = `
          <div class="match-time">${currentBrasfootState.currentMatchMinute}' MIN</div>
          <div class="match-teams">
            <div class="team-display home">
              ${getTeamLogoHTML(m.home.name, m.home.badge)}
              <span>${m.home.name}</span>
            </div>
            <div class="match-score">${m.homeScore} - ${m.awayScore}</div>
            <div class="team-display away">
              <span>${m.away.name}</span>
              ${getTeamLogoHTML(m.away.name, m.away.badge)}
            </div>
          </div>
          <div class="match-stats-panel">
            <div class="stat-row"><span class="stat-label">Chutes</span><span class="stat-val">${m.stats.homeShots} - ${m.stats.awayShots}</span></div>
            <div class="stat-row"><span class="stat-label">Posse</span><span class="stat-val">${m.stats.homePossession}% - ${m.stats.awayPossession}%</span></div>
          </div>
          <div class="match-events">${m.events.map(e => `<div>${e}</div>`).join('')}</div>
        `;
        container.appendChild(box);
      });

      renderTournamentSidePanel();
    }

    function getPhaseNameTitle(phase) {
      if (phase === 'GROUPS') return 'FASE DE GRUPOS';
      if (phase === 'OITAVAS') return 'OITAVAS DE FINAL';
      if (phase === 'QUARTAS') return 'QUARTAS DE FINAL';
      if (phase === 'SEMI') return 'SEMIFINAIS';
      if (phase === 'FINAL') return 'GRANDE FINAL';
      return '';
    }

    function renderTournamentSidePanel() {
      const groupsDiv = document.getElementById('groups-container');
      const bracketDiv = document.getElementById('bracket-list-container');

      if (tournamentData.currentPhase === 'GROUPS') {
        groupsDiv.style.display = 'grid';
        bracketDiv.style.display = 'none';
        groupsDiv.innerHTML = '';

        Object.keys(tournamentData.groups).forEach(gKey => {
          const card = document.createElement('div');
          card.className = 'group-card';
          let rowsHTML = tournamentData.groups[gKey].map((t, idx) => `
            <tr>
              <td class="team-cell">${idx + 1}. ${getTeamLogoHTML(t.name, t.badge)} ${t.name}</td>
              <td><b>${t.pts}</b></td>
              <td>${t.pj}</td>
              <td>${t.sg}</td>
            </tr>
          `).join('');

          card.innerHTML = `
            <div class="group-card-title">Grupo ${gKey}</div>
            <table>
              <thead><tr><th style="text-align:left;">Time</th><th>P</th><th>J</th><th>SG</th></tr></thead>
              <tbody>${rowsHTML}</tbody>
            </table>
          `;
          groupsDiv.appendChild(card);
        });
      } else {
        groupsDiv.style.display = 'none';
        bracketDiv.style.display = 'flex';
        bracketDiv.innerHTML = '';

        const phases = ['OITAVAS', 'QUARTAS', 'SEMI', 'FINAL'];
        phases.forEach(pKey => {
          if (tournamentData.bracket[pKey] && tournamentData.bracket[pKey].length > 0) {
            const title = document.createElement('div');
            title.className = 'bracket-phase-title';
            title.innerText = getPhaseNameTitle(pKey);
            bracketDiv.appendChild(title);

            tournamentData.bracket[pKey].forEach(m => {
              const item = document.createElement('div');
              item.className = 'bracket-match-item';
              const homeWin = m.homeScore > m.awayScore;
              item.innerHTML = `
                <div class="bracket-team ${homeWin ? 'winner' : ''}">
                  <span>${getTeamLogoHTML(m.home.name, m.home.badge)} ${m.home.name}</span>
                  <span>${m.homeScore}</span>
                </div>
                <div class="bracket-team ${!homeWin && m.homeScore !== m.awayScore ? 'winner' : ''}">
                  <span>${getTeamLogoHTML(m.away.name, m.away.badge)} ${m.away.name}</span>
                  <span>${m.awayScore}</span>
                </div>
              `;
              bracketDiv.appendChild(item);
            });
          }
        });
      }
    }
