const apiUrl = "https://wingo-backend-nqk5.onrender.com";
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const togglePassBtn = document.getElementById('togglePass');

// Enable/disable login button
function checkForm() {
  const emailValid = /^[\w\-.]+@[\w\-.]+\.[a-z]{2,}$/i.test(emailInput.value.trim());
  const passValid = passwordInput.value.trim().length > 0;
  if (emailValid && passValid) {
    loginBtn.disabled = false;
    loginBtn.classList.add('active');
  } else {
    loginBtn.disabled = true;
    loginBtn.classList.remove('active');
  }
}
emailInput.addEventListener('input', checkForm);
passwordInput.addEventListener('input', checkForm);

// Show/hide password
togglePassBtn.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePassBtn.style.backgroundImage = isPassword
    ? "url('assets/eye-open.png')"
    : "url('assets/eye-closed.png')";
});

// Handle login
document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    // Save token
    localStorage.setItem("token", data.token);
    window.location.href = "index.html";
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
});
