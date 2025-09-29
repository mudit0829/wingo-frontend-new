// API base - set according to your deployment
const apiBase = "https://wingo-backend-nqk5.onrender.com/api/admin";
const token = localStorage.getItem("token"); // Admin JWT

function apiFetch(url, method = "GET", body = null) {
  return fetch(url, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : null
  }).then(r => r.json());
}

// Sidebar nav
document.querySelectorAll('.admin-sidebar nav li').forEach(li => {
  li.onclick = function() {
    document.querySelectorAll('.admin-sidebar nav li').forEach(o => o.classList.remove('active'));
    li.classList.add('active');
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(li.dataset.section).classList.remove('hidden');
    // Auto load for each section
    if (li.dataset.section === "users") loadUsers();
    if (li.dataset.section === "agents") loadAgents();
    if (li.dataset.section === "wallet") loadWallet();
    if (li.dataset.section === "rounds") loadRounds();
    if (li.dataset.section === "bets") loadBets();
    if (li.dataset.section === "reports") loadReports();
  }
});

// --- USERS ---
async function loadUsers() {
  const c = document.getElementById("userTableContainer");
  c.innerHTML = "Loading...";
  const users = await apiFetch(`${apiBase}/users`);
  c.innerHTML = `
    <table>
      <tr>
        <th>Email</th><th>Role</th><th>Status</th><th>Wallet</th><th>Agent</th>
        <th>Actions</th>
      </tr>
      ${users.map(u => `
        <tr>
          <td>${u.email}</td>
          <td>${u.role}</td>
          <td>${u.blocked ? "Blocked" : "Active"}</td>
          <td>₹ ${u.wallet}</td>
          <td>${u.agentId || "-"}</td>
          <td>
            <button onclick="openWalletModal('${u._id}')">Wallet</button>
            <button onclick="openPromoteModal('${u._id}')">Promote</button>
            <button onclick="toggleBlockUser('${u._id}')">${u.blocked ? "Unblock" : "Block"}</button>
            <button onclick="deleteUser('${u._id}')">Delete</button>
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}

// --- CREATE USER ---
document.getElementById("btnNewUser").onclick = function() {
  showModal(`<h3>Create New User</h3>
    <label>Email</label><input id="newUserEmail"><label>Password</label><input type="password" id="newUserPassword">
    <button onclick="submitNewUser()">Create</button>
    <button onclick="closeModal()">Cancel</button>
  `);
};

window.submitNewUser = async function() {
  const email = document.getElementById("newUserEmail").value.trim();
  const password = document.getElementById("newUserPassword").value;
  if (!email || !password) return alert("Fill all fields!");
  const result = await apiFetch(`${apiBase}/users`, "POST", { email, password });
  if (result.error) { alert(result.error); return; }
  closeModal();
  loadUsers();
};

window.deleteUser = async function(id) {
  if (!confirm("Delete this user?")) return;
  await apiFetch(`${apiBase}/users/${id}`, "DELETE");
  loadUsers();
};

window.toggleBlockUser = async function(id) {
  await apiFetch(`${apiBase}/users/${id}/block`, "POST");
  loadUsers();
};

window.openPromoteModal = function(id) {
  showModal(`<h3>Promote User</h3>
    <label>Role</label>
    <select id="roleChoice"><option value="user">User</option><option value="admin">Admin</option><option value="agent">Agent</option></select>
    <button onclick="promoteUser('${id}')">Update</button>
    <button onclick="closeModal()">Cancel</button>
  `);
};
window.promoteUser = async function(id) {
  const role = document.getElementById("roleChoice").value;
  await apiFetch(`${apiBase}/users/${id}/role`, "POST", { role });
  closeModal(); loadUsers();
};

// --- WALLET ---
function loadWallet() {
  // Optionally implement a quick user wallet search and action
  document.getElementById("walletFormContainer").innerHTML = `
    <form onsubmit="event.preventDefault();searchWallet()">
      <label>User Email:</label>
      <input id="walletEmail" placeholder="email" style="margin-right:10px;">
      <button type="submit">Search</button>
    </form>
    <div id="walletUserOps"></div>
  `;
}
window.searchWallet = async function() {
  const email = document.getElementById('walletEmail').value.trim();
  if (!email) return;
  const r = await apiFetch(`${apiBase}/users?email=${encodeURIComponent(email)}`);
  if (!r || !Array.isArray(r) || r.length === 0) {
    document.getElementById('walletUserOps').innerHTML = 'User not found';
    return;
  }
  const u = r[0];
  document.getElementById('walletUserOps').innerHTML = `
    <div>
      <span>${u.email}</span> | <span>₹ ${u.wallet}</span>
      <form onsubmit="event.preventDefault();updateWallet('${u._id}')">
        <input id="walletAmt" type="number" step="1" placeholder="Amount (ex: 100)">
        <button type="submit">Add</button>
      </form>
    </div>
  `;
};
window.updateWallet = async function(id) {
  const amt = Number(document.getElementById("walletAmt").value || 0);
  await apiFetch(`${apiBase}/users/${id}/wallet`, "POST", { amount: amt });
  alert("Wallet updated!");
};
// --- AGENT list ---
async function loadAgents() {
  const c = document.getElementById("agentTableContainer");
  c.innerHTML = "Loading...";
  const agents = await apiFetch(`${apiBase}/agents`);
  c.innerHTML = `
    <table>
      <tr>
        <th>Email</th>
        <th>Wallet</th>
        <th>Commission</th>
        <th>Status</th>
      </tr>
      ${agents.map(a => `
        <tr>
          <td>${a.email}</td>
          <td>₹ ${a.wallet}</td>
          <td>₹ ${a.agentCommission || 0}</td>
          <td>${a.role}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

// --- GAME ROUNDS ---
async function loadRounds() {
  const c = document.getElementById("roundTableContainer");
  c.innerHTML = "Loading...";
  const rounds = await apiFetch(`${apiBase}/rounds`);
  c.innerHTML = `
    <table>
      <tr>
        <th>Round ID</th>
        <th>Status</th>
        <th>Result</th>
        <th>Actions</th>
      </tr>
      ${rounds.map(r => `
        <tr>
          <td>${r.roundId}</td>
          <td>${r.status || 'active'}</td>
          <td>${r.resultNumber !== undefined ? r.resultNumber : '-'}</td>
          <td>
            <button onclick="openEditRoundModal('${r._id}')">Edit</button>
            <button onclick="deleteRound('${r._id}')">Delete</button>
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}
window.openEditRoundModal = function(id) {
  showModal(`<h3>Edit Round</h3>
    <label>Result Number</label>
    <input id="roundResultNum" type="number" min="0" max="9">
    <button onclick="saveRoundResult('${id}')">Save</button>
    <button onclick="closeModal()">Cancel</button>
  `);
};
window.saveRoundResult = async function(id) {
  const n = parseInt(document.getElementById("roundResultNum").value, 10);
  await apiFetch(`${apiBase}/rounds/${id}/result`, "POST", { resultNumber: n });
  closeModal(); loadRounds();
};
window.deleteRound = async function(id) {
  if (!confirm("Delete this round?")) return;
  await apiFetch(`${apiBase}/rounds/${id}`, "DELETE");
  loadRounds();
};
// --- Add new round modal (simple demo) ---
document.getElementById("btnNewRound").onclick = () => {
  showModal(`<h3>Add Round</h3>
    <label>Game Type</label><input id="newGameType"><br>
    <label>Round ID</label><input id="newRoundId"><br>
    <button onclick="submitNewRound()">Add</button>
    <button onclick="closeModal()">Cancel</button>
  `);
};
window.submitNewRound = async function() {
  const gameType = document.getElementById("newGameType").value;
  const roundId = document.getElementById("newRoundId").value;
  await apiFetch(`${apiBase}/rounds`, "POST", { gameType, roundId });
  closeModal(); loadRounds();
};
// --- BETS ---
async function loadBets() {
  const c = document.getElementById("betTableContainer");
  c.innerHTML = "Loading...";
  const bets = await apiFetch(`${apiBase}/bets`);
  c.innerHTML = `
    <table>
      <tr><th>User</th><th>Game Type</th><th>Bet</th><th>Amount</th><th>Status</th></tr>
      ${bets.map(b => `
        <tr>
          <td>${b.email || b.userId}</td>
          <td>${b.gameType}</td>
          <td>${b.colorBet || b.numberBet || b.bigSmallBet || '-'}</td>
          <td>${b.amount}</td>
          <td>${b.win === true ? "Won" : b.win === false ? "Lost" : "Pending"}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

// --- REPORTS (demo) ---
function loadReports() {
  document.getElementById("reportContent").innerHTML = `
    <div>Profit/Loss Report: <button onclick="getPL()">Refresh</button></div>
    <div id="plData"></div>
  `;
}
window.getPL = async function() {
  const d = await apiFetch(`${apiBase}/profit-loss`);
  document.getElementById("plData").innerText =
    `Bets: ₹${d.totalBets} Distributed: ₹${d.totalDistributed} P/L: ₹${d.profit}`;
};

// --- Notifications ---
document.getElementById("notificationForm").onsubmit = async function(e) {
  e.preventDefault();
  const msg = document.getElementById("notifMsg").value.trim();
  if (msg === "") return;
  await apiFetch(`${apiBase}/notifications`, "POST", { message: msg });
  document.getElementById("notifMsg").value = '';
  alert("Notification sent!");
};

// --- Config Section ---
document.getElementById("configForm").onsubmit = async function(e) {
  e.preventDefault();
  const payoutRate = Number(document.getElementById("cfgPayout").value);
  const commFee = Number(document.getElementById("cfgComm").value);
  const timer = Number(document.getElementById("cfgTimer").value);
  await apiFetch(`${apiBase}/config`, "POST", { payoutRate, commFee, timer });
  alert("Config updated");
};

function showModal(html) {
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("modalBase").classList.remove("hidden");
}
function closeModal() {
  document.getElementById("modalBase").classList.add("hidden");
}

// Automatically load first section
loadUsers();
