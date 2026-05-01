const express = require("express");
const router = express.Router();
const voca = require("./voca");

router.post("/vocabulary", voca.saveVocabulary);
router.get("/vocabulary", voca.getVocabularyList);
router.get("/vocabulary/search", voca.searchVocabulary);
router.patch("/vocabulary/:vocaId/status", voca.updateVocabularyStatus);

module.exports = router;