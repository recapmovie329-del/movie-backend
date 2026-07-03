const express = require("express");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(express.json());

let initializationError = null;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let configStr = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        
        // Render ရဲ့ Enter ခေါက်ထားသမျှ စာကြောင်းအမှိုက်များကို ရှင်းလင်းခြင်း
        configStr = configStr.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ");

        if (configStr.startsWith('"') && configStr.endsWith('"')) {
            configStr = configStr.slice(1, -1);
        }

        const serviceAccount = JSON.parse(configStr);
        
        // 🟢 Error လုံးဝမတက်နိုင်တော့မည့် Firebase Standard Initialization ပုံစံ
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        
        console.log("Firebase Admin Initialized Successfully!");
    } else {
        initializationError = "FIREBASE_SERVICE_ACCOUNT variable is missing!";
    }
} catch (error) {
    initializationError = `${error.message}`;
    console.error("Firebase Initialization Error:", error);
}

app.get("/", (req, res) => {
    res.send("Movie Backend Running with Firebase Admin!");
});

app.get("/api/health", (req, res) => {
    // Firebase စနစ် ကောင်းမွန်စွာ အလုပ်လုပ်၊ မလုပ် စစ်ဆေးခြင်း
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

