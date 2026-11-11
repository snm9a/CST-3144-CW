const express = require("express");
const app = express();

app.get("/lessons", function (req, res) {
    res.json([
        { topic: "Mathematics", location: "Al Barsha", price: 80, space: 5 }
    ]);
});

const port = process.env.PORT || 30000;
app.listen(port, function () {
    console.log("Server running on port " + port);
});