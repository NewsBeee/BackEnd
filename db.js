require("dotenv").config();
var mysql = require("mysql2");

var db = mysql
  .createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  })
  .promise();

db.getConnection()
  .then((connection) => {
    console.log("DB 연결 성공");
    connection.release();
  })
  .catch((err) => {
    console.error("DB 연결 실패:", err);
  });

module.exports = db;
