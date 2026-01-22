const claimBtn = document.getElementById("claimBtn");
const result = document.getElementById("result");

let claimed = false;

claimBtn.addEventListener("click", () => {
  if (claimed) {
    console.warn("Claim already completed");
    return;
  }

  claimed = true;
  result.textContent = "Reward claimed successfully ✅";
});