const express = require("express");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(express.json()); // JSON body များကို ဖတ်နိုင်ရန်

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

// Base Route
app.get("/", (req, res) => {
    res.send("Movie Backend Running with Firebase Admin!");
});

// 🎬 1. ရုပ်ရှင်ဒေတာအားလုံးကို ဆွဲထုတ်မည့် API (GET)
app.get("/api/movies", async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ success: false, message: "Database not initialized" });
        }

        const moviesSnapshot = await db.collection("movies").get();
        const moviesList = [];

        moviesSnapshot.forEach((doc) => {
            moviesList.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json({
            success: true,
            count: moviesList.length,
            data: moviesList
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch movies", error: error.message });
    }
});

// ➕ 2. ရုပ်ရှင်ဒေတာအသစ် လှမ်းသိမ်းမည့် API (POST)
app.post("/api/movies", async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ success: false, message: "Database not initialized" });
        }

        // Client ဘက်မှ ပို့လိုက်သော Data များကို လက်ခံခြင်း
        const { title, year, rating, genre } = req.body;

        // Validation - Title မပါလျှင် Error ပြန်မည်
        if (!title) {
            return res.status(400).json({ success: false, message: "Movie title is required" });
        }

        const newMovie = {
            title,
            year: year ? Number(year) : null,
            rating: rating ? Number(rating) : null,
            genre: genre || "Unknown",
            createdAt: admin.firestore.FieldValue.serverTimestamp() // သိမ်းသည့်အချိန်ကို Auto မှတ်ပေးခြင်း
        };

        // Firestore ရဲ့ 'movies' collection ထဲသို့ လှမ်းထည့်ခြင်း
        const docRef = await db.collection("movies").add(newMovie);

        res.status(201).json({
            success: true,
            message: "Movie added successfully!",
            movieId: docRef.id // Firestore က ထုတ်ပေးလိုက်တဲ့ Auto ID ကို ပြန်ပြခြင်း
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add movie", error: error.message });
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
        debug: { hasServiceAccountConfig: !!process.env.FIREBASE_SERVICE_ACCOUNT }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

