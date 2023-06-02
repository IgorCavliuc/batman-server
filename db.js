const { MongoClient } = require("mongodb");

const URL = "mongodb+srv://cavliucserv:zXSCKfTxa1YGFVnu@database.uppj1fv.mongodb.net/?retryWrites=true&w=majority";
let dbConnection;

module.exports = {
    connectToDb: async (cb) => {
        try {
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
            await client.connect();
            console.log("Connected to MongoDB");
            dbConnection = client.db();
            cb();
        } catch (err) {
            cb(err);
        }
    },
    getDb: () => dbConnection,
};