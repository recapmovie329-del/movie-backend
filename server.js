const express = require("express");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(express.json());

let initializationError = null;
let db = null;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let configStr = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        configStr = configStr.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ");

        if (configStr.startsWith('"') && configStr.endsWith('"')) {
            configStr = configStr.slice(1, -1);
        }

        const serviceAccount = JSON.parse(configStr);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        
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

// Global DB variable ကို အခြား route များက သုံးနိုင်ရန် express app တွင် သိမ်းထားခြင်း
app.set("db", db);
app.set("admin", admin);

// Base Route
app.get("/", (req, res) => {
    res.send("Movie Recap Automation Backend Running!");
});

// 🎬 Movies Data Route (Lesson 4 က အပိုင်း)
app.get("/api/movies", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ success: false, message: "Database not initialized" });
        const moviesSnapshot = await db.collection("movies").get();
        const moviesList = [];
        moviesSnapshot.forEach((doc) => { moviesList.push({ id: doc.id, ...doc.data() }); });
        res.json({ success: true, count: moviesList.length, data: moviesList });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch movies", error: error.message });
    }
});

// Health Check Route
app.get("/api/health", (req, res) => {
    let isConnected = false;
    try { if (admin.apps && admin.apps.length > 0) isConnected = true; } catch (e) { isConnected = false; }
    res.json({
        success: true,
        message: "Server OK",
        firebase: isConnected ? "Connected" : "Disconnected",
        errorLogs: initializationError
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

