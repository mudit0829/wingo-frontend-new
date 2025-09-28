const apiUrl = "https://wingo-backend-nqk5.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  fetchRedeemData(token);

  document.getElementById("redeemForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const points = Number(document.getElementById("redeemAmount").value);
    if (points <= 0) {
      alert("Please enter a valid redeem amount.");
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/users/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ points })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Redeem failed");

      alert(`Redeem successful! You redeemed ${data.redeemed} points. New wallet balance: ${data.wallet}`);
      
      // Refresh displayed data
      fetchRedeemData(token);

      // Clear input
      document.getElementById("redeemAmount").value = '';
    } catch (err) {
      alert("Error: " + err.message);
    }
  });
});

async function fetchRedeemData(token) {
  try {
    // Fetch wallet and redeem history (assuming redeemHistory in the wallet API or separate API)
    const res = await fetch(`${apiUrl}/api/users/wallet`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch wallet data");
    const walletData = await res.json();

    // Show redeemable balance
    const balance = walletData.wallet || 0;
    document.getElementById("redeemableBalance").textContent = balance.toFixed(2);

    // Renew redeem history display
    let redeemHistory = walletData.redeemHistory || [];

    // If not in walletData, you may fetch from separate endpoint and adjust here

    const list = document.getElementById("historyList");
    list.innerHTML = "";
    if (redeemHistory.length === 0) {
      list.innerHTML = '<li style="color:#c2a935;text-align:center;">No redemption yet.</li>';
    } else {
      redeemHistory.forEach(entry => {
        const li = document.createElement("li");
        const date = new Date(entry.date);
        li.innerHTML = `<span class="hist-date">${date.toLocaleDateString()}</span> <span class="hist-amount">-${entry.points || entry.amount}</span>`;
        list.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Fetch redeem data error:", err);
    document.getElementById("redeemableBalance").textContent = "0.00";
    document.getElementById("historyList").innerHTML = '<li style="color:#c2a935;text-align:center;">Cannot fetch redeem data.</li>';
  }
}
