const express = require("express");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(express.json());

let initializationError = null;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let configStr = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        
        // 🟢 အရေးကြီးဆုံးအပိုင်း- Render က ပေးလိုက်တဲ့ စာကြောင်းအောက်ဆင်းတာတွေ၊ Space အပိုတွေကို အကုန်လုံး ဖယ်ထုတ်ပစ်ခြင်း
        configStr = configStr
            .replace(/\r?\n|\r/g, " ") // Enter ခေါက်ထားသမျှကို Space အဖြစ်ပြောင်း
            .replace(/\s+/g, " ");     // Space အပိုတွေကို တစ်ချက်တည်းဖြစ်အောင် ညှိ

        // 🟢 ရှေ့နောက် မျက်တောင်ဖွင့်/ပိတ် ပါနေလျှင် ဖယ်ရှားရန်
        if (configStr.startsWith('"') && configStr.endsWith('"')) {
            configStr = configStr.slice(1, -1);
        }

        const serviceAccount = JSON.parse(configStr);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin Initialized Successfully!");
    } else {
        initializationError = "FIREBASE_SERVICE_ACCOUNT variable is missing!";
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

