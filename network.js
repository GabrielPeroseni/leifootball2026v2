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
      else if (action === 'SET_TACTIC') setTacticLogic(payload.tactic, senderId);
      else if (action === 'SO_CHOICE') soSubmitChoice(senderId, payload);
      else if (action === 'NEXT_SEASON') {
        const podiumOpen = document.getElementById('podium-screen').style.display !== 'none';
        if (currentSeason < MAX_SEASONS && podiumOpen) startNextSeasonAuction();
      }
      else if (action === 'CONFIRM_SWAP') {
        if (pendingSwap && senderId === pendingSwap.teamId &&
            getSlotsForPos(pendingSwap.card.pos).includes(payload.targetSlot) &&
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
        topScorers: topScorers,
        teamStats: teamStats,
        playoffResults: playoffResults,
        diceResultText: document.getElementById('dice-result').innerText,
        setupHidden: document.getElementById('setup-screen').style.display === 'none',
        menuHidden: document.getElementById('main-menu-screen').style.display === 'none',
        gameArenaVisible: document.getElementById('game-arena').style.display !== 'none',
        leagueScreenVisible: document.getElementById('league-screen').style.display !== 'none',
        podiumScreenVisible: document.getElementById('podium-screen').style.display !== 'none',
        brasfootState: currentBrasfootState,
        shootout: shootoutState,
        draw: drawState
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
      tournamentStage = state.tournamentStage || 'ESTADUALZAO_PHASE1';
      pendingSwap = state.pendingSwap || null;
      if (state.tournamentData) tournamentData = state.tournamentData;
      if (state.topScorers) topScorers = state.topScorers;
      if (state.teamStats) teamStats = state.teamStats;
      if (state.playoffResults) playoffResults = state.playoffResults;

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

      shootoutState = state.shootout || null;
      renderShootoutOverlay();
      drawState = state.draw || null;
      renderDrawOverlay();

      renderTeamPanels();
      updateTurnUI();
      if (state.podiumScreenVisible) renderPodium();
      syncSwapModal();
    }

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
