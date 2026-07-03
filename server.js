const express = require("express");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(express.json());

// Firebase Admin SDK စတင်ချိတ်ဆက်ခြင်း
try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            })
        });
        console.log("Firebase Admin Initialized Successfully!");
    } else {
        console.error("Firebase Environment Variables are missing!");
    }
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

app.get("/", (req, res) => {
    res.send("Movie Backend Running with Firebase Admin!");
});

// 🟢 ပြင်ဆင်ထားသော Health Check API (Error တက်ရင် ဘာ Error လဲဆိုတာ အတိအကျ ထုတ်ပြပေးမည့်အပိုင်း)
app.get("/api/health", (req, res) => {
    try {
        res.json({
            success: true,
            message: "Server OK",
            firebase: (admin.apps && admin.apps.length > 0) ? "Connected" : "Disconnected"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Health Check Error",
            error: error.message,
            stack: error.stack
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

