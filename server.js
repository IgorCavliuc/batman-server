const express = require("express");
const axios = require('axios');
const cheerio = require('cheerio');
const bodyParser = require("body-parser");
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const { connectToDb, getDb } = require("./db");
const { registerUser } = require('./controllers/authController');
const cors = require("cors");
const cookieSession = require("cookie-session");

const saltRounds = 10;
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(bodyParser.json({ limit: "40mb" }));
app.use(bodyParser.urlencoded({ limit: "40mb", extended: true }));

let db;

const baseUrl = 'https://999.md';



const translations = {
  'Tip ofertă': 'offer_type',
  'Vând': 'selling',
  'Marcă': 'brand',
  'Modelul': 'model',
  'Înmatriculare': 'registration',
  'Stare': 'condition',
  'Disponibilitate': 'availability',
  'Autorul anunțului': 'advertiser',
  'Anul fabricației': 'manufacturing_year',
  'Volan': 'steering_wheel',
  'Numărul de locuri': 'seats_number',
  'Tip caroserie': 'body_type',
  'Numărul de uși': 'doors_number',
  'Kilometraj': 'mileage',
  'Capacit. motor (cm³)': 'engine_capacity',
  'Putere (CP)': 'power',
  'Tip combustibil': 'fuel_type',
  'Cutia de viteze': 'transmission',
  'Tip tracțiune': 'drivetrain',
  'Culoarea': 'color'
};


const createDetaleObject = (detaleArray) => {
  const detaleObject = {};

  for (let i = 0; i < detaleArray.length; i += 2) {
    const key = translations[detaleArray[i].trim()] || detaleArray[i].trim();
    const formattedKey = key.toLowerCase().replace(/\s+/g, '_');
    const value = detaleArray[i + 1].trim();
    detaleObject[formattedKey] = value;
  }

  return detaleObject;
};

const createPriceArray = (inputPriceArray) => {


  const currencyMap = {
    '€': 'eur',
    '$': 'usd',
    'lei': 'mdl'
  };

  const parts = inputPriceArray.split('≈');

  const price = [];

  for (const part of parts) {
    const [valueStr, currencySymbol] = part.split(/([€$lei]+)/);
    const value = valueStr.trim();
    const currency = currencyMap[currencySymbol] || currencySymbol.trim();

    if (value !== '') {
      if (!price.some(item => item.value === value && item.currency === currency)) {
        price.push({ value, currency });
      }
    }
  }

  return price
  };

const createRegionObject = (region) => {
  const regionParts = region.split(',');
  const countryAndCity = regionParts[0].replace("Regiunea:", "").trim();
  const [country, city] = countryAndCity.split(/\s+/);

  return {
    country: country,
    city: regionParts[1]?.trim()
  };
};

const processCarPage = async (carLink) => {
  try {
    const response = await axios.get(carLink);
    const $ = cheerio.load(response.data);

    const title = $('.adPage__header h1').text().trim();
    const images = $('.slick-cont-part-item img')
        .map((index, element) => $(element).attr('src'))
        .get().map(image => image.replace('320x240', '900x900'));;
    const description = $('.adPage__content__description.grid_18').text().trim();
    const detale = $('.m-value').text().trim();
    const features = $('.adPage__content__features__col.grid_9.suffix_1 a')
        .map((index, element) => $(element).text().trim())
        .get();
    const priceString = $('.adPage__content__price-feature__prices__price>span').text().trim();
    const region = $('.adPage__content__region').text().trim();
    const phoneNumber = $('.js-phone-number > dd > ul > li > a').attr('href').trim();

    const detaleArray = detale.split(/\s{6,}/).filter(item => item.trim() !== '');
    const detaleObject = createDetaleObject(detaleArray);
    const price = createPriceArray(priceString);
    const regionObj = createRegionObject(region);

    const carData = {
      title,
      images,
      description,
      detaleObject,
      features,
      price,
      regionObj,
      phoneNumber,
      subcategory: {
        name: "technology",
        code: "technology"
      },
      category: "technology"
    };

    console.log(carData);

    const createdProduct = await db.collection("products").insertOne(carData);

  } catch (error) {
    console.error(`Error parsing car page: ${carLink}`);
    console.error(error);
  }
};

const processCarLinks = async () => {
  try {
    const response = await axios.get(`${baseUrl}/ru/list/phone-and-communication/mobile-phones`);
    const $ = cheerio.load(response.data);

    const carLinks = $('.ads-list-photo-item-thumb > a')
        .map((index, element) => `${baseUrl}${$(element).attr('href')}`)
        .get();

    const processPromises = carLinks.map(processCarPage);
    await Promise.all(processPromises);

    console.log('All car data processed');

  } catch (error) {
    console.error('Error fetching car list page');
    console.error(error);
  }
};

// processCarLinks();



app.use(
    cors({
      origin: ["http://localhost:3001", "https://batman-client.vercel.app", "https://devel-batman.vercel.app"],
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
