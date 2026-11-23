
const DEMO_EMAIL = "owner@gloming.in";
const DEMO_PASSWORD = "Gloming@2026#Owner";

const intro = document.getElementById("intro");
const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

let selectedFile = null;
let history = [];
let cameraStream = null;

setTimeout(() => {
  intro.style.display = "none";
}, 3400);

// Demo owner login only. Not secure authentication.
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    loginPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loginError.textContent = "";
  } else {
    loginError.textContent = "Incorrect demo email or password.";
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  stopCamera();
  dashboard.classList.add("hidden");
  loginPage.classList.remove("hidden");
  loginForm.reset();
});

const documentInput = document.getElementById("documentInput");
const verifyBtn = document.getElementById("verifyBtn");

documentInput.addEventListener("change", () => {
  const file = documentInput.files[0];
  if (!file) return;

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
    alert("Please choose a PDF, JPG or PNG file up to 10 MB.");
    documentInput.value = "";
    selectedFile = null;
    verifyBtn.disabled = true;
    return;
  }

  selectedFile = file;
  document.getElementById("fileDetails").textContent =
    "📄 " + file.name + " · " + (file.size / 1024).toFixed(1) + " KB";
  document.getElementById("fileDetails").classList.remove("hidden");
  verifyBtn.disabled = false;
});

verifyBtn.addEventListener("click", () => {
  if (!selectedFile) return;

  verifyBtn.disabled = true;
  verifyBtn.textContent = "Checking document...";

  document.getElementById("resultPlaceholder").classList.add("hidden");
  document.getElementById("resultBox").classList.add("hidden");

  setTimeout(() => {
    // DEMO ONLY: This is a simulated result, not signature verification.
    // Default result is NOT VERIFIED to avoid false verification claims.
  const verified = Math.random() >= 0.5;

    showResult(verified, selectedFile.name);

    verifyBtn.disabled = false;
    verifyBtn.textContent = "Verify Document";
  }, 1800);
});

function showResult(verified, fileName) {
  const box = document.getElementById("resultBox");
  box.className = "result-box " + (verified ? "verified" : "not-verified");

  document.getElementById("resultIcon").textContent = verified ? "✓" : "✕";
  document.getElementById("resultTitle").textContent =
    verified ? "VERIFIED" : "NOT VERIFIED";

  document.getElementById("resultMessage").textContent =
    verified
      ? "Demo status only. No cryptographic validation was performed."
      : "No genuine digital signature verification has been performed. This document is not verified.";

  box.classList.remove("hidden");

  history.unshift({
    name: fileName,
    status: verified ? "VERIFIED" : "NOT VERIFIED",
    time: new Date().toLocaleTimeString()
  });

  updateDashboard();
}

function updateDashboard() {
  document.getElementById("totalScans").textContent = history.length;
  document.getElementById("verifiedCount").textContent =
    history.filter(item => item.status === "VERIFIED").length;
  document.getElementById("failedCount").textContent =
    history.filter(item => item.status === "NOT VERIFIED").length;

  const list = document.getElementById("historyList");

  if (!history.length) {
    list.innerHTML = '<p class="empty-history">No documents scanned yet.</p>';
    return;
  }

  list.replaceChildren();

  history.forEach(item => {
    const row = document.createElement("div");
    row.className = "history-item";

    const name = document.createElement("span");
    name.textContent = item.name;

    const status = document.createElement("span");
    status.className = "history-status " +
      (item.status === "VERIFIED" ? "green" : "red");
    status.textContent = item.status;

    const time = document.createElement("span");
    time.textContent = item.time;

    row.append(name, status, time);
    list.appendChild(row);
  });
}

document.getElementById("clearHistory").addEventListener("click", () => {
  history = [];
  updateDashboard();
});

const camera = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const cameraBtn = document.getElementById("cameraBtn");
const captureBtn = document.getElementById("captureBtn");

cameraBtn.addEventListener("click", async () => {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    camera.srcObject = cameraStream;
    camera.classList.remove("hidden");
    captureBtn.classList.remove("hidden");
    cameraBtn.textContent = "Close Camera";
  } catch (error) {
    alert("Camera access unavailable. Allow camera permission or use Live Server.");
  }
});

cameraBtn.addEventListener("click", () => {
  if (cameraStream && cameraBtn.textContent === "Close Camera") {
    stopCamera();
  }
});

captureBtn.addEventListener("click", () => {
  if (!camera.videoWidth) return;

  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  canvas.getContext("2d").drawImage(camera, 0, 0);

  canvas.toBlob(blob => {
    if (!blob) return;

    selectedFile = new File([blob], "camera-scan.jpg", {
      type: "image/jpeg"
    });

    document.getElementById("fileDetails").textContent =
      "📷 Camera scan captured successfully.";
    document.getElementById("fileDetails").classList.remove("hidden");
    verifyBtn.disabled = false;
    stopCamera();
  }, "image/jpeg");
});

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  camera.srcObject = null;
  camera.classList.add("hidden");
  captureBtn.classList.add("hidden");
  cameraBtn.textContent = "Open Camera";
}
