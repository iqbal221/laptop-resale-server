const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middle ware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("laptop sell center server is running");
});

// Database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t4uwg.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// verify token
const verifyToken = (req, res, next) => {
  const authHeaders = req.headers.authorization;

  if (!authHeaders) {
    return res.status(401).send("unauthorized access");
  }

  const token = authHeaders.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send("forbidden");
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  const usersCollection = client.db("anItBari").collection("users");
  const categoriesCollection = client.db("anItBari").collection("categories");
  const bookingsCollection = client.db("anItBari").collection("bookings");
  const addProductCollection = client.db("anItBari").collection("addProduct");
  const addSpecialProductCollection = client
    .db("anItBari")
    .collection("addSpecialProduct");

  try {
    // create jwt
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.find(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1d",
        });
        return res.send({ access_token: token });
      }
      res.status(403).send({ access_token: "" });
    });

    // users
    app.post("/users", async (req, res) => {
      const users = req.body;
      const result = await usersCollection.insertOne(users);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const userQuery = {
        role: "User",
      };
      const sellerQuery = {
        role: "Seller",
      };
      const users = await usersCollection.find(userQuery).toArray();
      const sellers = await usersCollection.find(sellerQuery).toArray();
      res.send({ users, sellers });
    });

    app.delete("/users/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });

    // admin, user ,seller

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);

      if (user?.role === "admin") {
        return res.send({ isAdmin: true });
      }

      if (user?.role === "User") {
        return res.send({ isUser: true });
      }

      if (user?.role === "Seller") {
        return res.send({ isSeller: true });
      }
    });

    // categories
    app.get("/categories", async (req, res) => {
      const query = {};
      const categories = await categoriesCollection.find(query).toArray();
      res.send(categories);
    });

    app.get("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const category = await categoriesCollection.findOne(filter);
      res.send(category);
    });

    // booking
    app.post("/bookings", async (req, res) => {
      const bookingInfo = req.body;

      const query = {
        product: bookingInfo.product,
        email: bookingInfo.email,
      };

      const alreadyBooked = await bookingsCollection.find(query).toArray();
      if (alreadyBooked.length) {
        const message = `you have already booked ${bookingInfo.product}`;
        return res.send({ acknowledged: false, message });
      }
      const result = await bookingsCollection.insertOne(bookingInfo);
      res.send(result);
    });

    app.get("/bookings", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    // my order
    app.delete("/myOrder/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await bookingsCollection.deleteOne(filter);
      res.send(result);
    });

    // add product
    app.post("/addProduct", async (req, res) => {
      const productInfo = req.body;
      const result = await addProductCollection.insertOne(productInfo);
      res.send(result);
    });

    app.get("/addProduct", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const products = await addProductCollection.find(query).toArray();
      res.send(products);
    });

    app.delete("/addProduct/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await addProductCollection.deleteOne(filter);
      res.send(result);
    });

    // add product for advirtisemen
    app.post("/addSpecialProduct", verifyToken, async (req, res) => {
      const specialProduct = req.body;
      const query = { product: specialProduct.product };
      const filter = await addSpecialProductCollection.find(query).toArray();
      if (filter.length > 0) {
        return res.send({
          acknowledged: false,
          message: "You have already added to advertisement this product",
        });
      }
      const result = await addSpecialProductCollection.insertOne(
        specialProduct
      );
      res.send(result);
    });

    app.get("/addSpecialProduct", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { email: email };

      const result = await addSpecialProductCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/addSpecialProduct/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await addSpecialProductCollection.findOne(filter);
      res.send(result);
    });

    app.delete("/addSpecialProduct/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await addSpecialProductCollection.deleteOne(filter);
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.dir(error));

app.listen(port, () => {
  console.log(`server is running at ${port}`);
});
