const express = require("express");
const bodyParser = require("body-parser");

const { registerUser } = require('./controllers/authController');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const saltRounds = 10;
const { connectToDb, getDb } = require("./db");
const cors = require("cors");
const cookieSession = require("cookie-session");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

app.use(bodyParser.json({ limit: "40mb" }));
app.use(bodyParser.urlencoded({ limit: "40mb", extended: true }));

let db;

app.use(
    cors({
      origin: ["http://localhost:3001", "https://batman.vercel.app", "https://devel-batman.vercel.app"],
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    })
);
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
});

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

app.post('/api/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ login: login });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    // const passwordMatch = password === user.password
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.setHeader('Referrer-Policy', 'same-origin');
    const token = jwt.sign({ userId: user._id }, 'secretKey', { expiresIn: '1h' });
    res.json({ app_code:"ACCESS_TOKEN", token, data:{
        name: user?.name ?? '',
        img: user?.img ?? '',
        lastname: user?.lastName ?? '',
        email: user?.email ?? '',
        login: user?.login ?? '',
        data_birthday: user?.data_birthday ?? '',
        root: user?.root ?? '',
        position: user?.position ?? '',
      }});
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/api/register', registerUser);

let isRequestPending = false;

app.get("/products", async (req, res) => {
  if (isRequestPending) {
    // Если запрос уже выполняется, возвращаем ошибку или соответствующий ответ
    return res.status(429).json({ error: "Previous request is still pending." });
  }

  isRequestPending = true;

  try {
    const filteredProducts = await db.collection("products").find({ category: req.query.subcategory }).toArray();
    res.status(200).json(filteredProducts);
  } catch (error) {
    handleError(res, "Something went wrong...");
  } finally {
    isRequestPending = false;
  }
});
app.get('/product/:productId', async (req, res) => {
  const productId = req.params.productId;

  try {
    const objectId = new ObjectId(productId);

    console.log({ _id: objectId })
    const product = await db.collection('products').findOne({ _id: objectId });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({app_code:"GETING_DATA", data:product});
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while fetching the product' });
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

app.post("/create-user", async (req, res) => {
  try {
    const user = req.body;

    // Хэширование пароля
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);

    // Заменяем исходный пароль на хэшированный
    user.password = hashedPassword;

    const createdUser = await db.collection("users").insertOne(user);
    const responseData = {
      message: "User created successfully",
      app_code: "SUCCESSFULLY",
      // data: createdUser.ops[0],
    };
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while creating the user" });
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
      // data: createdProduct.ops[0],
    };
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while creating the product" });
  }
});
