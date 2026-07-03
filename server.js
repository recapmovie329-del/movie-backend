const express = require("express");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(express.json());

// 🟢 Private Key ထဲက \n ပြဿနာကို ပုံစံနှစ်မျိုးလုံး စစ်ဆေးပြီး ပြင်ဆင်ပေးသည့် Function
const formatPrivateKey = (key) => {
    if (!key) return undefined;
    // အကယ်၍ ရှေ့နောက် မျက်တောင်ဖွင့်/ပိတ် ပါလာခဲ့ရင် ဖယ်ရှားပစ်ရန်
    let formattedKey = key.trim().replace(/^"/, "").replace(/"$/, "");
    // \n စာသားတွေ ညပ်နေရင် တကယ် စာကြောင်းဆင်းတဲ့ အက္ခရာအဖြစ် ပြောင်းရန်
    if (formattedKey.includes("\\n")) {
        return formattedKey.replace(/\\n/g, '\n');
    }
    return formattedKey;
};

// Firebase Admin SDK စတင်ချိတ်ဆက်ခြင်း
try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY)
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

app.get("/api/health", (req, res) => {
    try {
        res.json({
            success: true,
            message: "Server OK",
            firebase: (admin.apps && admin.apps.length > 0) ? "Connected" : "Disconnected",
            // Debug စစ်ရန်အတွက် Variable တွေ ကောင်းကောင်း ဝင်၊ မဝင် စစ်ဆေးခြင်း
            debug: {
                hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
                hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
                hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
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

