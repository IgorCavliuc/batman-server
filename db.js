const { MongoClient } = require("mongodb");

// const URL = "mongodb+srv://cavliucserv:zXSCKfTxa1YGFVnu@database.uppj1fv.mongodb.net/?retryWrites=true&w=majority";
const URL =  "mongodb+srv://cavliucserv:zXSCKfTxa1YGFVnu@database.uppj1fv.mongodb.net/Batman?retryWrites=true&w=majority"

let dbConnection;

module.exports = {
    connectToDb: (cb) => {
        MongoClient.connect(URL)
            .then((client) => {
                console.log(client);
                dbConnection = client.db();
                return cb();
            })
            .catch((err) => {
                return cb(err);
            });
    },
    getDb: () => dbConnection,
};