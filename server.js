const express = require("express");
const { ObjectId } = require("mongodb");
const { connectToDb, getDb } = require("./db");
const cors = require("cors");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");

const PORT = 3000;


// app.use(cors());

const app = express();
app.use(express.json());

app.use(bodyParser.json({ limit: "40mb" }));
app.use(bodyParser.urlencoded({ limit: "40mb", extended: true }));

let db;

app.use(
  cors({
    origin: "http://localhost:3001",
  })
);
connectToDb((err) => {
  if (!err) {
    app.listen(PORT, (err) => {
      err ? console.log(err) : console.log(`listening port ${PORT}`);
    });
    db = getDb();
  } else {
    console.log(`DB connection error: ${err}`);
  }
});

const handleError = (res, error) => {
  res.status(500).json({ error });
};

app.get("/navigation", (req, res) => {
  const navigation = [];

  db.collection("navigation")
    .find()
    .sort({ title: 1 })
    .forEach((nav) => navigation.push(nav))
    .then(() => {
      res.status(200).json(navigation);
    })
    .catch(() => handleError(res, "Something goes wrong..."));
});

app.get("/products", async (req, res) => {
  try {
    const filteredProducts = await db
      .collection("products")
      .find({ category: req.query.subcategory })
      .toArray();

    console.log(filteredProducts)

    res.status(200).json(filteredProducts);
  } catch (error) {
    handleError(res, "Something went wrong...");
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await db
      .collection("users")
      .find(req?.query)
      .sort()
      .toArray();
    res.status(200).json(users);
  } catch (error) {
    handleError(res, "Something went wrong...");
  }
});
app.get("/categories", async (req, res) => {
  // write(req.query)
  try {
    const users = await db
      .collection("categories")
      .find(req?.query)
      .sort()
      .toArray();
    res.status(200).json(users);
  } catch (error) {
    handleError(res, "Something went wrong...");
  }
});

app.post("/create-post", async (req, res) => {
  try {
    const products = await db.collection("products").insertOne(req.body);

    // Customize the response data
    const responseData = {
      message: "Product created successfully",
      app_code: "SUCCESSFULLY",
      data: req.body.params,
    };

    res.status(200).json(responseData);
  } catch (error) {
    handleError(res, "Something went wrong...");
  }
});
