// =========================================================
// SOLVEITAI — COMPLETE MAIN SCRIPT
// Chat + History + Voice + AI Video Call
// Hands-Free Mic + User Camera + LAN API
// ChatGPT-Style Voice Interrupt / Barge-In
// =========================================================


// =========================================================
// CHAT DATA
// =========================================================

let allChats =
    JSON.parse(localStorage.getItem("allChats")) || [];

let currentChat =
    JSON.parse(localStorage.getItem("currentChat")) || [];

let currentChatTitle =
    localStorage.getItem("currentChatTitle") || "";

const chatBox =
    document.getElementById("chatBox");

const history =
    document.getElementById("history");

const textarea =
    document.getElementById("problem");

const plusButton =
    document.getElementById("plusButton");

const imageInput =
    document.getElementById("imageInput");

const imagePreview =
    document.getElementById("imagePreview");

const selectedImage =
    document.getElementById("selectedImage");

const removeImage =
    document.getElementById("removeImage");

let selectedImageData =
    null;


// =========================================================
// CHATGPT STYLE IMAGE INPUT
// =========================================================

if (plusButton && imageInput) {

    plusButton.addEventListener(
        "click",
        function() {
            imageInput.click();
        }
    );


    imageInput.addEventListener(
        "change",
        function(event) {

            const file =
                event.target.files?.[0];

            if (!file) return;

            if (!file.type.startsWith("image/")) {

                alert(
                    "Please select an image."
                );

                imageInput.value = "";

                return;
            }

            if (file.size > 5 * 1024 * 1024) {

                alert(
                    "Image is too large. Please select an image below 5 MB."
                );

                imageInput.value = "";

                return;
            }

            const reader =
                new FileReader();

            reader.onload = function(e) {

                selectedImageData =
                    e.target.result;

                selectedImage.src =
                    selectedImageData;

                imagePreview.style.display =
                    "flex";

                // After selecting an image, return focus to the text box.
                // This keeps Enter working as Send instead of opening the file chooser again.
                if (textarea) {
                    textarea.focus();
                }
            };

            reader.readAsDataURL(file);
        }
    );
}


// =========================================================
// REMOVE SELECTED IMAGE
// =========================================================

if (removeImage) {

    removeImage.addEventListener(
        "click",
        function() {

            selectedImageData =
                null;

            imageInput.value =
                "";

            selectedImage.src =
                "";

            imagePreview.style.display =
                "none";
        }
    );
}


// =========================================================
// API
// =========================================================

const API_PORT = 5500;

const API_URL =
    `http://${window.location.hostname}:${API_PORT}/ask`;

const VISION_API_URL =
    `http://${window.location.hostname}:${API_PORT}/vision`;


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatAnswer(text) {

    return escapeHTML(
        String(text)
            .replace(/\*\*/g, "")
            .replace(/\*/g, "")
            .trim()
    ).replace(/\n/g, "<br>");
}


// =========================================================
// SAVE CHAT
// =========================================================

function saveCurrentChat() {

    if (!currentChat.length || !currentChatTitle) {
        return;
    }

    localStorage.setItem(
        "currentChat",
        JSON.stringify(currentChat)
    );

    localStorage.setItem(
        "currentChatTitle",
        currentChatTitle
    );

    const index =
        allChats.findIndex(
            chat =>
                chat.title === currentChatTitle
        );

    const chatData = {
        title: currentChatTitle,
        messages: [...currentChat]
    };

    if (index === -1) {

        allChats.unshift(chatData);

    } else {

        allChats[index] = chatData;
    }

    localStorage.setItem(
        "allChats",
        JSON.stringify(allChats)
    );

    loadHistory();
}


// =========================================================
// SOLVE PROBLEM
// =========================================================

// =========================================================
// SOLVE PROBLEM — TEXT + IMAGE
// =========================================================

async function solveProblem() {

    if (!textarea) return;


    const problem =
        textarea.value.trim();


    // Allow image without text
    if (!problem && !selectedImageData) {
        return;
    }


    if (currentChat.length === 0) {

        currentChatTitle =
            problem ||
            "Image Question";

        localStorage.setItem(
            "currentChatTitle",
            currentChatTitle
        );
    }


    // =====================================================
    // IMAGE QUESTION
    // =====================================================

    if (selectedImageData) {

        const imageToSend =
            selectedImageData;

        // Consume the selected image immediately.
        // This prevents the same image from being attached to the next message,
        // even if the AI request fails.
        selectedImageData = null;

        if (imageInput) {
            imageInput.value = "";
        }

        if (imagePreview) {
            imagePreview.style.display = "none";
        }

        if (selectedImage) {
            selectedImage.src = "";
        }


        chatBox.innerHTML += `

            <div class="user-message">

                <div class="bubble">

                    <img
                        src="${imageToSend}"
                        class="chat-user-image"
                        alt="Uploaded image">

                    ${
                        problem
                            ? `<br><br>${escapeHTML(problem)}`
                            : ""
                    }

                </div>

                <div class="avatar">
                    👤
                </div>

            </div>

        `;


        currentChat.push({

            role: "user",

            text:
                problem ||
                "[Image uploaded]"
        });


        saveCurrentChat();


        chatBox.innerHTML += `

            <div id="loading" class="ai-message">

                <div class="avatar">
                    🤖
                </div>

                <div class="typing">
                    SolveItAI is analyzing the image...
                </div>

            </div>

        `;


        chatBox.scrollTop =
            chatBox.scrollHeight;


        textarea.value = "";

        textarea.style.height =
            "60px";


        try {

            const response =
                await fetch(
                    VISION_API_URL,
                    {

                        method: "POST",

                       headers: {
    "Content-Type":
        "application/json",

    "Authorization":
        "Bearer " +
        localStorage.getItem(
            "solveitai_token"
        )
},

                        body: JSON.stringify({

                            image: imageToSend,

                            question:
                                problem,

                            mode:
                                localStorage.getItem(
                                    "mode"
                                ) || "normal",

                            language:
                                localStorage.getItem(
                                    "language"
                                ) || "en",

                            history:
                                currentChat.slice(0, -1)

                        })

                    }
                );


           if (!response.ok) {

    let serverMessage = "";

    try {
        const errorData = await response.json();

        serverMessage =
            errorData.answer ||
            errorData.error ||
            JSON.stringify(errorData);

    } catch (e) {

        serverMessage =
            await response.text();
    }

    throw new Error(
        "Server Error: " +
        response.status +
        " - " +
        serverMessage
    );
}


            const data =
                await response.json();


            const answer =
                data.answer ||
                "Sorry, I couldn't analyze this image.";


            document
                .getElementById("loading")
                ?.remove();


            chatBox.innerHTML += `

                <div class="ai-message">

                    <div class="avatar">
                        🤖
                    </div>

                    <div class="bubble">

                        ${formatAnswer(answer)}

                        <br><br>

                        <button
                            class="speak-answer"
                            type="button">

                            🔊 Speak

                        </button>

                    </div>

                </div>

            `;


            const aiMessage =
                chatBox.lastElementChild;


            const speakButton =
                aiMessage?.querySelector(
                    ".speak-answer"
                );


            if (speakButton) {

                speakButton.addEventListener(
                    "click",
                    () => speakText(answer)
                );
            }


            if (
                localStorage.getItem(
                    "voiceOutput"
                ) !== "false"
            ) {

                speakText(answer);
            }


            currentChat.push({

                role: "ai",

                text: answer

            });


            saveCurrentChat();


            chatBox.scrollTop =
                chatBox.scrollHeight;


        } catch (error) {

            console.error(
                "Vision AI Error:",
                error
            );


            document
                .getElementById("loading")
                ?.remove();


            chatBox.innerHTML += `

                <div class="ai-message">

                    <div class="avatar">
                        🤖
                    </div>

                    <div class="bubble">

                        ❌ Image Analysis Error<br><br>

                        ${escapeHTML(
                            error.message ||
                            "Unknown error"
                        )}

                    </div>

                </div>

            `;

        }


        return;
    }


    // =====================================================
    // NORMAL TEXT QUESTION
    // =====================================================

    if (!problem) {
        return;
    }


    chatBox.innerHTML += `

        <div class="user-message">

            <div class="bubble">
                ${escapeHTML(problem)}
            </div>

            <div class="avatar">
                👤
            </div>

        </div>

    `;


    currentChat.push({

        role: "user",

        text: problem

    });


    saveCurrentChat();


    chatBox.innerHTML += `

        <div id="loading" class="ai-message">

            <div class="avatar">
                🤖
            </div>

            <div class="typing">
                SolveItAI is thinking...
            </div>

        </div>

    `;


    chatBox.scrollTop =
        chatBox.scrollHeight;


    textarea.value = "";

    textarea.style.height =
        "60px";


    try {

        const response =
            await fetch(API_URL, {

                method: "POST",

                headers: {
    "Content-Type":
        "application/json",

    "Authorization":
        "Bearer " +
        localStorage.getItem(
            "solveitai_token"
        )
},

                body: JSON.stringify({

                    question:
                        problem,

                    mode:
                        localStorage.getItem(
                            "mode"
                        ) || "normal",

                    language:
                        localStorage.getItem(
                            "language"
                        ) || "en",

                    history:
                        currentChat.slice(0, -1)

                })

            });


        if (!response.ok) {

            throw new Error(
                "Server Error: " +
                response.status
            );
        }


        const data =
            await response.json();


        const answer =
            data.answer ||
            "Sorry, I couldn't answer.";


        document
            .getElementById("loading")
            ?.remove();


        chatBox.innerHTML += `

            <div class="ai-message">

                <div class="avatar">
                    🤖
                </div>

                <div class="bubble">

                    ${formatAnswer(answer)}

                    <br><br>

                    <button
                        class="speak-answer"
                        type="button">

                        🔊 Speak

                    </button>

                </div>

            </div>

        `;


        const aiMessage =
            chatBox.lastElementChild;


        const speakButton =
            aiMessage?.querySelector(
                ".speak-answer"
            );


        if (speakButton) {

            speakButton.addEventListener(
                "click",
                () => speakText(answer)
            );
        }


        if (
            localStorage.getItem(
                "voiceOutput"
            ) !== "false"
        ) {

            speakText(answer);
        }


        currentChat.push({

            role: "ai",

            text: answer

        });


        saveCurrentChat();


        chatBox.scrollTop =
            chatBox.scrollHeight;


    } catch (error) {

        console.error(
            "SolveItAI Error:",
            error
        );


        document
            .getElementById("loading")
            ?.remove();


        chatBox.innerHTML += `

            <div class="ai-message">

                <div class="avatar">
                    🤖
                </div>

                <div class="bubble">

                    ❌ Connection Error<br>

                    Check that SolveItAI server
                    is running on port ${API_PORT}.

                </div>

            </div>

        `;
    }
}


// =========================================================
// NEW CHAT
// =========================================================

const newChatButton =
    document.querySelector(".new-chat");


if (newChatButton) {

    newChatButton.addEventListener(
        "click",
        function() {

            currentChat = [];

            currentChatTitle = "";

            localStorage.removeItem(
                "currentChat"
            );

            localStorage.removeItem(
                "currentChatTitle"
            );

            showWelcome();

            loadHistory();
        }
    );
}


// =========================================================
// ENTER TO SEND
// =========================================================

if (textarea) {

    textarea.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                solveProblem();
            }
        }
    );


    textarea.addEventListener(
        "input",
        function() {

            this.style.height =
                "60px";

            this.style.height =
                Math.min(
                    this.scrollHeight,
                    200
                ) + "px";
        }
    );
}


// =========================================================
// NORMAL VOICE INPUT
// =========================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.interimResults =
        false;

    recognition.continuous =
        false;


    recognition.onresult =
        function(event) {

            if (!textarea) return;

            textarea.value =
                event.results[0][0]
                    .transcript;

            textarea.dispatchEvent(
                new Event("input")
            );
        };


    recognition.onerror =
        function(error) {

            console.log(
                "Voice input error:",
                error
            );
        };
}


function startVoice() {

    if (!recognition) {

        alert(
            "🎤 Voice input is not supported in this browser."
        );

        return;
    }


    try {

        recognition.start();

    } catch (error) {

        console.log(error);
    }
}


// =========================================================
// AI SPEECH
// =========================================================

let isSpeaking = false;

let speech = null;


// =========================================================
// VOICE INTERRUPT VARIABLES
// =========================================================

let interruptRecognition = null;

let interruptActive = false;

let interruptProcessing = false;


// =========================================================
// STOP AI SPEECH
// =========================================================

function stopAISpeech() {

    if (
        "speechSynthesis" in window
    ) {

        speechSynthesis.cancel();
    }


    isSpeaking = false;

    stopRobotMouth();


    const screen =
        document.getElementById(
            "aiVideoScreen"
        );


    if (screen) {

        screen.classList.remove(
            "speaking"
        );
    }
}


// =========================================================
// START INTERRUPT LISTENER
// =========================================================

function startVoiceInterruptListener() {

    if (
        !SpeechRecognition ||
        !aiVideoActive ||
        !handsFreeVoice
    ) {
        return;
    }


    stopVoiceInterruptListener();


    interruptRecognition =
        new SpeechRecognition();


    const language =
        localStorage.getItem(
            "language"
        ) || "en";


    if (language === "mr") {

        interruptRecognition.lang =
            "mr-IN";

    } else if (language === "hi") {

        interruptRecognition.lang =
            "hi-IN";

    } else {

        interruptRecognition.lang =
            "en-US";
    }


    interruptRecognition.interimResults =
        false;

    interruptRecognition.continuous =
        false;


    interruptActive = true;


    interruptRecognition.onresult =
        async function(event) {

            if (
                !aiVideoActive ||
                !handsFreeVoice
            ) {
                return;
            }


            const question =
                event.results[0][0]
                    .transcript
                    .trim();


            if (!question) {
                return;
            }


            // =============================================
            // USER INTERRUPTED AI
            // =============================================

            stopAISpeech();


            interruptProcessing =
                true;


            updateVideoStatus(
                "🎤 You are speaking..."
            );


            updateVideoCC(
                "You: " + question
            );


            await askVideoAI(
                question
            );


            interruptProcessing =
                false;
        };


    interruptRecognition.onerror =
        function(error) {

            console.log(
                "Interrupt voice:",
                error
            );


            interruptActive =
                false;
        };


    interruptRecognition.onend =
        function() {

            interruptActive =
                false;


            if (
                aiVideoActive &&
                handsFreeVoice &&
                isSpeaking
            ) {

                setTimeout(
                    startVoiceInterruptListener,
                    100
                );
            }
        };


    try {

        interruptRecognition.start();

    } catch (error) {

        console.log(
            "Interrupt recognition start:",
            error
        );
    }
}


// =========================================================
// STOP INTERRUPT LISTENER
// =========================================================

function stopVoiceInterruptListener() {

    if (!interruptRecognition) {
        return;
    }


    try {

        interruptRecognition.onend =
            null;

        interruptRecognition.onerror =
            null;

        interruptRecognition.onresult =
            null;

        interruptRecognition.stop();

    } catch (error) {

        console.log(error);
    }


    interruptRecognition =
        null;

    interruptActive =
        false;
}


// =========================================================
// SPEAK TEXT
// =========================================================

function speakText(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        return;
    }


    // Stop previous speech
    speechSynthesis.cancel();


    // Stop normal video recognition
    if (videoRecognition) {

        try {

            videoRecognition.onend =
                null;

            videoRecognition.onerror =
                null;

            videoRecognition.stop();

        } catch (error) {

            console.log(error);
        }


        videoRecognition = null;
    }


    speech =
        new SpeechSynthesisUtterance(
            String(text)
        );


    const language =
        localStorage.getItem(
            "language"
        ) || "en";


    if (language === "mr") {

        speech.lang =
            "mr-IN";

    } else if (language === "hi") {

        speech.lang =
            "hi-IN";

    } else {

        speech.lang =
            "en-US";
    }


    const voices =
        speechSynthesis.getVoices();


    let selectedVoice =
        null;


    if (language === "mr") {

        selectedVoice =
            voices.find(
                v =>
                    v.lang
                        .toLowerCase() ===
                    "mr-in"
            ) ||

            voices.find(
                v =>
                    v.lang
                        .toLowerCase()
                        .startsWith("mr")
            );
    }


    else if (language === "hi") {

        selectedVoice =
            voices.find(
                v =>
                    v.lang
                        .toLowerCase() ===
                    "hi-in"
            ) ||

            voices.find(
                v =>
                    v.lang
                        .toLowerCase()
                        .startsWith("hi")
            );
    }


    else {

        selectedVoice =
            voices.find(
                v =>
                    v.lang
                        .toLowerCase()
                        .startsWith("en")
            );
    }


    if (selectedVoice) {

        speech.voice =
            selectedVoice;
    }


    speech.rate =
        1;

    speech.pitch =
        1;


    isSpeaking =
        true;


    const screen =
        document.getElementById(
            "aiVideoScreen"
        );


    if (screen) {

        screen.classList.add(
            "speaking"
        );
    }


    startRobotMouth();


    // =============================================
    // CHATGPT STYLE BARGE-IN
    // =============================================

    if (
        aiVideoActive &&
        handsFreeVoice
    ) {

        setTimeout(
            function() {

                if (
                    isSpeaking &&
                    aiVideoActive &&
                    handsFreeVoice
                ) {

                    startVoiceInterruptListener();
                }

            },
            150
        );
    }


    speech.onend =
        function() {

            isSpeaking =
                false;


            stopRobotMouth();


            if (screen) {

                screen.classList.remove(
                    "speaking"
                );
            }


            stopVoiceInterruptListener();


            // Resume hands-free listening
            if (
                aiVideoActive &&
                handsFreeVoice
            ) {

                setTimeout(
                    startAIVideoVoice,
                    400
                );
            }
        };


    speech.onerror =
        function(error) {

            console.log(
                "Speech error:",
                error
            );


            isSpeaking =
                false;


            stopRobotMouth();


            if (screen) {

                screen.classList.remove(
                    "speaking"
                );
            }


            stopVoiceInterruptListener();


            if (
                aiVideoActive &&
                handsFreeVoice
            ) {

                setTimeout(
                    startAIVideoVoice,
                    400
                );
            }
        };


    speechSynthesis.speak(
        speech
    );
}


// =========================================================
// ROBOT MOUTH
// =========================================================

let mouthTimer =
    null;


function getRobotMouths() {

    return document.querySelectorAll(
        "#aiVideoScreen .robot-mouth"
    );
}


function startRobotMouth() {

    stopRobotMouth();


    mouthTimer =
        setInterval(
            function() {

                getRobotMouths()
                    .forEach(
                        function(mouth) {

                            const open =
                                Math.random() >
                                0.45;


                            mouth.style.height =
                                open
                                    ? "22px"
                                    : "7px";


                            mouth.style.transform =
                                open
                                    ? "scaleY(1.15)"
                                    : "scaleY(0.8)";
                        }
                    );

            },
            120
        );
}


function stopRobotMouth() {

    if (mouthTimer) {

        clearInterval(
            mouthTimer
        );

        mouthTimer =
            null;
    }


    getRobotMouths()
        .forEach(
            function(mouth) {

                mouth.style.height =
                    "";

                mouth.style.transform =
                    "";
            }
        );
}


// =========================================================
// HISTORY
// =========================================================

function loadHistory() {

    if (!history) return;


    history.innerHTML =
        "";


    allChats.forEach(
        function(chat, index) {

            const li =
                document.createElement(
                    "li"
                );


            li.innerHTML = `

                <span class="history-title">
                    ${escapeHTML(chat.title)}
                </span>

                <button
                    class="delete-chat"
                    type="button">

                    🗑️

                </button>

            `;


            li.querySelector(
                ".history-title"
            ).addEventListener(
                "click",
                function() {

                    currentChat =
                        [...chat.messages];


                    currentChatTitle =
                        chat.title;


                    localStorage.setItem(
                        "currentChat",
                        JSON.stringify(
                            currentChat
                        )
                    );


                    localStorage.setItem(
                        "currentChatTitle",
                        currentChatTitle
                    );


                    renderChat(
                        currentChat
                    );
                }
            );


            li.querySelector(
                ".delete-chat"
            ).addEventListener(
                "click",
                function(event) {

                    event.stopPropagation();


                    if (
                        !confirm(
                            "Delete this chat?"
                        )
                    ) {
                        return;
                    }


                    allChats.splice(
                        index,
                        1
                    );


                    localStorage.setItem(
                        "allChats",
                        JSON.stringify(
                            allChats
                        )
                    );


                    loadHistory();
                }
            );


            history.appendChild(
                li
            );
        }
    );
}


// =========================================================
// RENDER CHAT
// =========================================================

function renderChat(messages) {

    if (!chatBox) return;


    chatBox.innerHTML =
        "";


    messages.forEach(
        function(msg) {

            if (
                msg.role === "user"
            ) {

                chatBox.innerHTML += `

                    <div class="user-message">

                        <div class="bubble">
                            ${escapeHTML(msg.text)}
                        </div>

                        <div class="avatar">
                            👤
                        </div>

                    </div>

                `;

            } else {

                chatBox.innerHTML += `

                    <div class="ai-message">

                        <div class="avatar">
                            🤖
                        </div>

                        <div class="bubble">

                            ${formatAnswer(msg.text)}

                            <br><br>

                            <button
                                class="speak-answer"
                                type="button">

                                🔊 Speak

                            </button>

                        </div>

                    </div>

                `;
            }
        }
    );


    const aiMessages =
        messages.filter(
            msg =>
                msg.role === "ai"
        );


    chatBox
        .querySelectorAll(
            ".speak-answer"
        )
        .forEach(
            function(button, index) {

                button.addEventListener(
                    "click",
                    function() {

                        speakText(
                            aiMessages[index].text
                        );
                    }
                );
            }
        );


    chatBox.scrollTop =
        chatBox.scrollHeight;
}


// =========================================================
// WELCOME
// =========================================================

function showWelcome() {

    if (!chatBox) return;


    chatBox.innerHTML = `

        <div class="ai-message">

            <div class="avatar">
                🤖
            </div>

            <div class="bubble">

                👋 Hello! I'm
                <b>SolveItAI</b>.

                <br>

                Ask me anything.

            </div>

        </div>

    `;
}


// =========================================================
// RESTORE CHAT
// =========================================================

function restoreCurrentChat() {

    if (!currentChat.length) {

        showWelcome();

        return;
    }


    renderChat(
        currentChat
    );
}


// =========================================================
// SETTINGS
// =========================================================

function openSetting() {

    localStorage.setItem(
        "currentChat",
        JSON.stringify(
            currentChat
        )
    );


    localStorage.setItem(
        "currentChatTitle",
        currentChatTitle
    );


    window.location.href =
        "setting.html";
}


// =========================================================
// THEME
// =========================================================

function applyMainTheme() {

    const theme =
        localStorage.getItem(
            "theme"
        ) || "dark";


    document.body.classList.toggle(
        "light",
        theme === "light"
    );
}


// =========================================================
// PLACEHOLDER
// =========================================================

function applyPlaceholder() {

    if (!textarea) return;


    const language =
        localStorage.getItem(
            "language"
        ) || "en";


    if (language === "mr") {

        textarea.placeholder =
            "तुझा प्रश्न लिहा...";

    } else if (language === "hi") {

        textarea.placeholder =
            "अपना सवाल लिखें...";

    } else {

        textarea.placeholder =
            "Type your problem...";
    }
}


// =========================================================
// AI VIDEO VARIABLES
// =========================================================

let videoRecognition =
    null;

let userCameraStream =
    null;

let aiVideoActive =
    false;

let handsFreeVoice =
    false;

let recognitionRestartTimer =
    null;


// =========================================================
// OPEN AI VIDEO
// =========================================================

async function openAIVideo() {

    const screen =
        document.getElementById(
            "aiVideoScreen"
        );


    if (!screen) return;


    screen.classList.add(
        "active"
    );


    aiVideoActive =
        true;


    handsFreeVoice =
        true;


    updateVideoStatus(
        "🤖 Starting SolveItAI Video Call..."
    );


    updateVideoCC(
        "Connecting camera and microphone..."
    );


    await startUserCamera();


    setTimeout(
        function() {

            if (!aiVideoActive)
                return;


            const greeting =
                "Hello! I'm SolveItAI. How can I help you today?";


            updateVideoStatus(
                "🤖 SolveItAI is speaking..."
            );


            updateVideoCC(
                greeting
            );


            speakText(
                greeting
            );

        },
        700
    );
}


// =========================================================
// START USER CAMERA + MICROPHONE
// =========================================================

async function startUserCamera() {

    const video =
        document.getElementById(
            "userVideo"
        );


    if (!video) {

        updateVideoStatus(
            "📷 userVideo element not found."
        );

        return;
    }


    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        updateVideoStatus(
            "📷 Camera API is not supported."
        );

        return;
    }


    try {

        if (userCameraStream) {

            stopUserCamera();
        }


        userCameraStream =
            await navigator.mediaDevices.getUserMedia(
                {
                    video: true,
                    audio: true
                }
            );


        video.srcObject =
            userCameraStream;


        video.autoplay =
            true;

        video.muted =
            true;

        video.playsInline =
            true;


        try {

            await video.play();

        } catch (playError) {

            console.log(
                "Video autoplay:",
                playError
            );
        }


        updateVideoStatus(
            "📷 Camera + microphone connected"
        );


        updateVideoCC(
            "Camera connected. Speak normally."
        );

    } catch (error) {

        console.error(
            "Camera/Mic error:",
            error
        );


        updateVideoStatus(
            "📷 Camera/Microphone permission required."
        );


        updateVideoCC(
            "Allow camera and microphone permission in your browser."
        );
    }
}


// =========================================================
// STOP USER CAMERA
// =========================================================

function stopUserCamera() {

    if (userCameraStream) {

        userCameraStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );


        userCameraStream =
            null;
    }


    const video =
        document.getElementById(
            "userVideo"
        );


    if (video) {

        video.srcObject =
            null;
    }
}


// =========================================================
// CAMERA TOGGLE
// =========================================================

function toggleUserCamera() {

    if (!userCameraStream) {

        startUserCamera();

        return;
    }


    const track =
        userCameraStream
            .getVideoTracks()[0];


    if (!track) return;


    track.enabled =
        !track.enabled;


    const button =
        document.getElementById(
            "cameraButton"
        );


    if (button) {

        button.innerHTML =
            track.enabled
                ? "📹<small>Camera</small>"
                : "🚫<small>Camera</small>";
    }
}


// =========================================================
// USER MIC TOGGLE
// =========================================================

function toggleUserMic() {

    if (!userCameraStream)
        return;


    const track =
        userCameraStream
            .getAudioTracks()[0];


    if (!track) return;


    track.enabled =
        !track.enabled;


    const button =
        document.getElementById(
            "userMicToggle"
        );


    if (button) {

        button.innerText =
            track.enabled
                ? "🎤"
                : "🔇";
    }
}


// =========================================================
// CLOSE AI VIDEO
// =========================================================

function closeAIVideo() {

    aiVideoActive =
        false;


    handsFreeVoice =
        false;


    if (recognitionRestartTimer) {

        clearTimeout(
            recognitionRestartTimer
        );

        recognitionRestartTimer =
            null;
    }


    // Stop interrupt listener
    stopVoiceInterruptListener();


    // Stop speech
    if (
        "speechSynthesis" in window
    ) {

        speechSynthesis.cancel();
    }


    isSpeaking =
        false;


    stopRobotMouth();


    stopUserCamera();


    if (videoRecognition) {

        try {

            videoRecognition.onend =
                null;

            videoRecognition.onerror =
                null;

            videoRecognition.stop();

        } catch (error) {

            console.log(error);
        }


        videoRecognition =
            null;
    }


    const screen =
        document.getElementById(
            "aiVideoScreen"
        );


    if (screen) {

        screen.classList.remove(
            "active"
        );

        screen.classList.remove(
            "speaking"
        );

        screen.classList.remove(
            "thinking"
        );
    }
}


// =========================================================
// HANDS-FREE VIDEO VOICE
// =========================================================

function startAIVideoVoice() {

    if (!aiVideoActive) {
        return;
    }


    if (isSpeaking) {
        return;
    }


    if (!SpeechRecognition) {

        updateVideoStatus(
            "❌ Voice input is not supported in this browser."
        );

        return;
    }


    stopVoiceInterruptListener();


    if (videoRecognition) {

        try {

            videoRecognition.stop();

        } catch (error) {}

        videoRecognition =
            null;
    }


    videoRecognition =
        new SpeechRecognition();


    const language =
        localStorage.getItem(
            "language"
        ) || "en";


    if (language === "mr") {

        videoRecognition.lang =
            "mr-IN";

    } else if (language === "hi") {

        videoRecognition.lang =
            "hi-IN";

    } else {

        videoRecognition.lang =
            "en-US";
    }


    videoRecognition.interimResults =
        false;

    videoRecognition.continuous =
        false;


    updateVideoStatus(
        "🎤 Listening..."
    );


    updateVideoCC(
        "Speak naturally..."
    );


    videoRecognition.onresult =
        async function(event) {

            if (!aiVideoActive) {
                return;
            }


            const question =
                event.results[0][0]
                    .transcript
                    .trim();


            if (!question) {

                restartHandsFreeVoice();

                return;
            }


            updateVideoCC(
                "You: " + question
            );


            await askVideoAI(
                question
            );
        };


    videoRecognition.onerror =
        function(error) {

            console.log(
                "Video voice error:",
                error
            );


            if (
                aiVideoActive &&
                handsFreeVoice &&
                !isSpeaking
            ) {

                restartHandsFreeVoice();
            }
        };


    videoRecognition.onend =
        function() {

            if (
                aiVideoActive &&
                handsFreeVoice &&
                !isSpeaking
            ) {

                restartHandsFreeVoice();
            }
        };


    try {

        videoRecognition.start();

    } catch (error) {

        console.log(
            "Recognition start:",
            error
        );


        restartHandsFreeVoice();
    }
}


// =========================================================
// AUTO RESTART VOICE
// =========================================================

function restartHandsFreeVoice() {

    if (
        !aiVideoActive ||
        !handsFreeVoice ||
        isSpeaking
    ) {
        return;
    }


    if (recognitionRestartTimer) {
        return;
    }


    recognitionRestartTimer =
        setTimeout(
            function() {

                recognitionRestartTimer =
                    null;


                if (
                    aiVideoActive &&
                    handsFreeVoice &&
                    !isSpeaking
                ) {

                    startAIVideoVoice();
                }

            },
            500
        );
}


// =========================================================
// ASK VIDEO AI
// =========================================================

async function askVideoAI(question) {

    if (
        !question ||
        !aiVideoActive
    ) {
        return;
    }


    const screen =
        document.getElementById(
            "aiVideoScreen"
        );


    if (screen) {

        screen.classList.add(
            "thinking"
        );
    }


    updateVideoStatus(
        "🤖 SolveItAI is thinking..."
    );


    updateVideoCC(
        "Generating smart answer..."
    );


    try {

        const response =
            await fetch(API_URL, {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    question:
                        question,

                    mode:
                        localStorage.getItem(
                            "mode"
                        ) || "normal",

                    language:
                        localStorage.getItem(
                            "language"
                        ) || "en"
                })
            });


        if (!response.ok) {

            throw new Error(
                "Server Error: " +
                response.status
            );
        }


        const data =
            await response.json();


        const answer =
            data.answer ||
            "Sorry, I couldn't answer.";


        if (screen) {

            screen.classList.remove(
                "thinking"
            );
        }


        updateVideoStatus(
            "🤖 SolveItAI is speaking..."
        );


        updateVideoCC(
            answer
        );


        if (currentChat.length === 0) {

            currentChatTitle =
                question;
        }


        currentChat.push({

            role: "user",

            text: question
        });


        currentChat.push({

            role: "ai",

            text: answer
        });


        saveCurrentChat();


        if (
            localStorage.getItem(
                "voiceOutput"
            ) !== "false"
        ) {

            speakText(
                answer
            );

        } else {

            updateVideoStatus(
                "🤖 Answer ready."
            );


            restartHandsFreeVoice();
        }


    } catch (error) {

        console.error(
            "Video AI Error:",
            error
        );


        if (screen) {

            screen.classList.remove(
                "thinking"
            );
        }


        updateVideoStatus(
            "❌ Connection Error"
        );


        updateVideoCC(
            "Check that SolveItAI server is running."
        );


        restartHandsFreeVoice();
    }
}


// =========================================================
// VIDEO STATUS
// =========================================================

function updateVideoStatus(text) {

    const status =
        document.getElementById(
            "aiVideoStatus"
        );


    if (status) {

        status.innerText =
            text;
    }
}


// =========================================================
// VIDEO CAPTION
// =========================================================

function updateVideoCC(text) {

    const cc =
        document.getElementById(
            "aiVideoCC"
        );


    if (cc) {

        cc.innerText =
            text;
    }
}


// =========================================================
// DOM EVENTS
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        // =============================================
        // VIDEO MIC
        // =============================================

        const mic =
            document.getElementById(
                "videoMic"
            );


        if (mic) {

            mic.addEventListener(
                "click",
                function() {

                    handsFreeVoice =
                        true;

                    startAIVideoVoice();
                }
            );
        }


        // =============================================
        // CLOSE VIDEO
        // =============================================

        const closeButton =
            document.getElementById(
                "closeVideo"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                function() {

                    closeAIVideo();
                }
            );
        }


        // =============================================
        // CAMERA
        // =============================================

        const cameraButton =
            document.getElementById(
                "cameraButton"
            );


        if (cameraButton) {

            cameraButton.addEventListener(
                "click",
                function() {

                    toggleUserCamera();
                }
            );
        }


        // =============================================
        // END CALL
        // =============================================

        const endCallButton =
            document.getElementById(
                "endCallButton"
            );


        if (endCallButton) {

            endCallButton.addEventListener(
                "click",
                function() {

                    closeAIVideo();
                }
            );
        }


        // =============================================
        // SPEAKER
        // =============================================

        const speakerButton =
            document.getElementById(
                "speakerButton"
            );


        if (speakerButton) {

            speakerButton.addEventListener(
                "click",
                function() {

                    if (isSpeaking) {

                        stopAISpeech();


                        updateVideoStatus(
                            "🔇 Speaker stopped"
                        );


                        if (
                            aiVideoActive &&
                            handsFreeVoice
                        ) {

                            restartHandsFreeVoice();
                        }

                    } else {

                        updateVideoStatus(
                            "🔊 Speaker ready"
                        );
                    }
                }
            );
        }


        // =============================================
        // CAPTION
        // =============================================

        const captionButton =
            document.getElementById(
                "captionButton"
            );


        if (captionButton) {

            captionButton.addEventListener(
                "click",
                function() {

                    const cc =
                        document.getElementById(
                            "aiVideoCC"
                        );


                    if (cc) {

                        cc.classList.toggle(
                            "hidden"
                        );
                    }
                }
            );
        }

    }
);


// =========================================================
// CHATGPT STYLE SIDEBAR TOGGLE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const toggleButton =
            document.getElementById(
                "sidebarToggle"
            );


        const sidebar =
            document.querySelector(
                ".sidebar"
            );


        if (
            !toggleButton ||
            !sidebar
        ) {
            return;
        }


        toggleButton.addEventListener(
            "click",
            function() {

                sidebar.classList.toggle(
                    "show"
                );


                if (
                    sidebar.classList.contains(
                        "show"
                    )
                ) {

                    toggleButton.innerHTML =
                        "✕";

                } else {

                    toggleButton.innerHTML =
                        "☰";
                }
            }
        );

    }
);


// =========================================================
// SPEECH VOICES READY
// =========================================================

if (
    "speechSynthesis" in window
) {

    speechSynthesis.onvoiceschanged =
        function() {

            speechSynthesis.getVoices();
        };
}


// =========================================================
// START
// =========================================================

applyMainTheme();

applyPlaceholder();

loadHistory();

restoreCurrentChat();


// =========================================
// GAME MODE
// =========================================

function openGameMode() {

    const screen =
        document.getElementById(
            "gameModeScreen"
        );

    if (!screen) return;


    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    const toggleButton =
        document.getElementById(
            "sidebarToggle"
        );


    if (sidebar) {

        sidebar.classList.remove(
            "show"
        );
    }


    if (toggleButton) {

        toggleButton.innerHTML =
            "☰";
    }


    screen.classList.add(
        "active"
    );

    document.body.style.overflow =
        "hidden";
}


function closeGameMode() {

    const screen =
        document.getElementById(
            "gameModeScreen"
        );

    if (!screen) return;


    screen.classList.remove(
        "active"
    );

    document.body.style.overflow =
        "";
}


// =========================================
// CHESS
// =========================================

function openChess(mode) {

    if (mode === "ai") {

        window.location.href =
            "game.html?mode=ai";

    } else {

        window.location.href =
            "game.html?mode=duo";
    }

}


// =========================================
// CARROM
// =========================================

function openCarrom() {

    alert(
        "🟤 Carrom is coming soon!"
    );

}
// =========================================
// END OF MAIN SCRIPT
// =========================================