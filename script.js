
const DEMO_EMAIL = "GLOMINGOFFICIAL@GMAIL.COM";
const DEMO_PASSWORD = "SAHU0029";

const loginForm = document.getElementById("loginForm");
const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  if (
    email === DEMO_EMAIL.toLowerCase() &&
    password === DEMO_PASSWORD
  ) {
    loginPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loginError.textContent = "";
  } else {
    loginError.textContent = "Incorrect Gmail or Password!";
  }
});
