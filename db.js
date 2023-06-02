const { MongoClient } = require("mongodb");

const URL = "mongodb+srv://cavliucserv:zXSCKfTxa1YGFVnu@database.uppj1fv.mongodb.net/productsData?retryWrites=true&w=majority";
let dbConnection;

module.exports = {
  connectToDb: (cb) => {
    MongoClient.connect(URL, {useNewUrlParser: true, useUnifiedTopology:true})
      .then((client) => {
        console.log("Connected to MongoDB");
        dbConnection = client.db();
        return cb();
      })
      .catch((err) => {
        return cb(err);
      });
  },
  getDb: () => dbConnection,
};



