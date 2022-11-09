const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
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

// verify user by JWT
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "unauthorize access" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SCREAT, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
    });
};

const run = async () => {
    try {
        const serviceCollection = client
            .db("foodService")
            .collection("services");
        const blogCollection = client.db("foodService").collection("blogs");
        const reviewCollection = client.db("foodService").collection("reviews");

        // create token
        app.post("/jwt", (req, res) => {
            try {
                const user = req.body;
                const token = jwt.sign(user, process.env.ACCESS_TOKEN_SCREAT, {
                    expiresIn: "7d",
                });
                res.status(200).json({ token });
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        // get all services
        app.get("/services", async (req, res) => {
            try {
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
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        // get service by serviceId
        app.get("/services/:serviceId", async (req, res) => {
            try {
                const query = {
                    _id: ObjectId(req.params.serviceId),
                };
                const service = await serviceCollection.findOne(query);
                res.status(200).json(service);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        // create new service
        app.post("/services", async (req, res) => {
            try {
                const serviceObject = {
                    ...req.body,
                    createdAt: Date.now(),
                };

                const newService = await serviceCollection.insertOne(
                    serviceObject
                );
                res.status(201).json(newService);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        // get all blog
        app.get("/blogs", async (req, res) => {
            try {
                const query = {};
                const blogs = await blogCollection.find(query).toArray();
                res.status(200).json(blogs);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
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
                    res.status(400).json({
                        message: `You Already Reviewed ${serviceName} Service`,
                    });
                    return;
                }
                const newReview = await reviewCollection.insertOne(reviewObj);
                res.status(201).json(newReview);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        // get all reviews
        app.get("/reviews", async (req, res) => {
            try {
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
            } catch (error) {
                res.status(500).send({ message: "Server Error" });
            }
        });
        // get all reviews by specific user
        app.get("/reviews/user", verifyJWT, async (req, res) => {
            try {
                const decodedUser = req.decoded;
                if (decodedUser.name !== req.query.name) {
                    res.status(401).send({ message: "Unauthorize Access" });
                }
                if (req.query.email || req.query.name) {
                    const reviews = await reviewCollection
                        .find({
                            $or: [
                                { name: req.query.name },
                                { email: req.query.email },
                            ],
                        })
                        .toArray();
                    res.status(200).json(reviews);
                }
            } catch (error) {
                res.status(500).send({ message: "Server Error" });
            }
        });
        // get review by reviewId
        app.get("/reviews/:reviewId", async (req, res) => {
            try {
                const query = {
                    _id: ObjectId(req.params.reviewId),
                };
                const review = await reviewCollection.findOne(query);
                res.status(200).json(review);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        // update review by reviewId
        app.put("/reviews/:reviewId", async (req, res) => {
            try {
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
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        // delete review by reviewId
        app.delete("/reviews/:reviewId", async (req, res) => {
            try {
                const query = {
                    _id: ObjectId(req.params.reviewId),
                };
                const removedReview = await reviewCollection.deleteOne(query);
                res.status(200).json(removedReview);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
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
