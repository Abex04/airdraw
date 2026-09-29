const startButton = document.getElementById("startButton");
const clearButton = document.getElementById("clearButton");
const status = document.getElementById("status");

startButton.addEventListener("click", () => {
    status.textContent = "JavaScript is working!";
});

clearButton.addEventListener("click", () => {
    status.textContent = "Clear button clicked.";
});