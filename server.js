const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const client = new MongoClient(process.env.MONGODB_URI);
const lessons = client.db("Lesson").collection("after_school");

app.get("/lessons", async function (req, res) {
    try {
        const result = await lessons.find({}).toArray();
        res.json(result);
    } catch (error) {
        console.error("Could not load lessons:", error.message);
        res.status(500).json({ error: "Could not load lessons" });
    }
});

const port = process.env.PORT || 30000;
app.listen(port, function () {
    console.log("Server running on port " + port);
});