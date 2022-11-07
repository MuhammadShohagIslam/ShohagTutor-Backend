const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use([cors(), express.json()]);

const uri = process.env.MONGO_URL;
console.log(uri);
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

const run = async () => {
    try {
        const serviceCollection = client
            .db("foodService")
            .collection("services");

        // get all services
        app.get("/services", async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });
        // get single service
        app.get("/services/:serviceId", async (req, res) => {
            const { serviceId } = req.params;

            const query = {
                _id: ObjectId(serviceId),
            };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });
        // create new service
        app.post("/services", async (req, res) => {
            const serviceObject = req.body;
            const newService = await serviceCollection.insertOne(serviceObject);
            res.send(newService);
        });
    } finally {
    }
};

run().catch((error) => console.log(error));

app.get("/", (req, res) => {
    res.send("Cloud Kitchen server is running");
});

app.listen(port, () => {
    console.log(`Cloud Kitchen server is running on ${port}`);
});
