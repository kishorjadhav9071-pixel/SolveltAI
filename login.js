// ===============================
// SolveItAI LOGIN SYSTEM
// ===============================


// SHOW / HIDE PASSWORD

document
    .getElementById("showPassword")
    .addEventListener("change", function () {

        const password =
            document.getElementById("password");

        password.type =
            this.checked ? "text" : "password";
    });


// LOGIN

document
    .getElementById("loginBtn")
    .addEventListener("click", async function () {

        const email =
            document.getElementById("username").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("message");


        if (!email || !password) {

            message.textContent =
                "Please enter Email and Password.";

            return;
        }


        try {

            const response =
                await fetch("/api/auth/login", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                });


            const data =
                await response.json();


            if (!response.ok) {

                message.textContent =
                    data.error || "Login failed.";

                return;
            }


            localStorage.setItem(
                "solveitai_token",
                data.token
            );


            localStorage.setItem(
                "solveitai_user",
                JSON.stringify(data.user)
            );


            // Old login flag also kept
            // for compatibility

            localStorage.setItem(
                "loggedIn",
                "true"
            );


            message.style.color =
                "#45e69a";

            message.textContent =
                "Login successful!";


            setTimeout(() => {

                window.location.href = "/";

            }, 500);


        } catch (error) {

            console.error(error);

            message.style.color =
                "#ff7070";

            message.textContent =
                "Server connection failed.";
        }

    });


// CREATE ACCOUNT BUTTON

document
    .getElementById("signupBtn")
    .addEventListener("click", function () {

        document
            .getElementById("loginForm")
            .style.display = "none";


        document
            .getElementById("registerForm")
            .style.display = "block";


        document
            .getElementById("subtitle")
            .textContent =
            "Create your SolveItAI account";


        document
            .getElementById("message")
            .textContent = "";

    });


// REGISTER

document
    .getElementById("registerBtn")
    .addEventListener("click", async function () {

        const name =
            document
                .getElementById("registerName")
                .value
                .trim();

        const email =
            document
                .getElementById("registerEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("registerPassword")
                .value;


        const message =
            document.getElementById("message");


        if (!name || !email || !password) {

            message.style.color =
                "#ff7070";

            message.textContent =
                "Please fill all fields.";

            return;
        }


        if (password.length < 6) {

            message.style.color =
                "#ff7070";

            message.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        try {

            const response =
                await fetch("/api/auth/register", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                });


            const data =
                await response.json();


            if (!response.ok) {

                message.style.color =
                    "#ff7070";

                message.textContent =
                    data.error ||
                    "Registration failed.";

                return;
            }


            message.style.color =
                "#45e69a";

            message.textContent =
                "Account created successfully!";


            setTimeout(() => {

                document
                    .getElementById("registerForm")
                    .style.display = "none";


                document
                    .getElementById("loginForm")
                    .style.display = "block";


                document
                    .getElementById("subtitle")
                    .textContent =
                    "Welcome Back";


                message.textContent = "";

            }, 1000);


        } catch (error) {

            console.error(error);

            message.style.color =
                "#ff7070";

            message.textContent =
                "Server connection failed.";
        }

    });


// BACK TO LOGIN

document
    .getElementById("backLoginBtn")
    .addEventListener("click", function () {

        document
            .getElementById("registerForm")
            .style.display = "none";


        document
            .getElementById("loginForm")
            .style.display = "block";


        document
            .getElementById("subtitle")
            .textContent =
            "Welcome Back";


        document
            .getElementById("message")
            .textContent = "";

    });


// GUEST MODE

document
    .getElementById("guestBtn")
    .addEventListener("click", function () {

        localStorage.setItem(
            "loggedIn",
            "guest"
        );

        window.location.href = "/";

    });