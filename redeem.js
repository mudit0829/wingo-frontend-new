const walletBalanceElem = document.getElementById('walletBalance');
const betBalanceElem = document.getElementById('betBalance');
const winningBalanceElem = document.getElementById('winningBalance');
const redeemableBalanceElem = document.getElementById('redeemableBalance');
const redeemInput = document.getElementById('redeemAmount');
const redeemBtn = document.getElementById('redeemBtn');
const messageDiv = document.getElementById('message');

// Fetch current user balances from backend
async function fetchBalances() {
  try {
    const res = await fetch('https://wingo-backend-nqk5.onrender.com/api/users/balances', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch balances');
    const data = await res.json();
    return data;
  } catch (err) {
    messageDiv.textContent = `Error fetching balance: ${err.message}`;
    return null;
  }
}

function calculateRedeemable(winningBalance, walletBalance) {
  let redeemable = winningBalance - walletBalance;
  if (redeemable < 0) redeemable = 0;
  return redeemable;
}

async function updateBalances() {
  const data = await fetchBalances();
  if (!data) return;
  
  const { walletBalance, betBalance, winningBalance } = data;
  
  walletBalanceElem.textContent = walletBalance;
  betBalanceElem.textContent = betBalance;
  winningBalanceElem.textContent = winningBalance;
  
  const redeemable = calculateRedeemable(winningBalance, walletBalance);
  redeemableBalanceElem.textContent = redeemable;

  redeemInput.max = redeemable;
  redeemInput.value = redeemable > 0 ? redeemable : '';
  redeemBtn.disabled = redeemable <= 0;
}

redeemBtn.addEventListener('click', async () => {
  const amount = Number(redeemInput.value);
  const redeemable = Number(redeemableBalanceElem.textContent);

  if (amount <= 0 || amount > redeemable) {
    messageDiv.textContent = 'Please enter valid redeem amount.';
    return;
  }

  try {
    messageDiv.textContent = 'Processing redeem request...';
    
    const res = await fetch('https://wingo-backend-nqk5.onrender.com/api/users/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ amount }),
    });
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || 'Redeem failed');
    }
    
    messageDiv.textContent = `Successfully redeemed ${amount} points!`;
    
    // Refresh balances after redeem
    await updateBalances();
  } catch (err) {
    messageDiv.textContent = `Redeem error: ${err.message}`;
  }
});

// Initialize display
updateBalances();
