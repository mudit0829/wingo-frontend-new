const apiUrl = "https://wingo-backend-nqk5.onrender.com";

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Login failed (${res.status})`);
    }

    const data = await res.json();

    // Store token & email
    localStorage.setItem("token", data.token);
    localStorage.setItem("userEmail", data.user.email);

    alert("Login successful!");
    window.location.href = "index1.html";
  } catch (err) {
    console.error("Login error:", err.message);
    alert("Login failed: " + err.message);
  }
}
