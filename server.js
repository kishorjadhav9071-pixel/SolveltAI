const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
    createUser,
    findUserByEmail
} = require("./auth/auth");

const authenticateToken =
    require("./auth/authMiddleware");

dotenv.config();

const app = express();

/* =========================================================
   BASIC SETTINGS
========================================================= */

app.use(cors());

app.use(
    express.json({
        limit: "8mb"
    })
);
app.use(express.static(__dirname));

app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(
        "User-agent: *\n" +
        "Allow: /\n\n" +
        "Sitemap: https://solveltai.onrender.com/sitemap.xml"
    );
});

/* =========================================================
   OPENROUTER
========================================================= */

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});

const TEXT_MODEL = "openrouter/free";
const VISION_MODEL = "openrouter/free";

/* =========================================================
   HOME
========================================================= */
app.get("/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// =========================================================
// REGISTER
// =========================================================

app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const existingUser =
            await findUserByEmail(cleanEmail);

        if (existingUser) {
            return res.status(409).json({
                error: "Email already registered"
            });
        }

        const user = await createUser(
            name.trim(),
            cleanEmail,
            password
        );

        res.status(201).json({
            message: "Account created successfully",
            user
        });

    } catch (error) {
        console.error("Register Error:", error);

        res.status(500).json({
            error: "Registration failed"
        });
    }
});

// =========================================================
// LOGIN
// =========================================================

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const user = await findUserByEmail(cleanEmail);

        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login Error:", error);

        res.status(500).json({
            error: "Login failed"
        });
    }
});

/* =========================================================
   NORMAL CHAT + CHAT MEMORY
========================================================= */

app.post("/ask", authenticateToken, async (req, res) => {

    try {

        const {
            question,
            mode,
            language,
            history
        } = req.body;

        if (
            typeof question !== "string" ||
            !question.trim()
        ) {

            return res.status(400).json({
                answer:
                    "❌ Please enter a question."
            });

        }

        const q =
            question.toLowerCase();

        /* =====================================================
           CREATOR INFORMATION
        ===================================================== */

        if (
            q.includes("who made you") ||
            q.includes("who created you") ||
            q.includes("who designed you") ||
            q.includes("who developed you") ||
            q.includes("तुला कोणी बनवलं") ||
            q.includes("तुला कोणी तयार केलं")
        ) {

            return res.json({
                answer:
                    "I was created and designed by Naitik Jadhav."
            });

        }

        /* =====================================================
           NAITIK JADHAV
        ===================================================== */

        if (
            q.includes("who is naitik jadhav") ||
            q.includes("naitik jadhav who") ||
            q.includes("नाईतिक जाधव कोण")
        ) {

            return res.json({
                answer:
                    "Naitik Jadhav is the creator of SolveItAI. He also has a YouTube channel called Naitu Gamer."
            });

        }

        /* =====================================================
           IMAGE GENERATION
        ===================================================== */

        if (
            q.includes("generate image") ||
            q.includes("create image") ||
            q.includes("draw") ||
            q.includes("image बनाओ") ||
            q.includes("चित्र बनवा")
        ) {

            return res.json({
                answer:
                    "🖼️ Image generation is coming soon in SolveItAI."
            });

        }

        /* =====================================================
           CHAT MEMORY
        ===================================================== */

        const safeHistory =
            Array.isArray(history)
                ? history
                    .filter(item =>
                        item &&
                        (
                            item.role === "user" ||
                            item.role === "assistant" ||
                            item.role === "ai"
                        ) &&
                        typeof item.text === "string" &&
                        item.text.trim()
                    )
                    .map(item => ({
                        role:
                            item.role === "ai"
                                ? "assistant"
                                : item.role,
                        content:
                            item.text
                    }))
                : [];

        /* Keep latest messages only */
        const recentHistory =
            safeHistory.slice(-24);

        /* =====================================================
           AI REQUEST
        ===================================================== */

        const completion =
            await client.chat.completions.create({

                model:
                    TEXT_MODEL,

                messages: [

                    {
                        role: "system",

                        content: `
You are SolveItAI.

Your creator is Naitik Jadhav.

CHAT MEMORY RULES:

- Remember previous messages in the current conversation.
- Use previous messages when answering follow-up questions.
- If the user shared code earlier, use that code when needed.
- If the user asks to fix, edit, explain or modify previous code, use the code already present in memory.
- Do not ask the user to paste the same code again if it is already available.
- Treat follow-up messages as part of the same conversation.

GENERAL RULES:

- Give short and clear answers.
- Maximum 4 or 5 lines normally.
- No long paragraphs.
- No markdown tables.
- Be friendly.
- Use simple language.
- Answer directly.

FORMATTING RULES:

- Never use * or ** for formatting.
- Do not use markdown bold or italic.
- Use simple numbered points when useful.
- Keep answers clean and easy to read.

LANGUAGE:

Selected language:

${language || "en"}

If language is "en":
Answer in English.

If language is "mr":
Answer in Marathi.

If language is "hi":
Answer in Hindi.

Always follow the selected language.

AI MODE:

Selected mode:

${mode || "normal"}

If mode is "normal":
Answer normally.

If mode is "study":
Explain like a student-friendly teacher.

If mode is "coding":
Focus on programming and give useful code.

If mode is "math":
Solve mathematics step-by-step.

If mode is "homework":
Give clear and easy homework help.

If mode is "writing":
Help with writing, grammar and content.

If mode is "web":
Answer normally based on available information.

If mode is "image":
Image generation is currently coming soon.
`
                    },

                    ...recentHistory,

                    {
                        role: "user",
                        content: question
                    }

                ]

            });

        const answer =
            completion
                ?.choices?.[0]
                ?.message?.content ||
            "Sorry, I couldn't answer.";

        return res.json({
            answer
        });

    } catch (error) {

        console.error(
            "AI Error:",
            error
        );

        return res.status(500).json({
            answer:
                "❌ AI Error: " +
                (
                    error.message ||
                    "Unknown Error"
                )
        });

    }

});

/* =========================================================
   IMAGE / VISION AI
========================================================= */

app.post("/vision", async (req, res) => {

    console.log("========== VISION REQUEST ==========");

    console.log(
        "Image type:",
        typeof req.body.image
    );

    console.log(
        "Image start:",
        typeof req.body.image === "string"
            ? req.body.image.substring(0, 80)
            : req.body.image
    );

    console.log(
        "Image length:",
        req.body.image?.length
    );

    try {

        const {
            question,
            image,
            language
        } = req.body;

        /* =====================================================
           IMAGE VALIDATION
        ===================================================== */

        if (
            typeof image !== "string" ||
            !image.startsWith("data:image/")
        ) {

            return res.status(400).json({
                answer:
                    "❌ Invalid image."
            });

        }

        /* =====================================================
           ALLOWED IMAGE TYPES
        ===================================================== */

        const allowedTypes = [
            "data:image/jpeg",
            "data:image/jpg",
            "data:image/png",
            "data:image/webp"
        ];

        const validType =
            allowedTypes.some(
                type =>
                    image.startsWith(type)
            );

        if (!validType) {

            return res.status(400).json({
                answer:
                    "❌ Unsupported image format."
            });

        }

        /* =====================================================
           IMAGE SIZE LIMIT
        ===================================================== */

        if (
            image.length >
            6 * 1024 * 1024
        ) {

            return res.status(413).json({
                answer:
                    "❌ Image is too large. Please select a smaller image."
            });

        }

        /* =====================================================
           VISION SYSTEM PROMPT
        ===================================================== */

        const visionSystemPrompt = `

You are SolveItAI Vision.

Analyze the uploaded image and answer the user's question.

Do not expose sensitive personal information visible in the image.

Do not repeat:
- passwords
- OTPs
- banking details
- identity numbers
- authentication codes
- other confidential information

If sensitive information is visible,
tell the user to hide it.

LANGUAGE:

Selected language:

${language || "en"}

Answer in the selected language.

Keep answers short and clear.

`;

        /* =====================================================
           SEND IMAGE TO VISION MODEL
        ===================================================== */

        const completion =
            await client.chat.completions.create({

                model:
                    VISION_MODEL,

                messages: [

                    {
                        role: "system",

                        content:
                            visionSystemPrompt
                    },

                    {
                        role: "user",

                        content: [

                            {
                                type: "text",

                                text:
                                    question ||
                                    "Please analyze this image and answer briefly."
                            },

                            {
                                type: "image_url",

                                image_url: {
                                    url:
                                        image
                                }
                            }

                        ]

                    }

                ]

            });

        /* =====================================================
           GET ANSWER
        ===================================================== */

        const answer =
            completion
                ?.choices?.[0]
                ?.message?.content ||
            "Sorry, I couldn't analyze this image.";

        return res.json({
            answer
        });

    } catch (error) {

        console.error(
            "Vision AI Error:",
            error
        );

        return res.status(500).json({
            answer:
                "❌ Vision AI Error: " +
                (
                    error.message ||
                    "Unknown Error"
                )
        });

    }

});

/* =========================================================
   SERVER
========================================================= */

const PORT =
    process.env.PORT || 5500;

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `✅ SolveItAI server running at http://0.0.0.0:${PORT}`
        );

        console.log(
            `🖼️ Vision endpoint: http://0.0.0.0:${PORT}/vision`
        );

    }
);