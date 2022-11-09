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
        const blogCollection = client.db("foodService").collection("blogs");
        const reviewCollection = client.db("foodService").collection("reviews");

        // get all services
        app.get("/services", async (req, res) => {
            const query = {};
            const sort = {
                createdAt: -1,
            };
            let services;
            if (req.query.limit) {
                services = await serviceCollection
                    .find(query)
                    .sort(sort)
                    .limit(parseInt(req.query.limit))
                    .toArray();
            } else {
                services = await serviceCollection
                    .find(query)
                    .sort(sort)
                    .toArray();
            }
            res.status(200).json(services);
        });

        // get service by serviceId
        app.get("/services/:serviceId", async (req, res) => {
            const query = {
                _id: ObjectId(req.params.serviceId),
            };
            const service = await serviceCollection.findOne(query);
            res.status(200).json(service);
        });

        // create new service
        app.post("/services", async (req, res) => {
            const serviceObject = {
                ...req.body,
                createdAt: Date.now(),
            };

            const newService = await serviceCollection.insertOne(serviceObject);
            res.status(201).json(newService);
        });

        // get all blog
        app.get("/blogs", async (req, res) => {
            const query = {};
            const blogs = await blogCollection.find(query).toArray();
            res.status(200).json(blogs);
        });

        // create a new review
        app.post("/reviews", async (req, res) => {
            try {
                const {
                    serviceId,
                    serviceName,
                    name,
                    img,
                    email,
                    comment,
                    star,
                } = req.body;
                const reviewObj = {
                    serviceId,
                    serviceName,
                    email,
                    name,
                    img,
                    comment,
                    star,
                    reviewedAt: Date.now(),
                };
                const isExitsReview = await reviewCollection
                    .find({ serviceId, email })
                    .toArray();
                if (isExitsReview.length > 0) {
                    res.status(400).json({ message: "Review Already Exits" });
                    return;
                }
                const newReview = await reviewCollection.insertOne(reviewObj);
                res.status(201).json(newReview);
            } catch (error) {
                res.status(400).send({ message: error.message });
            }
        });

        // get all reviews
        app.get("/reviews", async (req, res) => {
            let reviews;
            if (req.query.id) {
                reviews = await reviewCollection
                    .find({ serviceId: req.query.id })
                    .sort({ reviewedAt: -1 })
                    .toArray();
            } else {
                reviews = await reviewCollection.find({}).toArray();
            }
            res.status(200).json(reviews);
        });
        // get all reviews by specific user
        app.get("/reviews", async (req, res) => {
            if (req.query.name) {
                const reviews = await reviewCollection
                    .find({ name: req.query.name })
                    .toArray();
                res.status(200).json(reviews);
            }
        });
        // get review by reviewId
        app.get("/reviews/:reviewId", async (req, res) => {
            const query = {
                _id: ObjectId(req.params.reviewId),
            };
            const review = await reviewCollection.findOne(query);
            res.status(200).json(review);
        });

        // update review by reviewId
        app.put("/reviews/:reviewId", async (req, res) => {
            const { comment, star } = req.body;

            const query = {
                _id: ObjectId(req.params.reviewId),
            };
            const updateDocument = {
                $set: {
                    comment: comment,
                    star: star,
                },
            };
            const updatedReview = await reviewCollection.updateOne(
                query,
                updateDocument
            );
            res.status(200).json(updatedReview);
        });

        // delete review by reviewId
        app.delete("/reviews/:reviewId", async (req, res) => {
            const query = {
                _id: ObjectId(req.params.reviewId),
            };
            const removedReview = await reviewCollection.deleteOne(query);
            res.status(200).json(removedReview);
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
