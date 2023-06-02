const { MongoClient } = require("mongodb");

const URL = "mongodb+srv://cavliucserv:zXSCKfTxa1YGFVnu@database.uppj1fv.mongodb.net/?retryWrites=true&w=majority";

let dbConnection;

module.exports = {
    connectToDb: (cb) => {
        // Подключаемся к базе данных с использованием URL
        MongoClient.connect(URL)
            .then((client) => {
                console.log(client);
                // При успешном подключении, устанавливаем соединение с базой данных
                dbConnection = client.db();
                // Вызываем обратный вызов для продолжения выполнения кода
                return cb();
            })
            .catch((err) => {
                // При ошибке подключения, передаем ошибку в обратный вызов
                return cb(err);
            });
    },
    getDb: () => dbConnection,
};
