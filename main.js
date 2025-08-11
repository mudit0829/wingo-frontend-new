const apiUrl = "https://wingo-backend-nqk5.onrender.com";
const currentEmail = localStorage.getItem("userEmail") || "user@example.com";
let currentRoundId = "";
let roundEndTime = null;
let selectedBetType = null;
let selectedBetValue = null;
let selectedDenom = 1;
let selectedMultiplier = 1;
let gameHistoryArr = [];
let myHistoryArr = [];
let gamePage = 0;
let myPage = 0;
const itemsPerPage = 20;

/* ==== Color mapping function ==== */
function getWinGoColor(n) {
  n = Number(n);
  if (n === 0 || n === 5) return "violet";
  if ([1, 3, 7, 9].includes(n)) return "green";
  if ([2, 4, 6, 8].includes(n)) return "red";
  return "";
}

/* ==== Tab switching ==== */
function showTab(id, btn) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  document.getElementById("gameHistoryPagination").style.display = id === "gameHistory" ? "" : "none";
  document.getElementById("myHistoryPagination").style.display = id === "myHistory" ? "" : "none";
}

/* ==== Betting popup triggers ==== */
function selectColor(c) { openBetPopup("color", c); }
function selectNumber(n) { openBetPopup("number", n); }
function selectMultiplier(m) { selectedMultiplier = Number(m.replace("X", "")) || 1; updatePopupTotal(); }
window.selectColor = selectColor;
window.selectNumber = selectNumber;

/* ==== Betting popup open/close ==== */
function openBetPopup(t, c) {
  selectedBetType = t; selectedBetValue = c;
  const header = document.getElementById("betHeader");
  header.className = "bet-header " + getWinGoColor(c);
  document.getElementById("betChoiceText").textContent = `Select ${c}`;
  selectedDenom = 1; selectedMultiplier = 1;
  document.getElementById("betQty").value = 1;
  updatePopupTotal();
  document.getElementById("betModal").classList.remove("hidden");
}
function closeBetPopup() {
  document.getElementById("betModal").classList.add("hidden");
}
window.closeBetPopup = closeBetPopup;

/* ==== Betting popup control wiring ==== */
function wireBetModalControls() {
  document.querySelectorAll(".bet-buttons button[data-balance]").forEach(btn => 
    btn.addEventListener("click", () => { selectedDenom = +btn.dataset.balance; updatePopupTotal(); })
  );
  document.querySelectorAll(".bet-buttons.multipliers button[data-mult]").forEach(btn => 
    btn.addEventListener("click", () => { selectedMultiplier = +btn.dataset.mult; updatePopupTotal(); })
  );
  document.getElementById("qtyPlus").onclick = () => {
    document.getElementById("betQty").value = +document.getElementById("betQty").value + 1;
    updatePopupTotal();
  };
  document.getElementById("qtyMinus").onclick = () => {
    document.getElementById("betQty").value = Math.max(1, +document.getElementById("betQty").value - 1);
    updatePopupTotal();
  };
  document.getElementById("cancelBet").onclick = closeBetPopup;
  document.getElementById("placeBet").onclick = handlePlaceBet;
}

/* ==== Update total amount in popup ==== */
function updatePopupTotal() {
  const qty = +document.getElementById("betQty").value || 1;
  document.getElementById("totalAmount").textContent = (selectedDenom * qty * selectedMultiplier).toFixed(2);
}

/* ==== Place bet ==== */
async function handlePlaceBet() {
  const qty = Number(document.getElementById("betQty")?.value || 1);
  const amount = selectedDenom * qty * selectedMultiplier;
  const payload = {
    email: currentEmail,
    roundId: currentRoundId,
    amount,
    colorBet: selectedBetType === "color" ? selectedBetValue : null,
    numberBet: selectedBetType === "number" ? Number(selectedBetValue) : null
  };
  await fetch(`${apiUrl}/api/bets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  closeBetPopup();
  loadMyHistory();
}

/* ==== Wallet ==== */
async function fetchWalletBalance() {
  const r = await fetch(`${apiUrl}/api/users/wallet/${encodeURIComponent(currentEmail)}`);
  const d = await r.json();
  document.getElementById("walletAmount").innerText = parseFloat(d.wallet || 0).toFixed(2);
}

/* ==== Current round + smooth timer ==== */
async function fetchCurrentRound() {
  const r = await fetch(`${apiUrl}/api/rounds`);
  const rounds = await r.json();
  if (!rounds.length) return;
  const round = rounds[0];
  currentRoundId = round.roundId;
  roundEndTime = new Date(round.startTime).getTime() + 30000;
  document.getElementById("roundId").textContent = round.roundId;
}

/* Local countdown update every second */
setInterval(() => {
  if (!roundEndTime) return;
  let rem = Math.max(0, Math.floor((roundEndTime - Date.now()) / 1000));
  document.getElementById("timeDigits").textContent = `00:${String(rem).padStart(2, "0")}`;
}, 1000);

/* ==== Game history ==== */
async function loadGameHistory() {
  const r = await fetch(`${apiUrl}/api/rounds`);
  let rounds = await r.json();
  const seen = new Set();
  rounds = rounds.filter(rr => !seen.has(rr.roundId) && seen.add(rr.roundId));
  gameHistoryArr = rounds;
  renderGameHistoryPage();
}

function renderGameHistoryPage() {
  const cont = document.getElementById("gameHistory");
  const start = gamePage * itemsPerPage, end = start + itemsPerPage;
  cont.innerHTML = `<table class="history-table"><tr><th>Period</th><th>Number</th><th>Big Small</th><th>Color</th></tr></table>`;
  const table = cont.querySelector("table");
  gameHistoryArr.slice(start, end).forEach(r => {
    const num = r.resultNumber ?? "-";
    const col = getWinGoColor(num);
    const bs = num === "-" ? "-" : (num >= 5 ? "Big" : "Small");
    table.innerHTML += `<tr><td>${r.roundId}</td><td><span class="history-number ${col}">${num}</span></td><td>${bs}</td><td><span class="dot ${col}"></span></td></tr>`;
  });
  const tot = Math.ceil(gameHistoryArr.length / itemsPerPage);
  document.getElementById("gameHistoryPagination").innerHTML =
    (gamePage > 0 ? `<button onclick="gamePage--;renderGameHistoryPage()">Prev</button>` : "") +
    ` Page ${gamePage + 1} of ${tot} ` +
    (gamePage < tot - 1 ? `<button onclick="gamePage++;renderGameHistoryPage()">Next</button>` : "");
}

/* ==== My history ==== */
async function loadMyHistory() {
  const [betsR, roundsR] = await Promise.all([
    fetch(`${apiUrl}/api/bets/user/${encodeURIComponent(currentEmail)}`),
    fetch(`${apiUrl}/api/rounds`)
  ]);
  const bets = await betsR.json();
  const rounds = await roundsR.json();
  const roundMap = new Map(rounds.map(r => [r.roundId, r]));
  myHistoryArr = bets.map(b => ({ ...b, round: roundMap.get(b.roundId) }));
  renderMyHistoryPage();
}

function renderMyHistoryPage() {
  const cont = document.getElementById("myHistory");
  const start = myPage * itemsPerPage, end = start + itemsPerPage;
  cont.innerHTML = "";
  myHistoryArr.slice(start, end).forEach(b => {
    const isNum = b.numberBet != null;
    const roundNumber = b.round?.resultNumber != null ? b.round.resultNumber : null;
    const roundColor = roundNumber != null ? getWinGoColor(roundNumber) : "pending";
    const betColor = b.colorBet ? b.colorBet.toLowerCase() : null;

    let statusClass, statusText;
    if (roundNumber == null) {
      statusClass = "pending"; statusText = "Pending";
    } else if ((betColor && roundColor === betColor) || (isNum && b.numberBet === roundNumber)) {
      statusClass = "succeed"; statusText = "Succeed";
    } else {
      statusClass = "failed"; statusText = "Failed";
    }

    const net = statusClass === "succeed" ? ((b.amount ?? 0) + (b.profit ?? 0)) :
      statusClass === "failed" ? -(b.amount ?? 0) : 0;
    const amtText = `${net >= 0 ? "+" : "-"}₹${Math.abs(net).toFixed(2)}`;

    cont.innerHTML += `<div class="my-history-item ${statusClass}">
      <div class="color-box ${roundColor}"></div>
      <div class="bet-number ${roundColor}">${roundNumber != null ? roundNumber : ""}</div>
      <div style="min-width:105px;">
        <div>${b.roundId}</div>
        <div>${b.timestamp ? new Date(b.timestamp).toLocaleString("en-IN", { hour12: false }) : ""}</div>
      </div>
      <div class="status ${statusClass}">${statusText}</div>
      <div class="amount ${statusClass}">${amtText}</div>
    </div>`;
  });

  const tot = Math.ceil(myHistoryArr.length / itemsPerPage);
  document.getElementById("myHistoryPagination").innerHTML =
    (myPage > 0 ? `<button onclick="myPage--;renderMyHistoryPage()">Prev</button>` : "") +
    ` Page ${myPage + 1} of ${tot} ` +
    (myPage < tot - 1 ? `<button onclick="myPage++;renderMyHistoryPage()">Next</button>` : "");
}

/* ==== Init ==== */
document.addEventListener("DOMContentLoaded", () => {
  wireBetModalControls();
  fetchWalletBalance();
  fetchCurrentRound();
  loadGameHistory();
  loadMyHistory();
  setInterval(fetchCurrentRound, 3000);
  setInterval(loadGameHistory, 10000);
  setInterval(loadMyHistory, 10000);
});
