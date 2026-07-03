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

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

