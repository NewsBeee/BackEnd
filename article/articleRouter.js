const express = require("express");
const router = express.Router();
const article = require("./article");

router.get("/recommendations/articles", article.recommendations);

router.post("/articles/transform", article.transform);
router.post("/articles/transform/{articleId}/read", article.read);
router.get("/articles", article.article);
router.get("/articles/{articleId}", article.articlesdetail);
router.get("/articles/guest/quota", article.guest);
module.exports = router;
