// ═══════════════════════════════════════════════════════════
// NEXCAREER V7.1 - FULL SYSTEM IMPLEMENTATION
// Constitution-Compliant Engine
// ═══════════════════════════════════════════════════════════

const STORAGE_KEY = 'nexcareer_data_v71';
const ADMIN_STORAGE_KEY = 'nexcareer_admin_v71';

// ═══════════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════════

const TRANSLATIONS = {
    ar: {
        selectLanguage: 'اختر اللغة',
        totalBalance: 'الرصيد الإجمالي',
        totalEarned: 'إجمالي الأرباح',
        claimReward: 'استلام المكافأة',
        liveMarket: 'السوق الحي',
        active: 'نشط',
        dailyProfit: 'الربح اليومي',
        activeContracts: 'العقود النشطة',
        careerPlans: 'خطط المسار المهني',
        intern: 'متدرب',
        junior: 'مبتدئ',
        pro: 'محترف',
        expert: 'خبير',
        manager: 'مدير',
        partner: 'شريك',
        dailyReturn: 'عائد يومي',
        endBonus: 'مكافأة نهاية الخدمة',
        duration: 'المدة',
        activate: 'تفعيل',
        locked: 'مقفل',
        wallet: 'المحفظة',
        availableBalance: 'الرصيد المتاح',
        withdraw: 'سحب',
        network: 'الشبكة',
        minWithdraw: 'الحد الأدنى',
        processingTime: 'وقت المعالجة',
        team: 'الفريق',
        yourCode: 'كود الإحالة الخاص بك',
        teamMembers: 'أعضاء الفريق',
        teamEarnings: 'أرباح الفريق',
        home: 'الرئيسية',
        invest: 'استثمار',
        careerContract: 'عقد المسار المهني',
        contractTerms: 'شروط العقد',
        workMechanism: 'آلية العمل',
        agreeToTerms: 'أوافق على الشروط والأحكام',
        acceptAndSubscribe: 'الموافقة والاشتراك',
        decline: 'رفض',
        processingDeal: 'جارٍ الحصول على صفقة...',
        verifyingSession: 'التحقق من الجلسة...',
        processingTransaction: 'معالجة المعاملة على الشبكة...',
        finalizingReward: 'إنهاء المكافأة...',
        seconds: 'ثانية',
        luckyTask: 'مهمة محظوظة!',
        taskDescription: 'تفاعل مع القناة ادعم المحتوى بالتعليق والمشاركة',
        uploadScreenshot: 'ارفع لقطة شاشة التفاعل',
        submitTask: 'إرسال المهمة',
        cancel: 'إلغاء',
        sundayLock: 'إغلاق الأحد 🔒',
        marketHoliday: 'عطلة السوق - درع الحماية مفعل'
    },
    en: {
        selectLanguage: 'Select Language',
        totalBalance: 'Total Balance',
        totalEarned: 'Total Earned',
        claimReward: 'Claim Reward',
        liveMarket: 'Live Market',
        active: 'Active',
        dailyProfit: 'Daily Profit',
        activeContracts: 'Active Contracts',
        careerPlans: 'Career Plans',
        intern: 'Intern',
        junior: 'Junior',
        pro: 'Pro',
        expert: 'Expert',
        manager: 'Manager',
        partner: 'Partner',
        dailyReturn: 'Daily Return',
        endBonus: 'End Bonus',
        duration: 'Duration',
        activate: 'Activate',
        locked: 'Locked',
        wallet: 'Wallet',
        availableBalance: 'Available Balance',
        withdraw: 'Withdraw',
        network: 'Network',
        minWithdraw: 'Minimum',
        processingTime: 'Processing Time',
        team: 'Team',
        yourCode: 'Your Referral Code',
        teamMembers: 'Team Members',
        teamEarnings: 'Team Earnings',
        home: 'Home',
        invest: 'Invest',
        careerContract: 'Career Contract',
        contractTerms: 'Contract Terms',
        workMechanism: 'Work Mechanism',
        agreeToTerms: 'I agree to terms and conditions',
        acceptAndSubscribe: 'Accept & Subscribe',
        decline: 'Decline',
        processingDeal: 'Processing deal...',
        verifyingSession: 'Verifying session...',
        processingTransaction: 'Processing transaction on network...',
        finalizingReward: 'Finalizing reward...',
        seconds: 'seconds',
        luckyTask: 'Lucky Task!',
        taskDescription: 'Engage with the channel, support content with comments and shares',
        uploadScreenshot: 'Upload interaction screenshot',
        submitTask: 'Submit Task',
        cancel: 'Cancel',
        sundayLock: 'Sunday Lock 🔒',
        marketHoliday: 'Market Holiday - Protection Shield Active'
    },
    fr: {
        selectLanguage: 'Choisir la Langue',
        totalBalance: 'Solde Total',
        totalEarned: 'Total Gagné',
        claimReward: 'Réclamer Récompense',
        liveMarket: 'Marché en Direct',
        active: 'Actif',
        dailyProfit: 'Profit Quotidien',
        activeContracts: 'Contrats Actifs',
        careerPlans: 'Plans de Carrière',
        intern: 'Stagiaire',
        junior: 'Junior',
        pro: 'Pro',
        expert: 'Expert',
        manager: 'Manager',
        partner: 'Partenaire',
        dailyReturn: 'Rendement Quotidien',
        endBonus: 'Prime de Fin',
        duration: 'Durée',
        activate: 'Activer',
        locked: 'Verrouillé',
        wallet: 'Portefeuille',
        availableBalance: 'Solde Disponible',
        withdraw: 'Retirer',
        network: 'Réseau',
        minWithdraw: 'Minimum',
        processingTime: 'Temps de Traitement',
        team: 'Équipe',
        yourCode: 'Votre Code de Parrainage',
        teamMembers: 'Membres de l\'Équipe',
        teamEarnings: 'Gains de l\'Équipe',
        home: 'Accueil',
        invest: 'Investir',
        careerContract: 'Contrat de Carrière',
        contractTerms: 'Conditions du Contrat',
        workMechanism: 'Mécanisme de Travail',
        agreeToTerms: 'J\'accepte les termes et conditions',
        acceptAndSubscribe: 'Accepter et S\'abonner',
        decline: 'Refuser',
        processingDeal: 'Traitement en cours...',
        verifyingSession: 'Vérification de la session...',
        processingTransaction: 'Traitement de la transaction...',
        finalizingReward: 'Finalisation de la récompense...',
        seconds: 'secondes',
        luckyTask: 'Tâche Chanceuse!',
        taskDescription: 'Interagissez avec la chaîne, soutenez le contenu',
        uploadScreenshot: 'Télécharger capture d\'écran',
        submitTask: 'Soumettre la Tâche',
        cancel: 'Annuler',
        sundayLock: 'Verrouillage Dimanche 🔒',
        marketHoliday: 'Jour Férié du Marché - Bouclier Actif'
    }
};

// ═══════════════════════════════════════════════════════════
// TIER CONFIGURATION (CONSTITUTION V7.1)
// ═══════════════════════════════════════════════════════════

const TIERS = {
    1: { price: 25, name: 'intern', booster: 0.0, eosBonus: 2.00, baseRates: [2.2, 2.6, 3.4] },
    2: { price: 50, name: 'junior', booster: 0.1, eosBonus: 5.00, baseRates: [2.3, 2.7, 3.5] },
    3: { price: 100, name: 'pro', booster: 0.2, eosBonus: 12.00, baseRates: [2.4, 2.8, 3.6] },
    4: { price: 250, name: 'expert', booster: 0.3, eosBonus: 30.00, baseRates: [2.5, 2.9, 3.7] },
    5: { price: 500, name: 'manager', booster: 0.4, eosBonus: 70.00, baseRates: [2.6, 3.0, 3.8] },
    6: { price: 1000, name: 'partner', booster: 0.5, eosBonus: 150.00, baseRates: [2.7, 3.1, 3.9] }
};

const PHASE_MODIFIERS = [0.0, 0.4, 1.2]; // Days 1-20, 21-40, 41-60

// ═══════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════

let currentLang = 'ar';
let appState = null;
let marketInterval = null;
let spectrumAnimationFrame = null;
let currentContractTier = null;

function loadState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return initializeState();
    }
    
    try {
        const state = JSON.parse(stored);
        if (!validateStateChecksum(state)) {
            console.warn('[Security] State checksum mismatch');
            return initializeState();
        }
        return state;
    } catch (e) {
        console.error('[State] Load error:', e);
        return initializeState();
    }
}

function initializeState() {
    return {
        user: {
            balance: 100, // Demo balance
            totalEarned: 0,
            lastClaimTime: 0,
            activeContracts: [],
            claimHistory: [],
            claimTimestamps: [],
            protectionCards: 0,
            cardIssuedAt: null,
            referralCode: generateReferralCode(),
            totalRenewal: 0,
            teamCount: 0,
            teamEarnings: 0
        },
        platform: {
            currentDay: 1,
            launchDate: Date.now()
        },
        _checksum: '',
        _version: '7.1'
    };
}

function saveState(state) {
    state._checksum = generateChecksum(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function generateChecksum(state) {
    const data = JSON.stringify({
        balance: state.user.balance,
        totalEarned: state.user.totalEarned,
        lastClaimTime: state.user.lastClaimTime,
        activeContracts: state.user.activeContracts
    });
    
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

function validateStateChecksum(state) {
    if (!state._checksum) return false;
    const expectedChecksum = generateChecksum(state);
    return state._checksum === expectedChecksum;
}

function generateReferralCode() {
    return 'NEXCAR' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ═══════════════════════════════════════════════════════════
// CONTRACT ENGINE
// ═══════════════════════════════════════════════════════════

function getContractPhase(contractDay) {
    if (contractDay >= 1 && contractDay <= 20) return 0; // Phase 1
    if (contractDay >= 21 && contractDay <= 40) return 1; // Phase 2
    if (contractDay >= 41 && contractDay <= 60) return 2; // Phase 3
    return 0;
}

function calculateDailyProfit(tier, contractDay) {
    const tierConfig = TIERS[tier];
    const phase = getContractPhase(contractDay);
    
    const baseRate = tierConfig.baseRates[phase];
    const totalRate = baseRate + tierConfig.booster + PHASE_MODIFIERS[phase];
    const dailyProfit = tierConfig.price * (totalRate / 100);
    
    return parseFloat(dailyProfit.toFixed(2));
}

function isSunday() {
    return new Date().getDay() === 0;
}

function showContractModal(tier) {
    currentContractTier = tier;
    const tierConfig = TIERS[tier];
    const modal = document.getElementById('contractModal');
    const badge = document.getElementById('contractTierBadge');
    const details = document.getElementById('contractDetails');
    const points = document.getElementById('contractPoints');
    
    badge.textContent = `Tier ${tier}`;
    
    // Contract Details
    details.innerHTML = `
        <div class="contract-detail-row">
            <span class="contract-detail-label">${t('dailyReturn')}:</span>
            <span class="contract-detail-value">${tierConfig.baseRates[0]}% - ${tierConfig.baseRates[2] + PHASE_MODIFIERS[2]}%</span>
        </div>
        <div class="contract-detail-row">
            <span class="contract-detail-label">${t('duration')}:</span>
            <span class="contract-detail-value">60 ${t('days', 'يوم', 'jours')}</span>
        </div>
        <div class="contract-detail-row">
            <span class="contract-detail-label">${t('endBonus')}:</span>
            <span class="contract-detail-value">$${tierConfig.eosBonus.toFixed(2)}</span>
        </div>
        <div class="contract-detail-row">
            <span class="contract-detail-label">${t('investment', 'الاستثمار', 'Investissement')}:</span>
            <span class="contract-detail-value">$${tierConfig.price}</span>
        </div>
    `;
    
    // Contract Points
    points.innerHTML = `
        <li>${t('capital100Locked', 'رأس المال مقفل 100% لمدة 60 يوماً', 'Capital 100% verrouillé pendant 60 jours')}</li>
        <li>${t('dailyClaimRequired', 'يجب الضغط على زر [استلام] كل 24 ساعة', 'Appuyez sur [Réclamer] toutes les 24h')}</li>
        <li>${t('sundayLockDesc', 'كل يوم أحد: السوق مغلق، الربح = 0%', 'Chaque dimanche: Marché fermé, profit = 0%')}</li>
        <li>${t('burnRule', 'عدم الاستلام خلال 24 ساعة = حرق أرباح اليوم', 'Pas de réclamation = brûlure des profits')}</li>
        <li>${t('phaseSystem', 'نظام المراحل: 3 مراحل بنسب متصاعدة', 'Système de phases: 3 phases progressives')}</li>
        <li>${t('usdtBep20', 'الشبكة الحصرية: USDT - BEP20 فقط', 'Réseau exclusif: USDT - BEP20 uniquement')}</li>
    `;
    
    modal.classList.add('active');
}

function closeContractModal() {
    const modal = document.getElementById('contractModal');
    modal.classList.remove('active');
    currentContractTier = null;
    
    // Reset checkbox
    const checkbox = document.getElementById('agreeCheckbox');
    checkbox.checked = false;
    updateContractAcceptButton();
}

function updateContractAcceptButton() {
    const checkbox = document.getElementById('agreeCheckbox');
    const acceptBtn = document.getElementById('btnContractAccept');
    acceptBtn.disabled = !checkbox.checked;
}

function acceptContract() {
    if (!currentContractTier) return;
    
    const state = loadState();
    const tierConfig = TIERS[currentContractTier];
    
    // Check balance
    if (state.user.balance < tierConfig.price) {
        showToast(t('insufficientBalance', 'رصيد غير كافٍ', 'Solde insuffisant'), 'error');
        return;
    }
    
    // Check if contract already exists
    const existingContract = state.user.activeContracts.find(c => c.tier === currentContractTier && c.status === 'active');
    if (existingContract) {
        showToast(t('contractExists', 'العقد موجود بالفعل', 'Contrat existe déjà'), 'error');
        return;
    }
    
    // Create contract
    const contract = {
        id: 'contract_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        tier: currentContractTier,
        principal: tierConfig.price,
        status: 'active',
        contractDay: 1,
        activatedAt: Date.now(),
        lastAccrualAt: Date.now(),
        unclaimedBalance: 0,
        totalEarned: 0,
        loyaltyBonus: 0
    };
    
    // Deduct from balance
    state.user.balance -= tierConfig.price;
    
    // Add contract
    state.user.activeContracts.push(contract);
    
    saveState(state);
    closeContractModal();
    updateUI();
    showToast(t('contractActivated', 'تم تفعيل العقد بنجاح!', 'Contrat activé avec succès!'), 'success');
}

function processContracts() {
    const state = loadState();
    const now = Date.now();
    let hasChanges = false;
    
    state.user.activeContracts.forEach(contract => {
        if (contract.status !== 'active') return;
        
        const timeSinceLastAccrual = now - contract.lastAccrualAt;
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        if (timeSinceLastAccrual >= oneDayMs) {
            const daysPassed = Math.floor(timeSinceLastAccrual / oneDayMs);
            
            for (let i = 0; i < daysPassed && contract.contractDay <= 60; i++) {
                contract.contractDay++;
                
                const accrualDate = new Date(contract.lastAccrualAt + (oneDayMs * (i + 1)));
                const wasSunday = accrualDate.getDay() === 0;
                
                if (!wasSunday && contract.contractDay <= 60) {
                    const dailyProfit = calculateDailyProfit(contract.tier, contract.contractDay);
                    contract.unclaimedBalance += dailyProfit;
                    contract.totalEarned += dailyProfit;
                }
                
                contract.lastAccrualAt += oneDayMs;
                hasChanges = true;
            }
            
            if (contract.contractDay > 60) {
                contract.status = 'expired';
                contract.unclaimedBalance += TIERS[contract.tier].eosBonus;
                hasChanges = true;
            }
        }
    });
    
    if (hasChanges) {
        saveState(state);
    }
}

// ═══════════════════════════════════════════════════════════
// CLAIM LOGIC WITH 60s OVERLAY
// ═══════════════════════════════════════════════════════════

function canClaim() {
    if (isSunday()) return false;
    
    const state = loadState();
    const now = Date.now();
    const cooldownPeriod = 24 * 60 * 60 * 1000;
    const timeSinceLastClaim = now - (state.user.lastClaimTime || 0);
    
    return timeSinceLastClaim >= cooldownPeriod;
}

function performClaim() {
    // DEFENSIVE GUARDS
    const state = loadState();
    const now = Date.now();
    const lastClaim = state.user.lastClaimTime || 0;
    const cooldownPeriod = 24 * 60 * 60 * 1000;
    const timeSinceLastClaim = now - lastClaim;
    
    // GUARD 1: Cooldown
    if (timeSinceLastClaim < cooldownPeriod) {
        console.error('[SECURITY] Claim rejected: Cooldown active');
        showToast(t('cooldownActive', 'فترة الانتظار نشطة', 'Période de refroidissement active'), 'error');
        return;
    }
    
    // GUARD 2: Sunday lock
    if (isSunday()) {
        console.error('[SECURITY] Claim rejected: Sunday lock');
        showToast(t('sundayLock'), 'error');
        return;
    }
    
    // GUARD 3: State integrity
    if (!validateStateChecksum(state)) {
        console.error('[SECURITY] State corruption detected');
        showToast(t('securityError', 'خطأ أمني', 'Erreur de sécurité'), 'error');
        setTimeout(() => location.reload(), 3000);
        return;
    }
    
    // Process contracts first
    processContracts();
    
    // Calculate total claimable
    let totalClaimable = 0;
    const updatedState = loadState();
    updatedState.user.activeContracts.forEach(contract => {
        if (contract.status === 'active' || contract.status === 'expired') {
            totalClaimable += contract.unclaimedBalance;
        }
    });
    
    if (totalClaimable === 0) {
        showToast(t('noRewards', 'لا توجد مكافآت', 'Pas de récompenses'), 'info');
        return;
    }
    
    // Show 60-second overlay
    show60SecondOverlay(totalClaimable);
}

function show60SecondOverlay(amount) {
    const overlay = document.getElementById('claimOverlay');
    const timerEl = document.getElementById('claimTimerSeconds');
    const messageEl = document.getElementById('claimStatusMessage');
    const progressRing = document.getElementById('progressRing');
    const progressFill = document.getElementById('claimProgressFill');
    
    overlay.classList.add('active');
    
    let timeRemaining = 60;
    const circumference = 2 * Math.PI * 90; // radius = 90
    
    // Messages for each 20-second phase
    const messages = [
        t('verifyingSession'),
        t('processingTransaction'),
        t('finalizingReward')
    ];
    
    const claimInterval = setInterval(() => {
        timeRemaining--;
        timerEl.textContent = timeRemaining;
        
        // Update progress ring
        const offset = circumference - (circumference * (60 - timeRemaining) / 60);
        progressRing.style.strokeDashoffset = offset;
        
        // Update progress bar
        const progress = ((60 - timeRemaining) / 60) * 100;
        progressFill.style.width = progress + '%';
        
        // Update message every 20 seconds
        if (timeRemaining === 40) {
            messageEl.textContent = messages[1];
        } else if (timeRemaining === 20) {
            messageEl.textContent = messages[2];
        }
        
        if (timeRemaining <= 0) {
            clearInterval(claimInterval);
            completeClaim(amount);
            overlay.classList.remove('active');
        }
    }, 1000);
}

function completeClaim(amount) {
    const state = loadState();
    const now = Date.now();
    
    // Clear unclaimed balances
    state.user.activeContracts.forEach(contract => {
        if (contract.status === 'active' || contract.status === 'expired') {
            contract.unclaimedBalance = 0;
        }
    });
    
    // Add to balance
    state.user.balance += amount;
    state.user.totalEarned += amount;
    state.user.lastClaimTime = now;
    
    // Store claim timestamp
    if (!state.user.claimTimestamps) state.user.claimTimestamps = [];
    state.user.claimTimestamps.unshift(now);
    state.user.claimTimestamps = state.user.claimTimestamps.slice(0, 10);
    
    // Log claim history
    if (!state.user.claimHistory) state.user.claimHistory = [];
    state.user.claimHistory.unshift({
        id: 'claim_' + now + '_' + Math.random().toString(36).substr(2, 4),
        timestamp: now,
        amount: amount,
        txHash: generateFakeTxHash(),
        status: 'completed'
    });
    
    if (state.user.claimHistory.length > 100) {
        state.user.claimHistory = state.user.claimHistory.slice(0, 100);
    }
    
    saveState(state);
    updateUI();
    triggerClaimSuccess(amount);
    showToast(t('claimSuccess', 'تم استلام المكافأة!', 'Récompense réclamée!') + ' $' + amount.toFixed(2), 'success');
    
    // Check for lucky task (30% chance)
    checkLuckyTaskTrigger();
}

function generateFakeTxHash() {
    return '0x' + Array.from({length: 64}, () => 
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('');
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
    
    // Haptic feedback
    if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
    }
}

// ═══════════════════════════════════════════════════════════
// LUCKY TASK SYSTEM (30% RANDOM)
// ═══════════════════════════════════════════════════════════

function checkLuckyTaskTrigger() {
    const state = loadState();
    
    // Don't show if user already has a shield
    if (state.user.protectionCards > 0) return;
    
    // 30% chance
    if (Math.random() < 0.30) {
        showLuckyTaskButton();
    }
}

function showLuckyTaskButton() {
    const btn = document.getElementById('luckyTaskBtn');
    btn.style.display = 'flex';
}

function hideLuckyTaskButton() {
    const btn = document.getElementById('luckyTaskBtn');
    btn.style.display = 'none';
}

function openTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.add('active');
}

function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('active');
    
    // Reset file input
    const fileInput = document.getElementById('taskFileInput');
    fileInput.value = '';
    
    const uploadZone = document.getElementById('taskUploadZone');
    uploadZone.classList.remove('has-file');
    
    const submitBtn = document.getElementById('btnTaskSubmit');
    submitBtn.disabled = true;
}

function handleTaskFileUpload(file) {
    if (!file) return;
    
    const uploadZone = document.getElementById('taskUploadZone');
    uploadZone.classList.add('has-file');
    
    const submitBtn = document.getElementById('btnTaskSubmit');
    submitBtn.disabled = false;
    
    // Show filename
    uploadZone.querySelector('p').textContent = file.name;
}

function submitTask() {
    const state = loadState();
    
    // Grant shield (admin approval simulation - always grants for demo)
    if (state.user.protectionCards === 0) {
        state.user.protectionCards = 1;
        state.user.cardIssuedAt = Date.now();
        saveState(state);
        
        updateShieldIndicator();
        closeTaskModal();
        hideLuckyTaskButton();
        
        showToast(t('shieldReceived', 'تم منحك درع الحماية!', 'Bouclier de protection reçu!'), 'success');
        triggerShieldReceived();
    }
}

function triggerShieldReceived() {
    const indicator = document.createElement('div');
    indicator.className = 'shield-saved-indicator';
    indicator.innerHTML = '<div>🛡️ ' + t('shieldReceived', 'تم استلام الدرع!', 'Bouclier Reçu!') + '</div>';
    document.body.appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 3000);
    
    if ('vibrate' in navigator) {
        navigator.vibrate([30, 20, 30]);
    }
}

// ═══════════════════════════════════════════════════════════
// MARKET SPECTRUM ANIMATION
// ═══════════════════════════════════════════════════════════

let marketPrice = 1.0000;
let marketTrend = 1; // 1 = up, -1 = down
let spectrumBars = [];

function initMarketSpectrum() {
    const canvas = document.getElementById('spectrumCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Initialize bars
    const barCount = 60;
    const barWidth = width / barCount;
    
    for (let i = 0; i < barCount; i++) {
        spectrumBars.push({
            height: Math.random() * height * 0.5 + height * 0.2,
            velocity: (Math.random() - 0.5) * 2
        });
    }
    
    function animateSpectrum() {
        ctx.clearRect(0, 0, width, height);
        
        // Update and draw bars
        spectrumBars.forEach((bar, i) => {
            // Update height with wave motion
            bar.velocity += (Math.random() - 0.5) * 0.5;
            bar.velocity *= 0.95; // Damping
            bar.height += bar.velocity;
            
            // Keep within bounds
            if (bar.height < height * 0.2) {
                bar.height = height * 0.2;
                bar.velocity *= -0.5;
            }
            if (bar.height > height * 0.8) {
                bar.height = height * 0.8;
                bar.velocity *= -0.5;
            }
            
            // Color based on market trend
            const gradient = ctx.createLinearGradient(0, height, 0, 0);
            if (marketTrend === 1) {
                gradient.addColorStop(0, 'rgba(0, 255, 136, 0.2)');
                gradient.addColorStop(1, 'rgba(0, 255, 136, 0.8)');
            } else {
                gradient.addColorStop(0, 'rgba(255, 71, 87, 0.2)');
                gradient.addColorStop(1, 'rgba(255, 71, 87, 0.8)');
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(i * barWidth, height - bar.height, barWidth - 1, bar.height);
        });
        
        spectrumAnimationFrame = requestAnimationFrame(animateSpectrum);
    }
    
    animateSpectrum();
}

function updateMarketPrice() {
    if (isSunday()) {
        // Sunday: Flat line
        document.getElementById('marketCard').classList.add('sunday-locked');
        document.getElementById('marketStatus').innerHTML = `
            <span class="status-dot"></span>
            <span>${t('marketHoliday')}</span>
        `;
        return;
    } else {
        document.getElementById('marketCard').classList.remove('sunday-locked');
        document.getElementById('marketStatus').innerHTML = `
            <span class="status-dot"></span>
            <span>${t('active')}</span>
        `;
    }
    
    // Random price movement
    const change = (Math.random() - 0.5) * 0.0002;
    marketPrice += change;
    
    // Keep price realistic
    if (marketPrice < 0.9990) marketPrice = 0.9990;
    if (marketPrice > 1.0010) marketPrice = 1.0010;
    
    // Determine trend
    marketTrend = change > 0 ? 1 : -1;
    
    // Update UI
    const priceEl = document.getElementById('marketPrice');
    const changeEl = document.getElementById('marketChange');
    
    priceEl.textContent = '$' + marketPrice.toFixed(4);
    
    const changePercent = ((marketPrice - 1) * 100).toFixed(2);
    changeEl.textContent = (changePercent >= 0 ? '+' : '') + changePercent + '%';
    changeEl.className = 'market-change ' + (changePercent >= 0 ? 'positive' : 'negative');
}

// ═══════════════════════════════════════════════════════════
// SHIELD INDICATOR
// ═══════════════════════════════════════════════════════════

function updateShieldIndicator() {
    const state = loadState();
    const indicator = document.getElementById('shieldIndicator');
    const countEl = document.getElementById('shieldCount');
    
    if (state.user.protectionCards > 0) {
        indicator.style.display = 'flex';
        countEl.textContent = state.user.protectionCards;
    } else {
        indicator.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// LANGUAGE SYSTEM
// ═══════════════════════════════════════════════════════════

function t(key, arText, frText) {
    if (arText && currentLang === 'ar') return arText;
    if (frText && currentLang === 'fr') return frText;
    return TRANSLATIONS[currentLang][key] || key;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('nexcareer_language', lang);
    
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    updateAllTranslations();
    closeLangModal();
}

function updateAllTranslations() {
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.getAttribute('data-lang-key');
        el.textContent = t(key);
    });
}

function openLangModal() {
    document.getElementById('langModal').classList.add('active');
}

function closeLangModal() {
    document.getElementById('langModal').classList.remove('active');
}

// ═══════════════════════════════════════════════════════════
// UI UPDATES
// ═══════════════════════════════════════════════════════════

function updateUI() {
    const state = loadState();
    
    // Update balance
    document.getElementById('balance').textContent = '$' + state.user.balance.toFixed(2);
    document.getElementById('totalEarned').textContent = '$' + state.user.totalEarned.toFixed(2);
    document.getElementById('walletBalance').textContent = '$' + state.user.balance.toFixed(2);
    
    // Update active contracts count
    const activeCount = state.user.activeContracts.filter(c => c.status === 'active').length;
    document.getElementById('activeContracts').textContent = activeCount;
    
    // Calculate daily profit
    let dailyProfit = 0;
    state.user.activeContracts.forEach(contract => {
        if (contract.status === 'active') {
            dailyProfit += calculateDailyProfit(contract.tier, contract.contractDay);
        }
    });
    document.getElementById('dailyProfit').textContent = '$' + dailyProfit.toFixed(2);
    
    // Update claim button
    updateClaimButton();
    
    // Update referral code
    document.getElementById('referralCode').textContent = state.user.referralCode;
    
    // Update team stats
    document.getElementById('teamCount').textContent = state.user.teamCount;
    document.getElementById('teamEarnings').textContent = '$' + state.user.teamEarnings.toFixed(2);
    
    // Update shield
    updateShieldIndicator();
    
    // Update tier buttons based on platform day
    updateTierAvailability();
}

function updateClaimButton() {
    const claimBtn = document.getElementById('claimButton');
    const claimText = claimBtn.querySelector('.claim-text');
    
    claimBtn.classList.remove('ready', 'cooldown', 'sunday-locked');
    
    if (isSunday()) {
        claimBtn.classList.add('sunday-locked');
        claimText.textContent = t('sundayLock');
        claimBtn.disabled = true;
    } else if (canClaim()) {
        claimBtn.classList.add('ready');
        claimText.textContent = t('claimReward');
        claimBtn.disabled = false;
    } else {
        claimBtn.classList.add('cooldown');
        const state = loadState();
        const nextClaimTime = (state.user.lastClaimTime || 0) + (24 * 60 * 60 * 1000);
        const remaining = nextClaimTime - Date.now();
        
        if (remaining > 0) {
            const hours = Math.floor(remaining / (60 * 60 * 1000));
            const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
            claimText.textContent = `${hours}h ${minutes}m`;
        }
        claimBtn.disabled = true;
    }
}

function updateTierAvailability() {
    const state = loadState();
    const platformDay = state.platform.currentDay;
    
    // Month 1: Tiers 1-3
    // Month 2: Tiers 4-5
    // Month 3: Tier 6
    
    for (let tier = 1; tier <= 6; tier++) {
        const btn = document.querySelector(`.btn-activate[data-tier="${tier}"]`);
        if (!btn) continue;
        
        let isUnlocked = false;
        if (tier <= 3) isUnlocked = true; // Always available
        if (tier <= 5 && platformDay >= 31) isUnlocked = true;
        if (tier === 6 && platformDay >= 61) isUnlocked = true;
        
        const hasContract = state.user.activeContracts.some(c => c.tier === tier && c.status === 'active');
        
        if (hasContract) {
            btn.textContent = t('active');
            btn.disabled = true;
        } else if (isUnlocked) {
            btn.textContent = t('activate');
            btn.disabled = false;
        } else {
            btn.textContent = t('locked');
            btn.disabled = true;
        }
    }
}

// ═══════════════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════════════

function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff4757' : '#00d4ff'};
        color: #0a0e27;
        padding: 15px 25px;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10004;
        animation: slideDown 0.3s ease;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ═══════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

function initEventListeners() {
    // Language button
    document.getElementById('langFloatBtn').addEventListener('click', openLangModal);
    
    // Language options
    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = e.currentTarget.getAttribute('data-lang');
            setLanguage(lang);
        });
    });
    
    // Claim button
    document.getElementById('claimButton').addEventListener('click', performClaim);
    
    // Tier activation buttons
    document.querySelectorAll('.btn-activate').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tier = parseInt(e.currentTarget.getAttribute('data-tier'));
            showContractModal(tier);
        });
    });
    
    // Contract modal
    document.getElementById('agreeCheckbox').addEventListener('change', updateContractAcceptButton);
    document.getElementById('btnContractAccept').addEventListener('click', acceptContract);
    document.getElementById('btnContractDecline').addEventListener('click', closeContractModal);
    
    // Lucky task button
    document.getElementById('luckyTaskBtn').addEventListener('click', openTaskModal);
    
    // Task modal
    document.getElementById('taskUploadZone').addEventListener('click', () => {
        document.getElementById('taskFileInput').click();
    });
    
    document.getElementById('taskFileInput').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleTaskFileUpload(e.target.files[0]);
        }
    });
    
    document.getElementById('btnTaskSubmit').addEventListener('click', submitTask);
    document.getElementById('btnTaskCancel').addEventListener('click', closeTaskModal);
    
    // Bottom navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.currentTarget.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Copy referral code
    document.getElementById('btnCopyRef').addEventListener('click', () => {
        const state = loadState();
        navigator.clipboard.writeText(state.user.referralCode);
        showToast(t('codeCopied', 'تم نسخ الكود!', 'Code copié!'), 'success');
    });
}

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

function init() {
    // Load language
    const savedLang = localStorage.getItem('nexcareer_language') || 'ar';
    currentLang = savedLang;
    setLanguage(savedLang);
    
    // Initialize state
    appState = loadState();
    
    // Initialize event listeners
    initEventListeners();
    
    // Process contracts
    processContracts();
    
    // Update UI
    updateUI();
    
    // Initialize market spectrum
    initMarketSpectrum();
    
    // Start market price updates (every 3 seconds)
    marketInterval = setInterval(updateMarketPrice, 3000);
    
    // Update claim button countdown every second
    setInterval(updateClaimButton, 1000);
    
    // Process contracts every minute
    setInterval(() => {
        processContracts();
        updateUI();
    }, 60000);
    
    console.log('[NexCareer] System initialized - V7.1');
}

// Start app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
