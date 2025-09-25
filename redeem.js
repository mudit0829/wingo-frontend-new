// *********** Replace below mock data with your real API fetched values *********** //
let walletBalance = 500;   // Total points loaded
let betBalance = 200;      // Points bet/lost - you can adjust with your losses
let winningBalance = 2700; // Points won (sum of all wins)

const walletBalanceElem = document.getElementById('walletBalance');
const betBalanceElem = document.getElementById('betBalance');
const winningBalanceElem = document.getElementById('winningBalance');
const redeemableBalanceElem = document.getElementById('redeemableBalance');
const redeemInput = document.getElementById('redeemAmount');
const redeemBtn = document.getElementById('redeemBtn');
const messageDiv = document.getElementById('message');

function calculateRedeemable() {
  // Redeemable = Winning - Wallet Load (Deposit)
  let redeemable = winningBalance - walletBalance;
  if (redeemable < 0) redeemable = 0;
  return redeemable;
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
  const amount = Number(redeemInput.value);
  const redeemable = calculateRedeemable();
  if (amount <= 0 || amount > redeemable) {
    messageDiv.textContent = 'Please enter valid redeem amount.';
    return;
  }
  messageDiv.textContent = 'Processing redeem request...';

  // Simulate API call for redeem - replace with your backend call
  setTimeout(() => {
    messageDiv.textContent = `Successfully redeemed ${amount} points!`;
    // Update winning balance accordingly (sandbox)
    winningBalance -= amount;
    updateBalances();
  }, 1500);
});

// Initialize display
updateBalances();
