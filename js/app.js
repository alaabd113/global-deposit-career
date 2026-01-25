/* =========================================================
   GLOBAL DEPOSIT V22.0 - ORGANIZED MASTER ENGINE
   ========================================================= */

(() => {
    // 1. CONFIG / CONSTITUTION [cite: 356, 357, 358]
    const STORAGE_KEY = 'gd_core_data_v21';
    const ADMIN_STORAGE_KEY = 'gd_admin_data_v21';
    const TIERS = {
        1: { name: 'Intern', price: 25, base: 2.2, booster: 0.0, bonus: 2.00 },
        2: { name: 'Junior', price: 50, base: 2.2, booster: 0.1, bonus: 5.00 },
        3: { name: 'Pro',    price: 100, base: 2.2, booster: 0.2, bonus: 12.00 },
        4: { name: 'Expert', price: 250, base: 2.2, booster: 0.3, bonus: 30.00 },
        5: { name: 'Manager',price: 500, base: 2.2, booster: 0.4, bonus: 70.00 },
        6: { name: 'Partner',price: 1000,base: 2.2, booster: 0.5, bonus: 150.00 }
    };
    const PHASE_MODIFIERS = { 1: 0.0, 2: 0.4, 3: 0.8 };
    const COINS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'];

    // 2. STATE MANAGER [cite: 364, 369, 370, 373]
    let state = loadState();

    function loadState() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return initializeState();
        try {
            const s = JSON.parse(stored);
            if (!validateChecksum(s)) return initializeState();
            return s;
        } catch { return initializeState(); }
    }

    function initializeState() {
        return { user: { balance: 0, totalEarned: 0, lastClaimTime: 0, activeContracts: [], protectionCards: 0, referralCode: 'GD'+Math.random().toString(36).substr(2,6).toUpperCase(), startDate: Date.now() }, _checksum: '' };
    }

    function saveState() {
        state._checksum = generateChecksum(state);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        updateUI();
    }

    function generateChecksum(s) {
        const data = JSON.stringify({ b: s.user.balance, e: s.user.totalEarned, c: s.user.activeContracts });
        return btoa(data); // بصمة رقمية بسيطة للحماية من التلاعب اليدوي [cite: 370]
    }

    function validateChecksum(s) {
        if (!s._checksum) return true;
        return s._checksum === generateChecksum(s);
    }

    // 3. CONTRACT ENGINE [cite: 374, 377, 383, 386]
    window.activateContract = (tierId) => {
        const tier = TIERS[tierId];
        if (state.user.balance < tier.price) return triggerToast('رصيد غير كافٍ', 'error');
        
        state.user.balance -= tier.price;
        state.user.activeContracts.push({
            id: Date.now(), tier: tierId, activatedAt: Date.now(), lastAccrual: Date.now(), contractDay: 1, status: 'active', unclaimed: 0
        });
        saveState();
        triggerSuccessAnimation(tier.price);
    };

    function processContracts() {
        const now = Date.now();
        state.user.activeContracts.forEach(c => {
            if (c.status !== 'active') return;
            // منطق احتساب الأرباح اليومية والمراحل [cite: 386, 387]
        });
    }

    // 4. CLAIM & BURN ENGINE [cite: 391, 394, 413, 416]
    function canClaim() {
        if (new Date().getDay() === 0) return false;
        return Date.now() - state.user.lastClaimTime >= 86400000;
    }

    window.performClaim = () => {
        if (!canClaim()) return;
        // استلام الأرباح وتحديث الحالة [cite: 405, 407]
        state.user.lastClaimTime = Date.now();
        saveState();
    };

    // 5. MARKET ENGINE [cite: 215, 226, 229]
    function startMarket() {
        const day = new Date().getDay();
        document.getElementById('coinNameDisplay').innerText = `${COINS[day % 6]} / USDT`;
        if (day === 0) { // تجميد يوم الأحد [cite: 226, 228]
            document.getElementById('marketPrice').innerText = "FROZEN";
            return;
        }
        // محاكاة السعر المتغير [cite: 241, 250]
    }

    // 6. EXPERIENCE LAYER (Claude)
    function handleTemporalUX() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour <= 10) document.getElementById('claimButton')?.classList.add('pulse');
    }

    function triggerSuccessAnimation(a) { /* أنيميشن النجاح */ }
    function triggerToast(m, t) { /* إشعار */ }

    // 7. ADMIN SYNC [cite: 421, 423, 424]
    function syncWithAdmin() {
        const pending = JSON.parse(localStorage.getItem('pending_deposits') || '[]');
        // مزامنة الإيداعات المعتمدة [cite: 423]
    }

    // 8. UI BINDINGS [cite: 427, 431, 473, 480]
    function updateUI() {
        document.getElementById('balanceDisplay').innerText = `$${state.user.balance.toFixed(2)}`;
        document.getElementById('totalEarnedDisplay').innerText = `$${state.user.totalEarned.toFixed(2)}`;
        document.getElementById('activeContractsCount').innerText = state.user.activeContracts.length;
    }

    window.switchTab = (tab) => {
        document.querySelectorAll('.tab-section').forEach(s => s.style.display = 'none');
        document.getElementById(`${tab}-section`).style.display = 'block';
    };

    // التشغيل
    startMarket();
    handleTemporalUX();
    setInterval(syncWithAdmin, 5000);
    updateUI();
})();
