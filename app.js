// ==============================
// MockDB (current state storage)
// ==============================
const MockDB = {
  state: "IDLE", // IDLE | CLAIMING | CLAIMED
};

// ==============================
// Rules Layer (Stage 1)
// ==============================
const Rules = {
  canClaim(currentState) {
    if (currentState === "CLAIMED") {
      console.warn("⚠️ Claim already completed");
      return false;
    }

    if (currentState === "CLAIMING") {
      console.warn("⚠️ Claim already in progress");
      return false;
    }

    return true;
  },
};

// ==============================
// Controller (modified, safe)
// ==============================
const claimBtn = document.getElementById("claimBtn");
const result = document.getElementById("result");

claimBtn.addEventListener("click", () => {
  // Rule check
  if (!Rules.canClaim(MockDB.state)) {
    return;
  }

  // Transition to CLAIMING
  MockDB.state = "CLAIMING";

  // Simulate async claim
  setTimeout(() => {
    MockDB.state = "CLAIMED";
    result.textContent = "Reward claimed successfully ✅";
  }, 500);
});
