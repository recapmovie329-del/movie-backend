const express = require("express");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(express.json());

let initializationError = null;

try {
    // Render (Production) ပေါ်တွင် Service Account စာသားရှိမရှိ တိုက်ရိုက်စစ်ဆေးခြင်း
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let configStr = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        
        // Render ၏ စာကြောင်းအောက်ဆင်းသမျှ အမှိုက်များကို တစ်ကြောင်းတည်းဖြစ်အောင် ညှိခြင်း
        configStr = configStr.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ");

        if (configStr.startsWith('"') && configStr.endsWith('"')) {
            configStr = configStr.slice(1, -1);
        }

        const serviceAccount = JSON.parse(configStr);
        
        // အစ်ကိုပေးထားသည့် လမ်းကြောင်းအတိုင်း ရိုးရှင်းစွာ ချိတ်ဆက်ခြင်း
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        
        console.log("Firebase Admin Initialized Successfully via Service Account!");
    } else {
        // Local Dev အတွက် အစ်ကိုသုံးချင်သည့် ပုံစံအတိုင်း ထားပေးခြင်း
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
        console.log("Firebase Admin Initialized via Application Default (Local).");
    }
} catch (error) {
    initializationError = error.message;
    console.error("Firebase Initialization Error:", error);
}

app.get("/", (req, res) => {
    res.send("Movie Backend Running with Firebase Admin!");
});

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

