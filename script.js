const video = document.getElementById("video");
const startButton = document.getElementById("startButton");
const clearButton = document.getElementById("clearButton");
const status = document.getElementById("status");

let cameraStream = null;

// Create MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

// Configure hand tracking
hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

// Receive MediaPipe results
hands.onResults((results) => {
    console.log("MediaPipe results:", results);

    if (results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0) {

        status.textContent =
            `Hand detected: ${results.multiHandLandmarks.length}`;
    } else {
        status.textContent = "Camera running — no hand detected.";
    }
});

startButton.addEventListener("click", async () => {
    try {
        status.textContent = "Requesting camera access...";

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        video.srcObject = cameraStream;

        status.textContent = "Camera is running.";

        startButton.textContent = "Camera Running";
        startButton.disabled = true;

        // Start sending camera frames to MediaPipe
        processCameraFrames();

    } catch (error) {
        console.error("Camera error:", error);

        status.textContent =
            "Camera access failed. Please allow camera permission.";
    }
});

async function processCameraFrames() {
    if (video.readyState >= 2) {
        await hands.send({
            image: video
        });
    }

    requestAnimationFrame(processCameraFrames);
}

clearButton.addEventListener("click", () => {
    status.textContent = "Clear button clicked.";
});