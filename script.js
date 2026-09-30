
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const startButton = document.getElementById("startButton");
const clearButton = document.getElementById("clearButton");
const status = document.getElementById("status");
const pinchStatus = document.getElementById("pinchStatus");

const ctx = canvas.getContext("2d");

let cameraStream = null;


// -----------------------------------------
// Create MediaPipe Hands
// -----------------------------------------

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});


// -----------------------------------------
// Configure hand tracking
// -----------------------------------------

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});


// -----------------------------------------
// Calculate distance between two landmarks
// -----------------------------------------

function calculateDistance(point1, point2) {

    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;

    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


// -----------------------------------------
// Receive MediaPipe results
// -----------------------------------------

hands.onResults((results) => {

    // Match canvas resolution to camera video
    if (
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        (
            canvas.width !== video.videoWidth ||
            canvas.height !== video.videoHeight
        )
    ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }


    // Clear previous frame
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Check if hands were detected
    if (
        results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0
    ) {

        status.textContent =
            `Hand detected: ${results.multiHandLandmarks.length}`;


        // Draw every detected hand
        for (const landmarks of results.multiHandLandmarks) {


            // -----------------------------------------
            // Thumb + index finger distance
            // -----------------------------------------

            // Landmark 4 = thumb tip
            // Landmark 8 = index fingertip

            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];

            const pinchDistance = calculateDistance(
                thumbTip,
                indexTip
            );


            // Pinch threshold
            const pinchThreshold = 0.06;

            // Determine whether the user is pinching
            const isPinching =
                pinchDistance < pinchThreshold;


            // -----------------------------------------
            // Pinch status
            // -----------------------------------------

            if (isPinching) {

                console.log("PINCH DETECTED");

                pinchStatus.textContent =
                    `Pinch: ON (${pinchDistance.toFixed(3)})`;

            } else {

                pinchStatus.textContent =
                    `Pinch: OFF (${pinchDistance.toFixed(3)})`;
            }


            // -----------------------------------------
            // Glowing hand connections
            // -----------------------------------------

            ctx.save();

            ctx.shadowColor = "#00e5ff";
            ctx.shadowBlur = 10;

            drawConnectors(
                ctx,
                landmarks,
                HAND_CONNECTIONS,
                {
                    color: "#00e5ff",
                    lineWidth: 3
                }
            );

            ctx.restore();


            // -----------------------------------------
            // Glowing hand landmarks
            // -----------------------------------------

            ctx.save();

            ctx.shadowColor = "#00e5ff";
            ctx.shadowBlur = 10;

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

            ctx.restore();
        }

    } else {

        status.textContent =
            "Camera running — no hand detected.";

        pinchStatus.textContent =
            "Pinch: OFF";
    }
});


// -----------------------------------------
// Start camera
// -----------------------------------------

startButton.addEventListener("click", async () => {

    try {

        status.textContent =
            "Requesting camera access...";


        cameraStream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });


        video.srcObject = cameraStream;


        status.textContent =
            "Camera is running.";


        startButton.textContent =
            "Camera Running";


        startButton.disabled = true;


        // Start sending camera frames to MediaPipe
        processCameraFrames();

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );


        status.textContent =
            "Camera access failed. Please allow camera permission.";
    }
});


// -----------------------------------------
// Send camera frames to MediaPipe
// -----------------------------------------

async function processCameraFrames() {

    if (video.readyState >= 2) {

        await hands.send({
            image: video
        });
    }

    requestAnimationFrame(
        processCameraFrames
    );
}


// -----------------------------------------
// Clear button
// -----------------------------------------

clearButton.addEventListener("click", () => {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    status.textContent =
        "Canvas cleared.";

    pinchStatus.textContent =
        "Pinch: OFF";
});
