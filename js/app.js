/* =========================================================
   NexCareer – Premium HIGH-END FINTECH Edition (V23.0)
   
   CORE BUSINESS LOGIC (Constitution V7.1):
   
   =========================================================
   CAREER CONTRACT ENGINE
   =========================================================
   TIERS & BASE DAILY RATES (Phase 1 – Days 1–20):
   - Tier 1 ($25):   2.20% daily
   - Tier 2 ($50):   2.30% daily
   - Tier 3 ($100):  2.40% daily
   - Tier 4 ($250):  2.50% daily
   - Tier 5 ($500):  2.60% daily
   - Tier 6 ($1000): 2.70% daily
   
   AUTOMATIC PHASE BOOSTERS:
   - Phase 2 (Day 21–40): +0.40% added to base rate
   - Phase 3 (Day 41–60): +0.80% added to base rate
   
   CORE RULES:
   - Contract duration: 60 days (capital fully LOCKED)
   - Maximum: 1 active contract per Tier at the same time
   - Currency label must always be: USDT (BEP20)
   
   =========================================================
   SUNDAY LAW (ZERO PROFIT RULE)
   =========================================================
   - Sundays (Day 0): Daily yield = 0.00%
   - Dashboard must display: "Sunday Lock 🔒"
   - Claim button must be DISABLED
   - Sundays MUST NOT generate profit
   - Sundays MUST NOT count toward burn penalties
   
   =========================================================
   CLAIM, BURN & WALLET LOGIC
   =========================================================
   CLAIM RULE:
   - User must press "CLAIM" once every 24 hours
   - On claim: Add calculated dailyProfit to wallet balance
   - Update total earned and lastClaimTime
   
   BURN RULE:
   - If (currentTime - lastClaimTime) > 48 hours:
     - Missed day's profit is BURNED (lost permanently)
   - Exception: Sundays do NOT count toward burn timing
   
   =========================================================
   PERSISTENCE (LOCAL STORAGE)
   =========================================================
   - Single Source of Truth: `gd_core_data_v21`
   - Structure:
     {
       balance: Float (wallet balance),
       totalEarned: Float,
       lastClaim: Timestamp,
       activeContracts: Array of contract objects
         {
           tier: Number (25, 50, 100, 250, 500, 1000),
           amount: Float,
           startDate: Timestamp,
           lastProcessedDay: Number (1-60)
         }
     }
========================================================= */

(() => {
    // =========================================================
    // STORAGE & CONSTANTS
    // =========================================================
    const CORE_DATA_KEY = "gd_core_data_v21"; // Single source of truth
    const STORAGE_KEY = "gd_premium_v20"; // Legacy state (keep for compatibility)
    const HISTORY_KEY = "gd_history_v7";
    const SECRET_SALT = "GD_SECURE_2026";
    const CLAIM_PROCESS_TIME = 60;
    const DAY_MS = 24 * 60 * 60 * 1000;
    const BURN_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours
    
    // =========================================================
    // CAREER CONTRACT ENGINE CONSTANTS
    // =========================================================
    const CONTRACT_DURATION_DAYS = 60;
    const INVESTMENT_TIERS = [25, 50, 100, 250, 500, 1000]; // USDT amounts
    
    // Base daily rates for Phase 1 (Days 1-20)
    const TIER_BASE_RATES = {
        25: 0.0220,   // 2.20%
        50: 0.0230,   // 2.30%
        100: 0.0240,  // 2.40%
        250: 0.0250,  // 2.50%
        500: 0.0260,  // 2.60%
        1000: 0.0270  // 2.70%
    };
    
    // Phase boosters
    const PHASE_2_BOOST = 0.0040; // +0.40% for Days 21-40
    const PHASE_3_BOOST = 0.0080; // +0.80% for Days 41-60
    
    // =========================================================
    // CONSTITUTION: Business Rules
    // =========================================================
    const REFERRAL_COMMISSION_RATE = 0.30; // 30% Commission on daily yield
    
    // Withdrawal Fee Structure
    const WITHDRAWAL_FEES = {
        lowTierFlat: 1.00,      // $1 fixed fee for $5-$15
        lowTierPercent: 0.05,   // 5% for $5-$15
        highTierPercent: 0.08,  // 8% for above $15
        fridayPenalty: 0.05,    // +5% extra on Fridays
        threshold: 15           // $15 threshold
    };
    
    // Calculate withdrawal fee based on amount and day
    function calculateWithdrawalFee(amount) {
        if (amount < 5) return 0;
        
        let fee = 0;
        const isFriday = new Date().getDay() === 5;
        
        if (amount <= WITHDRAWAL_FEES.threshold) {
            fee = WITHDRAWAL_FEES.lowTierFlat + (amount * WITHDRAWAL_FEES.lowTierPercent);
        } else {
            fee = amount * WITHDRAWAL_FEES.highTierPercent;
        }
        
        if (isFriday) {
            fee += amount * WITHDRAWAL_FEES.fridayPenalty;
        }
        
        return fee;
    }
    
    // =========================================================
    // CORE DATA MANAGEMENT (Single Source of Truth)
    // =========================================================
    
    /**
     * Generate checksum for core data integrity
     * @param {Object} data - Core data object
     * @returns {string} Checksum hash
     */
    function generateCoreDataChecksum(data) {
        const str = JSON.stringify({
            balance: data.balance,
            totalEarned: data.totalEarned,
            lastClaim: data.lastClaim,
            activeContracts: data.activeContracts
        }) + SECRET_SALT;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash.toString();
    }
    
    /**
     * Load core data from localStorage with checksum validation
     * Returns default structure if not found or tampered
     */
    function loadCoreData() {
        const raw = localStorage.getItem(CORE_DATA_KEY);
        if (!raw) {
            return {
                balance: 0.00,
                totalEarned: 0.00,
                lastClaim: 0,
                activeContracts: []
            };
        }
        try {
            const parsed = JSON.parse(raw);
            const storedChecksum = parsed._checksum;
            delete parsed._checksum;
            
            const calculatedChecksum = generateCoreDataChecksum(parsed);
            if (storedChecksum !== calculatedChecksum) {
                console.warn("⚠️ Core data checksum mismatch - resetting to safe state");
                return {
                    balance: 0.00,
                    totalEarned: 0.00,
                    lastClaim: 0,
                    activeContracts: []
                };
            }
            
            return parsed;
        } catch (e) {
            console.error("Failed to parse core data:", e);
            return {
                balance: 0.00,
                totalEarned: 0.00,
                lastClaim: 0,
                activeContracts: []
            };
        }
    }
    
    /**
     * Save core data to localStorage with checksum
     */
    function saveCoreData() {
        const dataToSave = { ...coreData };
        dataToSave._checksum = generateCoreDataChecksum(coreData);
        localStorage.setItem(CORE_DATA_KEY, JSON.stringify(dataToSave));
    }
    
    // Initialize core data
    let coreData = loadCoreData();
    
    // =========================================================
    // SUNDAY LAW (Zero Profit Rule)
    // =========================================================
    
    /**
     * Check if current day is Sunday
     * @returns {boolean} True if Sunday (Day 0)
     */
    function isSunday() {
        return new Date().getDay() === 0;
    }
    
    /**
     * Calculate number of non-Sunday days between two timestamps
     * Used for burn penalty calculations (Sundays don't count)
     * @param {number} startTime - Start timestamp
     * @param {number} endTime - End timestamp
     * @returns {number} Number of non-Sunday days
     */
    function countNonSundayDays(startTime, endTime) {
        let count = 0;
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        
        // Reset to start of day
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        const current = new Date(startDate);
        while (current <= endDate) {
            if (current.getDay() !== 0) { // Not Sunday
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        
        return count;
    }
    
    // =========================================================
    // CAREER CONTRACT ENGINE
    // =========================================================
    
    /**
     * Calculate daily rate for a contract based on tier and current day
     * @param {number} tier - Contract tier amount (25, 50, 100, 250, 500, 1000)
     * @param {number} contractDay - Current day of contract (1-60)
     * @returns {number} Daily rate as decimal (e.g., 0.0220 for 2.20%)
     */
    function calculateDailyRate(tier, contractDay) {
        // Get base rate for tier
        const baseRate = TIER_BASE_RATES[tier];
        if (!baseRate) {
            console.warn(`Invalid tier: ${tier}`);
            return 0;
        }
        
        // Apply phase boosters
        let rate = baseRate;
        
        if (contractDay >= 21 && contractDay <= 40) {
            // Phase 2: +0.40%
            rate += PHASE_2_BOOST;
        } else if (contractDay >= 41 && contractDay <= 60) {
            // Phase 3: +0.80%
            rate += PHASE_3_BOOST;
        }
        
        return rate;
    }
    
    /**
     * Calculate daily profit for a single contract
     * @param {Object} contract - Contract object
     * @returns {number} Daily profit amount in USDT
     */
    function calculateContractDailyProfit(contract) {
        // SUNDAY LAW: Zero profit on Sundays
        if (isSunday()) {
            return 0.00;
        }
        
        // Calculate current contract day
        const now = Date.now();
        const startDate = contract.startDate;
        const daysSinceStart = Math.floor((now - startDate) / DAY_MS) + 1;
        const contractDay = Math.min(daysSinceStart, CONTRACT_DURATION_DAYS);
        
        // Get daily rate for this tier and day
        const dailyRate = calculateDailyRate(contract.tier, contractDay);
        
        // Calculate profit: amount * daily rate
        const dailyProfit = contract.amount * dailyRate;
        
        return dailyProfit;
    }
    
    /**
     * Calculate total daily profit from all active contracts
     * @returns {number} Total daily profit in USDT
     */
    function calculateTotalDailyProfit() {
        // SUNDAY LAW: Zero profit on Sundays
        if (isSunday()) {
            return 0.00;
        }
        
        let totalProfit = 0.00;
        
        // Process each active contract
        coreData.activeContracts.forEach(contract => {
            const contractProfit = calculateContractDailyProfit(contract);
            totalProfit += contractProfit;
        });
        
        return totalProfit;
    }
    
    /**
     * Update contract lastProcessedDay and remove expired contracts
     */
    function updateContracts() {
        const now = Date.now();
        const updatedContracts = [];
        
        coreData.activeContracts.forEach(contract => {
            const daysSinceStart = Math.floor((now - contract.startDate) / DAY_MS) + 1;
            
            if (daysSinceStart > CONTRACT_DURATION_DAYS) {
                // Contract expired - remove it
                console.log(`Contract expired: Tier $${contract.tier}`);
                return; // Skip adding to updatedContracts
            }
            
            // Update lastProcessedDay
            contract.lastProcessedDay = Math.min(daysSinceStart, CONTRACT_DURATION_DAYS);
            updatedContracts.push(contract);
        });
        
        coreData.activeContracts = updatedContracts;
        saveCoreData();
    }
    
    /**
     * Activate a new contract
     * @param {number} tier - Contract tier amount
     * @param {number} amount - Investment amount (must match tier)
     * @returns {boolean} True if activation successful
     */
    function activateContract(tier, amount) {
        // Check if user already has an active contract for this tier
        const existingContract = coreData.activeContracts.find(c => c.tier === tier);
        if (existingContract) {
            console.warn(`Contract already active for tier $${tier}`);
            return false;
        }
        
        // Validate tier
        if (!INVESTMENT_TIERS.includes(tier)) {
            console.warn(`Invalid tier: ${tier}`);
            return false;
        }
        
        // OPTIMISTIC UI: Show contract immediately
        const optimisticContract = {
            tier: tier,
            amount: amount,
            startDate: Date.now(),
            lastProcessedDay: 1
        };
        coreData.activeContracts.push(optimisticContract);
        if (el.activeContractsCount) {
            el.activeContractsCount.textContent = coreData.activeContracts.length.toString();
        }
        
        // Create new contract
        const newContract = {
            tier: tier,
            amount: amount,
            startDate: Date.now(),
            lastProcessedDay: 1
        };
        
        coreData.activeContracts = coreData.activeContracts.filter(c => c !== optimisticContract);
        coreData.activeContracts.push(newContract);
        saveCoreData();
        
        // Context-aware navigation: Suggest Home tab after activation
        setTimeout(() => {
            switchTab('home');
        }, 1000);
        
        return true;
    }
    
    // =========================================================
    // CLAIM LOGIC
    // =========================================================
    
    /**
     * Process daily claim
     * Adds daily profit to balance and updates lastClaim timestamp
     * Includes optimistic UI and streak tracking
     */
    function processClaim() {
        // SUNDAY LAW: Cannot claim on Sunday
        if (isSunday()) {
            return false;
        }
        
        // Check cooldown (24 hours)
        const now = Date.now();
        if (coreData.lastClaim > 0) {
            const timeSinceLastClaim = now - coreData.lastClaim;
            if (timeSinceLastClaim < DAY_MS) {
                // Still in cooldown
                return false;
            }
        }
        
        // OPTIMISTIC UI: Update balance immediately (before processing)
        const dailyProfit = calculateTotalDailyProfit();
        const optimisticBalance = coreData.balance + dailyProfit;
        if (el.balanceDisplay) {
            el.balanceDisplay.textContent = `$${optimisticBalance.toFixed(2)}`;
        }
        
        // Process burn penalties first
        const hadBurn = processBurnPenalties();
        
        // Recalculate after burn (if any)
        const finalDailyProfit = calculateTotalDailyProfit();
        
        // Add to balance
        coreData.balance += finalDailyProfit;
        coreData.totalEarned += finalDailyProfit;
        coreData.lastClaim = now;
        
        // Update streak
        updateStreak();
        
        // Update contracts
        updateContracts();
        
        // Save to localStorage
        saveCoreData();
        
        // Check milestones
        checkMilestones();
        
        // Emotional recovery: If burn occurred, show empathetic message after delay
        if (hadBurn) {
            setTimeout(() => {
                showEmpatheticReminder();
            }, 300000); // 5 minutes
        }
        
        return true;
    }
    
    /**
     * Enhanced burn penalty processing with emotional recovery
     */
    let lastBurnTime = 0;
    function processBurnPenalties() {
        if (!coreData.lastClaim || coreData.lastClaim === 0) {
            return false; // No previous claim, no burn
        }
        
        const now = Date.now();
        const timeSinceLastClaim = now - coreData.lastClaim;
        
        // Check if more than 48 hours (excluding Sundays)
        const nonSundayDays = countNonSundayDays(coreData.lastClaim, now);
        
        // If more than 2 non-Sunday days have passed, burn occurred
        if (nonSundayDays > 2) {
            lastBurnTime = now;
            const missedDays = nonSundayDays - 1;
            
            // Calculate profit for each missed day (excluding Sundays)
            let burnedProfit = 0.00;
            for (let i = 1; i <= missedDays; i++) {
                const checkDate = new Date(coreData.lastClaim + (i * DAY_MS));
                if (checkDate.getDay() !== 0) {
                    let dayProfit = 0.00;
                    coreData.activeContracts.forEach(contract => {
                        const contractDay = Math.min(
                            Math.floor((checkDate.getTime() - contract.startDate) / DAY_MS) + 1,
                            CONTRACT_DURATION_DAYS
                        );
                        const dailyRate = calculateDailyRate(contract.tier, contractDay);
                        dayProfit += contract.amount * dailyRate;
                    });
                    burnedProfit += dayProfit;
                }
            }
            
            if (burnedProfit > 0) {
                console.log(`⚠️ Burn penalty: $${burnedProfit.toFixed(2)} lost due to missed claim`);
                
                // Experience Effect: Burn Shake
                triggerBurnShake();
                
                return true; // Burn occurred
            }
        }
        return false;
    }
    
    /**
     * Show empathetic reminder after burn event
     */
    function showEmpatheticReminder() {
        const timeSinceBurn = Date.now() - lastBurnTime;
        if (timeSinceBurn < 300000) return; // Only show after 5 minutes
        
        const reminder = document.createElement('div');
        reminder.className = 'empathetic-reminder';
        reminder.innerHTML = `
            <div class="reminder-content">
                <i class="fa-solid fa-heart"></i>
                <div>
                    <strong>We understand</strong>
                    <p>Life happens. Your next claim is ready when you are.</p>
                </div>
            </div>
        `;
        document.body.appendChild(reminder);
        
        setTimeout(() => {
            reminder.classList.add('fade-out');
            setTimeout(() => reminder.remove(), 500);
        }, 5000);
    }
    
    /**
     * Show shield protection relief modal
     */
    function showShieldProtectionModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'shieldProtectionModal';
        modal.innerHTML = `
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h2>🛡️ Shield Protected!</h2>
                    <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="text-align: center; padding: 30px;">
                    <div style="font-size: 60px; margin-bottom: 20px;">🛡️</div>
                    <h3 style="color: #FFD700; margin-bottom: 15px;">Your Profits Are Safe</h3>
                    <p style="color: #ccc; line-height: 1.6;">
                        Your Insurance Shield has protected your earnings. 
                        Continue building your portfolio with confidence.
                    </p>
                    <button class="gold-btn" style="margin-top: 20px;" onclick="this.closest('.modal-overlay').remove()">
                        Continue
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => {
            if (modal.parentNode) modal.remove();
        }, 10000);
    }
    
    // =========================================================
    // LOCALIZATION
    // =========================================================
    const LANGS = {
        en: {
            dir: "ltr",
            home: "Dashboard", wallet: "Wallet", teamTitle: "Team", activity: "Activity",
            pageTitle: "NexCareer", appTitle: "NexCareer", appSubtitle: "Secure Investment System",
            secureProtocol: "Secure Protocol", activityLog: "Activity Log", integrityCheck: "Integrity Check",
            accessDashboard: "ACCESS DASHBOARD", connected: "Connected",
            balance: "Total Asset Value", intern: "Intern", dayLabel: "Day", of: "of",
            dailyYield: "DAILY YIELD", totalProfit: "TOTAL PROFIT",
            claim: "CLAIM REWARD", sunday: "MARKET CLOSED (SUNDAY)", wait: "COME BACK TOMORROW",
            cooldown: "PROCESSING...", ready: "CLAIM AVAILABLE", locked: "SUNDAY LOCK",
            sundayLock: "Market Closed (Sunday)",
            bnbPair: "USDT / USD", bscChain: "BINANCE SMART CHAIN (BEP20)",
            walletTitle: "My Wallet", bnbBep20: "USDT (BEP20)", withdrawAddress: "USDT Wallet Address",
            withdrawAmount: "Amount (USDT)", confirm: "WITHDRAW", bnbPlaceholder: "0x...", amountPlaceholder: "0.00",
            referralTitle: "Referrals",
            commission: "30% Direct Commission", refLabel: "Your Link:", members: "Members", commissions: "Earned",
            activityTitle: "Transaction History", emptyHist: "No transactions yet.", histClaimTitle: "Daily Reward",
            waitMsg: "Verifying liquidity pool connection...", dontClose: "Do not close this page",
            phases: ["Connecting to Binance Node...", "Verifying Smart Contract...", "Securing Transaction...", "Finalizing Deposit..."],
            toastSuccess: "Reward Claimed Successfully", toastLink: "Link Copied!", toastRefLink: "Referral Link Copied!",
            toastErrSun: "Market Closed on Sunday", toastErrCool: "Cooldown Active",
            multiTab: "Session active in another tab.", useHere: "USE HERE",
            inviteFriends: "Invite Friends & Earn", copy: "Copy", totalReferrals: "Total Referrals", refCommission: "Commission",
            smartContractRules: "Smart Contract Rules", understood: "Understood",
            profitDistribution: "Profit Distribution", profitDistributionDesc: "Daily automatic distribution to your account",
            withdrawalLimit: "Withdrawal Limit", withdrawalLimitDesc: "Minimum $10 per transaction",
            contractDuration: "Contract Duration", contractDurationDesc: "60 days investment period",
            dailyYieldRate: "Daily Yield Rate", dailyYieldRateDesc: "2.20% daily return on investment",
            marketHours: "Market Hours", marketHoursDesc: "Closed on Sundays for maintenance"
        },
        ar: {
            dir: "rtl",
            home: "لوحة التحكم", wallet: "المحفظة", teamTitle: "الفريق", activity: "السجل",
            pageTitle: "NexCareer", appTitle: "NexCareer", appSubtitle: "نظام استثمار آمن",
            secureProtocol: "بروتوكول آمن", activityLog: "سجل النشاط", integrityCheck: "فحص النزاهة",
            accessDashboard: "الوصول إلى لوحة التحكم", connected: "متصل",
            balance: "إجمالي قيمة الأصول", intern: "متدرب", dayLabel: "يوم", of: "من",
            dailyYield: "العائد اليومي", totalProfit: "إجمالي الربح",
            claim: "سحب الأرباح", sunday: "السوق مغلق (الأحد)", wait: "عد غداً",
            cooldown: "جارِ المعالجة...", ready: "المطالبة متاحة الآن", locked: "قفل الأحد",
            sundayLock: "السوق مغلق (الأحد)",
            bnbPair: "USDT / USD", bscChain: "سلسلة بينانس الذكية (BEP20)",
            walletTitle: "محفظتي", bnbBep20: "USDT (BEP20)", withdrawAddress: "عنوان محفظة USDT",
            withdrawAmount: "الكمية (USDT)", confirm: "تأكيد السحب", bnbPlaceholder: "0x...", amountPlaceholder: "0.00",
            referralTitle: "الإحالات",
            commission: "عمولة مباشرة 30%", refLabel: "رابط الدعوة:", members: "أعضاء", commissions: "أرباح",
            activityTitle: "سجل المعاملات", emptyHist: "لا توجد معاملات بعد.", histClaimTitle: "مكافأة يومية",
            waitMsg: "جاري التحقق من سيولة العقد الذكي...", dontClose: "لا تغلق هذه الصفحة",
            phases: ["جاري الاتصال بـ Binance...", "التحقق من العقد الذكي...", "تأمين المعاملة...", "إيداع الأرباح..."],
            toastSuccess: "تم استلام المكافأة بنجاح", toastLink: "تم نسخ الرابط!", toastRefLink: "تم نسخ رابط الإحالة!",
            toastErrSun: "السوق مغلق يوم الأحد", toastErrCool: "فترة الانتظار نشطة",
            multiTab: "الجلسة نشطة في صفحة أخرى.", useHere: "استخدم هنا",
            inviteFriends: "دعوة الأصدقاء والربح", copy: "نسخ", totalReferrals: "إجمالي الإحالات", refCommission: "العمولة",
            smartContractRules: "قواعد العقد الذكي", understood: "فهمت",
            profitDistribution: "توزيع الأرباح", profitDistributionDesc: "توزيع تلقائي يومي على حسابك",
            withdrawalLimit: "حد السحب", withdrawalLimitDesc: "الحد الأدنى 10 دولارات لكل معاملة",
            contractDuration: "مدة العقد", contractDurationDesc: "فترة استثمار 60 يوماً",
            dailyYieldRate: "معدل العائد اليومي", dailyYieldRateDesc: "عائد يومي 2.20% على الاستثمار",
            marketHours: "ساعات السوق", marketHoursDesc: "مغلق أيام الأحد للصيانة"
        },
        fr: {
            dir: "ltr",
            home: "Tableau de bord", wallet: "Portefeuille", teamTitle: "Équipe", activity: "Activité",
            pageTitle: "NexCareer", appTitle: "NexCareer", appSubtitle: "Système d'investissement sécurisé",
            secureProtocol: "Protocole sécurisé", activityLog: "Journal d'activité", integrityCheck: "Vérification d'intégrité",
            accessDashboard: "ACCÉDER AU TABLEAU DE BORD", connected: "Connecté",
            balance: "Valeur Totale", intern: "Stagiaire", dayLabel: "Jour", of: "sur",
            dailyYield: "RENDEMENT QUOTIDIEN", totalProfit: "PROFIT TOTAL",
            claim: "RÉCLAMER", sunday: "MARCHÉ FERMÉ", wait: "REVENEZ DEMAIN",
            cooldown: "TRAITEMENT...", ready: "RÉCLAMATION DISPONIBLE", locked: "FERMÉ",
            sundayLock: "Marché fermé (Dimanche)",
            bnbPair: "USDT / USD", bscChain: "BINANCE SMART CHAIN (BEP20)",
            walletTitle: "Mon Portefeuille", bnbBep20: "USDT (BEP20)", withdrawAddress: "Adresse du portefeuille USDT",
            withdrawAmount: "Montant (USDT)", confirm: "RETRAIT", bnbPlaceholder: "0x...", amountPlaceholder: "0.00",
            referralTitle: "Parrainages",
            commission: "Commission directe de 30%", refLabel: "Votre Lien:", members: "Membres", commissions: "Gains",
            activityTitle: "Historique", emptyHist: "Aucune transaction.", histClaimTitle: "Récompense Quotidienne",
            waitMsg: "Veuillez patienter...", dontClose: "Ne fermez pas cette page",
            phases: ["Connexion à Binance...", "Vérification du contrat...", "Sécurisation...", "Finalisation..."],
            toastSuccess: "Récompense reçue avec succès", toastLink: "Lien copié !", toastRefLink: "Lien de parrainage copié !",
            toastErrSun: "Marché fermé dimanche", toastErrCool: "Période d'attente active",
            multiTab: "Session active ailleurs.", useHere: "UTILISER ICI",
            inviteFriends: "Inviter des amis et gagner", copy: "Copier", totalReferrals: "Total des parrainages", refCommission: "Commission",
            smartContractRules: "Règles du contrat intelligent", understood: "Compris",
            profitDistribution: "Distribution des profits", profitDistributionDesc: "Distribution automatique quotidienne sur votre compte",
            withdrawalLimit: "Limite de retrait", withdrawalLimitDesc: "Minimum 10 $ par transaction",
            contractDuration: "Durée du contrat", contractDurationDesc: "Période d'investissement de 60 jours",
            dailyYieldRate: "Taux de rendement quotidien", dailyYieldRateDesc: "Rendement quotidien de 2,20 % sur l'investissement",
            marketHours: "Heures de marché", marketHoursDesc: "Fermé le dimanche pour maintenance"
        }
    };
    
    // =========================================================
    // SESSION MANAGER (V22 - The Vault)
    // =========================================================
    const sessionChannel = new BroadcastChannel('gd_secure_v22');
    let isLeader = false;
    let heartbeatTimer, deadCheckTimer, lastHeartbeat = 0;
    
    function initSession() {
        const now = Date.now();
        const lastActive = parseInt(localStorage.getItem('gd_last_active') || 0);
        if (now - lastActive > 2000) becomeLeader();
        else becomeFollower();
        sessionChannel.onmessage = (e) => {
            if (e.data === 'HEARTBEAT' && !isLeader) lastHeartbeat = Date.now();
            else if (e.data === 'FORCE_TAKEOVER' && isLeader) becomeFollower();
        };
    }
    
    function becomeLeader() {
        isLeader = true;
        document.getElementById('multiTabWarning').classList.add('hidden');
        document.querySelector('.app').style.opacity = '1';
        document.querySelector('.app').style.pointerEvents = 'auto';
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
            sessionChannel.postMessage('HEARTBEAT');
            localStorage.setItem('gd_last_active', Date.now());
        }, 1000);
        if (deadCheckTimer) clearInterval(deadCheckTimer);
    }
    
    function becomeFollower() {
        isLeader = false;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        document.getElementById('multiTabWarning').classList.remove('hidden');
        document.querySelector('.app').style.opacity = '0.3';
        document.querySelector('.app').style.pointerEvents = 'none';
        lastHeartbeat = Date.now();
        if (deadCheckTimer) clearInterval(deadCheckTimer);
        deadCheckTimer = setInterval(() => {
            if (Date.now() - lastHeartbeat > 3000) becomeLeader();
        }, 1000);
    }
    
    document.getElementById('useHereBtn').onclick = () => {
        sessionChannel.postMessage('FORCE_TAKEOVER');
        becomeLeader();
    };
    
    // =========================================================
    // SECURITY & UTILS
    // =========================================================
    function generateHash(data) {
        const str = JSON.stringify(data) + SECRET_SALT;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash.toString();
    }
    
    function showToast(msg, type = 'error') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'}"></i> ${msg}`;
        document.getElementById('toastContainer').appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
    
    // =========================================================
    // LEGACY STATE MANAGEMENT (for compatibility)
    // =========================================================
    const defaultState = {
        balance: 0.00, lastClaim: 0, lang: null,
        refCode: Math.floor(100000 + Math.random() * 900000),
        isClaiming: false, claimStartTime: 0, startDate: Date.now(),
        hasShield: false,
        taskSubmitted: false,
        introShown: false,
        streakDays: 0,
        lastStreakDate: 0,
        milestones: {
            firstClaim: false,
            sevenDayStreak: false,
            hundredDollars: false
        },
        sessionResumeCount: 0,
        lastSessionTime: 0
    };
    
    function getInitialLang() {
        const b = navigator.language.slice(0, 2);
        return ["ar", "fr"].includes(b) ? b : "en";
    }
    
    function loadState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...defaultState, lang: getInitialLang() };
        try {
            const parsed = JSON.parse(raw);
            const h = parsed._hash;
            delete parsed._hash;
            if (generateHash(parsed) !== h) throw new Error("Tamper");
            return parsed;
        } catch (e) {
            return { ...defaultState, lang: getInitialLang() };
        }
    }
    
    function saveState() {
        const d = { ...state };
        if(d._hash) delete d._hash;
        d._hash = generateHash(d);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    }
    
    let state = loadState();
    
    // =========================================================
    // UI ELEMENTS
    // =========================================================
    const el = {
        balance: document.getElementById("balanceDisplay"),
        balanceDisplay: document.getElementById("balanceDisplay"),
        walletPageBalance: document.getElementById("walletPageBalance"),
        claimBtn: document.getElementById("claimBtn"),
        countdownDisplay: document.getElementById("countdownDisplay"),
        sundayLockOverlay: document.getElementById("sundayLockOverlay"),
        marketPrice: document.getElementById("marketPrice"),
        bnbPrice: document.getElementById("marketPrice"),
        bnbChange: document.getElementById("bnbChange"),
        coinName: document.getElementById("coinNameDisplay"),
        coinNameDisplay: document.getElementById("coinNameDisplay"),
        activeContractsCount: document.getElementById("activeContractsCount"),
        coinIcon: document.getElementById("coinIcon"),
        menuBtn: document.getElementById("menuBtn"),
        sidebar: document.getElementById("sidebar"),
        overlay: document.getElementById("sidebarOverlay"),
        menuItems: document.querySelectorAll(".menu-item"),
        langFabBtn: document.getElementById("langFabBtn"),
        langFabMenu: document.getElementById("langFabMenu"),
        langFabOptions: document.querySelectorAll(".lang-fab-option"),
        username: document.getElementById("usernameDisplay"),
        welcomeScreen: document.getElementById("welcomeScreen"),
        startBtn: document.getElementById("startBtn"),
        claimOverlay: document.getElementById("claimOverlay"),
        progressRing: document.getElementById("progressRing"),
        timer: document.getElementById("timer"),
        phaseText: document.getElementById("phaseText"),
        refLink: document.getElementById("refLink"),
        copyBtn: document.getElementById("copyBtn"),
        historyList: document.getElementById("historyList"),
        currentDay: document.getElementById("currentDay"),
        progressFill: document.getElementById("progressFill"),
        totalProfit: document.getElementById("totalProfit"),
        liveGraphCanvas: document.getElementById("liveGraphCanvas"),
        marketChartCanvas: document.getElementById("marketChartCanvas"),
        referralLink: document.getElementById("referralLink"),
        copyReferralBtn: document.getElementById("copyReferralBtn"),
        totalReferrals: document.getElementById("totalReferrals"),
        refCommission: document.getElementById("refCommission"),
        termsBtn: document.getElementById("termsBtn"),
        termsModal: document.getElementById("termsModal"),
        closeTermsBtn: document.getElementById("closeTermsBtn"),
        acceptTermsBtn: document.getElementById("acceptTermsBtn"),
        referralModal: document.getElementById("referralModal"),
        closeReferralBtn: document.getElementById("closeReferralBtn"),
        activityFeed: document.getElementById("activityFeed"),
        insuranceBtn: document.getElementById("insuranceBtn"),
        teamCountMain: document.getElementById("teamCountMain"),
        teamEarningsMain: document.getElementById("teamEarningsMain"),
        teamTableBody: document.getElementById("teamTableBody"),
        constitutionBtn: document.getElementById("constitutionBtn"),
        constitutionModal: document.getElementById("constitutionModal"),
        closeConstitutionBtn: document.getElementById("closeConstitutionBtn"),
        acceptConstitutionBtn: document.getElementById("acceptConstitutionBtn"),
        uploadTaskBtn: document.getElementById("uploadTaskBtn"),
        uploadTaskText: document.getElementById("uploadTaskText"),
        walletConnectBtn: document.getElementById("connect-wallet"),
        walletConnectText: document.getElementById("walletConnectText"),
        uploadModal: document.getElementById("uploadModal"),
        closeUploadModal: document.getElementById("closeUploadModal"),
        uploadStatusText: document.getElementById("uploadStatusText"),
        uploadProgressFill: document.getElementById("uploadProgressFill"),
        depositModal: document.getElementById("depositModal"),
        closeDepositBtn: document.getElementById("closeDepositBtn"),
        depositModalTitle: document.getElementById("depositModalTitle"),
        depositAmount: document.getElementById("depositAmount"),
        depositWalletAddress: document.getElementById("depositWalletAddress"),
        copyWalletBtn: document.getElementById("copyWalletBtn"),
        depositTxid: document.getElementById("depositTxid"),
        confirmDepositBtn: document.getElementById("confirmDepositBtn"),
        copyReferralBtn: document.getElementById("copyReferralBtn"),
        referralCount: document.getElementById("referralCount")
    };
    
    // =========================================================
    // CORE LOGIC
    // =========================================================
    const T = () => LANGS[state.lang];
    const now = () => Date.now();
    
    /**
     * Update UI with current core data
     * DOM binding only - no structure changes
     */
    function updateUI() {
        const txt = T();
        document.documentElement.dir = txt.dir;
        document.documentElement.lang = state.lang;
        document.title = txt.pageTitle;
        
        // Update ALL text elements with data-i18n
        document.querySelectorAll("[data-i18n]").forEach(e => {
            if(txt[e.dataset.i18n]) e.textContent = txt[e.dataset.i18n];
        });
        
        // Update placeholders
        document.querySelectorAll("[data-i18n-placeholder]").forEach(e => {
            if(txt[e.dataset.i18nPlaceholder]) e.placeholder = txt[e.dataset.i18nPlaceholder];
        });
        
        // =========================================================
        // UPDATE BALANCE DISPLAYS (DOM BINDING)
        // =========================================================
        // Sync with admin-approved balance first
        const adminBalance = parseFloat(localStorage.getItem('totalBalance') || '0');
        if (adminBalance > 0) {
            coreData.balance = adminBalance;
            saveCoreData();
        }
        
        // Update all balance displays (Unified IDs)
        if (el.balanceDisplay) {
            el.balanceDisplay.textContent = `$${coreData.balance.toFixed(2)}`;
        }
        if (el.balance) {
            el.balance.textContent = `$${coreData.balance.toFixed(2)}`;
        }
        if (el.walletPageBalance) {
            el.walletPageBalance.textContent = `$${coreData.balance.toFixed(2)}`;
        }
        if (el.totalProfit) {
            el.totalProfit.textContent = `$${coreData.totalEarned.toFixed(2)}`;
        }
        
        // Update active contracts count
        if (el.activeContractsCount) {
            el.activeContractsCount.textContent = coreData.activeContracts.length.toString();
        }
        
        // Update streak display
        const streakDisplay = document.getElementById('streakDays');
        if (streakDisplay) {
            streakDisplay.textContent = state.streakDays || 0;
            const streakContainer = document.getElementById('streakDisplay');
            if (streakContainer && state.streakDays >= 7) {
                streakContainer.style.color = '#FFD700';
                streakContainer.style.fontWeight = 'bold';
            }
        }
        
        // =========================================================
        // UPDATE CONTRACT PROGRESS (DOM BINDING)
        // =========================================================
        // Calculate current contract day (use earliest active contract or default)
        let currentContractDay = 1;
        if (coreData.activeContracts.length > 0) {
            const earliestContract = coreData.activeContracts.reduce((earliest, contract) => {
                return contract.startDate < earliest.startDate ? contract : earliest;
            });
            const now = Date.now();
            const daysSinceStart = Math.floor((now - earliestContract.startDate) / DAY_MS) + 1;
            currentContractDay = Math.min(daysSinceStart, CONTRACT_DURATION_DAYS);
        }
        
        if (el.currentDay) {
            el.currentDay.textContent = `${currentContractDay} / ${CONTRACT_DURATION_DAYS}`;
        }
        if (el.progressFill) {
            const progressPercent = (currentContractDay / CONTRACT_DURATION_DAYS) * 100;
            el.progressFill.style.width = `${progressPercent}%`;
        }
        
        // =========================================================
        // UPDATE REFERRAL DISPLAYS (DOM BINDING)
        // =========================================================
        if (el.refLink) el.refLink.value = `nexcareer.io/?ref=${state.refCode}`;
        if (el.username) el.username.textContent = `NexCareer Associate`;
        if (el.referralLink) el.referralLink.value = `https://nexcareer.io/?ref=User${state.refCode}`;
        
        // CONSTITUTION ENFORCEMENT: Referral Commission = 30% (HARDCODED)
        if (el.totalReferrals) el.totalReferrals.textContent = "0";
        if (el.refCommission) {
            // Calculate commission based on 30% of daily yield
            const dailyProfit = calculateTotalDailyProfit();
            const commission = dailyProfit * REFERRAL_COMMISSION_RATE;
            el.refCommission.textContent = `$${commission.toFixed(2)}`;
        }
        
        // Update active language
        if (el.langFabOptions) {
            el.langFabOptions.forEach(btn => btn.classList.toggle("active", btn.dataset.lang === state.lang));
        }
        
        // =========================================================
        // UPDATE CLAIM BUTTON STATE (DOM BINDING)
        // =========================================================
        if (el.claimBtn) {
            if (state.isClaiming) {
                el.claimBtn.disabled = true;
                const span = el.claimBtn.querySelector("span");
                if (span) span.textContent = txt.cooldown;
                if (el.sundayLockOverlay) el.sundayLockOverlay.classList.add('hidden');
            } else if (isSunday()) {
                // SUNDAY LAW: Disable claim button
                el.claimBtn.disabled = true;
                const span = el.claimBtn.querySelector("span");
                if (span) span.textContent = "SUNDAY LOCK 🔒";
                if (el.sundayLockOverlay) el.sundayLockOverlay.classList.remove('hidden');
            } else if (coreData.lastClaim > 0 && (now() - coreData.lastClaim < DAY_MS)) {
                // Still in 24-hour cooldown
                el.claimBtn.disabled = true;
                const span = el.claimBtn.querySelector("span");
                if (span) span.textContent = txt.wait;
                if (el.sundayLockOverlay) el.sundayLockOverlay.classList.add('hidden');
            } else {
                // Ready to claim
                el.claimBtn.disabled = false;
                const span = el.claimBtn.querySelector("span");
                if (span) span.textContent = txt.claim;
                if (el.sundayLockOverlay) el.sundayLockOverlay.classList.add('hidden');
            }
        }
        
        // Update market asset display based on current day
        const currentDayAsset = getAssetByDay();
        updateAssetDisplay(currentDayAsset);
        
        // Restart market chart with Sunday logic
        stopMarketChart();
        startMarketChart();
    }
    
    // =========================================================
    // MARKET CHART (Sunday Logic)
    // =========================================================
    let chartAnimFrame;
    function startMarketChart() {
        const canvas = el.marketChartCanvas;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        
        const points = 50;
        let dataPoints;
        let isMarketClosed = isSunday();
        
        if (isMarketClosed) {
            // SUNDAY: Perfectly flat horizontal line at 0.5 (middle of canvas)
            const flatY = height * 0.5;
            dataPoints = Array(points).fill(flatY);
        } else {
            dataPoints = Array(points).fill(0).map(() => Math.random() * 0.6 + 0.2);
        }
        
        let phaseOffset = 0;
        
        function animate() {
            const currentIsSunday = isSunday();
            ctx.clearRect(0, 0, width, height);
            
            if (!currentIsSunday) {
                dataPoints.shift();
                const lastPoint = dataPoints[dataPoints.length - 1];
                const variation = (Math.random() - 0.5) * 0.1;
                const newPoint = Math.max(0.1, Math.min(0.9, lastPoint + variation));
                dataPoints.push(newPoint);
            } else {
                // SUNDAY: Perfectly flat horizontal line at 0.5 (middle of canvas)
                const flatY = height * 0.5;
                dataPoints = Array(points).fill(flatY);
            }
            
            ctx.beginPath();
            for (let i = 0; i < points; i++) {
                const x = (i / (points - 1)) * width;
                const y = currentIsSunday ? dataPoints[i] : (height - (dataPoints[i] * height));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            
            if (currentIsSunday) {
                // SUNDAY: Perfectly flat golden dashed line at 0.5 height
                ctx.setLineDash([8, 4]);
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.lineWidth = 2.5;
                ctx.shadowBlur = 8;
                ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                const currentAsset = getAssetByDay();
                const assetColor = currentAsset ? currentAsset.color : '#00ff88';
                const pulseIntensity = 0.8 + Math.sin(phaseOffset) * 0.2;
                ctx.strokeStyle = assetColor;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 15 * pulseIntensity;
                ctx.shadowColor = assetColor;
                ctx.stroke();
            }
            
            if (!currentIsSunday) {
                ctx.shadowBlur = 0;
                const scanX = (Math.sin(phaseOffset * 0.5) * 0.5 + 0.5) * width;
                const scanIndex = Math.floor((scanX / width) * (points - 1));
                const scanY = height - (dataPoints[scanIndex] * height);
                ctx.beginPath();
                ctx.arc(scanX, scanY, 3, 0, Math.PI * 2);
                const currentAsset = getAssetByDay();
                ctx.fillStyle = currentAsset ? currentAsset.color : '#00ff88';
                ctx.shadowBlur = 10;
                ctx.shadowColor = currentAsset ? currentAsset.color : '#00ff88';
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            
            phaseOffset += 0.05;
            chartAnimFrame = requestAnimationFrame(animate);
        }
        
        animate();
    }
    
    function stopMarketChart() {
        if (chartAnimFrame) cancelAnimationFrame(chartAnimFrame);
    }
    
    // =========================================================
    // HAPTIC FEEDBACK & EXPERIENCE EFFECTS
    // =========================================================
    
    /**
     * Trigger haptic vibration pattern
     * @param {Array<number>} pattern - Vibration pattern [duration, pause, duration, ...]
     */
    function triggerHaptic(pattern) {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                console.warn('Haptic feedback not supported');
            }
        }
    }
    
    /**
     * Success burst effect (claim success)
     */
    function triggerSuccessBurst() {
        // Haptic: [50, 30, 50]
        triggerHaptic([50, 30, 50]);
        
        // Visual burst
        const burst = document.createElement('div');
        burst.className = 'success-burst';
        burst.innerHTML = '<div class="burst-content">✨ CLAIM SUCCESS! ✨</div>';
        document.body.appendChild(burst);
        
        setTimeout(() => {
            burst.classList.add('fade-out');
            setTimeout(() => burst.remove(), 500);
        }, 2000);
    }
    
    /**
     * Burn shake effect
     */
    function triggerBurnShake() {
        // Haptic: [100, 50, 100]
        triggerHaptic([100, 50, 100]);
        
        // Visual shake
        const app = document.querySelector('.app');
        if (app) {
            app.classList.add('burn-shake');
            setTimeout(() => {
                app.classList.remove('burn-shake');
            }, 600);
        }
        
        // Burn notification
        const burnNotif = document.createElement('div');
        burnNotif.className = 'burn-notification';
        burnNotif.innerHTML = '<div class="burn-content">⚠️ BURN EVENT: Missed claim penalty applied</div>';
        document.body.appendChild(burnNotif);
        
        setTimeout(() => {
            burnNotif.classList.add('fade-out');
            setTimeout(() => burnNotif.remove(), 500);
        }, 3000);
    }
    
    /**
     * Shield protection relief effect
     */
    function triggerShieldRelief() {
        // Relief glow effect
        const shieldBtn = document.getElementById('insuranceBtn');
        if (shieldBtn) {
            shieldBtn.style.animation = 'shieldReliefGlow 2s ease';
            setTimeout(() => {
                shieldBtn.style.animation = '';
            }, 2000);
        }
    }
    
    // =========================================================
    // BEHAVIORAL EXPERIENCE LAYER - TEMPORAL LOGIC
    // =========================================================
    
    /**
     * Get current time context for behavioral triggers
     */
    function getTimeContext() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();
        const minutes = now.getMinutes();
        
        return {
            hour: hour,
            day: day,
            minutes: minutes,
            isMorning: hour >= 6 && hour < 10,
            isEvening: hour >= 20,
            isSaturday: day === 6,
            isSaturdayEvening: day === 6 && hour >= 20 && hour < 23,
            isSunday: day === 0
        };
    }
    
    /**
     * Update streak counter based on daily claims
     */
    function updateStreak() {
        const now = Date.now();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMs = today.getTime();
        
        const lastStreakDate = state.lastStreakDate || 0;
        const lastStreakDay = new Date(lastStreakDate);
        lastStreakDay.setHours(0, 0, 0, 0);
        const lastStreakDayMs = lastStreakDay.getTime();
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayMs = yesterday.getTime();
        
        if (lastStreakDayMs === todayMs) {
            // Already claimed today, streak continues
            return;
        } else if (lastStreakDayMs === yesterdayMs) {
            // Claimed yesterday, increment streak
            state.streakDays += 1;
            state.lastStreakDate = now;
            saveState();
            
            // Check for milestone
            if (state.streakDays === 7 && !state.milestones.sevenDayStreak) {
                triggerMilestone('sevenDayStreak');
            }
        } else if (lastStreakDayMs < yesterdayMs) {
            // Streak broken, reset
            state.streakDays = 1;
            state.lastStreakDate = now;
            saveState();
        }
    }
    
    /**
     * Get animation delay multiplier based on streak
     * Fast-track consistent users (>7 days) by 30%
     */
    function getAnimationSpeed() {
        return state.streakDays >= 7 ? 0.7 : 1.0;
    }
    
    /**
     * Trigger milestone celebration
     */
    function triggerMilestone(type) {
        state.milestones[type] = true;
        saveState();
        
        let message = '';
        let icon = '🎉';
        
        switch(type) {
            case 'firstClaim':
                message = '🎊 First Claim Complete! Welcome to NexCareer!';
                icon = '🌟';
                break;
            case 'sevenDayStreak':
                message = '🔥 7-Day Streak! You\'re on fire!';
                icon = '🔥';
                break;
            case 'hundredDollars':
                message = '💰 $100 Milestone Reached! Keep it up!';
                icon = '💎';
                break;
        }
        
        if (message) {
            showToast(message, 'success');
            
            // Add visual celebration
            const celebration = document.createElement('div');
            celebration.className = 'milestone-celebration';
            celebration.innerHTML = `<div class="celebration-content">${icon} ${message}</div>`;
            document.body.appendChild(celebration);
            
            setTimeout(() => {
                celebration.classList.add('fade-out');
                setTimeout(() => celebration.remove(), 500);
            }, 3000);
        }
    }
    
    /**
     * Check and trigger milestones based on current state
     */
    function checkMilestones() {
        // First claim milestone
        if (coreData.totalEarned > 0 && !state.milestones.firstClaim) {
            triggerMilestone('firstClaim');
        }
        
        // $100 milestone
        if (coreData.totalEarned >= 100 && !state.milestones.hundredDollars) {
            triggerMilestone('hundredDollars');
        }
    }
    
    /**
     * Saturday Pre-Notification Banner
     */
    function showSaturdayPreNotification() {
        const timeCtx = getTimeContext();
        if (!timeCtx.isSaturdayEvening) return;
        
        const banner = document.getElementById('saturdayPreNotification');
        if (banner) {
            banner.classList.remove('hidden');
        }
    }
    
    /**
     * Auto-scroll to claim button during morning ritual
     */
    function performMorningRitual() {
        const timeCtx = getTimeContext();
        if (!timeCtx.isMorning) return;
        
        const diff = DAY_MS - (now() - coreData.lastClaim);
        if (diff <= 0 && el.claimBtn && !el.claimBtn.disabled) {
            // Auto-scroll to claim button
            const claimContainer = document.querySelector('.claim-btn-container');
            if (claimContainer) {
                claimContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
    
    /**
     * Add urgency badge to home tab during evening urgency
     */
    function updateEveningUrgencyBadges() {
        const timeCtx = getTimeContext();
        const diff = DAY_MS - (now() - coreData.lastClaim);
        const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
        
        const homeTab = document.querySelector('.nav-item[data-tab="home"]');
        if (timeCtx.isEvening && hoursRemaining < 4 && hoursRemaining > 0 && !isSunday()) {
            if (homeTab && !homeTab.querySelector('.urgency-badge')) {
                const badge = document.createElement('span');
                badge.className = 'urgency-badge';
                badge.textContent = '!';
                homeTab.appendChild(badge);
            }
        } else {
            const badge = homeTab?.querySelector('.urgency-badge');
            if (badge) badge.remove();
        }
    }
    
    // =========================================================
    // COUNTDOWN & HISTORY (With Enhanced Behavioral Intelligence)
    // =========================================================
    function startCountdown() {
        setInterval(() => {
            const txt = T();
            const timeCtx = getTimeContext();
            
            if (isSunday()) {
                if (el.countdownDisplay) {
                    el.countdownDisplay.textContent = txt.locked;
                    el.countdownDisplay.className = "countdown-text locked";
                }
                return;
            }
            
            const diff = DAY_MS - (now() - coreData.lastClaim);
            const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
            
            if (diff <= 0) {
                if (el.countdownDisplay) {
                    el.countdownDisplay.textContent = txt.ready;
                    el.countdownDisplay.className = "countdown-text ready";
                }
                
                // MORNING RITUAL (6:00-10:00): Pulse claim button + auto-scroll
                if (timeCtx.isMorning) {
                    const claimContainer = document.querySelector('.claim-btn-container');
                    if (claimContainer && !claimContainer.classList.contains('morning-pulse')) {
                        claimContainer.classList.add('morning-pulse');
                    }
                    // Auto-scroll once per session
                    const morningScrollDone = sessionStorage.getItem('morningScrollDone');
                    if (!morningScrollDone) {
                        performMorningRitual();
                        sessionStorage.setItem('morningScrollDone', 'true');
                    }
                } else {
                    const claimContainer = document.querySelector('.claim-btn-container');
                    if (claimContainer) {
                        claimContainer.classList.remove('morning-pulse');
                    }
                }
            } else {
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                
                // EVENING URGENCY (>20:00): Red + blinking if < 4h + tab badge
                if (timeCtx.isEvening && hoursRemaining < 4 && hoursRemaining > 0) {
                    if (el.countdownDisplay) {
                        el.countdownDisplay.textContent = `${h}h ${m}m ${s}s`;
                        el.countdownDisplay.className = "countdown-text urgent";
                    }
                    updateEveningUrgencyBadges();
                } else {
                    if (el.countdownDisplay) {
                        el.countdownDisplay.textContent = `${h}h ${m}m ${s}s`;
                        el.countdownDisplay.className = "countdown-text wait";
                    }
                    updateEveningUrgencyBadges();
                }
                
                // Remove morning pulse if not ready
                const claimContainer = document.querySelector('.claim-btn-container');
                if (claimContainer) {
                    claimContainer.classList.remove('morning-pulse');
                }
            }
            
            // Saturday Pre-Notification
            if (timeCtx.isSaturdayEvening) {
                showSaturdayPreNotification();
            }
        }, 1000);
    }
    
    function getHistory() { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
    
    function addHistory(amount) {
        const list = getHistory();
        const entry = {
            date: now(),
            amount: amount,
            tx: "0x" + Array.from({length: 20}, () => "0123456789abcdef"[Math.floor(Math.random()*16)]).join("") + "..."
        };
        list.unshift(entry);
        if(list.length > 50) list.pop();
        localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
        renderHistory();
    }
    
    function renderHistory() {
        const list = getHistory();
        const txt = T();
        if (!el.historyList) return;
        el.historyList.innerHTML = "";
        
        if(list.length === 0) {
            el.historyList.innerHTML = `<div class="empty-state">${txt.emptyHist}</div>`;
            return;
        }
        
        list.forEach(item => {
            const d = new Date(item.date).toLocaleString();
            const card = document.createElement("div");
            card.className = "history-card";
            card.innerHTML = `
                <div class="h-info"><h4>${txt.histClaimTitle}</h4><small>${d}</small><span class="tx-hash">${item.tx}</span></div>
                <div class="h-amount">+$${item.amount.toFixed(2)}</div>
            `;
            el.historyList.appendChild(card);
        });
    }
    
    // =========================================================
    // CLAIM LOGIC (Connected to Career Contract Engine)
    // =========================================================
    if (el.claimBtn) {
        el.claimBtn.onclick = () => {
            if (el.claimBtn.disabled || !isLeader) return;
            const txt = T();
            
            // SUNDAY LAW: Cannot claim on Sunday
            if (isSunday()) {
                showToast(txt.toastErrSun, 'error');
                return;
            }
            
            // Check 24-hour cooldown
            if (coreData.lastClaim > 0 && (now() - coreData.lastClaim < DAY_MS)) {
                showToast(txt.toastErrCool, 'error');
                return;
            }
            
            // Set critical action in progress
            setCriticalActionInProgress(true);
            
            // OPTIMISTIC UI: Immediate visual feedback
            el.claimBtn.disabled = true;
            const span = el.claimBtn.querySelector("span");
            if (span) span.textContent = "PROCESSING...";
            
            // Start claim process - Show Cinematic Overlay
            state.isClaiming = true;
            state.claimStartTime = now();
            saveState();
            resumeClaim();
        };
    }
    
    function resumeClaim() {
        // Show Cinematic Claim Overlay
        const claimOverlayEl = document.getElementById('claimOverlay');
        if (claimOverlayEl) {
            claimOverlayEl.classList.remove("hidden");
        }
        if (el.claimOverlay) {
            el.claimOverlay.classList.remove("hidden");
        }
        if (!claimOverlayEl && !el.claimOverlay) {
            console.warn("Claim overlay not found");
            return;
        }
        const circumference = 515;
        const phases = T().phases;
        startLiveGraph();
        
        const tick = setInterval(() => {
            const elapsed = Math.floor((now() - state.claimStartTime) / 1000);
            const timeLeft = CLAIM_PROCESS_TIME - elapsed;
            if (el.timer) el.timer.textContent = timeLeft > 0 ? timeLeft : 0;
            if (el.progressRing) {
                const offset = circumference * (1 - (timeLeft / CLAIM_PROCESS_TIME));
                el.progressRing.style.strokeDashoffset = -offset;
            }
            if (el.phaseText) {
                const phaseIndex = Math.min(3, Math.floor(elapsed / 15));
                el.phaseText.textContent = phases[phaseIndex];
            }
            if (timeLeft <= 0) {
                clearInterval(tick);
                finishClaim();
            }
        }, 1000);
    }
    
    // =========================================================
    // LIVE GRAPH ANIMATION
    // =========================================================
    let graphAnimFrame;
    function startLiveGraph() {
        const canvas = el.liveGraphCanvas;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
        
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        const points = 60;
        let dataPoints = Array(points).fill(0).map(() => Math.random() * 0.5 + 0.3);
        
        function animate() {
            dataPoints.shift();
            dataPoints.push(Math.random() * 0.5 + 0.3);
            ctx.clearRect(0, 0, width, height);
            
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(0, 255, 136, 0.4)');
            gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
            
            ctx.beginPath();
            ctx.moveTo(0, height);
            for (let i = 0; i < points; i++) {
                const x = (i / (points - 1)) * width;
                const y = height - (dataPoints[i] * height);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(0, height - (dataPoints[0] * height));
            for (let i = 1; i < points; i++) {
                const x = (i / (points - 1)) * width;
                const y = height - (dataPoints[i] * height);
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ff88';
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            graphAnimFrame = requestAnimationFrame(animate);
        }
        animate();
    }
    
    function stopLiveGraph() {
        if (graphAnimFrame) cancelAnimationFrame(graphAnimFrame);
    }
    
    /**
     * Finish claim process - adds profit to balance
     */
    function finishClaim() {
        // Validate claim conditions
        if (!state.isClaiming || !isLeader || isSunday() || 
            (coreData.lastClaim > 0 && (now() - coreData.lastClaim < DAY_MS))) {
            console.error("Claim blocked");
            setCriticalActionInProgress(false);
            return;
        }
        
        stopLiveGraph();
        const claimOverlayEl = document.getElementById('claimOverlay');
        if (claimOverlayEl) claimOverlayEl.classList.add("hidden");
        if (el.claimOverlay) el.claimOverlay.classList.add("hidden");
        
        // Process claim using Career Contract Engine
        const success = processClaim();
        
        if (success) {
            const dailyProfit = calculateTotalDailyProfit();
            addHistory(dailyProfit);
            showToast(T().toastSuccess, 'success');
            
            // Experience Effect: Success Burst
            triggerSuccessBurst();
            
            // Context-aware navigation: Suggest Wallet tab after claim
            setTimeout(() => {
                const suggestedTab = getSuggestedTab();
                if (suggestedTab === 'wallet') {
                    // Subtle hint (optional auto-switch after 2 seconds)
                    // switchTab('wallet');
                }
            }, 2000);
        }
        
        // Reset claim state
        state.isClaiming = false;
        state.claimStartTime = 0;
        setCriticalActionInProgress(false);
        saveState();
        
        // Update UI
        updateUI();
    }
    
    // =========================================================
    // MARKET SIMULATION
    // =========================================================
    const CRYPTO_ASSETS = [
        { symbol: 'BTC', name: 'Bitcoin', basePrice: 45000, icon: 'fa-brands fa-bitcoin', color: '#f7931a' },
        { symbol: 'ETH', name: 'Ethereum', basePrice: 2800, icon: 'fa-brands fa-ethereum', color: '#627eea' },
        { symbol: 'SOL', name: 'Solana', basePrice: 120, icon: 'fa-solid fa-coins', color: '#14f195' },
        { symbol: 'BNB', name: 'Binance Coin', basePrice: 350, icon: 'fa-solid fa-coins', color: '#f0b90b' },
        { symbol: 'XRP', name: 'Ripple', basePrice: 0.65, icon: 'fa-solid fa-coins', color: '#23292f' },
        { symbol: 'ADA', name: 'Cardano', basePrice: 0.55, icon: 'fa-solid fa-coins', color: '#0033ad' }
    ];
    
    let currentAsset = null;
    let marketPrice = 0;
    let marketLastPrice = 0;
    
    function getAssetByDay() {
        const dayIndex = new Date().getDay();
        const assetIndex = dayIndex === 0 ? 5 : (dayIndex - 1) % CRYPTO_ASSETS.length;
        return CRYPTO_ASSETS[assetIndex];
    }
    
    function updateAssetDisplay(asset) {
        if (!asset) return;
        
        if (el.coinNameDisplay) {
            el.coinNameDisplay.textContent = `${asset.symbol} / USD`;
        }
        if (el.coinName && el.coinName !== el.coinNameDisplay) {
            el.coinName.textContent = `${asset.symbol} / USD`;
        }
        
        if (el.coinIcon) {
            const iconElement = el.coinIcon.querySelector('i');
            if (iconElement) {
                iconElement.className = asset.icon;
                iconElement.style.color = asset.color || '#000';
                iconElement.style.fontSize = '20px';
            }
        }
    }
    
    function startMarketSimulation() {
        currentAsset = getAssetByDay();
        marketPrice = currentAsset.basePrice;
        marketLastPrice = marketPrice;
        updateAssetDisplay(currentAsset);
        
        setInterval(() => {
            const today = new Date().getDay();
            const isSunday = today === 0;
            
            // SUNDAY LOGIC: MARKET CLOSED - FLATLINE
            if (isSunday) {
                if (el.marketPrice) {
                    el.marketPrice.textContent = "FROZEN";
                    el.marketPrice.style.color = "#888";
                }
                if (el.bnbPrice) {
                    el.bnbPrice.textContent = "FROZEN";
                    el.bnbPrice.style.color = "#888";
                }
                if (el.bnbChange) {
                    el.bnbChange.textContent = "0.00%";
                    el.bnbChange.className = "change";
                    el.bnbChange.style.color = "#888";
                }
                if (el.coinNameDisplay) {
                    el.coinNameDisplay.textContent = "MARKET CLOSED";
                }
                return;
            }
            
            // WEEKDAY LOGIC: Dynamic Asset Rotation & Realistic Price Movement
            const newAsset = getAssetByDay();
            if (newAsset.symbol !== currentAsset.symbol) {
                currentAsset = newAsset;
                marketPrice = currentAsset.basePrice;
                marketLastPrice = marketPrice;
                updateAssetDisplay(currentAsset);
            }
            
            marketLastPrice = marketPrice;
            
            const volatility = currentAsset.symbol === 'BTC' ? 0.02 : 
                              currentAsset.symbol === 'ETH' ? 0.015 :
                              currentAsset.symbol === 'SOL' ? 0.025 :
                              currentAsset.symbol === 'BNB' ? 0.01 :
                              currentAsset.symbol === 'XRP' ? 0.01 : 0.008;
            
            const randomFactor = (Math.random() - 0.5) * 2;
            const priceChange = marketPrice * volatility * randomFactor;
            marketPrice += priceChange;
            
            if (marketPrice < 0.01) marketPrice = 0.01;
            
            const percentChange = ((marketPrice - marketLastPrice) / marketLastPrice) * 100;
            const percentDisplay = Math.abs(percentChange).toFixed(2);
            
            if (el.marketPrice) {
                el.marketPrice.textContent = marketPrice.toFixed(2);
            }
            if (el.bnbPrice && el.bnbPrice !== el.marketPrice) {
                el.bnbPrice.textContent = marketPrice.toFixed(2);
            }
            
            if (el.bnbChange) {
                const sign = percentChange >= 0 ? '+' : '';
                el.bnbChange.textContent = `${sign}${percentDisplay}%`;
                
                if (percentChange > 0) {
                    el.bnbChange.className = "change up";
                    if (el.marketPrice) el.marketPrice.style.color = "#00ff88";
                    if (el.bnbPrice) el.bnbPrice.style.color = "#00ff88";
                    el.bnbChange.style.color = "#00ff88";
                } else if (percentChange < 0) {
                    el.bnbChange.className = "change down";
                    if (el.marketPrice) el.marketPrice.style.color = "#ff4444";
                    if (el.bnbPrice) el.bnbPrice.style.color = "#ff4444";
                    el.bnbChange.style.color = "#ff4444";
                } else {
                    el.bnbChange.className = "change";
                    if (el.marketPrice) el.marketPrice.style.color = "#fff";
                    if (el.bnbPrice) el.bnbPrice.style.color = "#fff";
                    el.bnbChange.style.color = "#fff";
                }
            }
        }, 3000);
    }
    
    // =========================================================
    // ACTIVITY FEED
    // =========================================================
    function startActivityFeed() {
        let activityTimer;
        
        function generateActivity() {
            if (document.hidden) return;
            
            const activities = [
                { type: "contract", icon: "fa-file-contract" },
                { type: "deposit", icon: "fa-coins" },
                { type: "activate", icon: "fa-check-circle" }
            ];
            
            const activity = activities[Math.floor(Math.random() * activities.length)];
            const amount = (Math.random() * 9.5 + 0.5).toFixed(2);
            const wallet = `0x${Math.random().toString(16).substr(2, 2).toUpperCase()}...${Math.random().toString(16).substr(2, 2).toUpperCase()}`;
            
            let message = '';
            if (activity.type === 'contract') {
                message = `User <strong>${wallet}</strong> started a contract (<span class="activity-amount">${amount} USDT</span>)`;
            } else if (activity.type === 'deposit') {
                message = `New Deposit: <span class="activity-amount">${amount} USDT</span>`;
            } else {
                message = `Contract Activated: <span class="activity-amount">${amount} USDT</span>`;
            }
            
            showActivityNotification(activity.icon, message);
            
            const nextInterval = Math.random() * 30000 + 15000;
            activityTimer = setTimeout(generateActivity, nextInterval);
        }
        
        function showActivityNotification(icon, message) {
            if (!el.activityFeed) return;
            const notification = document.createElement('div');
            notification.className = 'activity-notification';
            notification.innerHTML = `
                <div class="activity-icon"><i class="fa-solid ${icon}"></i></div>
                <div class="activity-text">${message}</div>
            `;
            
            el.activityFeed.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 500);
            }, 5000);
        }
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearTimeout(activityTimer);
            } else {
                const resumeDelay = Math.random() * 30000 + 15000;
                activityTimer = setTimeout(generateActivity, resumeDelay);
            }
        });
        
        const initialDelay = Math.random() * 20000 + 10000;
        activityTimer = setTimeout(generateActivity, initialDelay);
    }
    
    // =========================================================
    // SHIELD TASK 30% RNG LOGIC
    // =========================================================
    /**
     * Initialize Shield Task RNG (30% chance if user has 0 shields)
     */
    function initShieldTaskRNG() {
        // Check if user already has shield
        if (localStorage.getItem('hasShield') === 'true') {
            state.hasShield = true;
            saveState();
            const shieldContainer = document.getElementById('shieldTaskContainer');
            if (shieldContainer) {
                shieldContainer.style.display = 'none';
            }
            if (el.uploadTaskBtn) {
                el.uploadTaskBtn.disabled = true;
                el.uploadTaskBtn.style.display = 'none';
            }
            if (el.insuranceBtn) {
                el.insuranceBtn.style.color = '#FFD700';
                el.insuranceBtn.style.textShadow = '0 0 15px #FFD700';
            }
            return;
        }
        
        // SHIELD RNG: 30% chance to show button
        const isLucky = Math.random() < 0.30;
        
        const shieldContainer = document.getElementById('shieldTaskContainer');
        if (shieldContainer) {
            if (isLucky) {
                shieldContainer.style.display = 'block';
                if (el.uploadTaskBtn) {
                    el.uploadTaskBtn.style.display = 'block';
                    if (el.uploadTaskText) {
                        el.uploadTaskText.innerHTML = '📸 Upload Task <span style="color: #FFD700; font-size: 10px; margin-left: 5px;">✨ Special Offer</span>';
                    }
                    el.uploadTaskBtn.disabled = false;
                }
            } else {
                shieldContainer.style.display = 'none';
                if (el.uploadTaskBtn) {
                    el.uploadTaskBtn.style.display = 'none';
                }
            }
        }
    }
    
    function checkAndApplyShieldStatus() {
        const adminApprovedShield = localStorage.getItem('hasShield');
        const hadShieldBefore = state.hasShield;
        
        if (adminApprovedShield === 'true') {
            state.hasShield = true;
            saveState();
            
            // Trigger shield protection modal if shield was just activated
            if (!hadShieldBefore && state.hasShield) {
                sessionStorage.setItem('shieldSaved', 'true');
                triggerShieldRelief();
            }
            
            if (el.insuranceBtn) {
                el.insuranceBtn.classList.add('active');
                el.insuranceBtn.style.color = '#FFD700';
                el.insuranceBtn.style.textShadow = '0 0 15px #FFD700';
                el.insuranceBtn.style.animation = 'shieldGlow 2s infinite';
            }
            
            if (el.uploadTaskBtn) {
                el.uploadTaskBtn.disabled = true;
                el.uploadTaskBtn.style.background = 'linear-gradient(45deg, #FFD700, #DAA520)';
                el.uploadTaskBtn.style.color = '#000';
                el.uploadTaskBtn.style.border = '2px solid #FFD700';
                el.uploadTaskBtn.style.cursor = 'not-allowed';
                if (el.uploadTaskText) {
                    el.uploadTaskText.textContent = 'Shield Active 🛡️';
                }
            }
        } else {
            if (el.insuranceBtn) {
                el.insuranceBtn.classList.remove('active');
                el.insuranceBtn.style.color = '#888';
                el.insuranceBtn.style.textShadow = 'none';
                el.insuranceBtn.style.animation = '';
            }
            if (el.uploadTaskBtn && !state.hasShield) {
                const wasShown = el.uploadTaskBtn.style.display !== 'none';
                if (wasShown) {
                    el.uploadTaskBtn.disabled = false;
                    el.uploadTaskBtn.style.background = '';
                    el.uploadTaskBtn.style.color = '';
                    el.uploadTaskBtn.style.border = '';
                    el.uploadTaskBtn.style.cursor = '';
                    if (el.uploadTaskText) {
                        el.uploadTaskText.innerHTML = '📸 Upload Task <span style="color: #FFD700; font-size: 10px; margin-left: 5px;">✨ Special Offer</span>';
                    }
                }
            }
        }
    }
    
    // =========================================================
    // CAMERA UPLOAD SIMULATION
    // =========================================================
    function simulateUpload(btn) {
        if (!btn) btn = el.uploadTaskBtn;
        if (!btn) return;
        
        if (state.hasShield || localStorage.getItem('hasShield') === 'true') {
            showToast('You already have a shield! Max 1 per user.', 'error');
            return;
        }
        
        // Show upload modal
        if (el.uploadModal) {
            el.uploadModal.classList.remove('hidden');
        }
        
        const btnText = el.uploadTaskText || btn.querySelector('#uploadTaskText') || btn.querySelector('span');
        if (!btnText) return;
        
        btn.disabled = true;
        
        // Step 1: Camera
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        const step3 = document.getElementById('step3');
        const step4 = document.getElementById('step4');
        const progressFill = document.getElementById('uploadProgressFill');
        const statusText = document.getElementById('uploadStatusText');
        
        if (step1) step1.classList.add('active');
        if (statusText) statusText.textContent = 'Connecting to Camera...';
        if (progressFill) progressFill.style.width = '25%';
        
        setTimeout(() => {
            // Step 2: Scanning
            if (step1) step1.classList.remove('active');
            if (step1) step1.classList.add('completed');
            if (step2) step2.classList.add('active');
            if (statusText) statusText.textContent = 'Scanning Receipt...';
            if (progressFill) progressFill.style.width = '50%';
            
            setTimeout(() => {
                // Step 3: Uploading
                if (step2) step2.classList.remove('active');
                if (step2) step2.classList.add('completed');
                if (step3) step3.classList.add('active');
                if (statusText) statusText.textContent = 'Uploading...';
                if (progressFill) progressFill.style.width = '75%';
                
                setTimeout(() => {
                    // Step 4: Sent to Admin
                    if (step3) step3.classList.remove('active');
                    if (step3) step3.classList.add('completed');
                    if (step4) step4.classList.add('completed');
                    if (statusText) statusText.textContent = '✅ Sent to Admin for Review';
                    if (progressFill) progressFill.style.width = '100%';
                    
                    state.taskSubmitted = true;
                    saveState();
                    
                    const pendingTasks = JSON.parse(localStorage.getItem('gd_pending_tasks') || '[]');
                    pendingTasks.push({
                        userId: `User_${state.refCode}`,
                        timestamp: Date.now(),
                        screenshot: 'placeholder'
                    });
                    localStorage.setItem('gd_pending_tasks', JSON.stringify(pendingTasks));
                    
                    setTimeout(() => {
                        if (el.uploadModal) el.uploadModal.classList.add('hidden');
                        showToast('Screenshot submitted! Awaiting admin approval...', 'success');
                    }, 1500);
                }, 1000);
            }, 1000);
        }, 1000);
    }
    
    window.simulateUpload = simulateUpload;
    
    // =========================================================
    // WALLET CONNECT SIMULATION
    // =========================================================
    function initWalletConnection() {
        const walletConnected = localStorage.getItem('walletConnected');
        const walletAddress = localStorage.getItem('gd_wallet_address');
        if (walletConnected === 'true' && walletAddress) {
            const maskedAddress = walletAddress.slice(0, 4) + '...' + walletAddress.slice(-2);
            updateWalletUI(maskedAddress);
        }
    }
    
    function connectWallet() {
        if (!el.walletConnectBtn || !el.walletConnectText) return;
        
        if (localStorage.getItem('walletConnected') === 'true') {
            if (confirm('Disconnect wallet?')) {
                localStorage.removeItem('gd_wallet_address');
                localStorage.removeItem('walletConnected');
                el.walletConnectBtn.classList.remove('connected');
                el.walletConnectText.textContent = 'Connect Wallet';
                el.walletConnectText.style.color = '';
                showToast('Wallet Disconnected', 'error');
            }
            return;
        }
        
        el.walletConnectBtn.disabled = true;
        el.walletConnectText.textContent = 'Connecting...';
        el.walletConnectBtn.style.opacity = '0.7';
        
        setTimeout(() => {
            const address = '0x' + Array.from({length: 40}, () => 
                '0123456789abcdef'[Math.floor(Math.random() * 16)]
            ).join('');
            const maskedAddress = address.slice(0, 4) + '...' + address.slice(-2);
            
            localStorage.setItem('gd_wallet_address', address);
            localStorage.setItem('walletConnected', 'true');
            
            el.walletConnectBtn.classList.add('connected');
            el.walletConnectText.textContent = maskedAddress;
            el.walletConnectText.style.color = '#00ff88';
            el.walletConnectBtn.disabled = false;
            el.walletConnectBtn.style.opacity = '1';
            
            showToast('Wallet Connected Successfully', 'success');
        }, 1500);
    }
    
    function updateWalletUI(maskedAddress) {
        if (!el.walletConnectBtn || !el.walletConnectText) return;
        el.walletConnectBtn.classList.add('connected');
        el.walletConnectText.textContent = maskedAddress;
        el.walletConnectText.style.color = '#00ff88';
        el.walletConnectBtn.disabled = false;
        el.walletConnectBtn.style.opacity = '1';
    }
    
    // =========================================================
    // CAREER CONTRACTS - SELECT PLAN FUNCTION
    // =========================================================
    function selectPlan(amount, tierName, isLocked) {
        const today = new Date().getDay();
        if (today === 0) {
            showToast('⛔ Market closed on Sundays. Please try again tomorrow.', 'error');
            return;
        }
        
        if (isLocked === true) {
            showToast('⛔ This plan opens in Phase 2 (Day 30)', 'error');
            return;
        }
        
        if (el.depositModal) {
            el.depositModalTitle.textContent = `Activate ${tierName}`;
            el.depositAmount.textContent = `$${amount}`;
            el.depositTxid.value = '';
            el.depositModal.classList.remove('hidden');
        }
    }
    
    window.selectPlan = selectPlan;
    
    // =========================================================
    // DEPOSIT MODAL LOGIC
    // =========================================================
    function initDepositModal() {
        if (el.closeDepositBtn) {
            el.closeDepositBtn.onclick = () => {
                if (el.depositModal) el.depositModal.classList.add('hidden');
            };
        }
        
        if (el.depositModal) {
            el.depositModal.onclick = (e) => {
                if (e.target === el.depositModal) {
                    el.depositModal.classList.add('hidden');
                }
            };
        }
        
        if (el.copyWalletBtn) {
            el.copyWalletBtn.onclick = () => {
                const address = el.depositWalletAddress.textContent;
                navigator.clipboard.writeText(address).then(() => {
                    showToast('Wallet address copied!', 'success');
                });
            };
        }
        
        if (el.confirmDepositBtn) {
            el.confirmDepositBtn.onclick = () => {
                const txid = el.depositTxid.value.trim();
                if (!txid) {
                    showToast('Please enter a transaction hash (TXID)', 'error');
                    return;
                }
                
                // Set critical action
                setCriticalActionInProgress(true);
                
                // OPTIMISTIC UI: Disable button and show processing
                el.confirmDepositBtn.disabled = true;
                el.confirmDepositBtn.textContent = 'Processing...';
                
                const amountText = el.depositAmount.textContent;
                const amount = parseInt(amountText.replace('$', ''));
                const tierName = el.depositModalTitle.textContent.replace('Activate ', '');
                
                const userId = `User_${state.refCode || '123'}`;
                
                const pendingDeposits = JSON.parse(localStorage.getItem('pending_deposits') || '[]');
                
                pendingDeposits.push({
                    user: userId,
                    tier: tierName,
                    amount: amount,
                    txid: txid,
                    status: 'pending',
                    date: new Date().toISOString()
                });
                
                localStorage.setItem('pending_deposits', JSON.stringify(pendingDeposits));
                
                // Reset button
                setTimeout(() => {
                    el.confirmDepositBtn.disabled = false;
                    el.confirmDepositBtn.textContent = 'Confirm Payment';
                    setCriticalActionInProgress(false);
                }, 1000);
                
                el.depositModal.classList.add('hidden');
                showToast('⏳ Request Sent! Waiting for Admin Approval.', 'success');
            };
        }
    }
    
    // =========================================================
    // REFERRAL LOGIC
    // =========================================================
    function initReferralSection() {
        const referrals = parseInt(localStorage.getItem('referrals') || '0');
        if (el.referralCount) {
            el.referralCount.textContent = referrals;
        }
        
        if (el.copyReferralBtn) {
            el.copyReferralBtn.onclick = () => {
                const userId = `User_${state.refCode || '123'}`;
                const referralLink = `https://nexcareer.io/?ref=${userId}`;
                
                navigator.clipboard.writeText(referralLink).then(() => {
                    showToast('Referral link copied!', 'success');
                });
            };
        }
    }
    
    // =========================================================
    // UPDATE BALANCE FROM LOCALSTORAGE (ADMIN SYNC)
    // =========================================================
    function updateBalanceFromStorage() {
        const totalBalance = parseFloat(localStorage.getItem('totalBalance') || '0');
        
        if (totalBalance > 0 && totalBalance !== coreData.balance) {
            coreData.balance = totalBalance;
            saveCoreData();
        }
        
        // Update all balance displays (Unified IDs)
        if (el.balanceDisplay) {
            el.balanceDisplay.textContent = `$${coreData.balance.toFixed(2)}`;
        }
        if (el.balance) {
            el.balance.textContent = `$${coreData.balance.toFixed(2)}`;
        }
        if (el.walletPageBalance) {
            el.walletPageBalance.textContent = `$${coreData.balance.toFixed(2)}`;
        }
        if (el.totalProfit) {
            el.totalProfit.textContent = `$${coreData.totalEarned.toFixed(2)}`;
        }
    }
    
    // =========================================================
    // SMART DEFAULTS & NAVIGATION (Context-Aware)
    // =========================================================
    
    /**
     * Determine suggested tab based on user context
     */
    function getSuggestedTab() {
        // If no contracts active, suggest Invest
        if (coreData.activeContracts.length === 0) {
            return 'invest';
        }
        
        // If claim just completed, suggest Wallet
        const timeSinceClaim = now() - coreData.lastClaim;
        if (timeSinceClaim < 60000 && timeSinceClaim > 0) { // Within last minute
            return 'wallet';
        }
        
        // If claim is ready, suggest Home
        const diff = DAY_MS - (now() - coreData.lastClaim);
        if (diff <= 0 && !isSunday()) {
            return 'home';
        }
        
        // Default to current tab or home
        return 'home';
    }
    
    /**
     * Apply dynamic info prioritization using CSS order
     */
    function prioritizeUrgentActions() {
        const timeCtx = getTimeContext();
        const diff = DAY_MS - (now() - coreData.lastClaim);
        const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
        
        const claimContainer = document.querySelector('.claim-btn-container');
        const marketCard = document.querySelector('.market-card');
        const bottomStats = document.querySelector('.bottom-stats');
        
        if (claimContainer) {
            if (diff <= 0 && !isSunday()) {
                // Claim ready - prioritize it
                claimContainer.style.order = '-1';
            } else if (timeCtx.isEvening && hoursRemaining < 4 && hoursRemaining > 0) {
                // Evening urgency - prioritize claim
                claimContainer.style.order = '-1';
            } else {
                claimContainer.style.order = '0';
            }
        }
    }
    
    /**
     * Accidental Navigation Protection
     */
    let criticalActionInProgress = false;
    
    function setCriticalActionInProgress(value) {
        criticalActionInProgress = value;
        sessionStorage.setItem('criticalActionInProgress', value ? 'true' : 'false');
    }
    
    function checkCriticalAction() {
        const stored = sessionStorage.getItem('criticalActionInProgress');
        if (stored === 'true') {
            criticalActionInProgress = true;
        }
    }
    
    function protectNavigation(e) {
        if (criticalActionInProgress) {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('A critical action is in progress. Are you sure you want to leave?')) {
                setCriticalActionInProgress(false);
                return true;
            }
            return false;
        }
        return true;
    }
    
    // =========================================================
    // TAB SWITCHING SYSTEM (Enhanced with Context-Aware)
    // =========================================================
    function switchTab(tabName) {
        // Navigation protection
        if (criticalActionInProgress) {
            if (!confirm('A critical action is in progress. Switch tabs anyway?')) {
                return;
            }
            setCriticalActionInProgress(false);
        }
        
        const validTabs = ['home', 'invest', 'wallet', 'team'];
        if (!validTabs.includes(tabName)) {
            // Use context-aware suggestion
            tabName = getSuggestedTab();
        }
        
        const sections = ['home-section', 'invest-section', 'wallet-section', 'team-section'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'none';
            }
        });
        
        const selectedSection = document.getElementById(`${tabName}-section`);
        if (selectedSection) {
            selectedSection.style.display = 'block';
        }
        
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.tab === tabName) {
                item.classList.add('active');
            }
        });
        
        if (el.sidebar) {
            el.sidebar.classList.remove("open");
        }
        if (el.overlay) {
            el.overlay.classList.remove("active");
        }
        
        // Apply dynamic prioritization after tab switch
        setTimeout(() => {
            prioritizeUrgentActions();
        }, 100);
    }
    
    window.switchTab = switchTab;
    
    // =========================================================
    // INITIALIZE DEPOSIT/WITHDRAW BUTTONS
    // =========================================================
    function initWalletButtons() {
        const depositBtn = document.getElementById('depositBtn');
        const withdrawBtn = document.getElementById('withdrawBtn');
        
        if (depositBtn) {
            depositBtn.onclick = () => {
                switchTab('invest');
            };
        }
        
        if (withdrawBtn) {
            withdrawBtn.onclick = () => {
                showToast('Withdraw feature coming soon', 'info');
            };
        }
    }
    
    // =========================================================
    // INITIALIZATION
    // =========================================================
    function init() {
        initSession();
        history.pushState(null, null, location.href);
        window.onpopstate = () => history.pushState(null, null, location.href);
        
        // Session Resume Tracking
        const lastSession = sessionStorage.getItem('lastSessionTime');
        const now = Date.now();
        if (lastSession) {
            const timeSinceLastSession = now - parseInt(lastSession);
            if (timeSinceLastSession < 3600000) { // Within 1 hour
                state.sessionResumeCount = (state.sessionResumeCount || 0) + 1;
            }
        }
        sessionStorage.setItem('lastSessionTime', now.toString());
        state.lastSessionTime = now;
        saveState();
        
        // Check for critical action in progress
        checkCriticalAction();
        
        // Navigation protection
        window.addEventListener('beforeunload', (e) => {
            if (criticalActionInProgress) {
                e.preventDefault();
                e.returnValue = 'A critical action is in progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
        
        // Stale Claim Check
        if (state.isClaiming) {
            const elapsed = now() - state.claimStartTime;
            if (elapsed > (CLAIM_PROCESS_TIME * 1000 + 5000)) {
                state.isClaiming = false;
                state.claimStartTime = 0;
                setCriticalActionInProgress(false);
                saveState();
            } else {
                resumeClaim();
            }
        }
        
        // Update contracts on load
        updateContracts();
        
        // Process burn penalties on load
        const hadBurn = processBurnPenalties();
        if (hadBurn) {
            // Show empathetic reminder after 5 minutes
            setTimeout(() => {
                showEmpatheticReminder();
            }, 300000);
        }
        
        // Reset morning scroll flag at start of new day
        const lastReset = sessionStorage.getItem('morningScrollReset');
        const today = new Date().toDateString();
        if (lastReset !== today) {
            sessionStorage.removeItem('morningScrollDone');
            sessionStorage.setItem('morningScrollReset', today);
        }
        
        // Initialize shield task RNG
        initShieldTaskRNG();
        checkAndApplyShieldStatus();
        
        // Check if shield saved user (for relief modal)
        const shieldSaved = sessionStorage.getItem('shieldSaved');
        if (shieldSaved === 'true') {
            showShieldProtectionModal();
            sessionStorage.removeItem('shieldSaved');
        }
        
        setInterval(() => {
            checkAndApplyShieldStatus();
        }, 3000);
        
        initWalletConnection();
        
        // Check milestones
        checkMilestones();
        
        // Apply dynamic prioritization
        prioritizeUrgentActions();
        
        // Apply fast-track animations for consistent users
        const animationSpeed = getAnimationSpeed();
        if (animationSpeed < 1.0) {
            document.documentElement.style.setProperty('--base-duration', '1s');
            document.body.classList.add('fast-track');
        }
        
        updateUI();
        startCountdown();
        renderHistory();
        startMarketSimulation();
        startActivityFeed();
        
        // Periodic prioritization updates
        setInterval(() => {
            prioritizeUrgentActions();
            updateEveningUrgencyBadges();
        }, 5000);
        
        // Silent Onboarding: Show subtle hints for new users
        if (state.sessionResumeCount === 0 && coreData.activeContracts.length === 0) {
            setTimeout(() => {
                const hint = document.createElement('div');
                hint.className = 'onboarding-hint';
                hint.innerHTML = `
                    <div class="hint-content">
                        <i class="fa-solid fa-lightbulb"></i>
                        <span>Start by activating your first contract in the Invest tab</span>
                    </div>
                `;
                document.body.appendChild(hint);
                setTimeout(() => {
                    hint.classList.add('fade-out');
                    setTimeout(() => hint.remove(), 500);
                }, 5000);
            }, 3000);
        }
        
        // Event Listeners
        if (el.menuBtn) {
            el.menuBtn.onclick = () => {
                if (el.sidebar) el.sidebar.classList.toggle("open");
                if (el.overlay) el.overlay.classList.toggle("active");
            };
        }
        
        if (el.overlay) {
            el.overlay.onclick = () => {
                if (el.sidebar) el.sidebar.classList.remove("open");
                if (el.overlay) el.overlay.classList.remove("active");
            };
        }
        
        if (el.langFabBtn) {
            el.langFabBtn.onclick = (e) => {
                e.stopPropagation();
                if (el.langFabMenu) el.langFabMenu.classList.toggle('hidden');
            };
        }
        
        if (el.langFabOptions) {
            el.langFabOptions.forEach(btn => btn.onclick = (e) => {
                e.stopPropagation();
                state.lang = btn.dataset.lang;
                saveState();
                updateUI();
                renderHistory();
                if (el.langFabMenu) el.langFabMenu.classList.add('hidden');
            });
        }
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.lang-fab')) {
                if (el.langFabMenu) el.langFabMenu.classList.add('hidden');
            }
        });
        
        if (el.menuItems && el.menuItems.length > 0) {
            el.menuItems.forEach(item => {
                if (item.href && item.href.includes('admin.html')) {
                    return;
                }
                item.onclick = (e) => {
                    e.preventDefault();
                    if (el.sidebar) el.sidebar.classList.remove("open");
                    if (el.overlay) el.overlay.classList.remove("active");
                };
            });
        }
        
        if (el.startBtn) {
            el.startBtn.onclick = () => {
                state.introShown = true;
                saveState();
                
                // Hide welcome screen completely
                if (el.welcomeScreen) {
                    el.welcomeScreen.classList.add("hidden");
                    el.welcomeScreen.style.display = 'none';
                }
                
                // Show header and bottom nav
                const appHeader = document.querySelector('.app-header');
                if (appHeader) {
                    appHeader.style.display = 'flex';
                }
                const bottomNav = document.querySelector('.bottom-nav');
                if (bottomNav) {
                    bottomNav.style.display = 'flex';
                }
                
                // Switch to home tab
                if (typeof window.switchTab === 'function') {
                    window.switchTab('home');
                } else {
                    const homeSection = document.getElementById('home-section');
                    const investSection = document.getElementById('invest-section');
                    const walletSection = document.getElementById('wallet-section');
                    const teamSection = document.getElementById('team-section');
                    
                    if (homeSection) homeSection.style.display = 'block';
                    if (investSection) investSection.style.display = 'none';
                    if (walletSection) walletSection.style.display = 'none';
                    if (teamSection) teamSection.style.display = 'none';
                    
                    const navItems = document.querySelectorAll('.nav-item');
                    navItems.forEach(item => {
                        item.classList.remove('active');
                        if (item.dataset.tab === 'home') {
                            item.classList.add('active');
                        }
                    });
                }
            };
        }
        
        // Initialize welcome screen visibility
        if (!state.introShown) {
            if (el.welcomeScreen) {
                el.welcomeScreen.classList.remove("hidden");
                el.welcomeScreen.style.display = 'flex';
            }
            const appHeader = document.querySelector('.app-header');
            if (appHeader) {
                appHeader.style.display = 'none';
            }
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) {
                bottomNav.style.display = 'none';
            }
        } else {
            if (el.welcomeScreen) {
                el.welcomeScreen.classList.add("hidden");
                el.welcomeScreen.style.display = 'none';
            }
            const appHeader = document.querySelector('.app-header');
            if (appHeader) {
                appHeader.style.display = 'flex';
            }
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) {
                bottomNav.style.display = 'flex';
            }
        }
        
        if (el.copyBtn) {
            el.copyBtn.onclick = () => {
                if (el.refLink) {
                    navigator.clipboard.writeText(el.refLink.value);
                    showToast(T().toastLink, 'success');
                }
            };
        }
        
        if (el.copyReferralBtn) {
            el.copyReferralBtn.onclick = () => {
                if (el.referralLink) {
                    navigator.clipboard.writeText(el.referralLink.value);
                    showToast(T().toastRefLink, 'success');
                }
            };
        }
        
        if (el.termsBtn) {
            el.termsBtn.onclick = (e) => {
                e.stopPropagation();
                if (el.termsModal) el.termsModal.classList.remove('hidden');
            };
        }
        
        if (el.closeTermsBtn) {
            el.closeTermsBtn.onclick = () => {
                if (el.termsModal) el.termsModal.classList.add('hidden');
            };
        }
        
        if (el.acceptTermsBtn) {
            el.acceptTermsBtn.onclick = () => {
                if (el.termsModal) el.termsModal.classList.add('hidden');
            };
        }
        
        if (el.termsModal) {
            el.termsModal.onclick = (e) => {
                if (e.target === el.termsModal) {
                    el.termsModal.classList.add('hidden');
                }
            };
        }
        
        if (el.closeReferralBtn) {
            el.closeReferralBtn.onclick = () => {
                if (el.referralModal) el.referralModal.classList.add('hidden');
            };
        }
        
        if (el.referralModal) {
            el.referralModal.onclick = (e) => {
                if (e.target === el.referralModal) {
                    el.referralModal.classList.add('hidden');
                }
            };
        }
        
        if (el.constitutionBtn) {
            el.constitutionBtn.onclick = (e) => {
                e.stopPropagation();
                if (el.constitutionModal) el.constitutionModal.classList.remove('hidden');
            };
        }
        
        if (el.closeConstitutionBtn) {
            el.closeConstitutionBtn.onclick = () => {
                if (el.constitutionModal) el.constitutionModal.classList.add('hidden');
            };
        }
        
        if (el.acceptConstitutionBtn) {
            el.acceptConstitutionBtn.onclick = () => {
                if (el.constitutionModal) el.constitutionModal.classList.add('hidden');
            };
        }
        
        if (el.constitutionModal) {
            el.constitutionModal.onclick = (e) => {
                if (e.target === el.constitutionModal) {
                    el.constitutionModal.classList.add('hidden');
                }
            };
        }
        
        if (el.walletConnectBtn) {
            el.walletConnectBtn.onclick = () => {
                connectWallet();
            };
        }
        
        if (el.closeUploadModal) {
            el.closeUploadModal.onclick = () => {
                if (el.uploadModal) el.uploadModal.classList.add('hidden');
                // Reset upload steps
                const steps = ['step1', 'step2', 'step3', 'step4'];
                steps.forEach(stepId => {
                    const step = document.getElementById(stepId);
                    if (step) {
                        step.classList.remove('active', 'completed');
                    }
                });
                const progressFill = document.getElementById('uploadProgressFill');
                if (progressFill) progressFill.style.width = '0%';
            };
        }
        
        if (el.uploadModal) {
            el.uploadModal.onclick = (e) => {
                if (e.target === el.uploadModal) {
                    el.uploadModal.classList.add('hidden');
                    // Reset upload steps
                    const steps = ['step1', 'step2', 'step3', 'step4'];
                    steps.forEach(stepId => {
                        const step = document.getElementById(stepId);
                        if (step) {
                            step.classList.remove('active', 'completed');
                        }
                    });
                    const progressFill = document.getElementById('uploadProgressFill');
                    if (progressFill) progressFill.style.width = '0%';
                }
            };
        }
        
        // Check Sunday every minute and update chart if needed
        setInterval(() => {
            if (el.sundayLockOverlay) {
                const wasSunday = !el.sundayLockOverlay.classList.contains('hidden');
                const isSundayNow = isSunday();
                if (wasSunday !== isSundayNow) {
                    updateUI();
                }
            }
        }, 60000);
    }
    
    // =========================================================
    // START APPLICATION
    // =========================================================
    init();
    
    // Initialize deposit modal and referral section
    initDepositModal();
    initReferralSection();
    updateBalanceFromStorage();
    initWalletButtons();
    
    // Set default active tab based on intro state
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen && welcomeScreen.classList.contains('hidden')) {
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = 'flex';
        }
        switchTab('home');
    } else {
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = 'none';
        }
    }
    
    // =========================================================
    // ADMIN SYNC (LIVE)
    // =========================================================
    function syncAdminData() {
        // Sync deposits from localStorage.pending_deposits
        const pendingDeposits = JSON.parse(localStorage.getItem('pending_deposits') || '[]');
        const userId = `User_${state.refCode || '123'}`;
        
        // Check for approved deposits and activate contracts
        const approvedDeposits = pendingDeposits.filter(d => 
            d.user === userId && d.status === 'approved' && !d.contractActivated
        );
        
        approvedDeposits.forEach(deposit => {
            const tier = deposit.amount;
            if (INVESTMENT_TIERS.includes(tier)) {
                // Check if contract already exists for this tier
                const existingContract = coreData.activeContracts.find(c => c.tier === tier);
                if (!existingContract) {
                    // Activate contract
                    if (activateContract(tier, tier)) {
                        deposit.contractActivated = true;
                        localStorage.setItem('pending_deposits', JSON.stringify(pendingDeposits));
                        console.log(`✅ Contract activated for tier $${tier} from admin approval`);
                        showToast(`Contract $${tier} activated!`, 'success');
                        updateUI();
                    }
                } else {
                    deposit.contractActivated = true;
                    localStorage.setItem('pending_deposits', JSON.stringify(pendingDeposits));
                }
            }
        });
        
        // Sync shields from localStorage.gd_shield_approvals
        const shieldApprovals = JSON.parse(localStorage.getItem('gd_shield_approvals') || '[]');
        const userApproval = shieldApprovals.find(approval => approval.userId === userId);
        
        if (userApproval && !state.hasShield) {
            localStorage.setItem('hasShield', 'true');
            state.hasShield = true;
            saveState();
            checkAndApplyShieldStatus();
        }
        
        // Admin approval logic handled in admin.html - balance sync happens via updateBalanceFromStorage
    }
    
    // Check for balance updates periodically
    setInterval(() => {
        updateBalanceFromStorage();
        syncAdminData();
    }, 2000);
    
    // Periodic contract updates
    setInterval(() => {
        updateContracts();
        updateUI();
    }, 60000); // Every minute
})();
