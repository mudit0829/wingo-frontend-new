const apiUrl = "https://wingo-backend-nqk5.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = 'login.html';

  // Fetch user profile (email, optionally name)
  try {
    const res = await fetch(`${apiUrl}/api/users/profile`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      document.getElementById("profileEmail").textContent = data.email || "(No email)";
      // If you add name field in HTML, set it here as well
    } else {
      document.getElementById("profileEmail").textContent = "(Error fetching profile)";
    }
  } catch {
    document.getElementById("profileEmail").textContent = "(Error fetching profile)";
  }

  // Fetch wallet balance
  try {
    const res = await fetch(`${apiUrl}/api/users/wallet`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      document.getElementById("walletAmount").textContent = "₹" + (Number(data.wallet) || 0).toFixed(2);
    } else {
      document.getElementById("walletAmount").textContent = "₹0.00";
    }
  } catch {
    document.getElementById("walletAmount").textContent = "₹0.00";
  }

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
