// ═══════════════════════════════════════════════════════════
// EXPERIENCE LAYER - ANIMATION TRIGGERS
// ═══════════════════════════════════════════════════════════

function updateMarketCardState() {
  const marketCard = document.querySelector('.market-card');
  if (!marketCard) return;
  
  if (isSunday()) {
    marketCard.classList.add('sunday-locked');
    marketCard.classList.remove('trading-active');
  } else {
    marketCard.classList.remove('sunday-locked');
    marketCard.classList.add('trading-active');
  }
}

function updateClaimButtonState() {
  const claimBtn = document.getElementById('claimButton');
  if (!claimBtn) return;
  
  // Remove all state classes
  claimBtn.classList.remove('ready', 'cooldown', 'sunday-locked', 'burned');
  
  if (isSunday()) {
    claimBtn.classList.add('sunday-locked');
  } else if (canClaim()) {
    claimBtn.classList.add('ready');
  } else {
    claimBtn.classList.add('cooldown');
    
    // Calculate cooldown progress percentage
    const state = loadState();
    const nextClaimTime = (state.user.lastClaimTime || 0) + (24 * 60 * 60 * 1000);
    const totalCooldown = 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - (state.user.lastClaimTime || 0);
    const progress = Math.min((elapsed / totalCooldown) * 100, 100);
    
    claimBtn.style.setProperty('--cooldown-progress', progress + '%');
  }
  
  // Urgent state when < 2 hours remain
  const state = loadState();
  const nextClaimTime = (state.user.lastClaimTime || 0) + (24 * 60 * 60 * 1000);
  const timeRemaining = nextClaimTime - Date.now();
  
  if (timeRemaining > 0 && timeRemaining < 2 * 60 * 60 * 1000) {
    const countdownEl = document.querySelector('.claim-countdown');
    if (countdownEl) {
      countdownEl.classList.add('urgent');
    }
  }
}

function triggerClaimSuccess(amount) {
  // Success burst effect
  const burst = document.createElement('div');
  burst.className = 'claim-success-burst';
  document.body.appendChild(burst);
  
  setTimeout(() => burst.remove(), 1000);
  
  // Balance update animation
  const balanceEl = document.getElementById('balance');
  if (balanceEl) {
    balanceEl.classList.add('updating');
    setTimeout(() => balanceEl.classList.remove('updating'), 600);
  }
  
  // Haptic feedback (if supported)
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 30, 50]);
  }
}

function triggerBurnPunishment(amount) {
  const claimBtn = document.getElementById('claimButton');
  if (claimBtn) {
    claimBtn.classList.add('burned');
    setTimeout(() => claimBtn.classList.remove('burned'), 500);
  }
  
  // Show burn indicator
  const dashboard = document.querySelector('.dashboard');
  if (dashboard) {
    dashboard.classList.add('burn-occurred');
    
    const indicator = document.createElement('div');
    indicator.className = 'burn-indicator';
    indicator.textContent = `Burned: $${amount.toFixed(2)}`;
    dashboard.appendChild(indicator);
    
    setTimeout(() => {
      dashboard.classList.remove('burn-occurred');
      indicator.remove();
    }, 5000);
  }
  
  // Harsh haptic
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100, 50, 100]);
  }
}

function triggerShieldProtection() {
  const indicator = document.createElement('div');
  indicator.className = 'shield-saved-indicator';
  indicator.innerHTML = '<div>Shield Protected!</div><div style="font-size: 14px; margin-top: 8px; opacity: 0.9;">Your profits are safe</div>';
  document.body.appendChild(indicator);
  
  setTimeout(() => indicator.remove(), 3000);
  
  // Gentle haptic
  if ('vibrate' in navigator) {
    navigator.vibrate([30, 20, 30]);
  }
}

function updateContractTierVisuals() {
  const state = loadState();
  
  state.user.activeContracts.forEach(contract => {
    const contractEl = document.getElementById(`contract_tier_${contract.tier}`);
    if (contractEl) {
      contractEl.setAttribute('data-tier', contract.tier);
      
      if (contract.status === 'active') {
        contractEl.classList.add('active');
      } else {
        contractEl.classList.remove('active');
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════
// INTEGRATION PATCHES (MODIFY EXISTING FUNCTIONS)
// ═══════════════════════════════════════════════════════════

// PATCH: Add to existing performClaim() after balance update
function performClaim() {
  // ... existing guards ...
  
  // Calculate total claimable
  let totalClaimable = 0;
  state.user.activeContracts.forEach(contract => {
    if (contract.status === 'active' || contract.status === 'expired') {
      totalClaimable += contract.unclaimedBalance;
      contract.unclaimedBalance = 0;
    }
  });
  
  if (totalClaimable === 0) {
    showToast('No rewards to claim', 'info');
    return;
  }
  
  // Add to balance
  state.user.balance += totalClaimable;
  state.user.totalEarned += totalClaimable;
  state.user.lastClaimTime = now;
  
  // ... existing claim logging ...
  
  saveState(state);
  
  // TRIGGER SUCCESS ANIMATION
  triggerClaimSuccess(totalClaimable);
  
  updateUI();
  showToast(t('claimSuccess') + ' $' + totalClaimable.toFixed(2), 'success');
}

// PATCH: Add to existing checkBurnConditions() after burn occurs
function checkBurnConditions() {
  // ... existing burn logic ...
  
  if (state.user.protectionCards > 0) {
    state.user.protectionCards--;
    state.user.lastClaimTime = now;
    saveState(state);
    
    // TRIGGER SHIELD ANIMATION
    triggerShieldProtection();
    
    showToast(t('shieldProtected'), 'info');
    return;
  }
  
  // Burn logic...
  let totalBurned = 0;
  state.user.activeContracts.forEach(contract => {
    // ... burn calculation ...
    totalBurned += burnAmount;
  });
  
  if (totalBurned > 0) {
    state.user.lastClaimTime = now;
    saveState(state);
    
    // TRIGGER BURN PUNISHMENT ANIMATION
    triggerBurnPunishment(totalBurned);
    
    showToast(t('burnWarning') + ' $' + totalBurned.toFixed(2), 'error');
  }
}

// PATCH: Add to existing updateUI()
function updateUI() {
  const state = loadState();
  
  // ... existing UI updates ...
  
  // UPDATE EXPERIENCE LAYER
  updateMarketCardState();
  updateClaimButtonState();
  updateContractTierVisuals();
  
  // ... rest of existing code ...
}

// PATCH: Add to init() periodic updates
function init() {
  // ... existing initialization ...
  
  // Update experience layer every second for countdown
  setInterval(() => {
    updateClaimButtonState();
  }, 1000);
  
  // ... rest of existing code ...
}
