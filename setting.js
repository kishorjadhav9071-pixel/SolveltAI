// =========================================
// SOLVEITAI SETTINGS
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    const language = document.getElementById("language");
    const theme = document.getElementById("theme");
    const mode = document.getElementById("mode");
    const responseStyle = document.getElementById("responseStyle");
    const fontSize = document.getElementById("fontSize");

    const voiceOutput = document.getElementById("voiceOutput");
    const voiceInput = document.getElementById("voiceInput");
    const fastMode = document.getElementById("fastMode");

    const saveBtn = document.getElementById("saveBtn");
    const clearBtn = document.getElementById("clearBtn");
    const logoutBtn = document.getElementById("logoutBtn");


    // =========================================
    // LOAD SAVED SETTINGS
    // =========================================

    language.value =
        localStorage.getItem("language") || "en";

    theme.value =
        localStorage.getItem("theme") || "dark";

    mode.value =
        localStorage.getItem("mode") || "normal";

    responseStyle.value =
        localStorage.getItem("responseStyle") || "short";

    fontSize.value =
        localStorage.getItem("fontSize") || "Medium";

    voiceOutput.checked =
        localStorage.getItem("voiceOutput") !== "false";

    voiceInput.checked =
        localStorage.getItem("voiceInput") !== "false";

    fastMode.checked =
        localStorage.getItem("fastMode") === "true";


    // =========================================
    // APPLY THEME
    // =========================================

    function applyTheme() {

        if (theme.value === "light") {

            document.body.classList.add("light");

        } else {

            document.body.classList.remove("light");
        }
    }

    applyTheme();


    // Theme instantly preview

    theme.addEventListener("change", () => {
        applyTheme();
    });


    // =========================================
    // SAVE SETTINGS
    // =========================================

    saveBtn.addEventListener("click", () => {

        localStorage.setItem(
            "language",
            language.value
        );

        localStorage.setItem(
            "theme",
            theme.value
        );

        localStorage.setItem(
            "mode",
            mode.value
        );

        localStorage.setItem(
            "responseStyle",
            responseStyle.value
        );

        localStorage.setItem(
            "fontSize",
            fontSize.value
        );

        localStorage.setItem(
            "voiceOutput",
            voiceOutput.checked
        );

        localStorage.setItem(
            "voiceInput",
            voiceInput.checked
        );

        localStorage.setItem(
            "fastMode",
            fastMode.checked
        );


        // Apply theme

        applyTheme();


        alert(
            "✅ Settings Saved Successfully!"
        );


        // Return to main page

        window.location.href =
            "index.html";

    });


    // =========================================
    // CLEAR CHAT HISTORY
    // =========================================

    clearBtn.addEventListener("click", () => {

        const confirmDelete =
            confirm(
                "Delete all chat history?"
            );

        if (!confirmDelete) {
            return;
        }


        localStorage.removeItem(
            "allChats"
        );

        localStorage.removeItem(
            "currentChat"
        );

        localStorage.removeItem(
            "currentChatTitle"
        );


        alert(
            "✅ All Chat History Cleared!"
        );

    });


    // =========================================
    // LOGOUT
    // =========================================

    logoutBtn.addEventListener(
        "click",
        () => {

            const confirmLogout =
                confirm(
                    "Do you want to logout?"
                );

            if (!confirmLogout) {
                return;
            }


            localStorage.removeItem(
                "loggedIn"
            );


            window.location.href =
                "login.html";

        }
    );

});