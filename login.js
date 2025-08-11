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
      if (res.status === 401) throw new Error("Invalid email or password");
      throw new Error(`Login failed (${res.status})`);
    }

    const data = await res.json();
    // Expected backend response: { token: "...", user: { email: "...", ... } }

    localStorage.setItem("token", data.token);
    localStorage.setItem("userEmail", data.user.email);

    alert("Login successful!");
    window.location.href = "index1.html"; // send to your game page
  } catch (err) {
    console.error("Login error:", err.message);
    alert(err.message);
  }
}
