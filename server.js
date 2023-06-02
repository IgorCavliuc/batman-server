const express = require("express");

const app = express();
app.use(express.json());

app.get("/navigation", (req, res) => {
  const navigation = [];

  // Replace this with your database integration code for Vercel
  // Example: Vercel Serverless Functions with MongoDB integration
  // const navigation = await db.collection("navigation").find().sort({ title: 1 }).toArray();

  res.status(200).json(navigation);
});

app.get("/products", (req, res) => {
  try {
    const filteredProducts = []; // Replace this with your database integration code for Vercel

    res.status(200).json(filteredProducts);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong..." });
  }
});

app.get("/users", (req, res) => {
  try {
    const users = []; // Replace this with your database integration code for Vercel

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong..." });
  }
});

app.get("/categories", (req, res) => {
  try {
    const categories = []; // Replace this with your database integration code for Vercel

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong..." });
  }
});

app.post("/create-post", (req, res) => {
  try {
    // Replace this with your database integration code for Vercel

    // Customize the response data
    const responseData = {
      message: "Product created successfully",
      app_code: "SUCCESSFULLY",
      data: req.body.params,
    };

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong..." });
  }
});

module.exports = app;
