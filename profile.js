const apiUrl = "https://wingo-backend-nqk5.onrender.com";

// On load, show email and wallet amount
document.addEventListener("DOMContentLoaded", async () => {
  // Show the logged-in user's email at top
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = 'login.html';

  // Example: get user's email from backend or local storage
  // (You may need to fetch user profile depending on your system)
  let email = localStorage.getItem("userEmail");
  if (!email) {
    // Try to fetch email from backend
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

  // Wallet
  try {
    const r = await fetch(`${apiUrl}/api/users/wallet`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (r.ok) {
      const d = await r.json();
      document.getElementById("walletAmount").textContent = "₹" + parseFloat(d.wallet || 0).toFixed(2);
    }
  } catch {}

  // Logout Handler
  document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    window.location.href = "login.html";
  };

  // Example Handlers — link to your game/transaction/deposit pages
  window.openDeposit = () => window.location.href = "deposit.html";
  window.openWithdraw = () => window.location.href = "withdraw.html";
  window.openGameHistory = () => window.location.href = "game-history.html";
  window.openTransactionHistory = () => window.location.href = "transaction-history.html";
  window.openDepositHistory = () => window.location.href = "deposit-history.html";
  window.openWithdrawHistory = () => window.location.href = "withdraw-history.html";
});
