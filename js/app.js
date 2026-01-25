/* =========================================================
   GLOBAL DEPOSIT V22.0 - MASTER ENGINE (8 SECTIONS)
   ========================================================= */

(() => {
    // 1. CONFIG / CONSTITUTION [cite: 357, 358]
    const STORAGE_KEY = 'gd_core_data_v21';
    const ADMIN_STORAGE_KEY = 'gd_admin_data_v21';
    const TIERS = {
        1: { name: 'Intern', price: 25, base: 2.2, booster: 0.0, bonus: 2.0 },
        2: { name: 'Junior', price: 50, base: 2.2, booster: 0.1, bonus: 5.0 },
        3: { name: 'Pro',    price: 100, base: 2.2, booster: 0.2, bonus: 12.0 },
        4: { name: 'Expert', price: 250, base: 2.2, booster: 0.3, bonus: 30.0 },
        5: { name: 'Manager',price: 500, base: 2.2, booster: 0.4, bonus: 70.0 },
        6: { name: 'Partner',price: 1000,base: 2.2, booster: 0.5, bonus: 150.0 }
    };
    const PHASE_MODS = { 1: 0.0, 2: 0.4, 3: 0.8 };

    // 2. STATE MANAGER [cite: 364, 370]
    let state = loadState();
    function loadState() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return resetState();
        try {
            const s = JSON.parse(stored);
            if (s._checksum !== generateChecksum(s.user)) return resetState();
            return s;
        } catch { return resetState(); }
    }
    function generateChecksum(u) {
        return btoa(JSON.stringify({b: u.balance, e: u.totalEarned, c: u.activeContracts.length}));
    }
    function resetState() {
        return { user: { balance: 0, totalEarned: 0, lastClaimTime: 0, activeContracts: [], protectionCards: 0, referralCode: 'GD'+Math.random().toString(36).substr(2,6).toUpperCase(), activatedAt: Date.now() }, _checksum: '' };
    }
    function saveState() {
        state._checksum = generateChecksum(state.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        updateUI();
    }

    // 3. CONTRACT ENGINE [cite: 374, 386]
    window.activateContract = (tierId) => {
        const tier = TIERS[tierId];
        if (state.user.balance < tier.price) return showToast('رصيد غير كافٍ', 'error');
        state.user.balance -= tier.price;
        state.user.activeContracts.push({ id: Date.now(), tier: tierId, activatedAt: Date.now(), status: 'active', unclaimed: 0, day: 1 });
        saveState();
    };

    // 4. CLAIM & BURN ENGINE [cite: 391, 413]
    function canClaim() {
        if (new Date().getDay() === 0) return false;
        return Date.now() - state.user.lastClaimTime >= 86400000;
    }
    window.performClaim = () => {
        if (!canClaim()) return;
        // حساب الربح بناءً على المراحل [cite: 358]
        let profit = 0;
        state.user.activeContracts.forEach(c => {
            const age = Math.floor((Date.now() - c.activatedAt) / 86400000) + 1;
            const phase = age <= 20 ? 1 : age <= 40 ? 2 : 3;
            const rate = TIERS[c.tier].base + TIERS[c.tier].booster + PHASE_MODS[phase];
            profit += (TIERS[c.tier].price * rate / 100);
        });
        state.user.balance += profit;
        state.user.totalEarned += profit;
        state.user.lastClaimTime = Date.now();
        saveState();
        triggerSuccessEffect(profit);
    };

    // 5. MARKET ENGINE [cite: 91, 215]
    const COINS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'];
    function startMarket() {
        const day = new Date().getDay();
        document.getElementById('coinNameDisplay').innerText = `${COINS[day % 6]} / USDT`;
        if (day === 0) { // قانون الأحد الصارم [cite: 91]
            document.getElementById('marketPrice').innerText = "FROZEN";
            return;
        }
        setInterval(() => {
            document.getElementById('marketPrice').innerText = (Math.random() * 500 + 1000).toFixed(2);
        }, 3000);
    }

    // 6. EXPERIENCE LAYER (Claude temporal UX)
    function handleUX() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour <= 10 && canClaim()) document.getElementById('claimButton')?.classList.add('ready');
    }

    // 7. ADMIN SYNC [cite: 423, 424]
    function checkAdmin() {
        const adminData = JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY) || '{}');
        if (adminData.deposits) {
            adminData.deposits.forEach(d => {
                if (d.status === 'approved' && !d.processed) {
                    state.user.balance += parseFloat(d.amount);
                    d.processed = true;
                }
            });
            localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminData));
            saveState();
        }
    }

    // 8. UI BINDINGS
    function updateUI() {
        document.getElementById('balanceDisplay').innerText = `$${state.user.balance.toFixed(2)}`;
        document.getElementById('totalEarnedDisplay').innerText = `$${state.user.totalEarned.toFixed(2)}`;
        document.getElementById('activeContractsCount').innerText = state.user.activeContracts.length;
        document.getElementById('referralCodeInput').value = state.user.referralCode;
    }

    window.switchTab = (tab) => {
        document.querySelectorAll('.tab-section').forEach(s => s.style.display = 'none');
        document.getElementById(`${tab}-section`).style.display = 'block';
    };

    // Initialization
    startMarket();
    handleUX();
    setInterval(checkAdmin, 5000);
    document.getElementById('startBtn').onclick = () => { document.getElementById('welcomeScreen').style.display = 'none'; };
    document.getElementById('claimButton').onclick = performClaim;
    updateUI();
})();
