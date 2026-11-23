(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const intro = $("intro");
  const loginPage = $("loginPage");
  const dashboard = $("dashboard");
  const loginForm = $("loginForm");
  const loginError = $("loginError");
  const documentInput = $("documentInput");
  const verifyBtn = $("verifyBtn");
  const camera = $("camera");
  const canvas = $("canvas");
  const cameraBtn = $("cameraBtn");
  const captureBtn = $("captureBtn");

  let selectedFile = null;
  let historyItems = [];
  let cameraStream = null;
  let verifying = false;

  // Intro animation
  window.setTimeout(() => {
    if (intro) intro.remove();
  }, 3100);

  // DEMO LOGIN: Any non-empty valid email and password accepted.
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = $("email").value.trim();
    const password = $("password").value;

    if (!email || !password) {
      loginError.textContent = "Please enter your email and password.";
      return;
    }

    loginError.textContent = "";
    loginPage.classList.add("hidden");
    dashboard.classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Logout
  $("logoutBtn").addEventListener("click", () => {
    stopCamera();

    dashboard.classList.add("hidden");
    loginPage.classList.remove("hidden");

    loginForm.reset();
    loginError.textContent = "";
  });

  // File validation
  function validFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();

    const allowedExt = ["pdf", "jpg", "jpeg", "png"];

    const allowedMime = [
      "application/pdf",
      "image/jpeg",
      "image/png"
    ];

    return (
      (allowedExt.includes(ext) || allowedMime.includes(file.type)) &&
      file.size <= 10 * 1024 * 1024
    );
  }

  // Select document
  function setSelectedFile(file, sourceLabel) {
    selectedFile = file;

    $("fileDetails").textContent =
      (sourceLabel || "📄") +
      " " +
      file.name +
      " · " +
      (file.size / 1024).toFixed(1) +
      " KB";

    $("fileDetails").classList.remove("hidden");

    $("resultPlaceholder").classList.remove("hidden");
    $("resultBox").classList.add("hidden");

    verifyBtn.disabled = false;
  }

  documentInput.addEventListener("change", () => {
    const file = documentInput.files && documentInput.files[0];

    if (!file) return;

    if (!validFile(file)) {
      alert("Please select a PDF, JPG or PNG file up to 10 MB.");

      documentInput.value = "";
      selectedFile = null;
      verifyBtn.disabled = true;

      $("fileDetails").classList.add("hidden");

      return;
    }

    setSelectedFile(file, "📄");

    stopCamera();
  });

  // Verify document
  verifyBtn.addEventListener("click", () => {
    if (!selectedFile || verifying) return;

    verifying = true;

    verifyBtn.disabled = true;

    verifyBtn.innerHTML =
      "<span>Checking document...</span><span>…</span>";

    $("resultPlaceholder").classList.add("hidden");
    $("resultBox").classList.add("hidden");

    window.setTimeout(() => {

      // DEMO SIMULATION ONLY:
      // Approximately 15% VERIFIED and 85% NOT VERIFIED.
      // No real digital signature validation is performed.

      const simulatedVerified = Math.random() < 0.15;

      showResult(simulatedVerified, selectedFile.name);

      verifying = false;

      verifyBtn.disabled = false;

      verifyBtn.innerHTML =
        "<span>Verify Document</span><span>→</span>";

    }, 1200);
  });

  // Result sound
  function playResultSound(isVerified) {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();

      const notes = isVerified
        ? [660, 880]
        : [260, 190];

      notes.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = isVerified ? "sine" : "triangle";
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(
          0.0001,
          ctx.currentTime + index * 0.17
        );

        gain.gain.exponentialRampToValueAtTime(
          0.12,
          ctx.currentTime + index * 0.17 + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + index * 0.17 + 0.15
        );

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(ctx.currentTime + index * 0.17);
        oscillator.stop(ctx.currentTime + index * 0.17 + 0.16);
      });

      window.setTimeout(() => ctx.close(), 700);

    } catch (error) {
      console.log("Sound unavailable.");
    }
  }

  // Display result
  function showResult(isVerified, fileName) {
    const box = $("resultBox");

    box.className =
      "result-box " +
      (isVerified ? "verified" : "not-verified");

    $("resultIcon").textContent =
      isVerified ? "✓" : "✕";

    $("resultTitle").textContent =
      isVerified ? "VERIFIED" : "NOT VERIFIED";

    $("resultMessage").textContent = isVerified
      ? "Simulated positive result only. No genuine digital signature validation was performed."
      : "This is a simulated negative result. No genuine digital signature validation was performed.";

    box.classList.remove("hidden");

    $("resultPlaceholder").classList.add("hidden");

    historyItems.unshift({
      name: fileName,
      status: isVerified ? "VERIFIED" : "NOT VERIFIED",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    });

    updateDashboard();

    playResultSound(isVerified);
  }

  // Update dashboard and history
  function updateDashboard() {
    $("totalScans").textContent = historyItems.length;

    $("verifiedCount").textContent =
      historyItems.filter(
        item => item.status === "VERIFIED"
      ).length;

    $("failedCount").textContent =
      historyItems.filter(
        item => item.status === "NOT VERIFIED"
      ).length;

    const list = $("historyList");

    list.replaceChildren();

    if (!historyItems.length) {
      const empty = document.createElement("p");

      empty.className = "empty-history";
      empty.textContent = "No documents scanned yet.";

      list.appendChild(empty);

      return;
    }

    historyItems.forEach((item) => {
      const row = document.createElement("div");
      row.className = "history-item";

      const name = document.createElement("span");
      name.className = "history-name";
      name.textContent = item.name;

      const status = document.createElement("span");

      status.className =
        "history-status " +
        (item.status === "VERIFIED" ? "green" : "red");

      status.textContent = item.status;

      const time = document.createElement("span");
      time.className = "history-time";
      time.textContent = item.time;

      row.append(name, status, time);

      list.appendChild(row);
    });
  }

  // Clear history
  $("clearHistory").addEventListener("click", () => {
    historyItems = [];
    updateDashboard();
  });

  // Camera open and close
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
        "Camera is unavailable. Open this project using VS Code Live Server (localhost) or HTTPS."
      );

      return;
    }

    cameraBtn.disabled = true;

    cameraBtn.querySelector("span").textContent =
      "Opening camera...";

    try {

      cameraStream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment"
            }
          },
          audio: false
        });

      camera.srcObject = cameraStream;

      await camera.play();

      camera.classList.remove("hidden");
      captureBtn.classList.remove("hidden");

      cameraBtn.querySelector("span").textContent =
        "Close Camera";

    } catch (error) {

      stopCamera();

      alert(
        "Camera could not open. Allow camera permission in Chrome and use Live Server or HTTPS."
      );

    } finally {

      cameraBtn.disabled = false;

    }
  });

  // Capture document from camera
  captureBtn.addEventListener("click", () => {

    if (
      !cameraStream ||
      !camera.videoWidth ||
      !camera.videoHeight
    ) {
      alert(
        "Camera is not ready yet. Please wait a moment and try again."
      );

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
        alert("Could not capture the image. Please try again.");
        return;
      }

      const captured = new File(
        [blob],
        "gloming-camera-scan.jpg",
        {
          type: "image/jpeg",
          lastModified: Date.now()
        }
      );

      documentInput.value = "";

      setSelectedFile(captured, "📷");

      stopCamera();

    }, "image/jpeg", 0.92);

  });

  // Stop camera safely
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

    const label = cameraBtn.querySelector("span");

    if (label) {
      label.textContent = "Open Camera";
    }

    cameraBtn.disabled = false;
  }

  window.addEventListener("beforeunload", stopCamera);

})();
