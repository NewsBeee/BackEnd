const express = require("express");
const router = express.Router();
const article = require("./article");

router.get("/recommendations/articles", article.recommendations);

module.exports = router;
