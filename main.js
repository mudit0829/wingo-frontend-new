const apiUrl = "https://wingo-backend-nqk5.onrender.com";

let currentRoundId = "", roundEndTime = null, selectedBetType = null, selectedBetValue = null;
let selectedDenom = 1, selectedMultiplier = 1, selectedGameType = "WIN30";
let gameHistoryArr = [], myHistoryArr = [];
let gamePage = 0, myPage = 0;
const itemsPerPage = 20;

const gameTypeMap = {
  "WinGo 30sec": "WIN30",
  "WinGo 1 Min": "WIN1",
  "WinGo 3 Min": "WIN3",
  "WinGo 5 Min": "WIN5"
};

// == Auth / Utility ==
function getToken() { return localStorage.getItem("token") || null; }
function requireLogin() { if (!getToken()) { window.location.href = "login.html"; return false; } return true; }
async function authFetch(url, options = {}) {
  const token = getToken();
  if (!token) { window.location.href = "login.html"; return; }
  options.headers = { ...(options.headers || {}), "Authorization": `Bearer ${token}` };
  const res = await fetch(url, options);
  if (res.status === 401) { localStorage.clear(); window.location.href = "login.html"; return; }
  return res;
}
function logout() { localStorage.clear(); window.location.href = "login.html"; }
function getWinGoColor(n) {
  n = Number(n);
  if (n === 0 || n === 5) return "violet";
  if ([1, 3, 7, 9].includes(n)) return "green";
  if ([2, 4, 6, 8].includes(n)) return "red";
  return "";
}

// == Tab switching ==
function showTab(id, btn) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("gameHistoryPagination").style.display = id === "gameHistory" ? "" : "none";
  document.getElementById("myHistoryPagination").style.display = id === "myHistory" ? "" : "none";
}
window.showTab = showTab;

// == Bet triggers ==
function selectColor(c) { openBetPopup("color", c); }
function selectNumber(n) { openBetPopup("number", n); }
function selectBigSmall(v) { openBetPopup("bigSmall", v); }
window.selectColor = selectColor;
window.selectNumber = selectNumber;
window.selectBigSmall = selectBigSmall;

// == Multiplier selection ==
function selectMultiplier(m) {
  document.querySelectorAll(".multiplier-btn").forEach(btn => btn.classList.remove("active"));
  const btn = Array.from(document.querySelectorAll(".multiplier-btn")).find(b => b.textContent.trim() === m);
  if (btn) btn.classList.add("active");
  selectedMultiplier = Number(m.replace("X", "")) || 1;
  selectedDenom = selectedMultiplier;
  updatePopupTotal();
}

// == Bet popup ==
function openBetPopup(t, c) {
  selectedBetType = t;
  selectedBetValue = c;
  const header = document.getElementById("betHeader");
  if (t === "color" || t === "number") {
    header.className = "bet-header " + getWinGoColor(c);
  } else {
    header.className = "bet-header";
  }
  document.getElementById("betChoiceText").textContent = `Select ${c}`;
  selectedMultiplier = 1; selectedDenom = 1;
  document.getElementById("betQty").value = 1;
  document.querySelectorAll(".multiplier-btn").forEach(btn => btn.classList.toggle("active", btn.textContent.trim() === "X1"));
  document.querySelectorAll(".bet-buttons button[data-balance]").forEach(btn => btn.classList.toggle("active", btn.dataset.balance === "1"));
  updatePopupTotal();
  document.getElementById("betModal").classList.remove("hidden");
}
function closeBetPopup() { document.getElementById("betModal").classList.add("hidden"); }
window.closeBetPopup = closeBetPopup;

// == Popup controls ==
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
    btn.addEventListener("click", () => selectMultiplier('X' + btn.dataset.mult))
  );
  document.getElementById("qtyPlus").onclick = () => { document.getElementById("betQty").value++; updatePopupTotal(); };
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

// == Place bet ==
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
    if (!res || !res.ok) throw new Error((await res.json()).message || "Bet failed");
    const data = await res.json();
    alert(`✅ Bet placed! New wallet balance: ₹${data.newWalletBalance}`);
    fetchWalletBalance();
    loadMyHistory();
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
  closeBetPopup();
}

// == Wallet ==
async function fetchWalletBalance() {
  if (!requireLogin()) return;
  try {
    const r = await authFetch(`${apiUrl}/api/users/wallet`);
    if (!r.ok) throw 0;
    const d = await r.json();
    document.getElementById("walletAmount").innerText = parseFloat(d.wallet || 0).toFixed(2);
  } catch {}
}

// == Current round ==
async function fetchCurrentRound() {
  try {
    const r = await fetch(`${apiUrl}/api/rounds/current?gameType=${selectedGameType}`);
    if (!r.ok) return;
    const round = await r.json();
    if (!round?.roundId) return;
    currentRoundId = round.roundId;
    roundEndTime = new Date(round.endTime).getTime();
    document.getElementById("roundId").textContent = round.roundId;
  } catch (err) { console.error(err.message); }
}

// == Countdown ==
setInterval(() => {
  if (!roundEndTime) return;
  const rem = Math.max(0, Math.floor((roundEndTime - Date.now()) / 1000));
  document.getElementById("timeDigits").textContent =
    `${String(Math.floor(rem / 60)).padStart(2, "0")}:${String(rem % 60).padStart(2, "0")}`;
}, 1000);

// == Game history ==
async function loadGameHistory() {
  try {
    const r = await fetch(`${apiUrl}/api/rounds?gameType=${selectedGameType}`);
    if (!r.ok) return;
    let rounds = await r.json();
    const seen = new Set();
    rounds = rounds.filter(rr => !seen.has(rr.roundId) && seen.add(rr.roundId));
    gameHistoryArr = rounds;
    renderGameHistoryPage();
  } catch {}
}
function renderGameHistoryPage() {
  const cont = document.getElementById("gameHistory");
  cont.innerHTML = `<table class="history-table"><tr><th>Period</th><th>Number</th><th>Big Small</th><th>Color</th></tr></table>`;
  gameHistoryArr.forEach(r => {
    const num = r.resultNumber ?? "-", col = getWinGoColor(num), bs = num === "-" ? "-" : (num >= 5 ? "Big" : "Small");
    cont.querySelector("table").innerHTML += `<tr>
      <td>${r.roundId}</td>
      <td><span class="history-number ${col}">${num}</span></td>
      <td>${bs}</td>
      <td><span class="dot ${col}"></span></td></tr>`;
  });
}

// == My history (use win & netAmount) ==
async function loadMyHistory() {
  if (!requireLogin()) return;
  try {
    const betsR = await authFetch(`${apiUrl}/api/bets/user?gameType=${selectedGameType}`);
    if (!betsR.ok) return;
    myHistoryArr = await betsR.json();
    renderMyHistoryPage();
    fetchWalletBalance();
  } catch {}
}
function renderMyHistoryPage() {
  const cont = document.getElementById("myHistory");
  cont.innerHTML = '';
  myHistoryArr.forEach(b => {
    let statusClass, statusText;
    if (b.win === true) { statusClass = "succeed"; statusText = "Succeed"; }
    else if (b.win === false) { statusClass = "failed"; statusText = "Failed"; }
    else { statusClass = "pending"; statusText = "Pending"; }

    const net = b.netAmount ?? 0;
    const betValue = b.numberBet != null ? b.numberBet : (b.bigSmallBet || b.colorBet);
    const betColorClass = b.numberBet != null ? getWinGoColor(betValue) :
      b.bigSmallBet ? (b.bigSmallBet === 'Big' ? 'red' : 'green') :
      (b.colorBet ? b.colorBet.toLowerCase() : '');

    cont.innerHTML += `
      <div class="my-history-item">
        <div class="my-history-left"><div class="color-box ${betColorClass}">${b.numberBet != null || b.bigSmallBet != null ? betValue : ''}</div></div>
        <div class="my-history-center"><div>${b.roundId}</div><div>${b.timestamp ? new Date(b.timestamp).toLocaleString("en-IN",{hour12:false}) : ""}</div></div>
        <div class="my-history-right"><div class="status ${statusClass}">${statusText}</div><div class="amount ${statusClass}">${net>=0?'+':'-'}₹${Math.abs(net).toFixed(2)}</div></div>
      </div>`;
  });
}

// == Init ==
document.addEventListener("DOMContentLoaded", () => {
  if (!requireLogin()) return;
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  wireBetModalControls();
  fetchWalletBalance();
  fetchCurrentRound();
  loadGameHistory();
  loadMyHistory();
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
