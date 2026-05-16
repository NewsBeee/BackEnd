const express = require("express");
const router = express.Router();
const article = require("./article");

router.get("/recommendations/articles", article.recommendations);
router.get("/articles/guest/quota", article.getGuestQuota);
router.post("/articles/transform", article.transform);
router.post("/articles/transform/:articleId/read", article.readinglog);
router.get("/articles", article.articlelist);
router.get("/articles/:articleId", article.articledetail);

module.exports = router;
