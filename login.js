const apiUrl = "https://wingo-backend-nqk5.onrender.com";

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  .then(res => {
    if (!res.ok) throw new Error("Login failed");
    return res.json();
  })
  .then(data => {
    // data should contain { token, user }
    localStorage.setItem("token", data.token);
    localStorage.setItem("userEmail", data.user.email);
    alert("Login successful!");
    window.location.href = "index1.html"; // Adjust to your main game page filename
  })
  .catch(err => {
    alert("Login failed: " + err.message);
  });
}
