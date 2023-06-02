const { MongoClient } = require("mongodb");

const URL = "mongodb+srv://cavliucserv:zXSCKfTxa1YGFVnu@database.uppj1fv.mongodb.net/?retryWrites=true&w=majority";
let dbConnection;

module.exports = {
    connectToDb: (cb) => {
        MongoClient.connect(URL)
            .then((client) => {
                console.log("Connected to MongoDB");
                dbConnection = client.db();
                cb();
            })
            .catch((err) => {
                cb(err);
            });
    },
    getDb: () => dbConnection,
};
