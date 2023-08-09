const { MongoClient } = require("mongodb");

// const URL = "mongodb+srv://cavliucserv:zXSCKfTxa1YGFVnu@database.uppj1fv.mongodb.net/?retryWrites=true&w=majority";
const URL =
  "mongodb+srv://cavliucserv:5XTmMsc12wKXXRi8@database.uppj1fv.mongodb.net/Batman?retryWrites=true&w=majority";

let dbConnection;

module.exports = {
  connectToDb: (cb) => {
    MongoClient.connect(URL)
      .then((client) => {
        dbConnection = client.db();
        return cb();
      })
      .catch((err) => {
        return cb(err);
      });
  },
  getDb: () => dbConnection,
};
