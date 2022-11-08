const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use([cors(), express.json()]);

// connect mongoDB
const uri = process.env.MONGO_URL;
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
        const blogCollection = client
            .db("foodService")
            .collection("blogs");

        // get all services
        app.get("/services", async (req, res) => {
            const query = {};
            let services;
            if (req.query.limit) {
                services = await serviceCollection
                    .find(query)
                    .limit(parseInt(req.query.limit))
                    .toArray();
            } else {
                services = await serviceCollection.find(query).toArray();
            }
            res.status(200).json(services);
        });

        // get service by serviceId
        app.get("/services/:serviceId", async(req, res)=>{
            const query = {
                _id: ObjectId(req.params.serviceId)
            }
            const service = await serviceCollection.findOne(query);
            res.status(200).json(service)
        })
       
        // create new service
        app.post("/services", async (req, res) => {
            const serviceObject = req.body;
            const newService = await serviceCollection.insertOne(serviceObject);
            res.send(newService);
        });

        // get all blog
        app.get("/blogs", async (req, res) => {
            const query = {};
            const blogs = await blogCollection.find(query).toArray();
            res.status(200).json(blogs);
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
