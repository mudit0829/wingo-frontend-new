const token = localStorage.getItem('adminToken'); // Assumes you store admin JWT token here

const apiBase = 'https://your-backend-url/api';

async function fetchReports(startDate, endDate) {
  const url = new URL(`${apiBase}/admin/reports`);
  if (startDate) url.searchParams.append('startDate', startDate);
  if (endDate) url.searchParams.append('endDate', endDate);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch reports');
  return await res.json();
}

async function fetchUsers(role = '') {
  const url = new URL(`${apiBase}/admin/users`);
  if (role) url.searchParams.append('role', role);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return await res.json();
}

function displayReports(data) {
  document.getElementById('totalRecharge').textContent = data.totalRecharge.toFixed(2);
  document.getElementById('totalRedeem').textContent = data.totalRedeem.toFixed(2);
  document.getElementById('activeUsers').textContent = data.activeUsers;
  document.getElementById('inactiveUsers').textContent = data.inactiveUsers;
  document.getElementById('totalUsers').textContent = data.totalUsers;
}

function displayUsers(users) {
  const tbody = document.getElementById('userTable').querySelector('tbody');
  tbody.innerHTML = '';

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No users found.</td></tr>';
    return;
  }

  users.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user.name || '-'}</td>
      <td>${user.email || '-'}</td>
      <td>${user.role || '-'}</td>
      <td>${user.walletBalance?.toFixed(2) || '0.00'}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('btnLoadReports').addEventListener('click', async () => {
  const startDate = document.getElementById('dateStart').value;
  const endDate = document.getElementById('dateEnd').value;

  try {
    const reports = await fetchReports(startDate, endDate);
    displayReports(reports);
  } catch (err) {
    alert('Error loading reports: ' + err.message);
  }
});

document.getElementById('btnLoadUsers').addEventListener('click', async () => {
  const role = document.getElementById('roleFilter').value;
  try {
    const users = await fetchUsers(role);
    displayUsers(users);
  } catch (err) {
    alert('Error loading users: ' + err.message);
  }
});

// Initial load without filters
(async () => {
  try {
    const reports = await fetchReports();
    displayReports(reports);
    const users = await fetchUsers();
    displayUsers(users);
  } catch (err) {
    console.error('Initial load error:', err);
  }
})();
