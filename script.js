
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

// DEMO LOGIN: Any non-empty email and password will work.
loginForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (email && password) {
    loginPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loginError.textContent = "";
  } else {
    loginError.textContent = "Please enter email and password.";
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
    // DEMO ONLY: 15% simulated green, 85% simulated red.
    // This is not cryptographic signature verification.
    const verified = Math.random() < 0.15;

    showResult(verified, selectedFile.name);

    verifyBtn.disabled = false;
    verifyBtn.textContent = "Verify Document";
  }, 1800);
});

function playTone(frequency, duration, delay = 0) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();

  audioContext.resume().then(() => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    const start = audioContext.currentTime + delay;
    gain.gain.setValueAtTime(0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    oscillator.start(start);
    oscillator.stop(start + duration);

    setTimeout(() => audioContext.close(), (delay + duration) * 1000 + 200);
  }).catch(() => {});
}

function playResultSound(verified) {
  if (verified) {
    playTone(880, 0.18);
    playTone(1175, 0.25, 0.2);
  } else {
    playTone(300, 0.35);
  }
}

function showResult(verified, fileName) {
  playResultSound(verified);

  const box = document.getElementById("resultBox");
  box.className = "result-box " + (verified ? "verified" : "not-verified");

  document.getElementById("resultIcon").textContent = verified ? "✓" : "✕";
  document.getElementById("resultTitle").textContent =
    verified ? "VERIFIED" : "NOT VERIFIED";

  document.getElementById("resultMessage").textContent =
    verified
      ? "Simulated demo result only. No cryptographic validation was performed."
      : "Demo result only. No genuine digital signature verification was performed.";

  box.classList.remove("hidden");

  history.unshift({
    name: fileName,
    status: verified ? "VERIFIED (DEMO)" : "NOT VERIFIED",
    time: new Date().toLocaleTimeString()
  });

  updateDashboard();
}

function updateDashboard() {
  document.getElementById("totalScans").textContent = history.length;
  document.getElementById("verifiedCount").textContent =
    history.filter(item => item.status === "VERIFIED (DEMO)").length;
  document.getElementById("failedCount").textContent =
    history.filter(item => item.status === "NOT VERIFIED").length;

  const list = document.getElementById("historyList");
  list.replaceChildren();

  if (!history.length) {
    const empty = document.createElement("p");
    empty.className = "empty-history";
    empty.textContent = "No documents scanned yet.";
    list.appendChild(empty);
    return;
  }

  history.forEach(item => {
    const row = document.createElement("div");
    row.className = "history-item";

    const name = document.createElement("span");
    name.textContent = item.name;

    const status = document.createElement("span");
    status.className = "history-status " +
      (item.status === "VERIFIED (DEMO)" ? "green" : "red");
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
  if (cameraStream) {
    stopCamera();
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Camera needs HTTPS or localhost. Please run with VS Code Live Server.");
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });

    camera.srcObject = cameraStream;
    await camera.play();

    camera.classList.remove("hidden");
    captureBtn.classList.remove("hidden");
    cameraBtn.textContent = "Close Camera";
  } catch (error) {
    alert("Camera could not open: " + error.message +
      ". Check Chrome camera permission.");
    stopCamera();
  }
});

captureBtn.addEventListener("click", () => {
  if (!camera.videoWidth) return;

  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  canvas.getContext("2d").drawImage(camera, 0, 0);

  canvas.toBlob(blob => {
    if (!blob) {
      alert("Could not capture image. Please try again.");
      return;
    }

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
