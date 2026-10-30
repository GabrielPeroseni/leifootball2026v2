    function startGame() {
      if (!isHost) return;
      isHost = true; 
      myPlayerId = 0;
      currentSeason = 1;
      season2DraftCount = 0;
      tournamentStage = 'ESTADUALZAO_PHASE1';
      usedPlayerNames.clear();
      topScorers = {};
      teamStats = {};
      teamTitles = {};
      seasonPrizes = [];
      seasonLog = [];
      compSummary = null;
      seasonCalendar = null;
      worldState = null;
      compCtl = null;
      playoffResults = { champion: null, runnerUp: null, semifinalists: [] };
      stopShootout();
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
        ...database.MC.map(p => ({ ...p, pos: 'MC' })),
        ...database.ATA.map(p => ({ ...p, pos: 'ATA' }))
      ];
      const filtered = fullList.filter(p => !usedPlayerNames.has(p.name));
      currentDeck = filtered.sort(() => Math.random() - 0.5);
    }

    function startNextSeasonAuction() {
      if (currentSeason >= MAX_SEASONS) return;
      currentSeason++;
      season2DraftCount = 0;
      pendingSwap = null;
      tournamentStage = 'LIGA';
      playoffResults = { champion: null, runnerUp: null, semifinalists: [] };
      seasonPrizes = [];
      seasonLog = [];
      compSummary = null;
      seasonCalendar = null;
      compCtl = null;
      
      teams.forEach(t => {
        t.tokens += 100;
        t.passesLeft = MAX_PASSES + (t.bonusPasses || 0);          // prêmio: recusas extras
        t.season2SwapsLeft = SWAPS_PER_SEASON + (t.bonusSwaps || 0); // prêmio: trocas extras
        t.bonusPasses = 0;
        t.bonusSwaps = 0;
      });

      document.getElementById('league-screen').style.display = 'none';
      document.getElementById('podium-screen').style.display = 'none';
      document.getElementById('comp-summary-screen').style.display = 'none';
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
          startSeasonCalendar();
          return;
        }
      } else {
        for (let i = 0; i < playerCount; i++) {
          if (teams[i].season2SwapsLeft > 0) { allDone = false; break; }
        }
        if (allDone) {
          startSeasonCalendar();
          return;
        }
      }

      currentPlayerCard = pickNextPlayableCard();

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

    // Na 1ª temporada, só aparecem cartas de posições em que ao menos um time ainda tem vaga
    function isCardPlayableNow(card) {
      if (currentSeason !== 1) return true;
      for (let i = 0; i < playerCount; i++) {
        if (!isTeamFull(i) && teamHasOpenSlot(i, card.pos)) return true;
      }
      return false;
    }

    function pickNextPlayableCard() {
      let guard = 0;
      while (guard++ < 5000) {
        let card = null;
        if (currentDeck.length > 0) {
          card = currentDeck.pop();
        } else if (rejectedQueue.length > 0) {
          card = rejectedQueue.shift();
        } else {
          buildDeck();
          if (currentDeck.length === 0) return null;
          card = currentDeck.pop();
        }
        if (isCardPlayableNow(card)) return card;
      }
      return currentDeck.pop();
    }

    function teamHasOpenSlot(teamId, pos) {
      return !!teams[teamId] && getSlotsForPos(pos).some(s => teams[teamId].lineup[s] === null);
    }

    function isTeamFull(teamId) {
      return teams[teamId] && Object.values(teams[teamId].lineup).every(slot => slot !== null);
    }

    function rollDice() { sendActionToHost('ROLL_DICE'); }

    function rollDiceLogic() {
      let activeIndices = [];
      for (let i = 0; i < playerCount; i++) activeIndices.push(i);

      if (currentSeason === 1) {
        turnOrder = activeIndices.filter(id => !isTeamFull(id) && teamHasOpenSlot(id, currentPlayerCard.pos)).sort(() => Math.random() - 0.5);
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
        if (senderId === myPlayerId) alert("⚠ Tokens insuficientes!");
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
      
      if (currentSeason >= 2) {
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
      const targetSlots = getSlotsForPos(card.pos);

      for (let s of targetSlots) {
        if (winner.lineup[s] === null) {
          winner.lineup[s] = card;
          break;
        }
      }
    }

    function promptSwapPlayerSelection(winnerId, card) {
      pendingSwap = { teamId: winnerId, card: card };
      renderTeamPanels();
    }

    function openSwapModal(teamId, card) {
      const winner = teams[teamId];
      const slotLabels = SLOT_LABELS;

      const overlay = document.getElementById('swap-modal-overlay');
      const listContainer = document.getElementById('swap-modal-list');
      document.getElementById('swap-modal-subtitle').innerText = `Escolha quem sai para a entrada de ${card.name} (${card.ovr}):`;
      
      listContainer.innerHTML = '';

      const allowedSlots = getSlotsForPos(card.pos);
      for (let slotKey in winner.lineup) {
        if (!allowedSlots.includes(slotKey)) continue;
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
        const slotLabels = SLOT_LABELS;

        let html = `
          <div class="team-header">
            <div style="display:flex; align-items:center; gap:6px;">
              <div style="width:22px; height:22px;">${getTeamLogoHTML(team.name, team.badge)}</div>
              <strong>${team.name}</strong>
            </div>
            <div>
              <span class="team-tokens">${team.tokens} TK</span>
              <span class="passes-left">${team.passesLeft}x Rec.</span>
              ${currentSeason >= 2 ? `<span style="background:#3b82f6; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.65rem; font-weight:bold; margin-left:2px;">${team.season2SwapsLeft} Trocas</span>` : ''}
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
