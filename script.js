const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const startButton = document.getElementById("startButton");
const clearButton = document.getElementById("clearButton");
const status = document.getElementById("status");

const ctx = canvas.getContext("2d");

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
    // Match canvas resolution to the camera video
    if (
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        (canvas.width !== video.videoWidth ||
            canvas.height !== video.videoHeight)
    ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Check if hands were detected
    if (
        results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0
    ) {
        status.textContent =
            `Hand detected: ${results.multiHandLandmarks.length}`;

        // Draw every detected hand
        for (const landmarks of results.multiHandLandmarks) {

            // Draw connections between landmarks
            drawConnectors(
                ctx,
                landmarks,
                HAND_CONNECTIONS,
                {
                    color: "#00e5ff",
                    lineWidth: 3
                }
            );

            // Draw the 21 landmarks
            drawLandmarks(
                ctx,
                landmarks,
                {
                    color: "#ffffff",
                    fillColor: "#00e5ff",
                    lineWidth: 1,
                    radius: 5
                }
            );
        }

    } else {
        status.textContent = "Camera running — no hand detected.";
    }
});

// Start camera
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

// Send camera frames to MediaPipe
async function processCameraFrames() {
    if (video.readyState >= 2) {
        await hands.send({
            image: video
        });
    }

    requestAnimationFrame(processCameraFrames);
}

// Clear button
clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    status.textContent = "Canvas cleared.";
});