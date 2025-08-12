const apiUrl = "https://wingo-backend-nqk5.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = 'login.html';

  // Try getting user email from backend (otherwise fallback to local storage)
  let email = localStorage.getItem("userEmail");
  if (!email) {
    try {
      const res = await fetch(`${apiUrl}/api/users/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        email = data.email;
        localStorage.setItem("userEmail", email);
      }
    } catch {}
  }
  document.getElementById("profileEmail").textContent = email || "(No email)";

  // Wallet value
  try {
    const r = await fetch(`${apiUrl}/api/users/wallet`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (r.ok) {
      const d = await r.json();
      document.getElementById("walletAmount").textContent = "₹" + parseFloat(d.wallet || 0).toFixed(2);
    }
  } catch {}

  // Logout
  document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    window.location.href = "login.html";
  };

  // Navigation handlers
  window.openDeposit = () => window.location.href = "deposit.html";
  window.openWithdraw = () => window.location.href = "withdraw.html";
  window.openGameHistory = () => window.location.href = "game-history.html";
  window.openTransactionHistory = () => window.location.href = "transaction-history.html";
  window.openDepositHistory = () => window.location.href = "deposit-history.html";
  window.openWithdrawHistory = () => window.location.href = "withdraw-history.html";
});
