const apiUrl = "https://wingo-backend-nqk5.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = 'index.html';

  // Fetch user profile (email)
  try {
    const res = await fetch(`${apiUrl}/api/users/profile`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      document.getElementById("profileEmail").textContent = data.email || "(No email)";
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

  // Logout button handler
  document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    window.location.href = "index.html";
  };

  // Navigation handlers (only two as requested)
  window.openGameHistory = () => window.location.href = "game-history.html";
  window.openTransactionHistory = () => window.location.href = "transaction-history.html";

  // Back to game button (top left arrow)
  const backBtn = document.getElementById("backToGameBtn");
  if (backBtn) {
    backBtn.onclick = function() {
      window.location.href = "index.html";
    };
  }
});
