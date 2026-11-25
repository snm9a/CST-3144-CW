// =====================================================
//  After-School Lessons - Express.js back-end
//  Runs on Node.js, stores data in MongoDB Atlas,
//  and gives the Vue.js front-end a REST API.
// =====================================================

// express  -> the web framework that handles requests and routes
// MongoClient -> the native MongoDB driver (no Mongoose, as the brief requires)
// ObjectId -> turns an id string from the URL into a real MongoDB _id
// path     -> builds file paths that work on Windows and on Render (Linux)
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("node:path");

// Create the Express app. Every app.use / app.get below is added to it.
const app = express();


// ---------- Database ----------

// The connection string is kept in the MONGODB_URI environment variable
// (in .env on my laptop, in Render's "Environment" settings online),
// so the password is never written in the code or pushed to GitHub.
const client = new MongoClient(process.env.MONGODB_URI);

// The database and the two collections the app uses.
// Nothing is sent to Atlas yet - that happens in startServer() at the bottom.
const db = client.db("Lesson");
const lessons = db.collection("after_school"); // lesson information
const orders = db.collection("orders");        // orders placed at checkout


// ---------- Middleware ----------
// Middleware functions run in order, top to bottom, for every request.
// Each one either sends a response or calls next() to pass the request on.

// 1) JSON parser: reads a JSON request body and puts it in req.body.
//    Without this, req.body would be undefined in the POST and PUT routes.
app.use(express.json());

// 2) CORS: the front-end lives on GitHub Pages and this server on render.com.
//    They are different "origins", so the browser blocks the requests unless
//    the server sends these headers to say it is allowed.
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");                    // any website may call the API
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS"); // methods the API accepts
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");        // lets fetch send JSON

    // Before a POST or PUT with JSON, the browser first sends an OPTIONS
    // "preflight" request to ask permission. We answer it straight away.
    if (req.method === "OPTIONS") {
        return res.sendStatus(204); // 204 = OK, no content
    }
    next();
});

// 3) Logger: prints every request to the console.
//    On render.com these lines appear in the "Logs" tab.
//    Example output:
//      2026-11-18T10:15:02.123Z PUT /lessons/6740...
//        body: {"space":3}
//    -> the time, the HTTP method, the URL, and (for POST/PUT) the data sent.
app.use(function (req, res, next) {
    const time = new Date().toISOString();
    console.log(time + " " + req.method + " " + req.url);
    if (req.method === "POST" || req.method === "PUT") {
        console.log("  body:", JSON.stringify(req.body));
    }
    next(); // pass the request on to the next middleware / route
});

// 4) Static files: requests to /images/... are served from the "images" folder.
//    e.g. GET /images/art.png sends the file images/art.png
app.use("/images", express.static(path.join(__dirname, "images")));

// 5) Image not found: express.static calls next() when the file does not exist,
//    so the request falls through to here and we send an error message.
//    e.g. GET /images/nothing.png -> 404 {"error":"Image not found: /nothing.png"}
app.use("/images", function (req, res) {
    res.status(404).json({ error: "Image not found: " + req.url });
});


// ---------- Routes (REST API) ----------

// GET /lessons -> returns every lesson in the collection as a JSON array.
// find({}) with an empty filter matches all documents; toArray() collects them.
app.get("/lessons", async function (req, res, next) {
    try {
        const result = await lessons.find({}).toArray();
        res.json(result);
    } catch (error) {
        next(error); // send the error to the error handler at the bottom
    }
});

// POST /orders -> saves a new order in the "orders" collection.
// Body sent by the front-end:
//   { "name": "Sam", "phone": "0501234567",
//     "lessons": [ { "lessonId": "6740...", "spaces": 2 } ] }
app.post("/orders", async function (req, res, next) {
    const order = req.body;

    // Check the order has everything it needs before saving it.
    // 400 = "bad request": the client sent incomplete data.
    if (!order.name || !order.phone || !Array.isArray(order.lessons) || order.lessons.length === 0) {
        return res.status(400).json({ error: "name, phone and lessons are required" });
    }

    try {
        // insertOne adds the document; MongoDB creates its _id for us.
        const result = await orders.insertOne(order);
        // 201 = "created". We send back the new order's id.
        res.status(201).json({ message: "Order saved", orderId: result.insertedId });
    } catch (error) {
        next(error);
    }
});

// PUT /lessons/:id -> updates ANY attribute of one lesson.
// :id is a route parameter, read with req.params.id.
// Body examples:  { "space": 3 }   or   { "price": 90, "location": "Mirdif" }
// The front-end uses it after checkout to set the new number of spaces.
app.put("/lessons/:id", async function (req, res, next) {
    // A MongoDB id is 24 hex characters; reject anything else.
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid lesson id" });
    }

    const changes = req.body;
    delete changes._id; // never allow the _id itself to be changed

    if (Object.keys(changes).length === 0) {
        return res.status(400).json({ error: "Nothing to update" });
    }

    try {
        // $set replaces only the fields in "changes" and keeps the others,
        // so space can be set to ANY number, not just +1 or -1.
        const result = await lessons.updateOne(
            { _id: new ObjectId(req.params.id) }, // which lesson
            { $set: changes }                     // what to change
        );

        // matchedCount is 0 when no lesson has that id.
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Lesson not found" });
        }
        res.json({ message: "Lesson updated" });
    } catch (error) {
        next(error);
    }
});


// ---------- Error handler ----------
// Express treats a middleware with FOUR parameters (err, req, res, next)
// as an error handler. Any route that calls next(error) ends up here.
app.use(function (err, req, res, next) {
    console.error("Server error:", err.message); // shows in the Render logs
    res.status(500).json({ error: "Server error" });
});


// ---------- Start ----------
// Connect to MongoDB Atlas FIRST, and only start listening once it works.
// If the connection string is wrong we see the reason in the log
// instead of a server that runs but fails on every request.
async function startServer() {
    try {
        await client.connect();
        console.log("Connected to MongoDB Atlas");

        // Render chooses the port and passes it in process.env.PORT.
        // On my laptop it falls back to 3000.
        const port = process.env.PORT || 3000;
        app.listen(port, function () {
            console.log("Server running on port " + port);
        });
    } catch (error) {
        console.error("Could not connect to MongoDB:", error.message);
        process.exit(1); // stop, because the API cannot work without the database
    }
}

startServer();
