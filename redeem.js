// ------- Replace with real API integration --------
let redeemableBalance = 5000;

// Example redeem history:
let redeemHistory = [
  { date: '26-09-2025', amount: 2000 },
  { date: '22-09-2025', amount: 1500 },
  { date: '20-09-2025', amount: 700 }
];
// -------------------------------------------------

function updateBalances() {
  document.getElementById('redeemableBalance').textContent = redeemableBalance;
}

function updateHistory() {
  const list = document.getElementById('historyList');
  list.innerHTML = '';
  if (!redeemHistory.length) {
    list.innerHTML = '<li style="color:#c2a935;text-align:center;">No redemption yet.</li>';
    return;
  }
  redeemHistory.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="hist-date">${item.date}</span> <span class="hist-amount">-${item.amount}</span>`;
    list.appendChild(li);
  });
}

document.getElementById('redeemForm').onsubmit = e => {
  e.preventDefault();
  const val = Number(document.getElementById('redeemAmount').value);
  if (val > 0 && val <= redeemableBalance) {
    redeemableBalance -= val;
    redeemHistory.unshift({ date: new Date().toLocaleDateString('en-GB'), amount: val });
    updateBalances();
    updateHistory();
    document.getElementById('redeemAmount').value = '';
    alert('Redeem request submitted!');
  } else {
    alert('Enter a valid redeem amount!');
  }
};

updateBalances();
updateHistory();
