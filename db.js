require("dotenv").config();
var mysql = require("mysql2");

var db = mysql
  .createPool({
    host: process.env.DB_HOST, //gachon-01.cjysow2c4blk.ap-northeast-2.rds.amazonaws.com
    user: process.env.DB_USER, //admin
    password: process.env.DB_PASSWORD, //newsbee-01
    database: process.env.DB_NAME, //gachon-01
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
