
const intro = document.getElementById("intro");
const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");

const camera = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const cameraBtn = document.getElementById("cameraBtn");
const captureBtn = document.getElementById("captureBtn");

let cameraStream = null;

// INTRO
window.addEventListener("load", () => {
  setTimeout(() => {
    if (intro) intro.classList.add("hidden");
    if (loginPage) loginPage.classList.remove("hidden");
  }, 1800);
});

// LOGIN - DEMO ONLY
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    loginPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
  });
}

// CAMERA OPEN
async function openCamera() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Camera not supported. Open website using Live Server (localhost).");
      return;
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    camera.srcObject = cameraStream;
    camera.classList.remove("hidden");

    await camera.play();

    if (captureBtn) captureBtn.classList.remove("hidden");
    cameraBtn.textContent = "Close Camera";

  } catch (error) {
    console.error("Camera error:", error);
    alert("Camera could not open: " + error.message);
  }
}

// CAMERA CLOSE
function closeCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  if (camera) {
    camera.srcObject = null;
    camera.classList.add("hidden");
  }

  if (captureBtn) captureBtn.classList.add("hidden");
  if (cameraBtn) cameraBtn.textContent = "Open Camera";
}

// CAMERA BUTTON
if (cameraBtn) {
  cameraBtn.addEventListener("click", () => {
    if (cameraStream) {
      closeCamera();
    } else {
      openCamera();
    }
  });
}

// CAPTURE PHOTO
if (captureBtn) {
  captureBtn.addEventListener("click", () => {
    if (!cameraStream || !camera.videoWidth) {
      alert("Camera is not ready.");
      return;
    }

    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(camera, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) {
        alert("Photo capture failed.");
        return;
      }

      const file = new File([blob], "camera-scan.jpg", {
        type: "image/jpeg"
      });

      const input = document.getElementById("documentInput");

      if (input) {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }

      closeCamera();
      alert("Document captured successfully!");
    }, "image/jpeg", 0.92);
  });
}

// STOP CAMERA WHEN LEAVING PAGE
window.addEventListener("beforeunload", closeCamera);
