/* =========================================================
   Global Deposit – Polished Master (V16.0)
   - Stale Claim Auto-Reset
   - Full Localization (Toasts, History)
   - Console Security Guards
   - Multi-Tab & Live Market
========================================================= */

(() => {
    const STORAGE_KEY = "gd_polished_v16";
    const HISTORY_KEY = "gd_history_v5";
    const SECRET_SALT = "GD_SECURE_2026";
    const CLAIM_PROCESS_TIME = 60;
    const REWARD_AMOUNT = 2.50;
    const DAY_MS = 24 * 60 * 60 * 1000;
  
    /* --- 1. CONFIG & LANGS --- */
    const LANGS = {
      en: {
        dir: "ltr",
        home: "Dashboard", wallet: "Wallet", teamTitle: "Team", activity: "Activity", langTitle: "Language",
        balance: "Total Asset Value", claim: "CLAIM REWARD",
        activityTitle: "Transaction History",
        walletTitle: "My Wallet", withdrawAddress: "Wallet Address (TRC20)", withdrawAmount: "Amount", confirm: "WITHDRAW",
        refLabel: "Your Invite Link", members: "Members", commissions: "Earned",
        waitMsg: "Verifying liquidity pool connection...", dontClose: "Do not close this window",
        sunday: "MARKET CLOSED (SUNDAY)", wait: "COME BACK TOMORROW", cooldown: "PROCESSING...",
        ready: "CLAIM AVAILABLE", locked: "SUNDAY LOCK",
        securityAlert: "⚠️ Action blocked: Please reload.",
        multiTab: "Session active in another tab.", useHere: "USE HERE",
        emptyHist: "No transactions yet.",
        histClaimTitle: "Daily Reward",
        toastSuccess: "Reward Claimed Successfully",
        toastLink: "Link Copied!",
        toastErrSun: "Market Closed on Sunday",
        toastErrCool: "Cooldown Active",
        phases: ["Connecting to Binance Node...", "Verifying Smart Contract...", "Securing Transaction...", "Finalizing Deposit..."]
      },
      ar: {
        dir: "rtl",
        home: "لوحة التحكم", wallet: "المحفظة", teamTitle: "الفريق", activity: "السجل", langTitle: "اللغة",
        balance: "إجمالي قيمة الأصول", claim: "سحب الأرباح",
        activityTitle: "سجل المعاملات",
        walletTitle: "محفظتي", withdrawAddress: "عنوان المحفظة (TRC20)", withdrawAmount: "الكمية", confirm: "تأكيد السحب",
        refLabel: "رابط الدعوة", members: "أعضاء", commissions: "أرباح",
        waitMsg: "جاري التحقق من سيولة العقد الذكي...", dontClose: "لا تغلق هذه النافذة",
        sunday: "السوق مغلق (الأحد)", wait: "عد غداً", cooldown: "جارِ المعالجة...",
        ready: "المطالبة متاحة الآن", locked: "قفل الأحد",
        securityAlert: "⚠️ تم منع الإجراء: يرجى تحديث الصفحة.",
        multiTab: "الجلسة نشطة في صفحة أخرى.", useHere: "استخدم هنا",
        emptyHist: "لا توجد معاملات بعد.",
        histClaimTitle: "مكافأة يومية",
        toastSuccess: "تم استلام المكافأة بنجاح",
        toastLink: "تم نسخ الرابط!",
        toastErrSun: "السوق مغلق يوم الأحد",
        toastErrCool: "فترة الانتظار نشطة",
        phases: ["جاري الاتصال بـ Binance...", "التحقق من العقد الذكي...", "تأمين المعاملة...", "إيداع الأرباح..."]
      },
      fr: {
        dir: "ltr",
        home: "Tableau de bord", wallet: "Portefeuille", teamTitle: "Équipe", activity: "Activité", langTitle: "Langue",
        balance: "Valeur Totale", claim: "RÉCLAMER",
        activityTitle: "Historique",
        walletTitle: "Mon Portefeuille", withdrawAddress: "Adresse (TRC20)", withdrawAmount: "Montant", confirm: "RETRAIT",
        refLabel: "Votre Lien", members: "Membres", commissions: "Gains",
        waitMsg: "Veuillez patienter...", dontClose: "Ne fermez pas",
        sunday: "MARCHÉ FERMÉ", wait: "REVENEZ DEMAIN", cooldown: "TRAITEMENT...",
        ready: "RÉCLAMATION DISPONIBLE", locked: "FERMÉ",
        securityAlert: "⚠️ Action bloquée.",
        multiTab: "Session active ailleurs.", useHere: "UTILISER ICI",
        emptyHist: "Aucune transaction.",
        histClaimTitle: "Récompense Quotidienne",
        toastSuccess: "Récompense reçue avec succès",
        toastLink: "Lien copié !",
        toastErrSun: "Marché fermé dimanche",
        toastErrCool: "Période d'attente active",
        phases: ["Connexion à Binance...", "Vérification du contrat...", "Sécurisation...", "Finalisation..."]
      }
    };
  
    /* --- 2. SESSION MANAGER --- */
    const sessionChannel = new BroadcastChannel('gd_session_v5');
    let isLeader = false;
    let heartbeatTimer;
    let deadCheckTimer;
    let lastHeartbeat = 0;
  
    function initSession() {
      const now = Date.now();
      const lastActive = parseInt(localStorage.getItem('gd_last_active') || 0);
  
      if (now - lastActive > 2000) {
        becomeLeader();
      } else {
        becomeFollower();
      }
  
      sessionChannel.onmessage = (e) => {
        if (e.data === 'HEARTBEAT') {
          if (!isLeader) lastHeartbeat = Date.now();
        } else if (e.data === 'FORCE_TAKEOVER') {
          if (isLeader) becomeFollower();
        }
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
        if (Date.now() - lastHeartbeat > 3000) {
          becomeLeader();
        }
      }, 1000);
    }
  
    document.getElementById('useHereBtn').onclick = () => {
      sessionChannel.postMessage('FORCE_TAKEOVER');
      becomeLeader();
    };
  
    /* --- 3. SECURITY & UTILS --- */
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
  
    /* --- 4. STATE MANAGEMENT --- */
    const defaultState = {
      balance: 0.00,
      lastClaim: 0,
      lang: null,
      refCode: Math.floor(100000 + Math.random() * 900000),
      isClaiming: false,
      claimStartTime: 0
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
  
    /* --- 5. UI ELEMENTS --- */
    const el = {
      balance: document.getElementById("balance"),
      walletPageBalance: document.getElementById("walletPageBalance"),
      claimBtn: document.getElementById("claimBtn"),
      countdownDisplay: document.getElementById("countdownDisplay"),
      bnbPrice: document.getElementById("bnbPrice"),
      bnbChange: document.getElementById("bnbChange"),
      menuBtn: document.getElementById("menuBtn"),
      sidebar: document.getElementById("sidebar"),
      overlay: document.getElementById("sidebarOverlay"),
      menuItems: document.querySelectorAll(".menu-item"),
      langBtns: document.querySelectorAll(".lang-btn"),
      pages: document.querySelectorAll(".page-section"),
      username: document.getElementById("usernameDisplay"),
      welcomeScreen: document.getElementById("welcomeScreen"),
      startBtn: document.getElementById("startBtn"),
      claimOverlay: document.getElementById("claimOverlay"),
      progressRing: document.getElementById("progressRing"),
      timer: document.getElementById("timer"),
      phaseText: document.getElementById("phaseText"),
      refLink: document.getElementById("refLink"),
      copyBtn: document.getElementById("copyBtn"),
      historyList: document.getElementById("historyList")
    };
  
    /* --- 6. CORE LOGIC --- */
    const T = () => LANGS[state.lang];
    const isSunday = () => new Date().getDay() === 0;
    const now = () => Date.now();
  
    function updateUI() {
      const txt = T();
      document.documentElement.dir = txt.dir;
      
      document.querySelectorAll("[data-i18n]").forEach(e => {
        if(txt[e.dataset.i18n]) e.textContent = txt[e.dataset.i18n];
      });
  
      el.balance.textContent = `$${state.balance.toFixed(2)}`;
      el.walletPageBalance.textContent = `$${state.balance.toFixed(2)}`;
      el.refLink.value = `global-deposit.com/?ref=${state.refCode}`;
      el.username.textContent = `User_${state.refCode}`;
  
      el.langBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.lang === state.lang));
  
      if (state.isClaiming) {
         el.claimBtn.disabled = true;
         el.claimBtn.querySelector("span").textContent = txt.cooldown;
      } else if (isSunday()) {
        el.claimBtn.disabled = true;
        el.claimBtn.querySelector("span").textContent = txt.sunday;
        el.claimBtn.style.background = "#222";
      } else if (now() - state.lastClaim < DAY_MS) {
        el.claimBtn.disabled = true;
        el.claimBtn.querySelector("span").textContent = txt.wait;
        el.claimBtn.style.background = "#222";
      } else {
        el.claimBtn.disabled = false;
        el.claimBtn.querySelector("span").textContent = txt.claim;
        el.claimBtn.style.background = ""; 
      }
    }
  
    /* --- 7. COUNTDOWN & HISTORY --- */
    function startCountdown() {
      setInterval(() => {
        const txt = T();
        if (isSunday()) {
          el.countdownDisplay.textContent = txt.locked;
          el.countdownDisplay.className = "countdown-text locked";
          return;
        }
        
        const diff = DAY_MS - (now() - state.lastClaim);
        if (diff <= 0) {
          el.countdownDisplay.textContent = txt.ready;
          el.countdownDisplay.className = "countdown-text ready";
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          el.countdownDisplay.textContent = `${h}h ${m}m ${s}s`;
          el.countdownDisplay.className = "countdown-text wait";
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
  
    /* --- 8. CLAIM LOGIC --- */
    el.claimBtn.onclick = () => {
      if (el.claimBtn.disabled || !isLeader) return;
      const txt = T();
      
      if (isSunday()) { showToast(txt.toastErrSun, 'error'); return; }
      if (now() - state.lastClaim < DAY_MS) { showToast(txt.toastErrCool, 'error'); return; }
  
      state.isClaiming = true;
      state.claimStartTime = now();
      saveState();
      resumeClaim();
    };
  
    function resumeClaim() {
      el.claimOverlay.classList.remove("hidden");
      const circumference = 408;
      const phases = T().phases;
      
      const tick = setInterval(() => {
        const elapsed = Math.floor((now() - state.claimStartTime) / 1000);
        const timeLeft = CLAIM_PROCESS_TIME - elapsed;
  
        el.timer.textContent = timeLeft > 0 ? timeLeft : 0;
        const offset = circumference * (1 - (timeLeft / CLAIM_PROCESS_TIME));
        el.progressRing.style.strokeDashoffset = -offset;
  
        const phaseIndex = Math.min(3, Math.floor(elapsed / 15));
        el.phaseText.textContent = phases[phaseIndex];
  
        if (timeLeft <= 0) {
          clearInterval(tick);
          finishClaim();
        }
      }, 1000);
    }
  
    function finishClaim() {
      // SECURITY GUARD
      if (!state.isClaiming || !isLeader || isSunday() || (now() - state.lastClaim < DAY_MS)) {
         console.error("Blocked"); return;
      }
  
      el.claimOverlay.classList.add("hidden");
      
      state.balance += REWARD_AMOUNT;
      state.lastClaim = now();
      state.isClaiming = false;
      state.claimStartTime = 0;
      saveState();
      
      addHistory(REWARD_AMOUNT);
      updateUI();
      showToast(T().toastSuccess, 'success');
    }
  
    /* --- 9. INIT & EVENTS --- */
    function init() {
      initSession(); 
      history.pushState(null, null, location.href);
      window.onpopstate = () => history.pushState(null, null, location.href);
  
      // Stale Claim Check
      if (state.isClaiming) {
          const elapsed = now() - state.claimStartTime;
          // If > 65s passed, reset (stale)
          if (elapsed > (CLAIM_PROCESS_TIME * 1000 + 5000)) {
              state.isClaiming = false;
              state.claimStartTime = 0;
              saveState();
          } else {
              resumeClaim();
          }
      }
      
      updateUI();
      startCountdown();
      renderHistory();
      startMarketSimulation();
  
      // Event Listeners
      el.menuBtn.onclick = () => { el.sidebar.classList.toggle("open"); el.overlay.classList.toggle("active"); };
      el.overlay.onclick = () => { el.sidebar.classList.remove("open"); el.overlay.classList.remove("active"); };
      
      el.langBtns.forEach(btn => btn.onclick = () => { 
          state.lang = btn.dataset.lang; 
          saveState(); 
          updateUI(); 
          renderHistory(); // Re-render history to translate title
      });
      
      el.menuItems.forEach(item => item.onclick = (e) => {
        e.preventDefault();
        document.querySelector(".menu-item.active").classList.remove("active");
        item.classList.add("active");
        document.querySelector(".page-section.active").classList.remove("active");
        document.getElementById(`page-${item.dataset.page}`).classList.add("active");
        el.sidebar.classList.remove("open");
        el.overlay.classList.remove("active");
      });
  
      if (!state.introShown) {
        el.welcomeScreen.classList.remove("hidden");
        el.startBtn.onclick = () => { state.introShown = true; saveState(); el.welcomeScreen.classList.add("hidden"); };
      } else {
        el.welcomeScreen.classList.add("hidden");
      }
      
      el.copyBtn.onclick = () => { navigator.clipboard.writeText(el.refLink.value); showToast(T().toastLink, 'success'); };
    }
  
    function startMarketSimulation() {
      let price = 617.50;
      setInterval(() => {
        const change = (Math.random() - 0.5) * 0.3;
        price += change;
        const percent = (0.47 + (Math.random() - 0.5) * 0.1).toFixed(2);
        el.bnbPrice.textContent = price.toFixed(2);
        el.bnbChange.textContent = `${percent > 0 ? '+' : ''}${percent}%`;
        if (change >= 0) {
          el.bnbPrice.style.color = "#00ff88";
          el.bnbChange.className = "change up";
        } else {
          el.bnbPrice.style.color = "#ff4444";
          el.bnbChange.className = "change down";
        }
      }, 3000);
    }
  
    init();
  })();