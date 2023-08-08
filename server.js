const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { connectToDb, getDb } = require("./db");
const { loginUser, registerUser } = require('./controllers/authController');
const User = require("./models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const PORT = 3001;

const app = express();
app.use(cors());
// app.use(cors({
//   origin: "http://localhost:3001",
//   methods: ["GET", "POST"],
//   allowedHeaders: ["Content-Type"],
// }));

app.use(express.json());
app.use(bodyParser.json({ limit: "40mb" }));
app.use(bodyParser.urlencoded({ limit: "40mb", extended: true }));

let db;

connectToDb((err) => {
  if (!err) {
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
    db = getDb();
  } else {
    console.log(`DB connection error: ${err}`);
  }
});

const handleError = (res, error) => {
  res.status(500).json({ error });
};

app.get("/navigation", async (req, res) => {
  try {
    const navigation = await db.collection("navigation").find().sort().toArray();
    res.status(200).json(navigation);
  } catch (error) {
    handleError(res, "Something went wrong...");
  }
});

app.post('/api/login', loginUser);
app.post('/api/register', registerUser);

app.get("/products", async (req, res) => {
  try {
    const filteredProducts = await db.collection("products").find({ category: req.query.subcategory }).toArray();
    res.status(200).json(filteredProducts);
  } catch (error) {
    handleError(res, "Something went wrong...");
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await db.collection("users").find(req?.query).sort().toArray();
    res.status(200).json(users);
  } catch (error) {
    handleError(res, "Something went wrong...");
  }
});

app.get("/categories", async (req, res) => {
  try {
    const categories = await db.collection("categories").find(req?.query).sort().toArray();
    res.status(200).json(categories);
  } catch (error) {
    handleError(res, "Something went wrong...");
  }
});

app.post("/create-post", async (req, res) => {
  try {
    const product = req.body;
    const createdProduct = await db.collection("products").insertOne(product);
    const responseData = {
      message: "Product created successfully",
      app_code: "SUCCESSFULLY",
      data: createdProduct.ops[0],
    };
    res.status(200).json(responseData);
  } catch (error) {
    handleError(res, "Something went wrong...");
  }
});
