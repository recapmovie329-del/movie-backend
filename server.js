const express = require("express");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();

// 📁 Global Middleware (JSON body ဖတ်နိုင်ရန်)
app.use(express.json());

// ➕ Movie Recap Video Processing Route ကို ချိတ်ဆက်ခြင်း
const videoRouter = require("./routes/video");
app.use("/api/video", videoRouter);

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

// Global Variables များကို အခြား Route (ဥပမာ - video.js) ထဲမှ လှမ်းသုံးနိုင်ရန် Express တွင် သိမ်းဆည်းခြင်း
app.set("db", db);
app.set("admin", admin);

// 🏠 Base Route
app.get("/", (req, res) => {
    res.send("Movie Recap Automation Backend Running!");
});

// 🎬 Movies Data API (GET - ရုပ်ရှင်စာရင်းကြည့်ရန်)
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

// ➕ Movies Data API (POST - ရုပ်ရှင်အသစ်လက်manualထည့်ရန်)
app.post("/api/movies", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ success: false, message: "Database not initialized" });
        const { title, year, rating, genre } = req.body;
        if (!title) return res.status(400).json({ success: false, message: "Movie title is required" });

        const newMovie = {
            title,
            year: year ? Number(year) : null,
            rating: rating ? Number(rating) : null,
            genre: genre || "Unknown",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection("movies").add(newMovie);
        res.status(201).json({ success: true, message: "Movie added successfully!", movieId: docRef.id });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add movie", error: error.message });
    }
});

// 🏥 Health Check Route (ဆာဗာနှင့် Firebase အခြေအနေအား စစ်ဆေးရန်)
app.get("/api/health", (req, res) => {
    let isConnected = false;
    try { if (admin.apps && admin.apps.length > 0) isConnected = true; } catch (e) { isConnected = false; }
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

