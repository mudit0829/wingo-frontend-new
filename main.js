const apiUrl = "https://wingo-backend-nqk5.onrender.com";

let currentRoundId = "", roundEndTime = null, selectedBetType = null, selectedBetValue = null;
let selectedDenom = 1, selectedMultiplier = 1, selectedGameType = "WIN30";
let gameHistoryArr = [], myHistoryArr = [];
let gamePage = 0, myPage = 0;
const itemsPerPage = 20;
const maxPages = 50;

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

// == Bet buttons controls ==
function disableAllBetButtons() {
  document.querySelectorAll("button.color-btn, img.number-ball, button.bigsmall-btn, button.multiplier-btn").forEach(elem => {
    elem.disabled = true;
    elem.style.pointerEvents = "none";
    elem.style.opacity = 0.5;
  });
}

function enableAllBetButtons() {
  document.querySelectorAll("button.color-btn, img.number-ball, button.bigsmall-btn, button.multiplier-btn").forEach(elem => {
    elem.disabled = false;
    elem.style.pointerEvents = "";
    elem.style.opacity = 1;
  });
}

// == Loading animation for bet close ==
function showLoadingAnimation() {
  const overlay = document.getElementById("betClosedOverlay");
  if (!overlay) return;
  overlay.style.display = "flex";
  let count = 5;
  const countdownDiv = document.getElementById("betClosedCountdown");
  countdownDiv.textContent = count;

  let interval = setInterval(() => {
    count--;
    countdownDiv.textContent = count;
    if (count <= 0) {
      clearInterval(interval);
    }
  }, 1000);
}

function hideLoadingAnimation() {
  const overlay = document.getElementById("betClosedOverlay");
  if (!overlay) return;
  overlay.style.display = "none";
}

// == Timer logic ==
let timer = 30; // starting timer for 30 seconds
let betClosed = false;
let timerInterval = null;

function startTimer() {
  if(timerInterval) clearInterval(timerInterval);
  timer = 30;
  betClosed = false;

  enableAllBetButtons();
  hideLoadingAnimation();

  timerInterval = setInterval(() => {
    const timeDigits = document.getElementById("timeDigits");
    const minutes = Math.floor(timer / 60).toString().padStart(2, "0");
    const seconds = (timer % 60).toString().padStart(2, "0");
    timeDigits.textContent = `${minutes}:${seconds}`;

    if (timer === 5) {
      betClosed = true;
      disableAllBetButtons();
      showLoadingAnimation();
    }
    if (timer === 0) {
      hideLoadingAnimation();
      enableAllBetButtons();
      timer = 30; // reset timer

      // Fetch new round info here to sync and start fresh
      fetchCurrentRound();

      // Reset game histories or other UI if needed here
      loadGameHistory();
      loadMyHistory();

    } else {
      timer--;
    }
  }, 1000);
}

// == Tab switching ==
function showTab(id, btn) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  if (id === "gameHistory") {
    document.getElementById("gameHistoryPagination").style.display = "";
    document.getElementById("myHistoryPagination").style.display = "none";
    gamePage = 0; 
    renderGameHistoryPage();
  } else if (id === "myHistory") {
    document.getElementById("myHistoryPagination").style.display = "";
    document.getElementById("gameHistoryPagination").style.display = "none";
    myPage = 0;
    renderMyHistoryPage();
  } else {
    document.getElementById("myHistoryPagination").style.display = "none";
    document.getElementById("gameHistoryPagination").style.display = "none";
  }
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
  if (qty < 1) { alert("Quantity must be at least 1."); return; }
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
      const err = await res.json();
      throw new Error(err.message || "Bet failed");
    }
    const data = await res.json();
    alert(`✅ Bet placed! New wallet balance: ${data.newWalletBalance}`);
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
    if (!r.ok) throw new Error('Failed to fetch wallet');
    const d = await r.json();
    document.getElementById("walletAmount").innerText = parseFloat(d.wallet || 0).toFixed(2);
  } catch (e) {
    console.error(e);
  }
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

    // Restart timer synced with server round end time
    if (roundEndTime) {
      startTimer();
    }
  } catch (err) { console.error(err.message); }
}

// == Countdown ==
// old countdown replaced by new timer logic

// Other functions remain unchanged (renderPagination, renderGameHistoryPage, etc)

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
  // removed old setInterval for countdown, as startTimer handles timer
  setInterval(fetchCurrentRound, 3000);
  setInterval(loadGameHistory, 10000);
  setInterval(loadMyHistory, 10000);
});
