const express = require("express");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(express.json());

let initializationError = null;

// Firebase Admin SDK ချိတ်ဆက်ခြင်းနှင့် Error ဖမ်းခြင်း
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let configStr = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        
        // 🟢 ရှေ့နောက် မျက်တောင်ဖွင့်/ပိတ် ပါနေလျှင် ဖယ်ရှားရန်
        if (configStr.startsWith('"') && configStr.endsWith('"')) {
            configStr = configStr.slice(1, -1);
        }

        // 🟢 \n ပြဿနာကို ကြိုတင် Fix ပေးခြင်း
        configStr = configStr.replace(/\\n/g, '\n');

        const serviceAccount = JSON.parse(configStr);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin Initialized Successfully!");
    } else {
        initializationError = "FIREBASE_SERVICE_ACCOUNT variable is missing from Render Environment!";
    }
} catch (error) {
    initializationError = `${error.message} | Stack: ${error.stack}`;
    console.error("Firebase Initialization Error:", error);
}

app.get("/", (req, res) => {
    res.send("Movie Backend Running with Firebase Admin!");
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Server OK",
        firebase: (admin.apps && admin.apps.length > 0) ? "Connected" : "Disconnected",
        errorLogs: initializationError, // 🟢 ဒီနေရာကနေ ဘာကြောင့် Fail ဖြစ်လဲဆိုတာ တန်းပြပေးပါလိမ့်မယ်
        debug: {
            hasServiceAccountConfig: !!process.env.FIREBASE_SERVICE_ACCOUNT
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

