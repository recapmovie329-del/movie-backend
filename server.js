const express = require("express");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(express.json());

// Firebase Admin SDK ကို JSON စာသားတိုက်ရိုက်ဖြင့် ချိတ်ဆက်ခြင်း
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // String ဖြစ်နေတဲ့ JSON စာသားကို Object အဖြစ် ပြန်ပြောင်းခြင်း
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin Initialized Successfully!");
    } else {
        console.error("FIREBASE_SERVICE_ACCOUNT variable is missing!");
    }
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

app.get("/", (req, res) => {
    res.send("Movie Backend Running with Firebase Admin!");
});

app.get("/api/health", (req, res) => {
    try {
        res.json({
            success: true,
            message: "Server OK",
            firebase: (admin.apps && admin.apps.length > 0) ? "Connected" : "Disconnected",
            debug: {
                hasServiceAccountConfig: !!process.env.FIREBASE_SERVICE_ACCOUNT
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Health Check Error",
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

