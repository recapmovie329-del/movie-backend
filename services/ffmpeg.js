const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const path = require("path");

// 🟢 Render/Linux ပေါ်တွင် FFmpeg Binary လမ်းကြောင်းကို အလိုအလျောက် ရှာဖွေသတ်မှတ်ခြင်း
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// ဗီဒီယိုပေါ်တွင် Watermark/Logo တင်ပေးမည့် Service Function
const addWatermark = (inputPath, logoPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .input(logoPath)
            .complexFilter([
                "overlay=20:20" // အစ်ကိုပေးထားသည့် Watermark Overlay Command
            ])
            .output(outputPath)
            .on("start", (commandLine) => {
                console.log("Spawned FFmpeg with command: " + commandLine);
            })
            .on("progress", (progress) => {
                console.log(`Processing: ${progress.percent}% done`);
            })
            .on("end", () => {
                console.log("FFmpeg processing finished successfully!");
                resolve(outputPath);
            })
            .on("error", (err) => {
                console.error("FFmpeg Error: ", err.message);
                reject(err);
            })
            .run();
    });
};

module.exports = {
    addWatermark
};

