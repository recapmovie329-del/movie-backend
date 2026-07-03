const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Movie Backend Running");
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Server OK"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

