
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const startButton = document.getElementById("startButton");
const clearButton = document.getElementById("clearButton");
const status = document.getElementById("status");
const pinchStatus = document.getElementById("pinchStatus");
const fingerPosition = document.getElementById("fingerPosition");

const ctx = canvas.getContext("2d");

let cameraStream = null;

// Previous fingertip position while drawing
let previousX = null;
let previousY = null;


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
// Draw fingertip cursor
// -----------------------------------------

function drawFingertip(x, y) {

    ctx.save();

    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 20;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        9,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#00e5ff";
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        4,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.restore();
}


// -----------------------------------------
// Draw writing line
// -----------------------------------------

function drawWritingLine(
    startX,
    startY,
    endX,
    endY
) {

    ctx.save();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 15;

    ctx.beginPath();

    ctx.moveTo(
        startX,
        startY
    );

    ctx.lineTo(
        endX,
        endY
    );

    ctx.stroke();

    ctx.restore();
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


        // Use the first detected hand for writing
        const landmarks =
            results.multiHandLandmarks[0];


        // -----------------------------------------
        // Index fingertip
        // -----------------------------------------

        const indexTip = landmarks[8];

        const indexX =
            indexTip.x * canvas.width;

        const indexY =
            indexTip.y * canvas.height;


        fingerPosition.textContent =
            `Index: X ${indexTip.x.toFixed(3)} | Y ${indexTip.y.toFixed(3)}`;


        // -----------------------------------------
        // Pinch detection
        // -----------------------------------------

        const thumbTip = landmarks[4];

        const pinchDistance =
            calculateDistance(
                thumbTip,
                indexTip
            );


        const pinchThreshold = 0.06;

        const isPinching =
            pinchDistance < pinchThreshold;


        // -----------------------------------------
        // Pinch status
        // -----------------------------------------

        if (isPinching) {

            pinchStatus.textContent =
                `Pinch: ON (${pinchDistance.toFixed(3)})`;

        } else {

            pinchStatus.textContent =
                `Pinch: OFF (${pinchDistance.toFixed(3)})`;
        }


        // -----------------------------------------
        // Air writing
        // -----------------------------------------

        if (isPinching) {

            // If this is the first drawing point,
            // don't draw a line yet.
            if (
                previousX !== null &&
                previousY !== null
            ) {

                drawWritingLine(
                    previousX,
                    previousY,
                    indexX,
                    indexY
                );
            }


            // Save current position
            previousX = indexX;
            previousY = indexY;

        } else {

            // Stop the current drawing path
            previousX = null;
            previousY = null;
        }


        // -----------------------------------------
        // Draw hand connections
        // -----------------------------------------

        for (const handLandmarks of results.multiHandLandmarks) {

            ctx.save();

            ctx.shadowColor = "#00e5ff";
            ctx.shadowBlur = 10;

            drawConnectors(
                ctx,
                handLandmarks,
                HAND_CONNECTIONS,
                {
                    color: "#00e5ff",
                    lineWidth: 3
                }
            );

            ctx.restore();


            // -----------------------------------------
            // Draw hand landmarks
            // -----------------------------------------

            ctx.save();

            ctx.shadowColor = "#00e5ff";
            ctx.shadowBlur = 10;

            drawLandmarks(
                ctx,
                handLandmarks,
                {
                    color: "#ffffff",
                    fillColor: "#00e5ff",
                    lineWidth: 1,
                    radius: 5
                }
            );

            ctx.restore();
        }


        // -----------------------------------------
        // Draw fingertip cursor
        // -----------------------------------------

        drawFingertip(
            indexX,
            indexY
        );

    } else {

        status.textContent =
            "Camera running — no hand detected.";

        pinchStatus.textContent =
            "Pinch: OFF";

        fingerPosition.textContent =
            "Index: X 0.000 | Y 0.000";

        // Reset drawing path
        previousX = null;
        previousY = null;
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

    previousX = null;
    previousY = null;

    status.textContent =
        "Canvas cleared.";

    pinchStatus.textContent =
        "Pinch: OFF";

    fingerPosition.textContent =
        "Index: X 0.000 | Y 0.000";
});
