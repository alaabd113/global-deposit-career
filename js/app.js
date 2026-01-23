// SYSTEM
const SYSTEM_STATES = { LOADING: 'LOADING', ACTIVE: 'ACTIVE', FROZEN: 'FROZEN', CLAIMED: 'CLAIMED' };
const MockDB = {
    key: 'gd_master_v8_0',
    getDefaults() { return { balance: 0, lastClaimDate: null, isSundayOverride: false, contractStartDate: new Date().toISOString(), tier: 1, shieldCards: 0, totalClaimed: 0, hasLoyalty: false }; },
    get() { const s = localStorage.getItem(this.key); return s ? { ...this.getDefaults(), ...JSON.parse(s) } : this.getDefaults(); },
    save(d) { localStorage.setItem(this.key, JSON.stringify(d)); }
};

// ONBOARDING
const Onboarding = {
    key: 'gd_onboarding_v8',
    init() {
        const hasSeen = localStorage.getItem(this.key);
        const overlay = document.getElementById('onboarding-overlay');
        if (!hasSeen) {
            overlay.classList.remove('hidden');
            document.querySelector('.main-content').classList.add('dashboard-hidden');
            document.getElementById('onboarding-accept').onclick = () => {
                localStorage.setItem(this.key, 'true');
                overlay.classList.add('hidden');
                document.querySelector('.main-content').classList.remove('dashboard-hidden');
                document.querySelector('.main-content').classList.add('dashboard-revealed');
                // Set initial balance
                const db = MockDB.get();
                if(db.balance === 0) { db.balance = 25.00; MockDB.save(db); location.reload(); }
            };
            return true;
        }
        return false;
    }
};

// CONTROLLERS
const SidebarController = {
    init() {
        const s = document.getElementById('sidebar'), b = document.getElementById('backdrop'), t = document.getElementById('menu-toggle'), c = document.getElementById('sidebar-close');
        const open = () => { s.classList.add('open'); b.classList.add('visible'); document.body.classList.add('menu-open'); };
        const close = () => { s.classList.remove('open'); b.classList.remove('visible'); document.body.classList.remove('menu-open'); };
        if(t) t.onclick = open; if(c) c.onclick = close; if(b) b.onclick = close;
    }
};

const SalaryEngine = {
    tiers: { 1: { name: 'Intern', price: 25, booster: 0.00 }, 4: { name: 'Expert', price: 250, booster: 0.30 }, 6: { name: 'Partner', price: 1000, booster: 0.50 } },
    phases: { 1: { baseRate: 2.2 }, 2: { baseRate: 2.6 }, 3: { baseRate: 3.4 } },
    isSunday(db) { return db.isSundayOverride || new Date().getDay() === 0; },
    getContractDay(db) { if (!db.contractStartDate) return 1; const diff = new Date() - new Date(db.contractStartDate); return Math.max(1, Math.floor(diff / 86400000) + 1); },
    getCurrentPhase(day) { return day <= 20 ? 1 : day <= 40 ? 2 : 3; },
    getDailyRate(db) { const t = this.tiers[db.tier]||this.tiers[1], d = this.getContractDay(db), p = this.getCurrentPhase(d); return this.phases[p].baseRate + t.booster; },
    calculateDailyProfit(db) { if (this.isSunday(db)) return 0; const t = this.tiers[db.tier]||this.tiers[1]; return t.price * (this.getDailyRate(db) / 100); },
    hasClaimedToday(db) { if (!db.lastClaimDate) return false; return new Date(db.lastClaimDate).toDateString() === new Date().toDateString(); },
    rollForShieldCard() { return Math.random() < 0.30; }
};

const RetentionProtocol = {
    check(db) {
        if (SalaryEngine.getContractDay(db) > 60) {
            document.getElementById('retention-modal').style.display = 'flex';
            document.body.classList.add('state-frozen');
            return true;
        }
        return false;
    },
    renew() { const db = MockDB.get(); db.contractStartDate = new Date().toISOString(); db.hasLoyalty = true; MockDB.save(db); location.reload(); },
    withdraw() { localStorage.removeItem(MockDB.key); localStorage.removeItem(Onboarding.key); location.reload(); }
};

const ProMarket = {
    canvas: null, ctx: null, maxPoints: 80, intervalId: null, UPDATE_INTERVAL: 3000, SEED: 7749, BASE_PRICE: 620,
    init() {
        this.canvas = document.getElementById('market-canvas'); this.ctx = this.canvas.getContext('2d');
        this.resize(); window.addEventListener('resize', () => this.resize());
        this.draw(); this.start();
    },
    resize() { const r = this.canvas.getBoundingClientRect(); this.canvas.width = r.width * 2; this.canvas.height = r.height * 2; this.ctx.scale(2, 2); this.draw(); },
    seededRandom(s) { const x = Math.sin(s) * 10000; return x - Math.floor(x); },
    generatePrice(t) {
        const db = MockDB.get(); if (SalaryEngine.isSunday(db)) return this.BASE_PRICE;
        const b = Math.floor(t / this.UPDATE_INTERVAL), w1 = Math.sin(b * 0.08) * 8, w2 = Math.sin(b * 0.3 + 1.5) * 4, n = (this.seededRandom(b + this.SEED) - 0.5) * 3;
        return this.BASE_PRICE + w1 + w2 + n;
    },
    draw() {
        if (!this.ctx) return;
        const db = MockDB.get(), isSunday = SalaryEngine.isSunday(db), w = this.canvas.width / 2, h = this.canvas.height / 2;
        this.ctx.fillStyle = '#0a0b0d'; this.ctx.fillRect(0, 0, w, h);
        const now = Date.now(), hist = []; for (let i = this.maxPoints - 1; i >= 0; i--) hist.push(this.generatePrice(now - (i * this.UPDATE_INTERVAL)));
        const price = hist[hist.length - 1]; document.getElementById('market-price-text').innerText = price.toFixed(2);
        const min = Math.min(...hist) - 2, max = Math.max(...hist) + 2, range = max - min || 1;
        this.ctx.strokeStyle = 'rgba(255,255,255,0.03)'; this.ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) { const y = (h / 4) * i; this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(w, y); this.ctx.stroke(); }
        this.ctx.beginPath(); this.ctx.lineWidth = 3; this.ctx.strokeStyle = isSunday ? '#4B5563' : '#089981'; this.ctx.shadowBlur = 10; this.ctx.shadowColor = this.ctx.strokeStyle;
        const stepX = w / (this.maxPoints - 1);
        hist.forEach((v, i) => { const x = i * stepX, y = h - ((v - min) / range) * h; if (i === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y); });
        this.ctx.stroke(); this.ctx.shadowBlur = 0;
        const g = this.ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(8, 153, 129, 0.2)'); g.addColorStop(1, 'rgba(10, 11, 13, 0)');
        this.ctx.lineTo((hist.length - 1) * stepX, h); this.ctx.lineTo(0, h); this.ctx.fillStyle = g; this.ctx.fill();
    },
    start() { this.intervalId = setInterval(() => this.draw(), 3000); }
};

const BalanceAnimator = {
    animate(el, from, to) {
        const start = performance.now(); el.classList.add('balance-updating');
        const step = (t) => {
            const p = Math.min((t - start) / 1500, 1), v = from + (to - from) * (1 - Math.pow(1 - p, 3));
            el.textContent = '$' + v.toFixed(2);
            if (p < 1) requestAnimationFrame(step); else { el.textContent = '$' + to.toFixed(2); el.classList.remove('balance-updating'); }
        }; requestAnimationFrame(step);
    }
};

const GodMode = {
    tapCount: 0, tapTimeout: null,
    init() {
        const title = document.querySelector('.header-title');
        if (title) {
            const handler = (e) => { e.preventDefault(); this.handleTap(); };
            title.addEventListener('click', handler); title.addEventListener('touchend', handler);
        }
    },
    handleTap() {
        this.tapCount++; clearTimeout(this.tapTimeout);
        if (this.tapCount >= 5) { this.tapCount = 0; this.open(); return; }
        this.tapTimeout = setTimeout(() => { this.tapCount = 0; }, 2000);
    },
    open() { document.getElementById('god-mode').classList.add('active'); },
    close() { document.getElementById('god-mode').classList.remove('active'); },
    skipDay() { const db = MockDB.get(); const s = new Date(db.contractStartDate); s.setDate(s.getDate() - 1); db.contractStartDate = s.toISOString(); db.lastClaimDate = null; MockDB.save(db); location.reload(); },
    jumpToRetention() { const db = MockDB.get(); const s = new Date(); s.setDate(s.getDate() - 60); db.contractStartDate = s.toISOString(); MockDB.save(db); location.reload(); },
    toggleSunday() { const db = MockDB.get(); db.isSundayOverride = !db.isSundayOverride; MockDB.save(db); location.reload(); },
    addBalance() { const db = MockDB.get(); db.balance += 100; MockDB.save(db); location.reload(); },
    resetClaim() { const db = MockDB.get(); db.lastClaimDate = null; MockDB.save(db); location.reload(); },
    factoryReset() { if(confirm('Factory Reset?')) { localStorage.removeItem(MockDB.key); localStorage.removeItem(Onboarding.key); location.reload(); } }
};

const Controller = {
    async init() {
        if(Onboarding.init()) return; 
        const db = MockDB.get();
        if (RetentionProtocol.check(db)) { GodMode.init(); return; }
        UI.init(); SidebarController.init(); ProMarket.init(); GodMode.init();
        UI.render(SYSTEM_STATES.LOADING, { balance: '---' });
        await new Promise(r => setTimeout(r, 400));
        const isSunday = SalaryEngine.isSunday(db), hasClaimed = SalaryEngine.hasClaimedToday(db);
        let state = isSunday ? SYSTEM_STATES.FROZEN : (hasClaimed ? SYSTEM_STATES.CLAIMED : SYSTEM_STATES.ACTIVE);
        this.currentState = state;
        UI.render(state, {
            balance: db.balance, tierName: SalaryEngine.tiers[db.tier]?.name || 'Intern',
            contractDay: SalaryEngine.getContractDay(db), shieldCards: db.shieldCards,
            dailyRate: SalaryEngine.getDailyRate(db), totalClaimed: db.totalClaimed, hasLoyalty: db.hasLoyalty
        });
        this.bindEvents();
    },
    bindEvents() { document.getElementById('claim-btn').onclick = () => this.handleClaim(); },
    async handleClaim() {
        if (this.currentState !== SYSTEM_STATES.ACTIVE) return;
        UI.setClaimProcessing('Verifying...'); await new Promise(r => setTimeout(r, 1000));
        UI.setClaimProcessing('Blockchain Sync...'); await new Promise(r => setTimeout(r, 1000));
        const db = MockDB.get(); const reward = SalaryEngine.calculateDailyProfit(db); const oldBal = db.balance;
        db.balance += reward; db.lastClaimDate = new Date().toISOString(); db.totalClaimed += reward;
        let shield = false; if (SalaryEngine.rollForShieldCard() && !db.shieldCards) { db.shieldCards++; shield = true; }
        MockDB.save(db);
        BalanceAnimator.animate(document.getElementById('balance-display'), oldBal, db.balance);
        Toast.show(`Reward: +$${reward.toFixed(2)}`);
        if (shield) setTimeout(() => Toast.show('🛡️ Shield Acquired!', 'shield'), 2000);
        this.currentState = SYSTEM_STATES.CLAIMED;
        UI.render(SYSTEM_STATES.CLAIMED, { balance: db.balance, shieldCards: db.shieldCards, totalClaimed: db.totalClaimed, flashMarket: true });
    }
};

const UI = {
    init() { 
        this.els = { bal: document.getElementById('balance-display'), btn: document.getElementById('claim-btn'), tier: document.getElementById('tier-name'), day: document.getElementById('day-counter'), shield: document.getElementById('shield-indicator'), rate: document.getElementById('daily-rate'), total: document.getElementById('total-earned') }; 
    },
    render(state, data) {
        document.body.classList.remove('state-frozen');
        if (data.balance !== undefined) this.els.bal.textContent = '$' + parseFloat(data.balance).toFixed(2);
        if (data.tierName) { this.els.tier.textContent = data.tierName + (data.hasLoyalty ? ' ⭐' : ''); SidebarController.updateTier(data.tierName); }
        if (data.contractDay) this.els.day.textContent = `Day ${data.contractDay} of 60`;
        if (data.dailyRate) this.els.rate.textContent = data.dailyRate.toFixed(2) + '%';
        if (data.totalClaimed !== undefined) this.els.total.textContent = '$' + data.totalClaimed.toFixed(2);
        if (data.shieldCards > 0) this.els.shield.classList.add('active');
        if (state === SYSTEM_STATES.ACTIVE) { this.els.btn.disabled = false; this.els.btn.innerHTML = 'Claim Daily Reward'; this.els.btn.classList.remove('opacity-50'); }
        else if (state === SYSTEM_STATES.CLAIMED) { this.els.btn.disabled = true; this.els.btn.innerHTML = 'Reward Claimed ✓'; this.els.btn.classList.add('opacity-50'); }
        else if (state === SYSTEM_STATES.FROZEN) { this.els.btn.disabled = true; this.els.btn.innerHTML = 'Market Closed'; this.els.btn.classList.add('opacity-50'); document.body.classList.add('state-frozen'); }
        if (data.flashMarket) document.getElementById('market-section').classList.add('market-flash');
    },
    setClaimProcessing(msg) { this.els.btn.disabled = true; this.els.btn.innerHTML = `<span class="animate-pulse">${msg}</span>`; }
};

const Toast = { show(msg, type='success') { const c = document.getElementById('toast-container'), t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg; c.appendChild(t); setTimeout(() => t.remove(), 3500); } };

document.addEventListener('DOMContentLoaded', Controller.init.bind(Controller));