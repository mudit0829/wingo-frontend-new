const apiUrl = "https://wingo-backend-nqk5.onrender.com";

let currentRoundId = "";
let roundEndTime = null;
let selectedBetType = null;
let selectedBetValue = null;
let selectedDenom = 1;
let selectedMultiplier = 1;
let selectedGameType = "WIN30";
let gameHistoryArr = [];
let myHistoryArr = [];
let gamePage = 0;
let myPage = 0;
const itemsPerPage = 20;

const gameTypeMap = {
  "WinGo 30sec": "WIN30",
  "WinGo 1 Min": "WIN1",
  "WinGo 3 Min": "WIN3",
  "WinGo 5 Min": "WIN5"
};

function getToken() {
  return localStorage.getItem("token") || null;
}
function requireLogin() {
  const token = getToken();
  if (!token) { window.location.href = "login.html"; return false; }
  return true;
}
async function authFetch(url, options = {}) {
  const token = getToken();
  if (!token) { window.location.href = "login.html"; return; }
  options.headers = { ...(options.headers || {}), "Authorization": `Bearer ${token}` };
  const res = await fetch(url, options);
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    window.location.href = "login.html";
    return;
  }
  return res;
}
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  window.location.href = "login.html";
}
function getWinGoColor(n) {
  n = Number(n);
  if (n === 0 || n === 5) return "violet";
  if ([1, 3, 7, 9].includes(n)) return "green";
  if ([2, 4, 6, 8].includes(n)) return "red";
  return "";
}
function showTab(id, btn) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("gameHistoryPagination").style.display = id === "gameHistory" ? "" : "none";
  document.getElementById("myHistoryPagination").style.display = id === "myHistory" ? "" : "none";
}
function selectColor(c) { openBetPopup("color", c); }
function selectNumber(n) { openBetPopup("number", n); }
function selectBigSmall(v) { openBetPopup("bigSmall", v); }

// ✅ Multiplier selection fix
function selectMultiplier(m) {
  document.querySelectorAll(".multiplier-btn").forEach(btn => btn.classList.remove("active"));
  const btn = Array.from(document.querySelectorAll(".multiplier-btn")).find(b => b.textContent.trim() === m);
  if (btn) btn.classList.add("active");
  selectedMultiplier = Number(m.replace("X", "")) || 1;
  selectedDenom = selectedMultiplier;
  updatePopupTotal();
}

window.selectColor = selectColor;
window.selectNumber = selectNumber;
window.selectBigSmall = selectBigSmall;

function openBetPopup(t, c) {
  selectedBetType = t;
  selectedBetValue = c;
  const header = document.getElementById("betHeader");

  if (t === "color" || t === "number") {
    header.className = "bet-header " + getWinGoColor(c);
  } else if (t === "bigSmall") {
    header.className = "bet-header";
  }

  document.getElementById("betChoiceText").textContent = `Select ${c}`;
  selectedMultiplier = 1;
  selectedDenom = 1;
  document.getElementById("betQty").value = 1;

  document.querySelectorAll(".multiplier-btn").forEach(btn => {
    if (btn.textContent.trim() === "X1") btn.classList.add("active");
    else btn.classList.remove("active");
  });
  document.querySelectorAll(".bet-buttons button[data-balance]").forEach(btn => {
    btn.classList.remove("active");
    if (btn.dataset.balance === "1") btn.classList.add("active");
  });

  updatePopupTotal();
  document.getElementById("betModal").classList.remove("hidden");
}
function closeBetPopup() {
  document.getElementById("betModal").classList.add("hidden");
}
window.closeBetPopup = closeBetPopup;

function wireBetModalControls() {
  document.querySelectorAll(".bet-buttons button[data-balance]").forEach(btn =>
    btn.addEventListener("click", () => {
      document.querySelectorAll(".bet-buttons button[data-balance]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedDenom = +btn.dataset.balance;
      updatePopupTotal();
    })
  );
  document.querySelectorAll(".bet-buttons.multipliers button[data-mult]").forEach(btn =>
    btn.addEventListener("click", () => {
      selectMultiplier('X' + btn.dataset.mult);
    })
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

function updatePopupTotal() {
  const qty = +document.getElementById("betQty").value || 1;
  document.getElementById("totalAmount").textContent = (selectedDenom * qty * selectedMultiplier).toFixed(2);
}
async function handlePlaceBet() {
  if (!requireLogin()) return;
  const qty = Number(document.getElementById("betQty")?.value || 1);
  const amount = selectedDenom * qty * selectedMultiplier;
  const payload = {
    gameType: selectedGameType,
    colorBet: selectedBetType === "color" ? selectedBetValue : null,
    numberBet: selectedBetType === "number" ? Number(selectedBetValue) : null,
    bigSmallBet: selectedBetType === "bigSmall" ? selectedBetValue : null,
    amount
  };
  try {
    const res = await authFetch(`${apiUrl}/api/bets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res || !res.ok) {
      let errMsg = `Bet failed (${res ? res.status : "no response"})`;
      try {
        const errData = await res.json();
        if (errData.message) errMsg = errData.message;
      } catch {}
      throw new Error(errMsg);
    }
    const data = await res.json();
    alert(`✅ Bet placed! New wallet balance: ₹${data.newWalletBalance}`);
    loadMyHistory();
  } catch (err) {
    alert(`❌ Unable to place bet: ${err.message}`);
    console.error("Place bet error:", err.message);
  }
  closeBetPopup();
}
async function fetchWalletBalance() {
  if (!requireLogin()) return;
  try {
    const r = await authFetch(`${apiUrl}/api/users/wallet`);
    if (!r || !r.ok) throw new Error("Wallet fetch failed");
    const d = await r.json();
    document.getElementById("walletAmount").innerText = parseFloat(d.wallet || 0).toFixed(2);
  } catch (err) {
    console.error(err.message);
  }
}
async function fetchCurrentRound() {
  try {
    const r = await fetch(`${apiUrl}/api/rounds?gameType=${selectedGameType}`);
    if (!r.ok) return;
    const rounds = await r.json();
    if (!rounds.length) return;
    const round = rounds[0];
    currentRoundId = round.roundId;
    roundEndTime = new Date(round.startTime).getTime() + getRoundDuration(selectedGameType);
    document.getElementById("roundId").textContent = round.roundId;
  } catch (err) {
    console.error(err.message);
  }
}
function getRoundDuration(type) {
  switch (type) {
    case "WIN1": return 60000;
    case "WIN3": return 180000;
    case "WIN5": return 300000;
    default: return 30000;
  }
}
setInterval(() => {
  if (!roundEndTime) return;
  const rem = Math.max(0, Math.floor((roundEndTime - Date.now()) / 1000));
  const mm = String(Math.floor(rem / 60)).padStart(2, "0");
  const ss = String(rem % 60).padStart(2, "0");
  document.getElementById("timeDigits").textContent = `${mm}:${ss}`;
}, 1000);
async function loadGameHistory() {
  try {
    const r = await fetch(`${apiUrl}/api/rounds?gameType=${selectedGameType}`);
    if (!r.ok) throw new Error("Game history error");
    let rounds = await r.json();
    const seen = new Set();
    rounds = rounds.filter(rr => !seen.has(rr.roundId) && seen.add(rr.roundId));
    gameHistoryArr = rounds;
    renderGameHistoryPage();
  } catch (err) {
    console.error(err.message);
  }
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
    table.innerHTML += `<tr>
      <td>${r.roundId}</td>
      <td><span class="history-number ${col}">${num}</span></td>
      <td>${bs}</td>
      <td><span class="dot ${col}"></span></td>
    </tr>`;
  });
  const tot = Math.ceil(gameHistoryArr.length / itemsPerPage) || 1;
  document.getElementById("gameHistoryPagination").innerHTML =
    (gamePage > 0 ? `<button onclick="gamePage--;renderGameHistoryPage()">Prev</button>` : "") +
    ` Page ${gamePage + 1} of ${tot} ` +
    (gamePage < tot - 1 ? `<button onclick="gamePage++;renderGameHistoryPage()">Next</button>` : "");
}
async function loadMyHistory() {
  if (!requireLogin()) return;
  try {
    const [betsR, roundsR] = await Promise.all([
      authFetch(`${apiUrl}/api/bets/user?gameType=${selectedGameType}`),
      fetch(`${apiUrl}/api/rounds?gameType=${selectedGameType}`)
    ]);
    if (!betsR || !betsR.ok) throw new Error("History fetch failed");
    const bets = await betsR.json();
    const rounds = await roundsR.json();
    const roundMap = new Map(rounds.map(r => [r.roundId, r]));
    myHistoryArr = bets.map(b => ({ ...b, round: roundMap.get(b.roundId) }));
    renderMyHistoryPage();
  } catch (err) {
    console.error(err.message);
  }
}
function renderMyHistoryPage() {
  const cont = document.getElementById("myHistory");
  const start = myPage * itemsPerPage, end = start + itemsPerPage;
  cont.innerHTML = '';
  myHistoryArr.slice(start, end).forEach(b => {
    const isNum = b.numberBet != null;
    const isBigSmall = b.bigSmallBet != null;
    const betValue = isNum ? b.numberBet : (isBigSmall ? b.bigSmallBet : b.colorBet);
    const betColorClass = isNum ? getWinGoColor(betValue) :
        isBigSmall ? (b.bigSmallBet === 'Big' ? 'red' : 'green') :
        (b.colorBet ? b.colorBet.toLowerCase() : '');
    const roundNumber = b.round?.resultNumber != null ? b.round.resultNumber : null;
    const roundColorClass = roundNumber != null ? getWinGoColor(roundNumber) : 'pending';
    let statusClass, statusText;
    if (roundNumber == null) { statusClass = "pending"; statusText = "Pending"; }
    else if (
      (b.colorBet && roundColorClass === b.colorBet.toLowerCase()) ||
      (isNum && b.numberBet === roundNumber) ||
      (isBigSmall && (
        (b.bigSmallBet === "Big" && roundNumber >= 5) ||
        (b.bigSmallBet === "Small" && roundNumber <= 4)
      ))
    ) { statusClass = "succeed"; statusText = "Succeed"; }
    else { statusClass = "failed"; statusText = "Failed"; }
    let net;
    if (statusClass === "succeed") {
      if (isNum) net = (b.contractAmount ?? (b.amount ?? 0)) * 9;
      else net = (b.contractAmount ?? (b.amount ?? 0)) * 2;
    } else if (statusClass === "failed") net = -(b.amount ?? 0);
    else net = 0;
    const amtText = `${net >= 0 ? "+" : "-"}₹${Math.abs(net).toFixed(2)}`;
    cont.innerHTML += `
      <div class="my-history-item">
        <div class="my-history-left">
          <div class="color-box ${betColorClass}">${isNum || isBigSmall ? betValue : ''}</div>
        </div>
        <div class="my-history-center">
          <div>${b.roundId}</div>
          <div>${b.timestamp ? new Date(b.timestamp).toLocaleString("en-IN",{hour12:false}) : ""}</div>
        </div>
        <div class="my-history-right">
          <div class="status ${statusClass}">${statusText}</div>
          <div class="amount ${statusClass}">${amtText}</div>
        </div>
      </div>`;
  });
  const tot = Math.ceil(myHistoryArr.length / itemsPerPage) || 1;
  document.getElementById("myHistoryPagination").innerHTML =
    (myPage > 0 ? `<button onclick="myPage--;renderMyHistoryPage()">Prev</button>` : "") +
    ` Page ${myPage + 1} of ${tot} ` +
    (myPage < tot - 1 ? `<button onclick="myPage++;renderMyHistoryPage()">Next</button>` : "");
}

document.addEventListener("DOMContentLoaded", () => {
  if (!requireLogin()) return;
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  wireBetModalControls();
  fetchWalletBalance();
  fetchCurrentRound();
  loadGameHistory();
  loadMyHistory();

  // ✅ Clock icon swap fix
  document.querySelectorAll(".round-tabs .tab").forEach(tab => {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".round-tabs .tab").forEach(t => {
        t.classList.remove("active");
        const img = t.querySelector("img");
        if (img) img.src = "assets/clock-inactive.png";
      });
      this.classList.add("active");
      const img = this.querySelector("img");
      if (img) img.src = "assets/clock-active.png";

      const label = this.querySelector("span").innerText.trim();
      document.querySelector(".game-type").innerText = label;
      selectedGameType = gameTypeMap[label] || "WIN30";
      fetchCurrentRound();
      loadGameHistory();
      loadMyHistory();
    });
  });

  setInterval(fetchCurrentRound, 3000);
  setInterval(loadGameHistory, 10000);
  setInterval(loadMyHistory, 10000);
});
