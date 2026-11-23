
/* =====================================
   GLOMING DOCUMENT VERIFICATION DEMO
   ===================================== */

const intro = document.getElementById("intro");
const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

let selectedFile = null;
let history = [];
let cameraStream = null;

// INTRO ANIMATION
setTimeout(() => {
  if (intro) intro.style.display = "none";
}, 3400);


// =====================================
// DEMO LOGIN - ANY EMAIL AND PASSWORD
// =====================================

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


// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
  stopCamera();

  dashboard.classList.add("hidden");
  loginPage.classList.remove("hidden");

  loginForm.reset();
});


// =====================================
// DOCUMENT UPLOAD
// =====================================

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
    alert("Only PDF, JPG and PNG files up to 10 MB are allowed.");

    documentInput.value = "";
    selectedFile = null;
    verifyBtn.disabled = true;

    return;
  }

  selectedFile = file;

  const details = document.getElementById("fileDetails");

  details.textContent =
    "📄 " + file.name + " · " +
    (file.size / 1024).toFixed(1) + " KB";

  details.classList.remove("hidden");

  verifyBtn.disabled = false;
});


// =====================================
// DEMO VERIFICATION
// =====================================

verifyBtn.addEventListener("click", () => {

  if (!selectedFile) return;

  verifyBtn.disabled = true;
  verifyBtn.textContent = "Checking Document...";

  document.getElementById("resultPlaceholder")
    .classList.add("hidden");

  document.getElementById("resultBox")
    .classList.add("hidden");

  setTimeout(() => {

    // SIMULATED DEMO RESULT:
    // Approximately 15% green and 85% red.
    // This does NOT verify a real digital signature.
    const verified = Math.random() < 0.15;

    showResult(verified, selectedFile.name);

    verifyBtn.disabled = false;
    verifyBtn.textContent = "Verify Document";

  }, 1800);

});


// =====================================
// SOUND SYSTEM
// =====================================

function playTone(frequency, duration, delay = 0) {

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

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

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      start + duration
    );

    oscillator.start(start);
    oscillator.stop(start + duration);

    setTimeout(() => audioContext.close(), 1000);

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


// =====================================
// SHOW VERIFICATION RESULT
// =====================================

function showResult(verified, fileName) {

  playResultSound(verified);

  const box = document.getElementById("resultBox");

  box.className =
    "result-box " +
    (verified ? "verified" : "not-verified");

  document.getElementById("resultIcon").textContent =
    verified ? "✓" : "✕";

  document.getElementById("resultTitle").textContent =
    verified ? "VERIFIED" : "NOT VERIFIED";

  document.getElementById("resultMessage").textContent =
    verified
      ? "Simulated demo result only. No cryptographic validation was performed."
      : "Demo result only. No genuine digital signature verification was performed.";

  box.classList.remove("hidden");

  history.unshift({

    name: fileName,

    status: verified
      ? "VERIFIED (DEMO)"
      : "NOT VERIFIED",

    time: new Date().toLocaleTimeString()

  });

  updateDashboard();

}


// =====================================
// DASHBOARD HISTORY
// =====================================

function updateDashboard() {

  document.getElementById("totalScans").textContent =
    history.length;

  document.getElementById("verifiedCount").textContent =
    history.filter(item =>
      item.status === "VERIFIED (DEMO)"
    ).length;

  document.getElementById("failedCount").textContent =
    history.filter(item =>
      item.status === "NOT VERIFIED"
    ).length;

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

    status.className =
      "history-status " +
      (item.status === "VERIFIED (DEMO)"
        ? "green"
        : "red");

    status.textContent = item.status;

    const time = document.createElement("span");
    time.textContent = item.time;

    row.append(name, status, time);

    list.appendChild(row);

  });

}


// CLEAR HISTORY
document.getElementById("clearHistory")
  .addEventListener("click", () => {

    history = [];
    updateDashboard();

  });


// =====================================
// GLOMING CAMERA SCANNER
// =====================================

const camera = document.getElementById("camera");
const canvas = document.getElementById("canvas");

const cameraBtn = document.getElementById("cameraBtn");
const captureBtn = document.getElementById("captureBtn");


// OPEN / CLOSE CAMERA
cameraBtn.addEventListener("click", async () => {

  if (cameraStream) {
    stopCamera();
    return;
  }

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    alert(
      "Camera unavailable. Open this website using VS Code Live Server (localhost)."
    );

    return;
  }

  try {

    cameraBtn.textContent = "Opening Camera...";

    cameraStream = await navigator.mediaDevices.getUserMedia({

      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },

      audio: false

    });

    camera.srcObject = cameraStream;

    await camera.play();

    camera.classList.remove("hidden");
    captureBtn.classList.remove("hidden");

    cameraBtn.textContent = "Close Camera";

  } catch (error) {

    stopCamera();

    alert(
      "CAMERA ERROR: " +
      error.message +
      "\n\nCheck Chrome camera permission and close other apps using the camera."
    );

  }

});


// CAPTURE DOCUMENT
captureBtn.addEventListener("click", () => {

  if (!camera.videoWidth) {

    alert("Camera is not ready. Please wait.");

    return;
  }

  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;

  const context = canvas.getContext("2d");

  context.drawImage(
    camera,
    0,
    0,
    canvas.width,
    canvas.height
  );

  canvas.toBlob(blob => {

    if (!blob) {

      alert("Could not capture image.");

      return;
    }

    selectedFile = new File(
      [blob],
      "GLOMING-Camera-Scan.jpg",
      { type: "image/jpeg" }
    );

    const details = document.getElementById("fileDetails");

    details.textContent =
      "📷 Camera scan captured successfully.";

    details.classList.remove("hidden");

    verifyBtn.disabled = false;

    stopCamera();

  }, "image/jpeg", 0.92);

});


// STOP CAMERA
function stopCamera() {

  if (cameraStream) {

    cameraStream.getTracks().forEach(track => {
      track.stop();
    });

    cameraStream = null;

  }

  camera.srcObject = null;

  camera.classList.add("hidden");

  captureBtn.classList.add("hidden");

  cameraBtn.textContent = "Open Camera";

}


// =====================================
// END OF GLOMING DEMO SCRIPT
// =====================================
