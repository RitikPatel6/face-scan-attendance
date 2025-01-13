const URL = "https://teachablemachine.withgoogle.com/models/7k-5g5LOp/"; // Your Teachable Machine model URL

    let model, webcam, labelContainer, maxPredictions;
    let isAttendanceTaken = false;  // Track if attendance is already taken
    let isProcessing = false; // Track if the system is processing attendance for a user

    // Load the image model and setup the webcam
    async function init() {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // Load the model and metadata
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Set up the webcam
        const flip = true; // whether to flip the webcam
        webcam = new tmImage.Webcam(300, 300, flip); // width, height, flip
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        window.requestAnimationFrame(loop);

        // Append the webcam to the DOM
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        labelContainer = document.getElementById("label-container");
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }
    }

    async function loop() {
        webcam.update(); // Update the webcam frame
        await predict();
        window.requestAnimationFrame(loop);
    }

    async function predict() {
        if (isProcessing) return; // Prevent processing if system is busy

        isProcessing = true; // Mark as processing
        const prediction = await model.predict(webcam.canvas);
        let isAttendance = false;
        let predictedName = "";

        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction = prediction[i].className + ": " + prediction[i].probability.toFixed(2);
            labelContainer.childNodes[i].innerHTML = classPrediction;

            // Check if the probability is high enough to mark attendance
            if (prediction[i].probability > 0.85) { // Increased threshold to avoid wrong recognition
                predictedName = prediction[i].className;
                isAttendance = true;
            }
        }

        // Show message based on the result
        const messageContainer = document.getElementById("message-container");
        const welcomeMessage = document.getElementById("welcome-message");

        if (isAttendance) {
            messageContainer.textContent = predictedName + ": Your attendance is done successfully!";
            messageContainer.classList.add("success");
            messageContainer.classList.remove("failure");

            welcomeMessage.textContent = "Welcome to the class, " + predictedName + "!";
            welcomeMessage.style.display = "block";

            setTimeout(() => {
                messageContainer.textContent = "Please wait for the next person...";
                messageContainer.classList.remove("success");
                messageContainer.classList.add("failure");
                welcomeMessage.style.display = "none";

                // Reset after 5 seconds, allowing another user to take attendance
                setTimeout(() => {
                    isProcessing = false;
                }, 5000);
            }, 2000); // 2 seconds for the message to display before resetting
        } else {
            messageContainer.textContent = "You are not in this class.";
            messageContainer.classList.add("failure");
            messageContainer.classList.remove("success");

            // Reset after 2 seconds to allow the next prediction
            setTimeout(() => {
                isProcessing = false;
            }, 2000);
        }
    }