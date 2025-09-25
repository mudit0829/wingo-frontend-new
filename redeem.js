// MOCK user data (replace with your API calls)
const walletBalance = 500;
const betBalance = 200;
const winningBalance = 2700;

const walletBalanceElem = document.getElementById('walletBalance');
const betBalanceElem = document.getElementById('betBalance');
const winningBalanceElem = document.getElementById('winningBalance');
const redeemableBalanceElem = document.getElementById('redeemableBalance');
const redeemInput = document.getElementById('redeemAmount');
const redeemBtn = document.getElementById('redeemBtn');
const messageDiv = document.getElementById('message');

function calculateRedeemable() {
  // Redeemable points = (winningBalance) - (walletBalance)
  let redeemable = winningBalance - walletBalance;
  return Math.max(0, redeemable);
}

function updateBalances() {
  walletBalanceElem.textContent = walletBalance;
  betBalanceElem.textContent = betBalance;
  winningBalanceElem.textContent = winningBalance;

  const redeemable = calculateRedeemable();
  redeemableBalanceElem.textContent = redeemable;

  redeemInput.max = redeemable;
  redeemInput.value = redeemable > 0 ? redeemable : '';
  redeemBtn.disabled = redeemable <= 0;
}

redeemBtn.addEventListener('click', () => {
  const redeemAmount = Number(redeemInput.value);
  const redeemable = calculateRedeemable();

  if (redeemAmount <= 0 || redeemAmount > redeemable) {
    messageDiv.textContent = 'Invalid redeem amount.';
    return;
  }

  // Call your backend redeem API here with redeemAmount
  mockRedeemAPI(redeemAmount);
});

function mockRedeemAPI(amount) {
  // Simulate API call
  messageDiv.textContent = 'Processing redeem request...';
  setTimeout(() => {
    messageDiv.textContent = `Successfully redeemed ${amount} points!`;
    // In real app, update balances here after server response
    // For demo: update winningBalance and balances display
    winningBalance -= amount;
    updateBalances();
  }, 1500);
}

// Initialize display
updateBalances();
