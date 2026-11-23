
"use strict";

// ==================================
// GLOMING DOCUMENT SCANNER
// DEMO VERSION
// ==================================

const $ = (id) => document.getElementById(id);

const intro = $("intro");
const loginPage = $("loginPage");
const dashboard = $("dashboard");
const loginForm = $("loginForm");

const emailInput = $("email");
const passwordInput = $("password");
const loginError = $("loginError");

const documentInput = $("documentInput");
const fileDetails = $("fileDetails");
const verifyBtn = $("verifyBtn");

const camera = $("camera");
const canvas = $("canvas");
const cameraBtn = $("cameraBtn");
const captureBtn = $("captureBtn");

const resultPlaceholder = $("resultPlaceholder");
const resultBox = $("resultBox");
const resultIcon = $("resultIcon");
const resultTitle = $("resultTitle");
const resultMessage = $("resultMessage");

const historyList = $("historyList");

let cameraStream = null;
let selectedFile = null;
let totalScans = 0;
let verifiedCount = 0;
let failedCount = 0;
let historyItems = [];

// ==================================
// INTRO
// ==================================

window.addEventListener("load", () => {
  setTimeout(() => {
    intro.classList.add("hidden");
    loginPage.classList.remove("hidden");
  }, 2300);
});

// ==================================
// LOGIN
// DEMO LOGIN - ANY NON-EMPTY DETAILS
// ==================================

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    loginError.textContent = "Please enter email and password.";
    return;
  }

  loginError.textContent = "";

  loginPage.classList.add("hidden");
  dashboard.classList.remove("hidden");
});

// ==================================
// LOGOUT
// ==================================

$("logoutBtn").addEventListener("click", () => {
  closeCamera();

  dashboard.classList.add("hidden");
  loginPage.classList.remove("hidden");

  loginForm.reset();
  loginError.textContent = "";

  resetResult();
});

// ==================================
// FILE VALIDATION
// ==================================

function isAllowedFile(file) {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  const extension = file.name.split(".").pop().toLowerCase();
  const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];

  return allowedTypes.includes(file.type) ||
         allowedExtensions.includes(extension);
}

function selectDocument(file) {
  if (!file) {
    selectedFile = null;
    fileDetails.textContent = "No document selected";
    return;
  }

  if (!isAllowedFile(file)) {
    alert("Only PDF, JPG and PNG files are allowed.");
    documentInput.value = "";
    selectedFile = null;
    fileDetails.textContent = "No document selected";
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert("File size must be 10 MB or less.");
    documentInput.value = "";
    selectedFile = null;
    fileDetails.textContent = "No document selected";
    return;
  }

  selectedFile = file;

  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

  fileDetails.textContent =
    "Selected: " + file.name + " (" + sizeMB + " MB)";

  resetResult();
}

documentInput.addEventListener("change", () => {
  selectDocument(documentInput.files[0]);
});

// ==================================
// CAMERA OPEN
// ==================================

async function openCamera() {
  if (!navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia) {
    alert(
      "Camera is unavailable. Open this website using localhost or HTTPS."
    );
    return;
  }

  try {
    cameraBtn.disabled = true;
    cameraBtn.textContent = "OPENING CAMERA...";

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" }
      },
      audio: false
    });

    camera.srcObject = cameraStream;

    camera.classList.remove("hidden");

    await camera.play();

    captureBtn.classList.remove("hidden");

    cameraBtn.textContent = "CLOSE CAMERA";
    cameraBtn.disabled = false;

  } catch (error) {
    console.error("Camera error:", error);

    closeCamera();

    alert(
      "Camera could not open: " +
      error.message +
      "\n\nPlease allow camera permission in Chrome."
    );
  }
}

// ==================================
// CAMERA CLOSE
// ==================================

function closeCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => {
      track.stop();
    });

    cameraStream = null;
  }

  camera.srcObject = null;
  camera.classList.add("hidden");

  captureBtn.classList.add("hidden");

  cameraBtn.textContent = "▣ OPEN CAMERA";
  cameraBtn.disabled = false;
}

cameraBtn.addEventListener("click", () => {
  if (cameraStream) {
    closeCamera();
  } else {
    openCamera();
  }
});

// ==================================
// CAPTURE DOCUMENT
// ==================================

captureBtn.addEventListener("click", () => {
  if (!cameraStream || !camera.videoWidth) {
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

  canvas.toBlob((blob) => {
    if (!blob) {
      alert("Unable to capture document.");
      return;
    }

    const capturedFile = new File(
      [blob],
      "GLOMING-Camera-Scan.jpg",
      { type: "image/jpeg" }
    );

    const transfer = new DataTransfer();
    transfer.items.add(capturedFile);

    documentInput.files = transfer.files;

    selectDocument(capturedFile);

    closeCamera();

  }, "image/jpeg", 0.92);
});

// ==================================
// RESET RESULT
// ==================================

function resetResult() {
  resultPlaceholder.classList.remove("hidden");
  resultBox.classList.add("hidden");

  resultBox.classList.remove(
    "verified",
    "not-verified"
  );
}

// ==================================
// RESULT SOUND
// ==================================

function playResultSound(isVerified) {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    const audio = new AudioContextClass();

    const frequencies = isVerified
      ? [880, 1175]
      : [220, 165];

    frequencies.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      const startTime = audio.currentTime + index * 0.20;

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(
        0.12,
        startTime + 0.025
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + 0.16
      );

      oscillator.connect(gain);
      gain.connect(audio.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.17);
    });

    setTimeout(() => audio.close(), 800);

  } catch (error) {
    console.log("Sound unavailable:", error);
  }
}

// ==================================
// UPDATE STATISTICS
// ==================================

function updateStats() {
  $("totalScans").textContent = totalScans;
  $("verifiedCount").textContent = verifiedCount;
  $("failedCount").textContent = failedCount;
}

// ==================================
// HISTORY
// ==================================

function addHistory(file, isVerified) {
  const item = {
    name: file.name,
    verified: isVerified,
    time: new Date().toLocaleString()
  };

  historyItems.unshift(item);

  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";

  if (historyItems.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-history";
    empty.textContent = "No scan history yet.";

    historyList.appendChild(empty);
    return;
  }

  historyItems.forEach(item => {
    const row = document.createElement("div");

    row.className =
      "history-item " +
      (item.verified ? "success" : "failed");

    const name = document.createElement("span");
    name.className = "history-name";
    name.textContent = item.name;

    const status = document.createElement("span");
    status.className = "history-status";

    status.textContent = item.verified
      ? "VERIFIED (DEMO)"
      : "NOT VERIFIED (DEMO)";

    row.title = item.time;

    row.appendChild(name);
    row.appendChild(status);

    historyList.appendChild(row);
  });
}

// ==================================
// DOCUMENT CHECK
// ==================================

verifyBtn.addEventListener("click", () => {
  if (!selectedFile) {
    alert("Please upload or capture a document first.");
    return;
  }

  if (verifyBtn.disabled) return;

  verifyBtn.disabled = true;
  verifyBtn.textContent = "CHECKING DOCUMENT...";

  resultPlaceholder.classList.add("hidden");
  resultBox.classList.add("hidden");

  setTimeout(() => {

    // IMPORTANT:
    // This is a random demonstration only.
    // It does not validate a real signature.
    const isVerified = Math.random() < 0.15;

    resultBox.classList.remove(
      "verified",
      "not-verified"
    );

    resultBox.classList.remove("hidden");

    if (isVerified) {
      resultBox.classList.add("verified");

      resultIcon.textContent = "✓";
      resultTitle.textContent = "VERIFIED";
      resultMessage.textContent =
        "Simulated demo success. Actual signature has not been checked.";

      verifiedCount++;

    } else {
      resultBox.classList.add("not-verified");

      resultIcon.textContent = "✕";
      resultTitle.textContent = "NOT VERIFIED";
      resultMessage.textContent =
        "Simulated demo result. Actual signature has not been checked.";

      failedCount++;
    }

    totalScans++;

    updateStats();
    addHistory(selectedFile, isVerified);
    playResultSound(isVerified);

    verifyBtn.disabled = false;
    verifyBtn.textContent = "CHECK DOCUMENT";

  }, 1200);
});

// ==================================
// CLEAR HISTORY
// ==================================

$("clearHistory").addEventListener("click", () => {
  if (historyItems.length === 0) {
    alert("History is already empty.");
    return;
  }

  const confirmClear = confirm(
    "Are you sure you want to clear scan history and statistics?"
  );

  if (!confirmClear) return;

  historyItems = [];

  totalScans = 0;
  verifiedCount = 0;
  failedCount = 0;

  updateStats();
  renderHistory();
  resetResult();
});

// ==================================
// STOP CAMERA WHEN PAGE CLOSES
// ==================================

window.addEventListener("beforeunload", () => {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
  }
});

// INITIAL STATE
updateStats();
renderHistory();

