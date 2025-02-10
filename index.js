const URL = "https://teachablemachine.withgoogle.com/models/7k-5g5LOp/"; 

    let model, webcam, labelContainer, maxPredictions;
    let isAttendanceTaken = false;  
    let isProcessing = false; 

    async function init() {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        
        const flip = true; 
        webcam = new tmImage.Webcam(300, 300, flip); 
        await webcam.setup(); 
        await webcam.play();
        window.requestAnimationFrame(loop);

       
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        labelContainer = document.getElementById("label-container");
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }
    }

    async function loop() {
        webcam.update(); 
        await predict();
        window.requestAnimationFrame(loop);
    }

    async function predict() {
        if (isProcessing) return;

        isProcessing = true; 
        const prediction = await model.predict(webcam.canvas);
        let isAttendance = false;
        let predictedName = "";

        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction = prediction[i].className + ": " + prediction[i].probability.toFixed(2);
            labelContainer.childNodes[i].innerHTML = classPrediction;

            
            if (prediction[i].probability > 0.85) { 
                predictedName = prediction[i].className;
                isAttendance = true;
            }
        }

       
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
            
                setTimeout(() => {
                    isProcessing = false;
                }, 5000);
            }, 2000); 
        } else {
            messageContainer.textContent = "You are not in this class.";
            messageContainer.classList.add("failure");
            messageContainer.classList.remove("success");

            setTimeout(() => {
                isProcessing = false;
            }, 2000);
        }
    }
