const btn = document.getElementById("claimBtn");
const result = document.getElementById("result");

btn.addEventListener("click", () => {
  result.innerText = "Reward claimed successfully ✅";
});