const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

function toggleForms() {
  loginForm.style.display =
    loginForm.style.display === "none" ? "block" : "none";
  registerForm.style.display =
    registerForm.style.display === "none" ? "block" : "none";
}

function moveToBlog() {
  window.location.replace("./blog.html");
}

async function registerUser() {
  const username = document.getElementById("registerUsername").value;
  const password = document.getElementById("registerPassword").value;

  const response = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    alert("Registration successful! You can now login.");
    moveToBlog();
    toggleForms();
  } else {
    const errorData = await response.json();
    alert("Error: " + errorData.message);
  }
}

async function loginUser() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem("token", data.token); // Store JWT token
    alert("Login successful!");
    moveToBlog();
    // Redirect or load the main page
  } else {
    const errorData = await response.json();
    alert("Login failed: " + errorData.message);
  }
}
