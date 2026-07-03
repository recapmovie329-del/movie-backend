const express = require("express");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(express.json());

let initializationError = null;
let db = null; // 🟢 Firestore Database ပုံး

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let configStr = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        
        // Render ၏ စာကြောင်းအောက်ဆင်းသမျှကို ညှိခြင်း
        configStr = configStr.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ");

        if (configStr.startsWith('"') && configStr.endsWith('"')) {
            configStr = configStr.slice(1, -1);
        }

        const serviceAccount = JSON.parse(configStr);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        
        // 🟢 Firebase ချိတ်ဆက်မှု အောင်မြင်ရင် Firestore DB ကို ယူသုံးမည်
        db = admin.firestore();
        console.log("Firebase Admin & Firestore Initialized Successfully!");
    } else {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
        db = admin.firestore();
        console.log("Firebase Admin Initialized via Application Default (Local).");
    }
} catch (error) {
    initializationError = error.message;
    console.error("Firebase Initialization Error:", error);
}

// Base Route
app.get("/", (req, res) => {
    res.send("Movie Backend Running with Firebase Admin!");
});

// 🎬 1. ရုပ်ရှင်ဒေတာအားလုံးကို Firestore ထဲမှ ဆွဲထုတ်မည့် API Route (GET)
app.get("/api/movies", async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ success: false, message: "Database not initialized" });
        }

        // Firestore ထဲက 'movies' ဆိုတဲ့ Collection ကို လှမ်းခေါ်ခြင်း
        const moviesSnapshot = await db.collection("movies").get();
        const moviesList = [];

        // ရလာတဲ့ ဒေတာတွေကို Array ထဲ စနစ်တကျ ထည့်ခြင်း
        moviesSnapshot.forEach((doc) => {
            moviesList.push({
                id: doc.id,         // Document ရဲ့ ID (Firebase က ပေးတာ)
                ...doc.data()       // အထဲက Movie Data များ (title, year, rating စသည်)
            });
        });

        // Client ဘက်ကို ဒေတာ ပြန်ပေးပို့ခြင်း
        res.json({
            success: true,
            count: moviesList.length,
            data: moviesList
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch movies",
            error: error.message
        });
    }
});

// Health Check Route
app.get("/api/health", (req, res) => {
    let isConnected = false;
    try {
        if (admin.apps && admin.apps.length > 0) {
            isConnected = true;
        }
    } catch (e) {
        isConnected = false;
    }

    res.json({
        success: true,
        message: "Server OK",
        firebase: isConnected ? "Connected" : "Disconnected",
        errorLogs: initializationError,
        debug: {
            hasServiceAccountConfig: !!process.env.FIREBASE_SERVICE_ACCOUNT
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

